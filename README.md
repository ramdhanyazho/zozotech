# ZOZOTECH Full-Stack App

Aplikasi marketing dan landing page ZOZOTECH berbasis Next.js 15 dengan App Router. Konten landing page ditenagai Turso (libSQL) melalui Drizzle ORM, autentikasi admin menggunakan Auth.js (NextAuth) Credentials, dan panel admin sederhana untuk mengelola artikel, paket harga, serta pengaturan situs.

## Fitur

- **Landing page dinamis**: data artikel, paket harga, dan konfigurasi WhatsApp berasal dari database.
- **Autentikasi admin**: login email/password dengan hash bcrypt dan sesi JWT.
- **Panel admin**:
  - CRUD Artikel (slug unik, status publikasi).
  - CRUD Paket Harga (fitur berupa daftar JSON).
  - Pengaturan nama situs, nomor & pesan WhatsApp, simbol mata uang.
- **API terproteksi**: seluruh endpoint `/api/admin/*` dan halaman `/admin/*` dilindungi middleware NextAuth.
- **Migrasi & seeding**: Drizzle-kit untuk migrasi Turso, skrip seed admin + pengaturan default, serta import opsional dari JSON lama (`data/posts.json` dan `data/prices.json`).

## Prasyarat

- Node.js 20+
- Akun [Turso](https://turso.tech/) dan database libSQL aktif
- Akun [Vercel](https://vercel.com/)

## Instalasi & Pengembangan Lokal

1. **Instal dependensi**
   ```bash
   npm install
   ```
2. **Salin variabel lingkungan**
   ```bash
   cp .env.example .env.local
   ```
   Isi nilai berikut:
   - `TURSO_DATABASE_URL`, `TURSO_AUTH_TOKEN` dari Turso.
   - `AUTH_SECRET` (gunakan `openssl rand -hex 32`).
   - `NEXTAUTH_URL` (mis. `http://localhost:3000` saat lokal).
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD` untuk seed admin.
   - Opsi `SITE_DEFAULT_*` bila ingin override nilai fallback.
3. **Migrasi database**
   ```bash
   npm run db:push
   ```
4. **Seed admin & pengaturan**
   ```bash
   npm run seed
   ```
5. **(Opsional) Import data JSON lama**
   ```bash
   npm run import:json
   ```
6. **Jalankan mode pengembangan**
   ```bash
   npm run dev
   ```
   Akses `http://localhost:3000` untuk landing page dan `http://localhost:3000/login` untuk masuk admin.

## Struktur Penting

```
app/
  (public)/page.tsx           # Landing page
  artikel/[slug]/page.tsx     # Detail artikel publik
  login/page.tsx              # Form login admin
  admin/...                   # Dashboard & halaman CRUD
  api/                        # Next.js API routes (auth + CRUD)
components/                   # Komponen klien (form admin, login)
drizzle/schema.ts             # Definisi tabel Drizzle
lib/                          # Koneksi DB & helper autentikasi
scripts/                      # Seed & import JSON
public/assets/                # File statis (CSS, JS legacy)
```

## Workflow Drizzle

- `npm run db:generate` – membuat migrasi dari schema.
- `npm run db:push` – sinkron schema ke Turso.
- `npm run db:migrate` – menjalankan migrasi yang sudah digenerate.

## Deployment ke Vercel

1. **Siapkan database Turso** (jika belum)
   ```bash
   turso db create zozotech
   turso db tokens create zozotech
   ```
   Simpan URL & auth token.
2. **Atur Environment Variables** di Vercel:
   - `TURSO_DATABASE_URL`
   - `TURSO_AUTH_TOKEN`
   - `AUTH_SECRET`
   - `NEXTAUTH_URL` (mis. `https://your-project.vercel.app`)
   - `ADMIN_EMAIL`, `ADMIN_PASSWORD`
   - `SITE_DEFAULT_NAME`, `SITE_DEFAULT_CURRENCY` (opsional)
3. **Migrasi & seed** (jalankan lokal atau lewat job satu kali):
   ```bash
   npm run db:push
   npm run seed
   npm run import:json   # opsional
   ```
4. **Deploy**
   ```bash
   vercel
   vercel --prod
   ```

Setelah deploy, gunakan kredensial admin untuk login di `/login`. Panel admin tersedia di `/admin` dan seluruh API admin telah diproteksi.
