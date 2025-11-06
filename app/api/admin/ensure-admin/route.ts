import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { randomUUID } from "node:crypto";
import { z } from "zod";

export const runtime = "nodejs"; // jangan edge, butuh crypto & bcrypt

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8), // ganti rule sesuai kebutuhan
  role: z.string().default("admin"),
});

function reqEnv(name: string) {
  const v = process.env[name];
  if (!v || !String(v).trim()) {
    throw new Error(`Missing env: ${name}`);
  }
  return v;
}

export async function POST(req: NextRequest) {
  try {
    // Guard global: hanya boleh bila diizinkan
    if (process.env.ALLOW_ADMIN_SEED !== "1") {
      return NextResponse.json({ ok: false, error: "Seeding disabled" }, { status: 403 });
    }

    // Auth header rahasia
    const secret = req.headers.get("x-admin-seed-secret");
    if (!secret || secret !== process.env.ADMIN_SEED_SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    // Parse & validasi body
    const json = await req.json();
    const { email, password, role } = BodySchema.parse(json);

    // Env DB
    const TURSO_DATABASE_URL = reqEnv("TURSO_DATABASE_URL");
    const TURSO_AUTH_TOKEN   = reqEnv("TURSO_AUTH_TOKEN");

    // Koneksi
    const client = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });

    // Pastikan tabel users ada (aman jika sudah migrasi)
    await client.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT NOT NULL UNIQUE,
        passwordHash TEXT NOT NULL,
        role TEXT NOT NULL DEFAULT 'admin',
        createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now'))
      );
    `);

    // Hash password
    const hash = await bcrypt.hash(password, 12);
    const id = randomUUID();

    // Upsert by email
    await client.execute({
      sql: `
        INSERT INTO users (id, email, passwordHash, role)
        VALUES (?, ?, ?, ?)
        ON CONFLICT(email) DO UPDATE SET
          passwordHash = excluded.passwordHash,
          role = excluded.role
      `,
      args: [id, email, hash, role || "admin"],
    });

    await client.close();

    return NextResponse.json({ ok: true, email, role: role || "admin" }, { status: 200 });
  } catch (err: any) {
    const message = err?.message ?? String(err);
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
