import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { packages } from "@/drizzle/schema";
import { getAdminSession } from "@/lib/auth";
import { packageInputSchema } from "@/lib/validators";
import { computeFinalPrice, isDiscountActive } from "@/utils/pricing";
import { and, eq, ne } from "drizzle-orm";

type RouteParams = Promise<{ id: string }>;

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

export async function GET(_: NextRequest, { params }: { params: RouteParams }) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const [pkg] = await db.select().from(packages).where(eq(packages.id, id)).limit(1);
  if (!pkg) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({
    data: {
      ...pkg,
      featured: !!pkg.featured,
      features: parseStoredFeatures(pkg.features),
      discountActive: !!pkg.discountActive,
      computed: (() => {
        const active = isDiscountActive({
          discountPercent: pkg.discountPercent,
          discountActive: pkg.discountActive,
        });
        const priceOriginal = pkg.priceOriginalIdr ?? pkg.price;
        const finalPrice = active
          ? computeFinalPrice(priceOriginal, pkg.discountPercent || 0)
          : priceOriginal;
        return {
          is_discount_active: active,
          price_final_idr: finalPrice,
        };
      })(),
    },
  });
}

export async function PUT(request: NextRequest, { params }: { params: RouteParams }) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const parsed = packageInputSchema.safeParse({
    ...body,
    priceOriginalIdr:
      typeof body.priceOriginalIdr === "string"
        ? Number(body.priceOriginalIdr)
        : typeof body.price === "string"
          ? Number(body.price)
          : body.priceOriginalIdr ?? body.price,
    discountPercent:
      typeof body.discountPercent === "string"
        ? Number(body.discountPercent)
        : body.discountPercent,
    discountActive:
      typeof body.discountActive === "string"
        ? ["true", "on", "1"].includes(body.discountActive.toLowerCase())
        : Boolean(body.discountActive),
    featured: Boolean(body?.featured),
    features: normalizeFeatures(body?.features),
  });

  if (!parsed.success) {
    return NextResponse.json({ message: "Invalid data", errors: parsed.error.flatten() }, { status: 400 });
  }

  const payload = {
    ...parsed.data,
    discountPercent: Math.min(100, Math.max(0, parsed.data.discountPercent ?? 0)),
    discountActive: parsed.data.discountActive ?? false,
  };

  const finalPrice = payload.discountActive && payload.discountPercent > 0
    ? computeFinalPrice(payload.priceOriginalIdr, payload.discountPercent)
    : payload.priceOriginalIdr;

  const db = getDb();
  const conflict = await db
    .select({ id: packages.id })
    .from(packages)
    .where(and(eq(packages.name, payload.name.trim()), ne(packages.id, id)))
    .limit(1);

  if (conflict.length > 0) {
    return NextResponse.json({ message: "Nama paket sudah digunakan" }, { status: 409 });
  }

  const result = await db
    .update(packages)
    .set({
      name: payload.name.trim(),
      price: finalPrice,
      priceOriginalIdr: payload.priceOriginalIdr,
      discountPercent: payload.discountPercent,
      discountActive: payload.discountActive,
      detail: payload.detail ?? null,
      icon: payload.icon ?? null,
      featured: payload.featured ?? false,
      features: JSON.stringify(payload.features ?? []),
      updatedAt: Math.floor(Date.now() / 1000),
    })
    .where(eq(packages.id, id))
    .run();

  if (result.rowsAffected === 0) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Package updated" });
}

export async function DELETE(_: NextRequest, { params }: { params: RouteParams }) {
  const { id } = await params;
  const session = await getAdminSession();
  if (!session) {
    return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
  }

  const db = getDb();
  const result = await db.delete(packages).where(eq(packages.id, id)).run();
  if (result.rowsAffected === 0) {
    return NextResponse.json({ message: "Not found" }, { status: 404 });
  }

  return NextResponse.json({ message: "Package deleted" });
}
