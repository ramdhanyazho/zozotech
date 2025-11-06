import type { NextAuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

import { eq, sql } from "drizzle-orm";
import { getDb } from "./db";
import { users } from "@/drizzle/schema";

export const authOptions: NextAuthOptions = {
  providers: [
    Credentials({
      name: "Credentials",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null;
        }

        const normalizedEmail = credentials.email.toLowerCase().trim();
        const db = getDb();
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        let matchedUser = user;

        if (!matchedUser) {
          const [caseInsensitiveUser] = await db
            .select()
            .from(users)
            .where(sql`lower(${users.email}) = ${normalizedEmail}`)
            .limit(1);

          if (caseInsensitiveUser) {
            if (caseInsensitiveUser.email !== normalizedEmail) {
              await db
                .update(users)
                .set({ email: normalizedEmail })
                .where(eq(users.id, caseInsensitiveUser.id));
            }

            matchedUser = { ...caseInsensitiveUser, email: normalizedEmail };
          }
        }

        const envEmail = process.env.ADMIN_EMAIL
          ? process.env.ADMIN_EMAIL.toLowerCase().trim()
          : undefined;
        const envPassword = process.env.ADMIN_PASSWORD ?? "";
        const matchesEnvCredentials =
          !!envEmail &&
          !!envPassword &&
          normalizedEmail === envEmail &&
          credentials.password === envPassword;

        if (!matchedUser) {
          if (!matchesEnvCredentials) {
            return null;
          }

          const passwordHash = await bcrypt.hash(envPassword, 10);
          const adminId = randomUUID();

          await db
            .insert(users)
            .values({
              id: adminId,
              email: envEmail,
              passwordHash,
              role: "admin",
            })
            .onConflictDoNothing({ target: users.email });

          const [createdUser] = await db
            .select()
            .from(users)
            .where(eq(users.email, envEmail))
            .limit(1);

          if (!createdUser) {
            return null;
          }

          matchedUser = createdUser;
        }

        const valid = await bcrypt.compare(credentials.password, matchedUser.passwordHash);

        if (!valid) {
          if (matchesEnvCredentials) {
            const updatedHash = await bcrypt.hash(envPassword, 10);

            await db
              .update(users)
              .set({ passwordHash: updatedHash })
              .where(eq(users.id, matchedUser.id));

            return {
              id: matchedUser.id,
              email: matchedUser.email,
              role: matchedUser.role,
              name: matchedUser.email,
            } as any;
          }

          return null;
        }

        return {
          id: matchedUser.id,
          email: matchedUser.email,
          role: matchedUser.role,
          name: matchedUser.email,
        } as any;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.sub = (user as any).id ?? token.sub;
        token.email = (user as any).email ?? token.email;
        token.role = (user as any).role ?? "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email ?? session.user.email;
        (session.user as any).role = (token as any).role ?? "admin";
        (session.user as any).id = token.sub ?? (session.user as any).id;
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
  cookies: {
    sessionToken: {
      name:
        process.env.NODE_ENV === "production"
          ? "__Secure-next-auth.session-token"
          : "next-auth.session-token",
      options: {
        httpOnly: true,
        sameSite: "lax",
        path: "/",
        secure: process.env.NODE_ENV === "production",
      },
    },
  },
};

export const getServerAuthSession = () => getServerSession(authOptions);

export const getAdminSession = async (): Promise<Session | null> => {
  const session = await getServerAuthSession();
  if (!session || (session.user as any)?.role !== "admin") {
    return null;
  }
  return session;
};
