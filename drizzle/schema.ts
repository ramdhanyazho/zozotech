import { sql } from "drizzle-orm";
import { sqliteTable, text, integer, index } from "drizzle-orm/sqlite-core";

const now = () => Math.floor(Date.now() / 1000);

export const users = sqliteTable("users", {
  id: text("id").primaryKey(),
  email: text("email").notNull().unique(),
  passwordHash: text("passwordHash").notNull(),
  role: text("role").notNull().default("admin"),
  createdAt: integer("createdAt", { mode: "number" }).notNull().default(now()),
});

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey(), // slug
  title: text("title").notNull(),
  date: text("date").notNull(), // YYYY-MM-DD
  excerpt: text("excerpt"),
  content: text("content"),
  icon: text("icon"),
  published: integer("published", { mode: "boolean" }).notNull().default(true),
  createdAt: integer("createdAt", { mode: "number" }).notNull().default(now()),
  updatedAt: integer("updatedAt", { mode: "number" }).notNull().default(now()),
});

export const packages = sqliteTable("packages", {
  id: text("id").primaryKey(), // uuid/cuid
  name: text("name").notNull().unique(),
  price: integer("price", { mode: "number" }).notNull().default(0),
  priceOriginalIdr: integer("price_original_idr", { mode: "number" }).notNull().default(0),
  discountPercent: integer("discount_percent", { mode: "number" }).notNull().default(0),
  discountActive: integer("discount_active", { mode: "boolean" }).notNull().default(false),
  detail: text("detail"),
  icon: text("icon"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(false),
  features: text("features"), // JSON string array
  createdAt: integer("createdAt", { mode: "number" }).notNull().default(now()),
  updatedAt: integer("updatedAt", { mode: "number" }).notNull().default(now()),
});

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey().default("site"),
  siteName: text("siteName").notNull().default("ZOZOTECH"),
  whatsappNumber: text("whatsappNumber"),
  whatsappMessage: text("whatsappMessage"),
  currency: text("currency").notNull().default("Rp"),
  navbarLogoUrl: text("navbarLogoUrl").default("/logo-zozotech.svg"),
  faviconUrl: text("faviconUrl").default("/favicon.svg"),
});

export const products = sqliteTable(
  "products",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    name: text("name").notNull(),
    slug: text("slug").notNull().unique(),
    isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    slugIdx: index("idx_products_slug").on(t.slug),
  })
);

export const galleryMedia = sqliteTable(
  "gallery_media",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    productId: integer("product_id").notNull().references(() => products.id, { onDelete: "cascade" }),
    slug: text("slug").notNull(),
    title: text("title"),
    caption: text("caption"),
    alt: text("alt"),
    imageUrl: text("image_url").notNull(),
    thumbUrl: text("thumb_url").notNull(),
    sortOrder: integer("sort_order").notNull().default(0),
    isCover: integer("is_cover", { mode: "boolean" }).notNull().default(false),
    isPublished: integer("is_published", { mode: "boolean" }).notNull().default(true),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
    updatedAt: integer("updated_at").notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    slugIdx: index("idx_gallery_slug").on(t.slug),
    productIdx: index("idx_gallery_product").on(t.productId),
    orderIdx: index("idx_gallery_order").on(t.sortOrder),
  })
);

export const gallery = sqliteTable(
  "gallery",
  {
    id: integer("id").primaryKey({ autoIncrement: true }),
    slug: text("slug").notNull(),
    url: text("url").notNull(),
    key: text("key").notNull(),
    contentType: text("content_type"),
    size: integer("size", { mode: "number" }).notNull().default(0),
    createdAt: integer("created_at").notNull().default(sql`(unixepoch())`),
  },
  (t) => ({
    slugIdx: index("idx_gallery_v2_slug").on(t.slug),
  })
);
