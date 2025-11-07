import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

import { getSiteSettings } from "@/lib/queries";

const siteDescription = "Solusi POS, jasa web development, dan layanan teknologi bisnis dari ZOZOTECH.";

export async function generateMetadata(): Promise<Metadata> {
  const settings = await getSiteSettings();
  const faviconUrl = settings.faviconUrl?.trim() || "/favicon.svg";

  return {
    title: settings.siteName,
    description: siteDescription,
    icons: {
      icon: faviconUrl,
    },
  };
}

export default function RootLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <html lang="id">
      <body>{children}</body>
    </html>
  );
}
