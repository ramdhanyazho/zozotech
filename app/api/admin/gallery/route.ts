import { NextResponse } from "next/server";
import { put } from "@vercel/blob";
import sharp from "sharp";
import { eq } from "drizzle-orm";

import { gallery, galleryMedia } from "@/drizzle/schema";
import { authAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  GALLERY_ALLOWED_CONTENT_TYPES,
  GALLERY_CACHE_MAX_AGE_SECONDS,
  buildGalleryBlobKey,
  normalizeGallerySlug,
  sanitizeGalleryFileName,
} from "@/lib/gallery";
import { ensureDefaultProduct, isDefaultProductSlug } from "@/lib/products";

export const runtime = "nodejs";

const WEBP_CONTENT_TYPE = "image/webp";

function now() {
  return Math.floor(Date.now() / 1000);
}

function parseBoolean(value: unknown, fallback: boolean) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const normalized = String(value).toLowerCase();
  if (["1", "true", "on", "yes"].includes(normalized)) {
    return true;
  }
  if (["0", "false", "off", "no"].includes(normalized)) {
    return false;
  }
  return fallback;
}

function parseNumber(value: unknown, fallback: number) {
  if (value === undefined || value === null || value === "") {
    return fallback;
  }
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

function normalizeText(value: unknown) {
  if (value === undefined || value === null) {
    return null;
  }
  const text = String(value).trim();
  return text.length > 0 ? text : null;
}

function ensureWebpFileNames(originalName: string) {
  const base = originalName.replace(/\.[^.]+$/, "");
  const safeBase = base.length > 0 ? base : "upload";
  return {
    main: `${safeBase}.webp`,
    thumb: `${safeBase}_900.webp`,
  };
}

async function createWebpBuffers(buffer: Buffer) {
  const main = sharp(buffer, { failOn: "none" }).rotate().webp({ quality: 90 });
  const thumb = sharp(buffer, { failOn: "none" })
    .rotate()
    .resize({ width: 900, withoutEnlargement: true })
    .webp({ quality: 90 });

  const [mainBuffer, thumbBuffer] = await Promise.all([main.toBuffer(), thumb.toBuffer()]);
  return { mainBuffer, thumbBuffer };
}

export async function POST(req: Request) {
  const admin = await authAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const contentType = req.headers.get("content-type") ?? "";
  if (!contentType.includes("multipart/form-data")) {
    return NextResponse.json(
      { error: "Content-Type must be multipart/form-data" },
      { status: 400 }
    );
  }

  const form = await req.formData();
  const slugValue = form.get("slug") ?? form.get("product_slug");
  const slug = normalizeGallerySlug(slugValue);

  if (!isDefaultProductSlug(slug)) {
    return NextResponse.json({ error: "invalid product" }, { status: 400 });
  }

  const files = Array.from(form.getAll("files"))
    .filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  if (!process.env.UPLOAD_READ_WRITE_TOKEN) {
    return NextResponse.json(
      { error: "Blob token is not configured" },
      { status: 500 }
    );
  }

  const db = getDb();
  const product = await ensureDefaultProduct(db, slug);
  if (!product) {
    return NextResponse.json({ error: "product not found" }, { status: 404 });
  }

  const title = normalizeText(form.get("title"));
  const caption = normalizeText(form.get("caption"));
  const alt = normalizeText(form.get("alt"));
  const sortOrderBase = parseNumber(form.get("sort_order"), 0);
  const isPublished = parseBoolean(form.get("is_published"), true);
  const shouldSetCover = parseBoolean(form.get("is_cover"), false);

  if (shouldSetCover) {
    await db.update(galleryMedia).set({ isCover: false }).where(eq(galleryMedia.productId, product.id));
  }

  try {
    const uploads = [] as {
      slug: string;
      url: string;
      pathname: string;
      size: number;
      contentType: string | null;
      mediaId: number | null;
    }[];

    for (let index = 0; index < files.length; index += 1) {
      const file = files[index];
      const type = file.type?.toLowerCase() ?? "";
      if (type && !GALLERY_ALLOWED_CONTENT_TYPES.includes(type)) {
        throw new Error(`Unsupported file type: ${type}`);
      }

      const arrayBuffer = await file.arrayBuffer();
      const inputBuffer = Buffer.from(arrayBuffer);
      const safeFileName = sanitizeGalleryFileName(file.name);
      const { main: mainFileName, thumb: thumbFileName } = ensureWebpFileNames(safeFileName);
      const { mainBuffer, thumbBuffer } = await createWebpBuffers(inputBuffer);

      const mainKey = buildGalleryBlobKey(slug, mainFileName);
      const thumbKey = buildGalleryBlobKey(slug, thumbFileName);

      const [mainBlob, thumbBlob] = await Promise.all([
        put(mainKey, mainBuffer, {
          access: "public",
          cacheControlMaxAge: GALLERY_CACHE_MAX_AGE_SECONDS,
          token: process.env.UPLOAD_READ_WRITE_TOKEN,
          contentType: WEBP_CONTENT_TYPE,
        }),
        put(thumbKey, thumbBuffer, {
          access: "public",
          cacheControlMaxAge: GALLERY_CACHE_MAX_AGE_SECONDS,
          token: process.env.UPLOAD_READ_WRITE_TOKEN,
          contentType: WEBP_CONTENT_TYPE,
        }),
      ]);

      await db.insert(gallery).values({
        slug,
        url: mainBlob.url,
        key: mainBlob.pathname,
        contentType: WEBP_CONTENT_TYPE,
        size: mainBuffer.length,
      });

      const [media] = await db
        .insert(galleryMedia)
        .values({
          productId: product.id,
          slug,
          title,
          caption,
          alt,
          imageUrl: mainBlob.url,
          thumbUrl: thumbBlob.url,
          sortOrder: sortOrderBase + index * 10,
          isPublished,
          isCover: shouldSetCover && index === 0,
          createdAt: now(),
          updatedAt: now(),
        })
        .returning({ id: galleryMedia.id });

      uploads.push({
        slug,
        url: mainBlob.url,
        pathname: mainBlob.pathname,
        size: mainBuffer.length,
        contentType: WEBP_CONTENT_TYPE,
        mediaId: media?.id ?? null,
      });
    }

    if (shouldSetCover && uploads.length > 0) {
      const coverMediaId = uploads[0]?.mediaId;
      if (coverMediaId) {
        await db.update(galleryMedia).set({ isCover: true }).where(eq(galleryMedia.id, coverMediaId));
      }
    }

    return NextResponse.json({ ok: true, uploads });
  } catch (error) {
    console.error("Failed to process gallery uploads", error);
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}
