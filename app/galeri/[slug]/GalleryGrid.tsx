"use client";

import Image from "next/image";
import { useState } from "react";

type GalleryItem = {
  id: number;
  title: string | null;
  caption: string | null;
  alt: string | null;
  imageUrl: string;
  thumbUrl: string;
};

type GalleryGridProps = {
  productName: string;
  items: GalleryItem[];
};

export function GalleryGrid({ productName, items }: GalleryGridProps) {
  const [activeId, setActiveId] = useState<number | null>(null);
  const activeItem = items.find((item) => item.id === activeId) ?? null;

  return (
    <div>
      <section
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "20px",
          justifyItems: "center",
        }}
      >
        {items.map((item) => {
          const label = item.title || productName;
          return (
            <article
              key={item.id}
              style={{
                borderRadius: "18px",
                border: "1px solid #e5e7eb",
                boxShadow: "0 12px 30px rgba(15,23,42,0.08)",
                overflow: "hidden",
                background: "#fff",
                display: "flex",
                flexDirection: "column",
                maxWidth: "320px",
                width: "100%",
              }}
            >
              <button
                type="button"
                onClick={() => setActiveId(item.id)}
                style={{
                  padding: 0,
                  border: "none",
                  background: "transparent",
                  cursor: "pointer",
                }}
              >
                <Image
                  src={item.thumbUrl}
                  alt={item.alt || item.title || productName}
                  width={800}
                  height={450}
                  sizes="(max-width: 768px) 100vw, 320px"
                  style={{ display: "block", width: "100%", height: "200px", objectFit: "cover" }}
                />
              </button>
              <div style={{ padding: "18px" }}>
                <h3 style={{ margin: 0, fontSize: "1.1rem", color: "#111827" }}>{label}</h3>
                {item.caption ? (
                  <p style={{ marginTop: "8px", color: "#6b7280", lineHeight: 1.6 }}>{item.caption}</p>
                ) : null}
              </div>
            </article>
          );
        })}
      </section>

      {activeItem ? (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15,23,42,0.7)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "24px",
            zIndex: 2000,
          }}
          onClick={() => setActiveId(null)}
        >
          <div
            style={{
              maxWidth: "960px",
              width: "100%",
              background: "#fff",
              borderRadius: "20px",
              overflow: "hidden",
              boxShadow: "0 25px 60px rgba(15,23,42,0.25)",
            }}
            onClick={(event) => event.stopPropagation()}
          >
            <Image
              src={activeItem.imageUrl}
              alt={activeItem.alt || activeItem.title || productName}
              width={1280}
              height={720}
              style={{ display: "block", width: "100%", height: "auto" }}
            />
            <div style={{ padding: "16px", textAlign: "right" }}>
              <button
                type="button"
                onClick={() => setActiveId(null)}
                style={{
                  border: "1px solid #d1d5db",
                  borderRadius: "12px",
                  padding: "8px 18px",
                  background: "white",
                  fontWeight: 600,
                  cursor: "pointer",
                }}
              >
                Tutup
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
