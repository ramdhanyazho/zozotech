import type { Metadata } from "next";
import type { ReactNode } from "react";
import "./globals.css";

const siteTitle = process.env.SITE_DEFAULT_NAME ?? "ZOZOTECH";
const siteDescription = "Solusi POS, jasa web development, dan layanan teknologi bisnis dari ZOZOTECH.";

export const metadata: Metadata = {
  title: siteTitle,
  description: siteDescription,
};

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
