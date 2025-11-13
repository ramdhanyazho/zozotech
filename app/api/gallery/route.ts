import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq } from "drizzle-orm";

import { gallery, galleryMedia } from "@/drizzle/schema";
import { authAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { ensureDefaultProduct, isDefaultProductSlug } from "@/lib/products";

function now() {
  return Math.floor(Date.now() / 1000);
}

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const rawSlug = searchParams.get("product") ?? searchParams.get("slug");
  const normalizedSlug = rawSlug?.trim().toLowerCase() ?? "";
  const isAdminRequest = searchParams.get("admin") === "1";

  if (!normalizedSlug || !isDefaultProductSlug(normalizedSlug)) {
    return NextResponse.json({ error: "invalid product" }, { status: 400 });
  }

  if (isAdminRequest) {
    const admin = await authAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
  }

  const db = getDb();
  const product = await ensureDefaultProduct(db, normalizedSlug);
  if (!product) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const conditions = [eq(galleryMedia.productId, product.id)];
  if (!isAdminRequest) {
    conditions.push(eq(galleryMedia.isPublished, true));
  }

  const whereClause = conditions.length === 1 ? conditions[0] : and(...conditions);

  let items = await db
    .select()
    .from(galleryMedia)
    .where(whereClause)
    .orderBy(desc(galleryMedia.isCover), asc(galleryMedia.sortOrder), desc(galleryMedia.createdAt));

  if (items.length === 0) {
    const [anyMedia] = await db
      .select({ id: galleryMedia.id })
      .from(galleryMedia)
      .where(eq(galleryMedia.productId, product.id))
      .limit(1);

    if (!anyMedia) {
      const legacyEntries = await db
        .select()
        .from(gallery)
        .where(eq(gallery.slug, normalizedSlug))
        .orderBy(asc(gallery.createdAt));

      if (legacyEntries.length > 0) {
        await db.insert(galleryMedia).values(
          legacyEntries.map((entry, index) => ({
            productId: product.id,
            slug: normalizedSlug,
            title: null,
            caption: null,
            alt: null,
            imageUrl: entry.url,
            thumbUrl: entry.url,
            sortOrder: index * 10,
            isCover: index === 0,
            isPublished: true,
            createdAt: entry.createdAt ?? now(),
            updatedAt: now(),
          }))
        );

        items = await db
          .select()
          .from(galleryMedia)
          .where(whereClause)
          .orderBy(desc(galleryMedia.isCover), asc(galleryMedia.sortOrder), desc(galleryMedia.createdAt));
      }
    }
  }

  return NextResponse.json({
    product: {
      name: product.name,
      slug: product.slug,
    },
    items,
  });
}
