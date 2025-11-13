import { Navbar } from "@/components/navbar";
import { getSiteSettings } from "@/lib/queries";

import { Gallery } from "../[slug]/Gallery";

export const metadata = {
  title: "Galeri Open Retail (PC) | Zozotech",
  description: "Cuplikan tampilan aplikasi kasir Open Retail (PC) dari Zozotech.",
};

export default async function OpenRetailGalleryPage() {
  const siteSettings = await getSiteSettings();

  return (
    <>
      <Navbar siteName={siteSettings.siteName} logoUrl={siteSettings.navbarLogoUrl} />
      <main style={{ maxWidth: "1100px", margin: "0 auto", padding: "140px 20px 80px" }}>
        <h1 style={{ fontSize: "2.5rem", marginBottom: "32px", color: "#111827" }}>Galeri Open Retail (PC)</h1>
        <Gallery slug="open-retail" />
      </main>
    </>
  );
}
