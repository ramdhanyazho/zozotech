import { randomBytes } from "node:crypto";

export const DEFAULT_GALLERY_SLUG = "uncategorized";
export const GALLERY_ALLOWED_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
];
export const GALLERY_CACHE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;
export const GALLERY_CACHE_CONTROL = "public, max-age=31536000, immutable";
const FALLBACK_FILE_NAME = "upload.bin";

function createRandomPrefix() {
  return randomBytes(6).toString("hex");
}

export function normalizeGallerySlug(value: unknown, fallback = DEFAULT_GALLERY_SLUG) {
  if (typeof value !== "string") {
    return fallback;
  }

  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "-")
    .replace(/-{2,}/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

  return normalized.length > 0 ? normalized : fallback;
}

export function sanitizeGalleryFileName(name: string | undefined) {
  if (!name) {
    return FALLBACK_FILE_NAME;
  }

  const baseName = name.split(/[\\/]/).pop() ?? FALLBACK_FILE_NAME;
  const cleaned = baseName
    .replace(/\s+/g, "-")
    .replace(/[^a-zA-Z0-9._-]/g, "")
    .replace(/-{2,}/g, "-");

  const trimmed = cleaned.replace(/^-+/, "").replace(/-+$/, "");
  return trimmed.length > 0 ? trimmed : FALLBACK_FILE_NAME;
}

export function buildGalleryBlobKey(slug: string, fileName: string) {
  const prefix = createRandomPrefix();
  return `gallery/${slug}/${prefix}-${fileName}`;
}
