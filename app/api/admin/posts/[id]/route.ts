import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { posts } from "@/drizzle/schema";
import { getAdminSession } from "@/lib/auth";
import { postInputSchema } from "@/lib/validators";
import { and, eq, ne } from "drizzle-orm";

type RouteParams = Promise<{ id: string }>;

export async function GET(_: NextRequest, { params }: { params: RouteParams }) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const [post] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!post) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ data: { ...post, published: !!post.published } });
}

export async function PUT(request: NextRequest, { params }: { params: RouteParams }) {
  const { id } = await params;
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

  const conflict = await db
    .select({ id: posts.id })
    .from(posts)
    .where(and(eq(posts.slug, payload.slug.trim()), ne(posts.id, id)))
    .limit(1);

  if (conflict.length > 0) {
    return NextResponse.json({ message: "Slug sudah digunakan" }, { status: 409 });
  }

  const updated = await db
    .update(posts)
    .set({
      title: payload.title.trim(),
      slug: payload.slug.trim(),
      date: payload.date,
      excerpt: payload.excerpt ?? null,
      content: payload.content ?? null,
      icon: payload.icon ?? null,
      published: payload.published,
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(posts.id, id))
    .run();

  if (updated.rowsAffected === 0) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Post updated" });
}

export async function DELETE(_: NextRequest, { params }: { params: RouteParams }) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const result = await db.delete(posts).where(eq(posts.id, id)).run();
  if (result.rowsAffected === 0) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Post deleted" });
}
