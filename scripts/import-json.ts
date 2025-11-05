import "dotenv/config";
import fs from "node:fs/promises";
import path from "node:path";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { packages, posts } from "@/drizzle/schema";

async function importPosts() {
  const filePath = path.join(process.cwd(), "data", "posts.json");
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const json = JSON.parse(raw);
    const list: any[] = Array.isArray(json.posts) ? json.posts : [];

    for (const item of list) {
      const slug = String(item.slug || item.id || "").trim();
      if (!slug) continue;
      const title = String(item.title || "").trim();
      if (!title) continue;
      const date = String(item.date || "").trim() || new Date().toISOString().slice(0, 10);

      const [existing] = await db.select({ id: posts.id }).from(posts).where(eq(posts.slug, slug)).limit(1);
      if (existing) {
        console.log(`Lewati artikel ${slug}, sudah ada.`);
        continue;
      }

      await db.insert(posts).values({
        slug,
        title,
        date,
        excerpt: item.excerpt ?? null,
        content: item.content ?? null,
        icon: item.icon ?? null,
        published: true,
      });
      console.log(`Artikel ${slug} diimport.`);
    }
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.log("posts.json tidak ditemukan, melewati import artikel.");
    } else {
      throw error;
    }
  }
}

async function importPackages() {
  const filePath = path.join(process.cwd(), "data", "prices.json");
  try {
    const raw = await fs.readFile(filePath, "utf8");
    const json = JSON.parse(raw);
    const list: any[] = Array.isArray(json.packages) ? json.packages : [];

    for (const item of list) {
      const name = String(item.name || "").trim();
      if (!name) continue;

      const [existing] = await db.select({ id: packages.id }).from(packages).where(eq(packages.name, name)).limit(1);
      if (existing) {
        console.log(`Lewati paket ${name}, sudah ada.`);
        continue;
      }

      const features = Array.isArray(item.features) ? item.features.map((feature: any) => String(feature)) : [];

      await db.insert(packages).values({
        name,
        price: Number(item.price) || 0,
        detail: item.detail ?? null,
        icon: item.icon ?? null,
        featured: Boolean(item.featured),
        features: JSON.stringify(features),
      });
      console.log(`Paket ${name} diimport.`);
    }
  } catch (error: any) {
    if (error.code === "ENOENT") {
      console.log("prices.json tidak ditemukan, melewati import paket.");
    } else {
      throw error;
    }
  }
}

async function main() {
  try {
    await importPosts();
    await importPackages();
  } catch (error) {
    console.error("Import JSON gagal:", error);
    process.exitCode = 1;
  }
}

main();
