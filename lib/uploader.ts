import { randomUUID } from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";

import sharp from "sharp";

const MAX_UPLOAD_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

function sanitizeSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-{2,}/g, "-");
}

function resolveGalleryDir(slug: string) {
  const safeSlug = sanitizeSlug(slug);
  return path.join(process.cwd(), "public", "uploads", "gallery", safeSlug);
}

function normalizePublicPath(filePath: string) {
  const publicDir = path.join(process.cwd(), "public");
  return filePath.replace(publicDir, "").replace(/\\/g, "/");
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function convertToWebp(buffer: Buffer, width?: number) {
  let instance = sharp(buffer, { failOn: "none" }).rotate();
  if (width) {
    instance = instance.resize({ width, withoutEnlargement: true });
  }
  return instance.webp({ quality: 90 });
}

export async function saveImagesForSlug(slug: string, files: File[]) {
  const directory = resolveGalleryDir(slug);
  await ensureDir(directory);

  const results: { imageUrl: string; thumbUrl: string }[] = [];

  for (const file of files) {
    if (!(file instanceof File)) {
      throw new Error("Invalid file");
    }

    if (file.size > MAX_UPLOAD_SIZE) {
      throw new Error("File too large");
    }

    const type = file.type?.toLowerCase() ?? "";
    if (type && !ALLOWED_MIME_TYPES.has(type)) {
      throw new Error("Unsupported file type");
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const baseName = randomUUID();
    const mainPath = path.join(directory, `${baseName}.webp`);
    const thumbPath = path.join(directory, `${baseName}_900.webp`);

    await Promise.all([
      convertToWebp(buffer).toFile(mainPath),
      convertToWebp(buffer, 900).toFile(thumbPath),
    ]);

    results.push({
      imageUrl: normalizePublicPath(mainPath),
      thumbUrl: normalizePublicPath(thumbPath),
    });
  }

  return results;
}

export async function deleteGalleryFiles(paths: { imageUrl?: string | null; thumbUrl?: string | null }) {
  const entries = [paths.imageUrl, paths.thumbUrl].filter(Boolean) as string[];
  if (entries.length === 0) return;

  await Promise.all(
    entries.map(async (relativePath) => {
      const cleaned = relativePath.startsWith("/") ? relativePath.slice(1) : relativePath;
      const fullPath = path.join(process.cwd(), "public", cleaned);
      try {
        await fs.unlink(fullPath);
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
          console.error("Failed to delete gallery file", error);
        }
      }
    })
  );
}
