# POS Site (Static JSON)

Website statis yang bisa:
- Posting berita (Artikel & Tips) dari `data/posts.json`
- Update harga paket dari `data/prices.json`
- Link WhatsApp dinamis dari `config.js`

## Cara pakai (GitHub Pages / hosting statis)
1. **Ganti nomor WhatsApp** di `config.js` (format internasional tanpa tanda +).
2. Buka `admin.html` secara lokal untuk mengedit data:
   - Tambah/ubah berita pada bagian **Posting Berita** lalu klik **Download posts.json**.
   - Tambah/ubah harga pada bagian **Harga Paket** lalu klik **Download prices.json**.
   - (Opsional) Generate **config.js** baru dari bagian **Konfigurasi**.
3. Salin file JSON yang sudah di-download ke folder `/data` dan `config.js` ke root proyek.
4. Commit & push ke GitHub. Aktifkan GitHub Pages (branch `main`, folder `/root`).

> Catatan: Mode ini **tanpa backend** sehingga admin tidak menulis langsung ke server. Admin hanya membantu membuat file JSON untuk Anda replace di repo.

## Struktur
```
/
├─ index.html
├─ admin.html
├─ config.js
├─ assets/
│  ├─ css/style.css
│  └─ js/
│     ├─ app.js
│     └─ admin.js
└─ data/
   ├─ posts.json
   └─ prices.json
```

## Deploy cepat
- Unggah seluruh isi ZIP ini ke repo GitHub baru.
- Atur `Settings → Pages → Deploy from branch`.
- Selesai. Konten artikel & harga bisa Anda perbarui dengan mengganti file JSON-nya.