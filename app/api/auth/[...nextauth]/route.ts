// app/api/auth/[...nextauth]/route.ts
import NextAuth from "next-auth";

import { authOptions } from "@/lib/auth";

export const runtime = "nodejs"; // WAJIB: supaya bcrypt/crypto stabil

const handler = NextAuth(authOptions);

export { handler as GET, handler as POST };
