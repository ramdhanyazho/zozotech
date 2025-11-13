"use client";

import Image from "next/image";
import { useCallback, useEffect, useMemo, useState, type DragEvent } from "react";

type ProductSlug = "open-retail" | "eco-pos";

type GalleryItem = {
  id: number;
  title: string | null;
  caption: string | null;
  alt: string | null;
  imageUrl: string;
  thumbUrl: string;
  sortOrder: number;
  isCover: number;
  isPublished: number;
  createdAt: number;
};

const PRODUCT_OPTIONS: { label: string; value: ProductSlug }[] = [
  { value: "open-retail", label: "Open Retail (PC)" },
  { value: "eco-pos", label: "Eco POS (Android)" },
];

const toast = (message: string) => {
  if (typeof window !== "undefined") {
    window.alert(message);
  }
};

export default function AdminGalleryPage() {
  const [slug, setSlug] = useState<ProductSlug>("open-retail");
  const [files, setFiles] = useState<File[]>([]);
  const [fileInputKey, setFileInputKey] = useState(0);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isReordering, setIsReordering] = useState(false);
  const [draggedId, setDraggedId] = useState<number | null>(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [alt, setAlt] = useState("");
  const [sortOrder, setSortOrder] = useState(0);
  const [isPublished, setIsPublished] = useState(true);
  const [isCover, setIsCover] = useState(false);

  const loadItems = useCallback(async (currentSlug: ProductSlug) => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/gallery?admin=1&product=${currentSlug}`, {
        cache: "no-store",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const data = await res.json();
      setItems(data.items ?? []);
    } catch (error) {
      console.error(error);
      toast("Gagal memuat galeri");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadItems(slug);
  }, [loadItems, slug]);

  const resetForm = () => {
    setFiles([]);
    setFileInputKey((value) => value + 1);
    setTitle("");
    setCaption("");
    setAlt("");
    setSortOrder(0);
    setIsPublished(true);
    setIsCover(false);
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      toast("Pilih minimal satu file gambar");
      return;
    }

    const formData = new FormData();
    formData.append("product_slug", slug);
    files.forEach((file) => formData.append("files", file));
    if (title.trim()) formData.append("title", title.trim());
    if (caption.trim()) formData.append("caption", caption.trim());
    if (alt.trim()) formData.append("alt", alt.trim());
    formData.append("sort_order", sortOrder.toString());
    formData.append("is_published", isPublished ? "true" : "false");
    formData.append("is_cover", isCover ? "true" : "false");

    setIsUploading(true);
    try {
      const res = await fetch("/api/admin/gallery", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      toast("Berhasil mengunggah galeri");
      resetForm();
      await loadItems(slug);
    } catch (error) {
      console.error(error);
      toast("Gagal mengunggah gambar");
    } finally {
      setIsUploading(false);
    }
  };

  const handleTogglePublish = async (id: number, nextValue: boolean) => {
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_published: nextValue }),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      await loadItems(slug);
    } catch (error) {
      console.error(error);
      toast("Gagal memperbarui status publish");
    }
  };

  const handleSetCover = async (id: number) => {
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_cover: true }),
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      await loadItems(slug);
    } catch (error) {
      console.error(error);
      toast("Gagal memperbarui cover");
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Hapus gambar ini?")) return;
    try {
      const res = await fetch(`/api/admin/gallery/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      setItems((current) => current.filter((item) => item.id !== id));
      toast("Berhasil menghapus gambar");
      await loadItems(slug);
    } catch (error) {
      console.error(error);
      toast("Gagal menghapus gambar");
    }
  };

  const sortedItems = useMemo(() => {
    return [...items].sort((a, b) => {
      if (a.isCover !== b.isCover) {
        return a.isCover ? -1 : 1;
      }
      if (a.sortOrder !== b.sortOrder) {
        return a.sortOrder - b.sortOrder;
      }
      return b.createdAt - a.createdAt;
    });
  }, [items]);

  const persistOrder = useCallback(
    async (updated: GalleryItem[]) => {
      setIsReordering(true);
      try {
        for (let index = 0; index < updated.length; index += 1) {
          const item = updated[index];
          const desiredOrder = index * 10;
          if (item.sortOrder !== desiredOrder) {
            const res = await fetch(`/api/admin/gallery/${item.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ sort_order: desiredOrder }),
              credentials: "include",
            });
            if (!res.ok) {
              throw new Error(await res.text());
            }
          }
        }
        await loadItems(slug);
      } catch (error) {
        console.error(error);
        toast("Gagal menyimpan urutan");
      } finally {
        setIsReordering(false);
      }
    },
    [loadItems, slug]
  );

  const handleDragStart = (id: number) => {
    setDraggedId(id);
  };

  const handleDragOver = (event: DragEvent<HTMLTableRowElement>) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  };

  const handleDrop = async (targetId: number) => {
    if (draggedId === null || draggedId === targetId) return;
    const current = [...sortedItems];
    const fromIndex = current.findIndex((item) => item.id === draggedId);
    const toIndex = current.findIndex((item) => item.id === targetId);
    if (fromIndex === -1 || toIndex === -1) {
      setDraggedId(null);
      return;
    }
    const [moved] = current.splice(fromIndex, 1);
    current.splice(toIndex, 0, moved);
    const withNewOrder = current.map((item, index) => ({
      ...item,
      sortOrder: index * 10,
    }));
    setItems(withNewOrder);
    setDraggedId(null);
    await persistOrder(withNewOrder);
  };

  return (
    <main className="admin-section">
      <h1 style={{ fontSize: "1.8rem", fontWeight: 700, marginBottom: "16px", color: "#111827" }}>
        Galeri Aplikasi
      </h1>

      <div className="admin-form" style={{ marginBottom: "32px" }}>
        <label>
          Pilih Produk
          <select value={slug} onChange={(event) => setSlug(event.target.value as ProductSlug)}>
            {PRODUCT_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </label>

        <label>
          Pilih File Gambar
          <input
            key={fileInputKey}
            type="file"
            accept="image/*"
            multiple
            onChange={(event) => setFiles(Array.from(event.target.files ?? []))}
          />
        </label>

        <div className="admin-grid" style={{ gap: "16px", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))" }}>
          <label>
            Judul
            <input value={title} onChange={(event) => setTitle(event.target.value)} placeholder="Opsional" />
          </label>
          <label>
            Caption
            <input value={caption} onChange={(event) => setCaption(event.target.value)} placeholder="Opsional" />
          </label>
          <label>
            Alt Text
            <input value={alt} onChange={(event) => setAlt(event.target.value)} placeholder="Opsional" />
          </label>
          <label>
            Urutan (angka)
            <input
              type="number"
              value={sortOrder}
              onChange={(event) => setSortOrder(Number(event.target.value) || 0)}
            />
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input
              type="checkbox"
              checked={isPublished}
              onChange={(event) => setIsPublished(event.target.checked)}
            />
            Publikasikan langsung
          </label>
          <label style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <input type="checkbox" checked={isCover} onChange={(event) => setIsCover(event.target.checked)} />
            Jadikan cover
          </label>
        </div>

        <button type="button" onClick={handleUpload} disabled={isUploading}>
          {isUploading ? "Mengunggah..." : "Upload"}
        </button>
      </div>

      <section className="admin-section" style={{ padding: "0", boxShadow: "none" }}>
        <div className="admin-top" style={{ padding: "0 24px" }}>
          <h2>Media Galeri</h2>
          {isReordering && <span className="badge">Menyimpan urutan...</span>}
        </div>
        {isLoading ? (
          <p className="admin-hint">Memuat data...</p>
        ) : sortedItems.length === 0 ? (
          <p className="admin-empty">Belum ada media untuk produk ini.</p>
        ) : (
          <div style={{ overflowX: "auto" }}>
            <table className="admin-table" style={{ minWidth: "720px" }}>
              <thead>
                <tr>
                  <th style={{ width: "60px" }}>Urut</th>
                  <th>Preview</th>
                  <th>Judul</th>
                  <th>Caption</th>
                  <th>Status</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {sortedItems.map((item) => (
                  <tr
                    key={item.id}
                    draggable
                    onDragStart={() => handleDragStart(item.id)}
                    onDragOver={handleDragOver}
                    onDrop={() => handleDrop(item.id)}
                    style={{ cursor: "move", background: item.isCover ? "#eef2ff" : undefined }}
                  >
                    <td>{item.sortOrder}</td>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <Image
                          src={item.thumbUrl}
                          alt={item.alt ?? item.title ?? ""}
                          width={80}
                          height={45}
                          style={{ borderRadius: "8px", objectFit: "cover" }}
                        />
                        {item.isCover ? <span className="badge">Cover</span> : null}
                      </div>
                    </td>
                    <td>{item.title ?? "-"}</td>
                    <td>{item.caption ?? "-"}</td>
                    <td>
                      <label style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        <input
                          type="checkbox"
                          checked={!!item.isPublished}
                          onChange={(event) => handleTogglePublish(item.id, event.target.checked)}
                        />
                        Terbit
                      </label>
                    </td>
                    <td>
                      <div className="admin-actions" style={{ gap: "8px" }}>
                        <button type="button" className="edit" onClick={() => handleSetCover(item.id)}>
                          Jadikan Cover
                        </button>
                        <button type="button" className="delete" onClick={() => handleDelete(item.id)}>
                          Hapus
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </main>
  );
}
