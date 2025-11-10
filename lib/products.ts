import { eq } from "drizzle-orm";
import type { LibSQLDatabase } from "drizzle-orm/libsql";

import { products } from "@/drizzle/schema";

export const DEFAULT_PRODUCTS = {
  "open-retail": { name: "Open Retail (PC)" },
  "eco-pos": { name: "Eco POS (Android)" },
} as const;

export type DefaultProductSlug = keyof typeof DEFAULT_PRODUCTS;

type Database = LibSQLDatabase<Record<string, never>>;

type ProductRecord = {
  id: number;
  name: string;
  slug: string;
};

export function isDefaultProductSlug(slug: string): slug is DefaultProductSlug {
  return slug in DEFAULT_PRODUCTS;
}

export async function ensureDefaultProduct(
  db: Database,
  slug: DefaultProductSlug
): Promise<ProductRecord | null> {
  const [existing] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
    })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  if (existing) {
    return existing;
  }

  const defaults = DEFAULT_PRODUCTS[slug];
  if (!defaults) {
    return null;
  }

  await db.insert(products).values({
    name: defaults.name,
    slug,
  });

  const [created] = await db
    .select({
      id: products.id,
      name: products.name,
      slug: products.slug,
    })
    .from(products)
    .where(eq(products.slug, slug))
    .limit(1);

  return created ?? null;
}
