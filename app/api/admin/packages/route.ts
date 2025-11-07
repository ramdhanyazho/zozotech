import crypto from "node:crypto";

import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import { packages } from "@/drizzle/schema";
import { getAdminSession } from "@/lib/auth";
import { ensurePackagesPriceColumns, isMissingPackagesPriceColumnError } from "@/lib/migrations/packages";
import { packageInputSchema } from "@/lib/validators";
import { computeFinalPrice, isDiscountActive } from "@/utils/pricing";
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

  const db = getDb();
  await ensurePackagesPriceColumns(db);
  const data = await db.select().from(packages).orderBy(desc(packages.featured), desc(packages.createdAt));
  return NextResponse.json({
    data: data.map((item) => {
      const active = isDiscountActive({
        discountPercent: item.discountPercent,
        discountActive: item.discountActive,
      });
      const priceOriginal = item.priceOriginalIdr ?? item.price;
      const finalPrice = active
        ? computeFinalPrice(priceOriginal, item.discountPercent || 0)
        : priceOriginal;

      return {
        ...item,
        featured: !!item.featured,
        features: parseStoredFeatures(item.features),
        discountActive: !!item.discountActive,
        computed: {
          is_discount_active: active,
          price_final_idr: finalPrice,
        },
      };
    }),
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
  await ensurePackagesPriceColumns(db);
  const existing = await db
    .select({ id: packages.id })
    .from(packages)
    .where(eq(packages.name, payload.name.trim()))
    .limit(1);

  if (existing.length > 0) {
    return NextResponse.json({ message: "Nama paket sudah digunakan" }, { status: 409 });
  }

  const performInsert = async () => {
    await db.insert(packages).values({
      id: crypto.randomUUID(),
      name: payload.name.trim(),
      price: finalPrice,
      priceOriginalIdr: payload.priceOriginalIdr,
      discountPercent: payload.discountPercent,
      discountActive: payload.discountActive,
      detail: payload.detail ?? null,
      icon: payload.icon ?? null,
      featured: payload.featured ?? false,
      features: JSON.stringify(payload.features ?? []),
    });
  };

  try {
    await performInsert();
  } catch (error) {
    if (isMissingPackagesPriceColumnError(error)) {
      await ensurePackagesPriceColumns(db);
      await performInsert();
    } else {
      throw error;
    }
  }

  return NextResponse.json({ message: "Package created" }, { status: 201 });
}
