import { integer, sqliteTable, text } from "drizzle-orm/sqlite-core";
import { sql } from "drizzle-orm";

const timestamp = () => sql`(strftime('%s','now'))`;
const randomId = () => sql`lower(hex(randomblob(16)))`;

export const users = sqliteTable("users", {
  id: text("id").primaryKey().notNull().default(randomId()),
  email: text("email").notNull().unique(),
  passwordHash: text("password_hash").notNull(),
  role: text("role").notNull().default(sql`'admin'`),
  createdAt: integer("created_at", { mode: "number" }).notNull().default(timestamp()),
});

export const posts = sqliteTable("posts", {
  id: text("id").primaryKey().notNull().default(randomId()),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  date: text("date").notNull(),
  excerpt: text("excerpt"),
  content: text("content"),
  icon: text("icon"),
  published: integer("published", { mode: "boolean" }).notNull().default(sql`1`),
  createdAt: integer("created_at", { mode: "number" }).notNull().default(timestamp()),
  updatedAt: integer("updated_at", { mode: "number" }).notNull().default(timestamp()),
});

export const packages = sqliteTable("packages", {
  id: text("id").primaryKey().notNull().default(randomId()),
  name: text("name").notNull().unique(),
  price: integer("price", { mode: "number" }).notNull(),
  detail: text("detail"),
  icon: text("icon"),
  featured: integer("featured", { mode: "boolean" }).notNull().default(sql`0`),
  features: text("features"),
  createdAt: integer("created_at", { mode: "number" }).notNull().default(timestamp()),
  updatedAt: integer("updated_at", { mode: "number" }).notNull().default(timestamp()),
});

export const settings = sqliteTable("settings", {
  id: text("id").primaryKey().notNull().default(sql`'site'`),
  siteName: text("site_name").notNull().default(sql`'ZOZOTECH'`),
  whatsappNumber: text("whatsapp_number"),
  whatsappMessage: text("whatsapp_message"),
  currency: text("currency").notNull().default(sql`'Rp'`),
  createdAt: integer("created_at", { mode: "number" }).notNull().default(timestamp()),
  updatedAt: integer("updated_at", { mode: "number" }).notNull().default(timestamp()),
});
