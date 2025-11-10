import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { authAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { galleryMedia } from "@/drizzle/schema";
import { deleteGalleryFiles } from "@/lib/uploader";
import { ensureDefaultProduct, isDefaultProductSlug } from "@/lib/products";

type RouteParams = Promise<{ id: string }>;

function now() {
  return Math.floor(Date.now() / 1000);
}

function parseBoolean(value: unknown, fallback?: boolean) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const normalized = String(value).toLowerCase();
  return ["1", "true", "on", "yes"].includes(normalized);
}

function parseNumber(value: unknown, fallback?: number) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) return undefined;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

export async function PUT(req: NextRequest, { params }: { params: RouteParams }) {
  const admin = await authAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: routeId } = await params;
  const id = Number(routeId);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const payload = await req.json();
  const db = getDb();

  const [existing] = await db
    .select()
    .from(galleryMedia)
    .where(eq(galleryMedia.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  const updates: Record<string, unknown> = { updatedAt: now() };

  const title = normalizeText(payload.title);
  if (title !== undefined) updates.title = title;

  const caption = normalizeText(payload.caption);
  if (caption !== undefined) updates.caption = caption;

  const alt = normalizeText(payload.alt);
  if (alt !== undefined) updates.alt = alt;

  const sortOrder = parseNumber(payload.sort_order);
  if (sortOrder !== undefined) updates.sortOrder = sortOrder;

  const isPublished = parseBoolean(payload.is_published);
  if (isPublished !== undefined) updates.isPublished = isPublished;

  let shouldSetCover: boolean | undefined;
  const cover = parseBoolean(payload.is_cover);
  if (cover !== undefined) {
    updates.isCover = cover;
    shouldSetCover = cover;
  }

  if (payload.product_slug !== undefined) {
    const slug = String(payload.product_slug).trim();
    if (!isDefaultProductSlug(slug)) {
      return NextResponse.json({ error: "invalid product_slug" }, { status: 400 });
    }

    const product = await ensureDefaultProduct(db, slug);
    if (!product) {
      return NextResponse.json({ error: "product not found" }, { status: 404 });
    }

    updates.productId = product.id;
    updates.slug = slug;
  }

  if (Object.keys(updates).length <= 1) {
    return NextResponse.json({ error: "no changes" }, { status: 400 });
  }

  if (shouldSetCover) {
    const productId = (updates.productId as number | undefined) ?? existing.productId;
    await db.update(galleryMedia).set({ isCover: false }).where(eq(galleryMedia.productId, productId));
  }

  await db.update(galleryMedia).set(updates).where(eq(galleryMedia.id, id));

  if (shouldSetCover) {
    await db.update(galleryMedia).set({ isCover: true }).where(eq(galleryMedia.id, id));
  }

  return NextResponse.json({ ok: true });
}

export async function DELETE(req: NextRequest, { params }: { params: RouteParams }) {
  const admin = await authAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: routeId } = await params;
  const id = Number(routeId);
  if (!Number.isInteger(id)) {
    return NextResponse.json({ error: "invalid id" }, { status: 400 });
  }

  const db = getDb();
  const [existing] = await db
    .select({
      id: galleryMedia.id,
      imageUrl: galleryMedia.imageUrl,
      thumbUrl: galleryMedia.thumbUrl,
    })
    .from(galleryMedia)
    .where(eq(galleryMedia.id, id))
    .limit(1);

  if (!existing) {
    return NextResponse.json({ error: "not found" }, { status: 404 });
  }

  await db.delete(galleryMedia).where(eq(galleryMedia.id, id));
  await deleteGalleryFiles({ imageUrl: existing.imageUrl, thumbUrl: existing.thumbUrl });

  return NextResponse.json({ ok: true });
}
