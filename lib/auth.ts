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
        const envEmail = process.env.ADMIN_EMAIL?.toLowerCase().trim();
        const envPassword = process.env.ADMIN_PASSWORD;

        const matchesEnvCredentials =
          envEmail && envPassword && normalizedEmail === envEmail && credentials.password === envPassword;

        const buildEnvUser = () =>
          matchesEnvCredentials && envEmail
            ? ({
                id: `env-admin:${envEmail}`,
                email: envEmail,
                role: "admin",
                name: envEmail,
              } as any)
            : null;

        const db = getDb({ optional: true });

        if (!db) {
          return buildEnvUser();
        }

        try {
          const [user] = await db
            .select()
            .from(users)
            .where(eq(users.email, normalizedEmail))
            .limit(1);

          if (!user) {
            if (!matchesEnvCredentials || !envEmail || !envPassword) {
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
              return buildEnvUser();
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
        } catch (error) {
          console.error("[auth] Failed to query database during login", error);
          return buildEnvUser();
        }
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
