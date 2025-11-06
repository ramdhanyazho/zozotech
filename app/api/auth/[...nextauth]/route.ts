// app/api/auth/[...nextauth]/route.ts
import NextAuth, { NextAuthOptions } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";

export const runtime = "nodejs"; // WAJIB: supaya bcrypt/crypto stabil

const DEBUG = process.env.NEXTAUTH_DEBUG === "true";

async function getUserByEmail(email: string) {
  const client = createClient({
    url: process.env.TURSO_DATABASE_URL!,
    authToken: process.env.TURSO_AUTH_TOKEN!,
  });
  const r = await client.execute({
    // Penting: lookup case-insensitive
    sql: "SELECT id, email, passwordHash, role FROM users WHERE email = ? COLLATE NOCASE LIMIT 1;",
    args: [email],
  });
  await client.close();
  return (r.rows?.[0] as any) ?? null;
}

export const authOptions: NextAuthOptions = {
  secret: process.env.AUTH_SECRET,
  session: { strategy: "jwt" }, // pakai JWT jika tanpa Adapter
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
          if (DEBUG) console.log("AUTH empty creds");
          return null;
        }

        let user: any = null;
        try {
          user = await getUserByEmail(email);
        } catch (e: any) {
          if (DEBUG) console.log("AUTH DB error:", e?.message ?? e);
          return null;
        }

        if (!user) {
          if (DEBUG) console.log("AUTH user not found:", email);
          return null;
        }

        const ok = await bcrypt.compare(password, String(user.passwordHash));
        if (DEBUG) console.log("AUTH compare:", ok);
        if (!ok) return null;

        // WAJIB: return object user agar session dibuat
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
  // Cookie secure di production
  cookies: {
    sessionToken: {
      name: "__Secure-next-auth.session-token",
      options: { httpOnly: true, sameSite: "lax", path: "/", secure: true },
    },
  },
};

export const { GET, POST } = NextAuth(authOptions);
