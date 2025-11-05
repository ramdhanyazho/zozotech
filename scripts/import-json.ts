import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

import "dotenv/config";
import { eq } from "drizzle-orm";

import { db } from "../lib/db";
import { posts, packages } from "../drizzle/schema";

async function importPosts() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data", "posts.json"), "utf-8");
    const json = JSON.parse(raw);
    for (const p of json.posts || []) {
      if (!p.id) continue;
      const exists = await db.select().from(posts).where(eq(posts.id, p.id));
      const row = {
        id: p.id,
        title: p.title || p.id,
        date: p.date || "2025-01-01",
        excerpt: p.excerpt || "",
        content: p.content || "",
        icon: p.icon || "📰",
        published: true,
        updatedAt: Math.floor(Date.now() / 1000),
      };
      if (exists.length === 0) await db.insert(posts).values(row);
    }
    console.log("✅ posts imported");
  } catch {
    console.log("⏭️  skip posts.json");
  }
}

async function importPackages() {
  try {
    const raw = await fs.readFile(path.join(process.cwd(), "data", "prices.json"), "utf-8");
    const json = JSON.parse(raw);
    for (const p of json.packages || []) {
      if (!p.name) continue;
      const exists = await db.select().from(packages).where(eq(packages.name, p.name));
      const id = crypto.randomUUID();
      const row = {
        id: exists[0]?.id || id,
        name: p.name,
        price: Number(p.price || 0),
        detail: p.detail || "",
        icon: p.icon || "💼",
        featured: !!p.featured as unknown as boolean,
        features: JSON.stringify(p.features || []),
        updatedAt: Math.floor(Date.now() / 1000),
      };
      if (exists.length === 0) await db.insert(packages).values(row);
    }
    console.log("✅ packages imported");
  } catch {
    console.log("⏭️  skip prices.json");
  }
}

(async () => {
  await importPosts();
  await importPackages();
})();
