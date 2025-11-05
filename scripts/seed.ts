import "dotenv/config";
import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { settings, users } from "@/drizzle/schema";

async function seedAdmin() {
  const email = process.env.ADMIN_EMAIL;
  const password = process.env.ADMIN_PASSWORD;

  if (!email || !password) {
    throw new Error("ADMIN_EMAIL dan ADMIN_PASSWORD harus diset di environment");
  }

  const existing = await db.select().from(users).where(eq(users.email, email)).limit(1);
  if (existing.length > 0) {
    console.log("Admin sudah tersedia, melewati pembuatan pengguna.");
    return;
  }

  const passwordHash = await bcrypt.hash(password, 10);
  await db.insert(users).values({
    email,
    passwordHash,
    role: "admin",
  });
  console.log("Admin berhasil dibuat:", email);
}

async function seedSettings() {
  const [row] = await db.select().from(settings).where(eq(settings.id, "site")).limit(1);
  if (row) {
    console.log("Pengaturan situs sudah ada, melewati.");
    return;
  }

  await db.insert(settings).values({
    id: "site",
    siteName: process.env.SITE_DEFAULT_NAME ?? "ZOZOTECH",
    currency: process.env.SITE_DEFAULT_CURRENCY ?? "Rp",
  });

  console.log("Pengaturan situs default dibuat.");
}

async function main() {
  try {
    await seedAdmin();
    await seedSettings();
  } catch (error) {
    console.error("Seed gagal:", error);
    process.exitCode = 1;
  }
}

main();
