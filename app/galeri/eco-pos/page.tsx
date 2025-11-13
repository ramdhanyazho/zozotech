import { Navbar } from "@/components/navbar";
import { getSiteSettings } from "@/lib/queries";

import { Gallery } from "../[slug]/Gallery";

export const metadata = {
  title: "Galeri Eco POS (Android) | Zozotech",
  description: "Cuplikan tampilan aplikasi kasir Eco POS (Android) dari Zozotech.",
};

export default async function EcoPosGalleryPage() {
  const siteSettings = await getSiteSettings();

  return (
    <>
      <Navbar siteName={siteSettings.siteName} logoUrl={siteSettings.navbarLogoUrl} />
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "140px 20px 80px" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "32px", color: "#111827" }}>Galeri Eco POS (Android)</h1>
        <Gallery slug="eco-pos" />
      </main>
    </>
  );
}
