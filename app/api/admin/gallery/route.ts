import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";

import { authAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import { galleryMedia, products } from "@/drizzle/schema";
import { saveImagesForSlug } from "@/lib/uploader";

const allowedSlugs = new Set(["open-retail", "eco-pos"]);

function normalizeString(value: FormDataEntryValue | null) {
  if (value === null || value === undefined) return null;
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function parseBoolean(value: FormDataEntryValue | null, defaultValue: boolean) {
  if (value === null || value === undefined || value === "") {
    return defaultValue;
  }
  const normalized = String(value).toLowerCase();
  return ["1", "true", "on", "yes"].includes(normalized);
}

function parseNumber(value: FormDataEntryValue | null, fallback = 0) {
  if (value === null || value === undefined || value === "") return fallback;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export async function POST(req: NextRequest) {
  const admin = await authAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const form = await req.formData();
  const slug = String(form.get("product_slug") ?? "").trim();

  if (!allowedSlugs.has(slug)) {
    return NextResponse.json({ error: "invalid slug" }, { status: 400 });
  }

  const db = getDb();
  const [product] = await db.select().from(products).where(eq(products.slug, slug)).limit(1);

  if (!product) {
    return NextResponse.json({ error: "product not found" }, { status: 404 });
  }

  const files = form
    .getAll("files")
    .filter((item): item is File => item instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "no files" }, { status: 400 });
  }

  let saved;
  try {
    saved = await saveImagesForSlug(slug, files);
  } catch (error) {
    console.error("Failed to process gallery uploads", error);
    return NextResponse.json({ error: "failed to process images" }, { status: 400 });
  }

  const title = normalizeString(form.get("title"));
  const caption = normalizeString(form.get("caption"));
  const alt = normalizeString(form.get("alt"));
  const sortOrder = parseNumber(form.get("sort_order"), 0);
  const isCover = parseBoolean(form.get("is_cover"), false);
  const isPublished = parseBoolean(form.get("is_published"), true);

  const insertedIds: number[] = [];

  for (const file of saved) {
    const [record] = await db
      .insert(galleryMedia)
      .values({
        productId: product.id,
        slug,
        title,
        caption,
        alt,
        imageUrl: file.imageUrl,
        thumbUrl: file.thumbUrl,
        sortOrder,
        isCover,
        isPublished,
      })
      .returning({ id: galleryMedia.id });

    if (record?.id) {
      insertedIds.push(record.id);
    }
  }

  if (isCover && insertedIds.length > 0) {
    const lastInsertedId = insertedIds[insertedIds.length - 1];
    await db.update(galleryMedia).set({ isCover: false }).where(eq(galleryMedia.productId, product.id));
    await db
      .update(galleryMedia)
      .set({ isCover: true })
      .where(eq(galleryMedia.id, lastInsertedId));
  }

  return NextResponse.json({ ok: true, inserted: insertedIds });
}
