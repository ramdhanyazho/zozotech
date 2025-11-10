import { NextResponse } from "next/server";
import { put } from "@vercel/blob";

import { gallery } from "@/drizzle/schema";
import { authAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  GALLERY_CACHE_MAX_AGE_SECONDS,
  buildGalleryBlobKey,
  normalizeGallerySlug,
  sanitizeGalleryFileName,
} from "@/lib/gallery";

export const runtime = "nodejs";

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

  const files = Array.from(form.getAll("files"))
    .filter((entry): entry is File => entry instanceof File);

  if (files.length === 0) {
    return NextResponse.json({ error: "No files provided" }, { status: 400 });
  }

  const db = getDb();

  try {
    const uploads = await Promise.all(
      files.map(async (file) => {
        const safeFileName = sanitizeGalleryFileName(file.name);
        const key = buildGalleryBlobKey(slug, safeFileName);

        const blob = await put(key, file, {
          access: "public",
          cacheControlMaxAge: GALLERY_CACHE_MAX_AGE_SECONDS,
        });

        await db.insert(gallery).values({
          slug,
          url: blob.url,
          key: blob.pathname,
          contentType: file.type || null,
          size: file.size,
        });

        return {
          slug,
          url: blob.url,
          pathname: blob.pathname,
          size: file.size,
          contentType: file.type || null,
        };
      })
    );

    return NextResponse.json({ ok: true, uploads });
  } catch (error) {
    console.error("Failed to process gallery uploads", error);
    return NextResponse.json({ ok: false, error: "Upload failed" }, { status: 500 });
  }
}
