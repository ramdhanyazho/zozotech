import { notFound } from "next/navigation";

import { GalleryGrid } from "./GalleryGrid";

type ProductSlug = "open-retail" | "eco-pos";

const allowedSlugs = new Set<ProductSlug>(["open-retail", "eco-pos"]);

type GalleryResponse = {
  product: { name: string; slug: string };
  items: {
    id: number;
    title: string | null;
    caption: string | null;
    alt: string | null;
    imageUrl: string;
    thumbUrl: string;
  }[];
};

function resolveBaseUrl() {
  if (typeof window !== "undefined") {
    return "";
  }
  if (process.env.NEXT_PUBLIC_BASE_URL) {
    return process.env.NEXT_PUBLIC_BASE_URL.replace(/\/$/, "");
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL.replace(/\/$/, "")}`;
  }
  return "http://localhost:3000";
}

async function fetchGallery(slug: ProductSlug): Promise<GalleryResponse> {
  const baseUrl = resolveBaseUrl();
  const response = await fetch(`${baseUrl}/api/gallery?product=${slug}`, {
    cache: "no-store",
  });
  if (!response.ok) {
    if (response.status === 404) {
      notFound();
    }
    throw new Error("Failed to load gallery");
  }
  return (await response.json()) as GalleryResponse;
}

export async function Gallery({ slug }: { slug: ProductSlug }) {
  if (!allowedSlugs.has(slug)) {
    notFound();
  }

  const data = await fetchGallery(slug);
  return <GalleryGrid productName={data.product.name} items={data.items} />;
}
