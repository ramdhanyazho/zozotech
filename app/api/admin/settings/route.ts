import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { settings } from "@/drizzle/schema";
import type { LibSQLDatabase } from "drizzle-orm/libsql";
import { sql } from "drizzle-orm";
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
  const navbarLogoUrl = payload.navbarLogoUrl?.trim() || null;

  const db = getDb();

  const performUpsert = () =>
    db
      .insert(settings)
      .values({
        id: "site",
        siteName: payload.siteName.trim(),
        whatsappNumber,
        whatsappMessage,
        currency: payload.currency.trim(),
        navbarLogoUrl,
      })
      .onConflictDoUpdate({
        target: settings.id,
        set: {
          siteName: payload.siteName.trim(),
          whatsappNumber,
          whatsappMessage,
          currency: payload.currency.trim(),
          navbarLogoUrl,
        },
      });

  try {
    await performUpsert();
  } catch (error) {
    if (isMissingNavbarLogoUrlColumnError(error)) {
      await ensureNavbarLogoUrlColumn(db);
      await performUpsert();
    } else {
      throw error;
    }
  }

  return NextResponse.json({ message: "Settings updated" });
}

async function ensureNavbarLogoUrlColumn(db: LibSQLDatabase) {
  const result = await db.all(sql`PRAGMA table_info(${sql.raw("settings")});`);

  const rows = Array.isArray(result)
    ? result
    : Array.isArray((result as any)?.rows)
      ? (result as any).rows
      : [];

  const hasColumn = rows.some((row: any) => row?.name === "navbarLogoUrl");

  if (!hasColumn) {
    try {
      await db.run(sql.raw("ALTER TABLE settings ADD COLUMN navbarLogoUrl text DEFAULT '/logo-zozotech.svg'"));
    } catch (error) {
      if (!isColumnAlreadyExistsError(error)) {
        throw error;
      }
    }
  }
}

function isMissingNavbarLogoUrlColumnError(error: unknown) {
  return includesMessage(error, "no column named navbarLogoUrl");
}

function isColumnAlreadyExistsError(error: unknown) {
  return includesMessage(error, "duplicate column name: navbarLogoUrl");
}

function includesMessage(error: unknown, text: string) {
  if (!error) return false;
  const message = extractMessage(error);
  if (message.includes(text)) {
    return true;
  }

  const cause = (error as any)?.cause;
  if (!cause) return false;
  return extractMessage(cause).includes(text);
}

function extractMessage(error: unknown) {
  if (typeof error === "string") return error;
  if (error instanceof Error) {
    return error.message ?? "";
  }
  if (error && typeof error === "object" && "message" in error && typeof (error as any).message === "string") {
    return (error as any).message as string;
  }
  return "";
}
