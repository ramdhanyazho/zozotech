import { Gallery } from "../[slug]/Gallery";

export const metadata = {
  title: "Galeri Open Retail (PC) | Zozotech",
  description: "Cuplikan tampilan aplikasi kasir Open Retail (PC) dari Zozotech.",
};

export default function OpenRetailGalleryPage() {
  return (
    <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "120px 20px 80px" }}>
      <h1 style={{ fontSize: "2.5rem", marginBottom: "32px", color: "#111827" }}>Galeri Open Retail (PC)</h1>
      <Gallery slug="open-retail" />
    </main>
  );
}
