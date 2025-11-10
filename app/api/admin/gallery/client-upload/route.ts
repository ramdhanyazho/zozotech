import { NextResponse } from "next/server";
import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";

import { gallery } from "@/drizzle/schema";
import { authAdmin } from "@/lib/auth";
import { getDb } from "@/lib/db";
import {
  GALLERY_ALLOWED_CONTENT_TYPES,
  GALLERY_CACHE_MAX_AGE_SECONDS,
  GALLERY_CACHE_CONTROL,
  buildGalleryBlobKey,
  normalizeGallerySlug,
  sanitizeGalleryFileName,
} from "@/lib/gallery";

export const runtime = "nodejs";

function parseClientPayload(payload: string | null | undefined): Record<string, unknown> {
  if (!payload) {
    return {};
  }

  try {
    const parsed = JSON.parse(payload);
    if (parsed && typeof parsed === "object") {
      return parsed as Record<string, unknown>;
    }
    if (typeof parsed === "string") {
      return { slug: parsed };
    }
    return {};
  } catch (error) {
    return { slug: payload };
  }
}

function extractSlugFromPayload(payload: Record<string, unknown>) {
  const raw = payload.slug ?? payload["product_slug"];
  if (typeof raw === "string") {
    return raw;
  }
  return undefined;
}

type GenerateClientTokenEvent = Extract<HandleUploadBody, { type: "blob.generate-client-token" }>;

type UploadCompletedEvent = Extract<HandleUploadBody, { type: "blob.upload-completed" }>;

function isGenerateClientTokenEvent(body: HandleUploadBody): body is GenerateClientTokenEvent {
  return body?.type === "blob.generate-client-token";
}

function isUploadCompletedEvent(body: HandleUploadBody): body is UploadCompletedEvent {
  return body?.type === "blob.upload-completed";
}

function normalizeGenerateEvent(event: GenerateClientTokenEvent) {
  const payloadData = parseClientPayload(event.payload.clientPayload);
  const slug = normalizeGallerySlug(extractSlugFromPayload(payloadData));
  const safeFileName = sanitizeGalleryFileName(event.payload.pathname);
  const pathname = buildGalleryBlobKey(slug, safeFileName);
  const clientPayload = JSON.stringify({ slug });

  return {
    ...event,
    payload: {
      ...event.payload,
      pathname,
      clientPayload,
    },
  } satisfies GenerateClientTokenEvent;
}

export async function POST(req: Request) {
  let body: HandleUploadBody;
  try {
    body = (await req.json()) as HandleUploadBody;
  } catch (error) {
    console.error("Invalid handleUpload payload", error);
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  let normalizedBody = body;

  if (isGenerateClientTokenEvent(body)) {
    const admin = await authAdmin();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    normalizedBody = normalizeGenerateEvent(body);
  } else if (!isUploadCompletedEvent(body)) {
    return NextResponse.json({ error: "Unsupported event type" }, { status: 400 });
  }

  const db = getDb();

  try {
    const response = await handleUpload({
      request: req,
      body: normalizedBody,
      onBeforeGenerateToken: async (_pathname, clientPayload) => {
        const payloadData = parseClientPayload(clientPayload);
        const slug = normalizeGallerySlug(extractSlugFromPayload(payloadData));
        const tokenPayload = JSON.stringify({ slug });

        return {
          allowedContentTypes: GALLERY_ALLOWED_CONTENT_TYPES,
          cacheControlMaxAge: GALLERY_CACHE_MAX_AGE_SECONDS,
          tokenPayload,
        };
      },
      onUploadCompleted: async ({ blob, tokenPayload }) => {
        const payloadData = parseClientPayload(tokenPayload);
        const slug = normalizeGallerySlug(extractSlugFromPayload(payloadData));

        await db.insert(gallery).values({
          slug,
          url: blob.url,
          key: blob.pathname,
          contentType: blob.contentType ?? null,
          size: blob.size ?? 0,
        });
      },
    });

    // handleUpload responses don't include cache info, attach explicit header for clarity when running locally
    const headers = new Headers();
    headers.set("cache-control", GALLERY_CACHE_CONTROL);

    return NextResponse.json(response, { headers });
  } catch (error) {
    console.error("Failed to handle gallery client upload", error);
    return NextResponse.json({ error: "Upload handler failed" }, { status: 500 });
  }
}
