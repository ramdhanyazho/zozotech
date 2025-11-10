import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";

import { galleryMedia } from "@/drizzle/schema";
import { authAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ensureDefaultProduct, isDefaultProductSlug } from "@/lib/products";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const slug = searchParams.get("product");
  const isAdminRequest = searchParams.get("admin") === "1";

  if (!slug || !isDefaultProductSlug(slug)) {
    return NextResponse.json({ error: "invalid product" }, { status: 400 });
  }

  if (isAdminRequest) {
    const admin = await authAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const db = getDb();
  const product = await ensureDefaultProduct(db, slug);
  if (!product) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const conditions = [eq(galleryMedia.productId, product.id)];
  if (!isAdminRequest) {
    conditions.push(eq(galleryMedia.isPublished, true));
  }

  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

  const items = await db
    .select()
    .from(galleryMedia)
    .where(whereClause)
    .orderBy(desc(galleryMedia.isCover), asc(galleryMedia.sortOrder), desc(galleryMedia.createdAt));

  return NextResponse.json({
    product: {
      name: product.name,
      slug: product.slug,
    },
    items,
  });
}
