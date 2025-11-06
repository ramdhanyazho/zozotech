import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import { randomUUID, randomBytes } from "node:crypto";
import { z } from "zod";

export const runtime = "nodejs"; // perlu crypto & bcrypt

const BodySchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
  role: z.string().default("admin"),
});

function reqEnv(name: string) {
  const v = process.env[name];
  if (!v || !String(v).trim()) throw new Error(`Missing env: ${name}`);
  return v;
}

function strongRandomPassword(len = 16) {
  const alphabet =
    "ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789!@#$%^&*_-";
  const buf = randomBytes(len);
  let out = "";
  for (let i = 0; i < len; i++) out += alphabet[buf[i] % alphabet.length];
  return out;
}

function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

async function upsertAdmin(email: string, plain: string, role = "admin") {
  const normalizedEmail = normalizeEmail(email);
  const TURSO_DATABASE_URL = reqEnv("TURSO_DATABASE_URL");
  const TURSO_AUTH_TOKEN = reqEnv("TURSO_AUTH_TOKEN");
  const client = createClient({ url: TURSO_DATABASE_URL, authToken: TURSO_AUTH_TOKEN });

  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      passwordHash TEXT NOT NULL,
      role TEXT NOT NULL DEFAULT 'admin',
      createdAt INTEGER NOT NULL DEFAULT (strftime('%s','now'))
    );
  `);

  const hash = await bcrypt.hash(plain, 12);
  const id = randomUUID();

  await client.execute({
    sql: `
      INSERT INTO users (id, email, passwordHash, role)
      VALUES (?, ?, ?, ?)
      ON CONFLICT(email) DO UPDATE SET
        passwordHash = excluded.passwordHash,
        role = excluded.role
    `,
    args: [id, normalizedEmail, hash, role],
  });

  await client.close();
}

/** POST: kirim email+password via JSON (recommended) */
export async function POST(req: NextRequest) {
  try {
    if (process.env.ALLOW_ADMIN_SEED !== "1") {
      return NextResponse.json({ ok: false, error: "Seeding disabled" }, { status: 403 });
    }
    const secret = req.headers.get("x-admin-seed-secret");
    if (!secret || secret !== process.env.ADMIN_SEED_SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const body = BodySchema.parse(await req.json());
    const normalizedEmail = normalizeEmail(body.email);
    await upsertAdmin(body.email, body.password, body.role);
    return NextResponse.json(
      { ok: true, email: normalizedEmail, role: body.role },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}

/** GET (opsional): generate password acak di server, tampilkan sekali di response */
export async function GET(req: NextRequest) {
  try {
    if (process.env.ALLOW_ADMIN_SEED !== "1") {
      return NextResponse.json({ ok: false, error: "Seeding disabled" }, { status: 403 });
    }
    const secret = req.headers.get("x-admin-seed-secret");
    if (!secret || secret !== process.env.ADMIN_SEED_SECRET) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const email = String(searchParams.get("email") || "").trim();
    const role = String(searchParams.get("role") || "admin").trim();
    if (!email || !email.includes("@")) {
      return NextResponse.json({ ok: false, error: "Invalid email" }, { status: 400 });
    }

    const generated = strongRandomPassword(16);
    const normalizedEmail = normalizeEmail(email);
    await upsertAdmin(email, generated, role);
    return NextResponse.json(
      {
        ok: true,
        email: normalizedEmail,
        role,
        password: generated,
        note: "Store this password now.",
      },
      { status: 200 }
    );
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message ?? String(e) }, { status: 500 });
  }
}
