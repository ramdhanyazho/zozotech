import { desc, eq } from "drizzle-orm";

import { getDb } from "./db";
import { packages, posts, settings } from "@/drizzle/schema";

function logQueryError(message: string, error: unknown) {
  if (process.env.NODE_ENV !== "production") {
    console.warn(`[queries] ${message}`, error);
  }
}

export type SiteSettings = {
  siteName: string;
  whatsappNumber: string | null;
  whatsappMessage: string | null;
  currency: string;
  navbarLogoUrl: string;
};

const defaultSettings = {
  siteName: process.env.SITE_DEFAULT_NAME ?? "ZOZOTECH",
  whatsappNumber: null,
  whatsappMessage: "Halo, saya tertarik dengan produk Anda",
  currency: process.env.SITE_DEFAULT_CURRENCY ?? "Rp",
  navbarLogoUrl: "/logo-zozotech.svg",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  try {
    const db = getDb({ optional: true });
    if (!db) {
      return defaultSettings;
    }
    const [row] = await db.select().from(settings).limit(1);
    if (!row) {
      return defaultSettings;
    }
    return {
      siteName: row.siteName ?? defaultSettings.siteName,
      whatsappNumber: row.whatsappNumber ?? defaultSettings.whatsappNumber,
      whatsappMessage: row.whatsappMessage ?? defaultSettings.whatsappMessage,
      currency: row.currency ?? defaultSettings.currency,
      navbarLogoUrl: row.navbarLogoUrl ?? defaultSettings.navbarLogoUrl,
    };
  } catch (error) {
    logQueryError("getSiteSettings failed", error);
    return defaultSettings;
  }
}

export type PublishedPost = {
  id: string;
  slug: string;
  title: string;
  date: string;
  excerpt: string | null;
  content: string | null;
  icon: string | null;
};

export async function getPublishedPosts(): Promise<PublishedPost[]> {
  try {
    const db = getDb({ optional: true });
    if (!db) {
      return [];
    }
    const rows = await db
      .select({
        id: posts.id,
        slug: posts.id,
        title: posts.title,
        date: posts.date,
        excerpt: posts.excerpt,
        content: posts.content,
        icon: posts.icon,
      })
      .from(posts)
      .where(eq(posts.published, true))
      .orderBy(desc(posts.date), desc(posts.createdAt));

    return rows.map((row) => ({
      ...row,
    }));
  } catch (error) {
    logQueryError("getPublishedPosts failed", error);
    return [];
  }
}

export async function getAllPosts() {
  const db = getDb({ optional: true });
  if (!db) {
    return [];
  }
  const rows = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.createdAt));

  return rows.map((row) => ({
    ...row,
    slug: row.id,
    published: !!row.published,
  }));
}

export async function getPostById(id: string) {
  const db = getDb({ optional: true });
  if (!db) return null;
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!row) return null;
  return { ...row, slug: row.id, published: !!row.published };
}

export async function getPostBySlug(slug: string): Promise<PublishedPost | null> {
  const db = getDb({ optional: true });
  if (!db) {
    return null;
  }
  const [row] = await db
    .select({
      id: posts.id,
      slug: posts.id,
      title: posts.title,
      date: posts.date,
      excerpt: posts.excerpt,
      content: posts.content,
      icon: posts.icon,
      published: posts.published,
    })
    .from(posts)
    .where(eq(posts.id, slug))
    .limit(1);

  if (!row || !row.published) {
    return null;
  }

  const { published: _published, ...post } = row;
  return post;
}

export type PackageWithFeatures = {
  id: string;
  name: string;
  price: number;
  detail: string | null;
  icon: string | null;
  featured: boolean;
  features: string[];
};

export async function getPackages(): Promise<PackageWithFeatures[]> {
  try {
    const db = getDb({ optional: true });
    if (!db) {
      return [];
    }
    const rows = await db
      .select({
        id: packages.id,
        name: packages.name,
        price: packages.price,
        detail: packages.detail,
        icon: packages.icon,
        featured: packages.featured,
        features: packages.features,
      })
      .from(packages)
      .orderBy(desc(packages.featured), desc(packages.createdAt));

    return rows.map((row) => ({
      ...row,
      featured: !!row.featured,
      features: parseFeatures(row.features),
    }));
  } catch (error) {
    logQueryError("getPackages failed", error);
    return [];
  }
}

function parseFeatures(raw: string | null): string[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw);
    if (Array.isArray(parsed)) {
      return parsed.map((item) => String(item));
    }
  } catch (error) {
    console.error("Failed to parse features", error);
  }
  return [];
}

export async function getPackageById(id: string): Promise<PackageWithFeatures | null> {
  const db = getDb({ optional: true });
  if (!db) {
    return null;
  }
  const [row] = await db
    .select({
      id: packages.id,
      name: packages.name,
      price: packages.price,
      detail: packages.detail,
      icon: packages.icon,
      featured: packages.featured,
      features: packages.features,
    })
    .from(packages)
    .where(eq(packages.id, id))
    .limit(1);

  if (!row) return null;

  return {
    ...row,
    featured: !!row.featured,
    features: parseFeatures(row.features),
  };
}
