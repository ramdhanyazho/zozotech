import { sqliteTable, text, integer } from "drizzle-orm/sqlite-core";

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
});
