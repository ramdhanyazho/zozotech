import type { NextAuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";

import { eq } from "drizzle-orm";
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

        if (!user) {
          const envEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
          const envPassword = process.env.ADMIN_PASSWORD;

          const matchesEnvCredentials =
            envEmail && envPassword && normalizedEmail === envEmail && credentials.password === envPassword;

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

          return {
            id: createdUser.id,
            email: createdUser.email,
            role: createdUser.role,
            name: createdUser.email,
          } as any;
        }

        const valid = await bcrypt.compare(credentials.password, user.passwordHash);
        if (!valid) {
          return null;
        }

        return {
          id: user.id,
          email: user.email,
          role: user.role,
          name: user.email,
        } as any;
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  pages: {
    signIn: "/login",
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.role = (user as any).role ?? "admin";
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.email = token.email ?? session.user.email;
        (session.user as any).role = (token as any).role ?? "admin";
      }
      return session;
    },
  },
  secret: process.env.AUTH_SECRET,
};

export const getServerAuthSession = () => getServerSession(authOptions);

export const getAdminSession = async (): Promise<Session | null> => {
  const session = await getServerAuthSession();
  if (!session || (session.user as any)?.role !== "admin") {
    return null;
  }
  return session;
};
