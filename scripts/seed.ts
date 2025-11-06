import "dotenv/config";
import crypto from "node:crypto";

import bcrypt from "bcryptjs";
import { eq } from "drizzle-orm";

import { getDb } from "../lib/db";
import { users, settings } from "../drizzle/schema";

async function main() {
  const db = getDb();
  const email = process.env.ADMIN_EMAIL!;
  const pwd = process.env.ADMIN_PASSWORD!;
  if (!email || !pwd) throw new Error("ADMIN_EMAIL/ADMIN_PASSWORD belum diset");

  const normalizedEmail = email.trim().toLowerCase();

  // settings (upsert 1 row)
  const existingSettings = await db.select().from(settings).where(eq(settings.id, "site"));
  if (existingSettings.length === 0) {
    await db.insert(settings).values({
      id: "site",
      siteName: process.env.SITE_DEFAULT_NAME || "ZOZOTECH",
      whatsappNumber: "",
      whatsappMessage: "Halo, saya tertarik dengan produk Anda",
      currency: process.env.SITE_DEFAULT_CURRENCY || "Rp",
    });
    console.log("✅ settings seeded");
  } else {
    console.log("ℹ️  settings sudah ada");
  }

  // admin user (upsert by email)
  const existing = await db.select().from(users).where(eq(users.email, normalizedEmail));
  if (existing.length === 0) {
    const hash = await bcrypt.hash(pwd, 10);
    const id = crypto.randomUUID();
    await db.insert(users).values({
      id,
      email: normalizedEmail,
      passwordHash: hash,
      role: "admin",
    });
    console.log(`✅ admin user created: ${normalizedEmail}`);
  } else {
    console.log(`ℹ️  admin user already exists: ${normalizedEmail}`);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
