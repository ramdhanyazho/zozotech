import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { packages } from "@/drizzle/schema";
import { getAdminSession } from "@/lib/auth";
import { packageInputSchema } from "@/lib/validators";
import { desc, eq } from "drizzle-orm";

function normalizeFeatures(raw: unknown): string[] {
  if (Array.isArray(raw)) {
    return raw.map((item) => String(item).trim()).filter(Boolean);
  }
  if (typeof raw === "string") {
    return raw
      .split(/\r?\n/)
      .map((item) => item.trim())
      .filter(Boolean);
  }
  return [];
}

function parseStoredFeatures(raw: string | null) {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error("Gagal membaca fitur paket", error);
    return [];
  }
}

export async function GET() {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const data = await db.select().from(packages).orderBy(desc(packages.featured), desc(packages.createdAt));
  return NextResponse.json({
    data: data.map((item) => ({
      ...item,
      featured: !!item.featured,
      features: parseStoredFeatures(item.features),
    })),
  });
}

export async function POST(request: Request) {
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = packageInputSchema.safeParse({
    ...body,
    price: typeof body.price === "string" ? Number(body.price) : body.price,
    featured: Boolean(body?.featured),
    features: normalizeFeatures(body?.features),
  });

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid data", errors: parsed.error.flatten() }, { status: 400 });
  }

  const payload = parsed.data;

  const existing = await db
    .select({ id: packages.id })
    .from(packages)
    .where(eq(packages.name, payload.name.trim()))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ message: "Nama paket sudah digunakan" }, { status: 409 });
  }

  await db.insert(packages).values({
    name: payload.name.trim(),
    price: payload.price,
    detail: payload.detail ?? null,
    icon: payload.icon ?? null,
    featured: payload.featured ?? false,
    features: JSON.stringify(payload.features ?? []),
  });

  return NextResponse.json({ message: "Package created" }, { status: 201 });
}
