import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { db } from "@/lib/db";
import { settings } from "@/drizzle/schema";
import { getAdminSession } from "@/lib/auth";
import { settingsInputSchema } from "@/lib/validators";
import { getSiteSettings } from "@/lib/queries";

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const data = await getSiteSettings();
  return NextResponse.json({ data });
}

export async function PUT(request: NextRequest) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = settingsInputSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid data", errors: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;
  const whatsappNumber = payload.whatsappNumber?.trim() || null;
  const whatsappMessage = payload.whatsappMessage?.trim() || null;

  await db
    .insert(settings)
    .values({
      id: "site",
      siteName: payload.siteName.trim(),
      whatsappNumber,
      whatsappMessage,
      currency: payload.currency.trim(),
    })
    .onConflictDoUpdate({
      target: settings.id,
      set: {
        siteName: payload.siteName.trim(),
        whatsappNumber,
        whatsappMessage,
        currency: payload.currency.trim(),
      },
    });

  return NextResponse.json({ message: "Settings updated" });
}
