import { desc, eq } from "drizzle-orm";
import { db } from "./db";
import { packages, posts, settings } from "@/drizzle/schema";

export type SiteSettings = {
  siteName: string;
  whatsappNumber: string | null;
  whatsappMessage: string | null;
  currency: string;
};

const defaultSettings = {
  siteName: process.env.SITE_DEFAULT_NAME ?? "ZOZOTECH",
  whatsappNumber: null,
  whatsappMessage: null,
  currency: process.env.SITE_DEFAULT_CURRENCY ?? "Rp",
};

export async function getSiteSettings(): Promise<SiteSettings> {
  const [row] = await db.select().from(settings).limit(1);
  if (!row) {
    return defaultSettings;
  }
  return {
    siteName: row.siteName ?? defaultSettings.siteName,
    whatsappNumber: row.whatsappNumber ?? defaultSettings.whatsappNumber,
    whatsappMessage: row.whatsappMessage ?? defaultSettings.whatsappMessage,
    currency: row.currency ?? defaultSettings.currency,
  };
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
  const rows = await db
    .select({
      id: posts.id,
      slug: posts.slug,
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
}

export async function getAllPosts() {
  const rows = await db
    .select()
    .from(posts)
    .orderBy(desc(posts.createdAt));

  return rows.map((row) => ({
    ...row,
    published: !!row.published,
  }));
}

export async function getPostById(id: string) {
  const [row] = await db.select().from(posts).where(eq(posts.id, id)).limit(1);
  if (!row) return null;
  return { ...row, published: !!row.published };
}

export async function getPostBySlug(slug: string): Promise<PublishedPost | null> {
  const [row] = await db
    .select({
      id: posts.id,
      slug: posts.slug,
      title: posts.title,
      date: posts.date,
      excerpt: posts.excerpt,
      content: posts.content,
      icon: posts.icon,
      published: posts.published,
    })
    .from(posts)
    .where(eq(posts.slug, slug))
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
