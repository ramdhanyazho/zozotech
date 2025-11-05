import type { NextAuthOptions, Session } from "next-auth";
import { getServerSession } from "next-auth";
import Credentials from "next-auth/providers/credentials";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "./db";
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
        const [user] = await db
          .select()
          .from(users)
          .where(eq(users.email, normalizedEmail))
          .limit(1);

        if (!user) {
          return null;
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
