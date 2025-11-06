// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

const debug = process.env.NEXTAUTH_DEBUG === "true";

async function getUserByEmail(email: string) {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  const r = await client.execute({
    // Penting: case-insensitive lookup
    sql: "SELECT id, email, passwordHash, role FROM users WHERE email = ? COLLATE NOCASE LIMIT 1;",
    args: [email],
  });
  await client.close();
  return (r.rows?.[0] as any) ?? null;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" }, // pakai JWT kalau tidak menggunakan Adapter DB
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(creds) {
        const email = (creds?.email ?? "").toLowerCase().trim();
        const password = creds?.password ?? "";

        if (!email || !password) {
          if (debug) console.log("AUTH: empty email/password");
          return null;
        }

        // 1) Ambil user dari DB (fail-soft, jangan lempar error ke NextAuth)
        let user: any = null;
        try {
          user = await getUserByEmail(email);
        } catch (e: any) {
          if (debug) console.log("AUTH: DB lookup error:", e?.message ?? e);
          // biarkan lanjut -> null (akan jadi 401)
          user = null;
        }

        if (!user) {
          if (debug) console.log("AUTH: user not found");
          return null;
        }

        // 2) Bandingkan password vs bcrypt hash
        const ok = await bcrypt.compare(password, String(user.passwordHash));
        if (debug) console.log("AUTH: compare =", ok);
        if (!ok) return null;

        // 3) WAJIB return object user (minimal id/email) agar NextAuth membuat session
        return {
          id: String(user.id),
          email: String(user.email),
          name: "Admin",
          role: String(user.role ?? "admin"),
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = (user as any).id;
        (token as any).role = (user as any).role ?? "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token) {
        (session.user as any).id = token.sub;
        (session.user as any).role = (token as any).role ?? "admin";
      }
      return session;
    },
  },
  // Opsional: cookie secure di production
  cookies: {
    sessionToken: {
      name: "__Secure-next-auth.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
  },
};

export const { GET, POST } = NextAuth(authOptions);
