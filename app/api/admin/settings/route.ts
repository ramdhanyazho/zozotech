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
  const faviconUrl = payload.faviconUrl?.trim() || null;

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
        faviconUrl,
      })
      .onConflictDoUpdate({
        target: settings.id,
        set: {
          siteName: payload.siteName.trim(),
          whatsappNumber,
          whatsappMessage,
          currency: payload.currency.trim(),
          navbarLogoUrl,
          faviconUrl,
        },
      });

  try {
    await performUpsert();
  } catch (error) {
    if (isMissingSettingsColumnError(error)) {
      await ensureOptionalSettingsColumns(db);
      await performUpsert();
    } else {
      throw error;
    }
  }

  return NextResponse.json({ message: "Settings updated" });
}

async function ensureOptionalSettingsColumns(db: LibSQLDatabase) {
  const result = await db.all(sql`PRAGMA table_info(${sql.raw("settings")});`);

  const rows = Array.isArray(result)
    ? result
    : Array.isArray((result as any)?.rows)
      ? (result as any).rows
      : [];

  const hasNavbarLogoUrl = rows.some((row: any) => row?.name === "navbarLogoUrl");
  const hasFaviconUrl = rows.some((row: any) => row?.name === "faviconUrl");

  if (!hasNavbarLogoUrl) {
    await addColumnIfMissing(db, "navbarLogoUrl", "text DEFAULT '/logo-zozotech.svg'");
  }

  if (!hasFaviconUrl) {
    await addColumnIfMissing(db, "faviconUrl", "text DEFAULT '/favicon.svg'");
  }
}

async function addColumnIfMissing(db: LibSQLDatabase, column: string, definition: string) {
  try {
    await db.run(sql.raw(`ALTER TABLE settings ADD COLUMN ${column} ${definition}`));
  } catch (error) {
    if (!isColumnAlreadyExistsError(error, column)) {
      throw error;
    }
  }
}

function isMissingSettingsColumnError(error: unknown) {
  return (
    includesMessage(error, "no column named navbarLogoUrl") ||
    includesMessage(error, "no column named faviconUrl")
  );
}

function isColumnAlreadyExistsError(error: unknown, column: string) {
  return includesMessage(error, `duplicate column name: ${column}`);
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
