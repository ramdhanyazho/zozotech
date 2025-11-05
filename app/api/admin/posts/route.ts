import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { getAdminSession } from "@/lib/auth";
import { postInputSchema } from "@/lib/validators";
import { desc, eq } from "drizzle-orm";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const data = await db.select().from(posts).orderBy(desc(posts.createdAt));

  return NextResponse.json({
    data: data.map((item) => ({
      ...item,
      published: !!item.published,
    })),
  });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = postInputSchema.safeParse({
    ...body,
    published: body?.published ?? true,
  });

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid data", errors: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  const existing = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, payload.slug.trim())).limit(1);
  if (existing.length > 0) {
    return NextResponse.json({ message: "Slug sudah digunakan" }, { status: 409 });
  }

  await db.insert(posts).values({
    title: payload.title.trim(),
    slug: payload.slug.trim(),
    date: payload.date,
    excerpt: payload.excerpt ?? null,
    content: payload.content ?? null,
    icon: payload.icon ?? null,
    published: payload.published,
  });

  return NextResponse.json({ message: "Post created" }, { status: 201 });
}
