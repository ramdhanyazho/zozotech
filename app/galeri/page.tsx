import Link from "next/link";

import { Gallery } from "./[slug]/Gallery";

export const metadata = {
  title: "Galeri Aplikasi | Zozotech",
  description: "Kumpulan tampilan aplikasi Open Retail (PC) dan Eco POS (Android) dari Zozotech.",
};

export default async function GalleryLandingPage() {
  return (
    <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "120px 20px 80px" }}>
      <header style={{ textAlign: "center", marginBottom: "48px" }}>
        <p style={{ color: "#6366f1", fontWeight: 700, letterSpacing: "0.08em" }}>GALERI APLIKASI</p>
        <h1 style={{ fontSize: "2.5rem", margin: "12px 0", color: "#111827" }}>Kenali Produk Unggulan Kami</h1>
        <p style={{ color: "#6b7280", maxWidth: "720px", margin: "0 auto" }}>
          Jelajahi tampilan aplikasi kasir Open Retail untuk PC dan Eco POS untuk Android. Setiap galeri menampilkan
          antarmuka dan fitur utama yang siap meningkatkan operasional bisnis Anda.
        </p>
      </header>

      <section style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "24px", marginBottom: "56px" }}>
        <Link
          href="/galeri/open-retail"
          style={{
            display: "block",
            padding: "28px",
            borderRadius: "18px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 15px 35px rgba(79,70,229,0.15)",
            textDecoration: "none",
            color: "inherit",
            background: "linear-gradient(135deg, #eef2ff 0%, #e0e7ff 100%)",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#312e81" }}>Open Retail (PC)</h2>
          <p style={{ color: "#4338ca", marginTop: "12px", lineHeight: 1.6 }}>
            Sistem kasir lengkap untuk perangkat desktop dengan fitur inventori, multi-outlet, dan laporan komprehensif.
          </p>
          <span style={{ display: "inline-block", marginTop: "18px", fontWeight: 600, color: "#3730a3" }}>
            Lihat Galeri →
          </span>
        </Link>
        <Link
          href="/galeri/eco-pos"
          style={{
            display: "block",
            padding: "28px",
            borderRadius: "18px",
            border: "1px solid #e5e7eb",
            boxShadow: "0 15px 35px rgba(16,185,129,0.12)",
            textDecoration: "none",
            color: "inherit",
            background: "linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%)",
          }}
        >
          <h2 style={{ marginTop: 0, color: "#065f46" }}>Eco POS (Android)</h2>
          <p style={{ color: "#047857", marginTop: "12px", lineHeight: 1.6 }}>
            Aplikasi kasir mobile untuk Android dengan interface yang ringan dan mudah digunakan di berbagai perangkat.
          </p>
          <span style={{ display: "inline-block", marginTop: "18px", fontWeight: 600, color: "#047857" }}>
            Lihat Galeri →
          </span>
        </Link>
      </section>

      <section style={{ marginTop: "60px" }}>
        <h2 style={{ fontSize: "2rem", color: "#111827", marginBottom: "24px" }}>Cuplikan Galeri Terbaru</h2>
        <Gallery slug="open-retail" />
        <div style={{ height: "48px" }} />
        <Gallery slug="eco-pos" />
      </section>
    </main>
  );
}
