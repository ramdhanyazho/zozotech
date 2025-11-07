import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { put } from "@vercel/blob";

import { getAdminSession } from "@/lib/auth";

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  if (!process.env.UPLOAD_READ_WRITE_TOKEN) {
    return NextResponse.json({ message: "Blob token is not configured" }, { status: 500 });
  }

  const formData = await request.formData();
  const file = formData.get("file");

  if (!(file instanceof File)) {
    return NextResponse.json({ message: "File is required" }, { status: 400 });
  }

  if (file.size === 0) {
    return NextResponse.json({ message: "File is empty" }, { status: 400 });
  }

  if (file.size > MAX_FILE_SIZE) {
    return NextResponse.json({ message: "Ukuran file maksimal 5MB" }, { status: 400 });
  }

  const extension = (() => {
    const nameParts = file.name?.split(".") ?? [];
    const ext = nameParts.length > 1 ? nameParts.pop() : undefined;
    if (ext && /^[-a-zA-Z0-9]+$/.test(ext)) {
      return ext.toLowerCase();
    }
    const typeParts = file.type?.split("/") ?? [];
    const typeExt = typeParts.length > 1 ? typeParts.pop() : undefined;
    if (typeExt && /^[-a-zA-Z0-9]+$/.test(typeExt)) {
      return typeExt.toLowerCase();
    }
    return "bin";
  })();

  const fileName = `navbar-logos/${crypto.randomUUID()}.${extension}`;

  try {
    const blob = await put(fileName, file, {
      access: "public",
      token: process.env.UPLOAD_READ_WRITE_TOKEN,
      contentType: file.type || undefined,
    });

    return NextResponse.json({ url: blob.url });
  } catch (error) {
    console.error("Failed to upload logo", error);
    return NextResponse.json({ message: "Gagal mengunggah logo" }, { status: 500 });
  }
}
