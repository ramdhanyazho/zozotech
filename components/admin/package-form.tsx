"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { computeFinalPrice, formatIDR } from "@/utils/pricing";

type PackageFormProps = {
  pkg?: {
    id: string;
    name: string;
    priceOriginalIdr: number;
    discountPercent: number;
    discountActive: boolean;
    detail: string | null;
    icon: string | null;
    featured: boolean;
    features: string[];
    computed: {
      priceFinalIdr: number;
      isDiscountActive: boolean;
    };
  };
};

const defaultForm = {
  name: "",
  priceOriginalIdr: 0,
  discountPercent: 0,
  discountActive: false,
  detail: "",
  icon: "",
  featured: false,
  features: "",
};

export function PackageForm({ pkg }: PackageFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    ...defaultForm,
    ...pkg,
    detail: pkg?.detail ?? "",
    icon: pkg?.icon ?? "",
    featured: pkg?.featured ?? false,
    features: pkg?.features?.join("\n") ?? "",
    discountActive: pkg?.discountActive ?? false,
    discountPercent: pkg?.discountPercent ?? 0,
    priceOriginalIdr: pkg?.priceOriginalIdr ?? 0,
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const sanitizedDiscountPercent = Math.min(100, Math.max(0, Number(form.discountPercent) || 0));
  const priceOriginal = Number(form.priceOriginalIdr) || 0;
  const isActive = form.discountActive && sanitizedDiscountPercent > 0;
  const finalPrice = isActive
    ? computeFinalPrice(priceOriginal, sanitizedDiscountPercent)
    : priceOriginal;

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const response = await fetch(pkg ? `/api/admin/packages/${pkg.id}` : "/api/admin/packages", {
      method: pkg ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        name: form.name.trim(),
        priceOriginalIdr: Number(form.priceOriginalIdr),
        discountPercent: sanitizedDiscountPercent,
        discountActive: form.discountActive,
        detail: form.detail.trim() || null,
        icon: form.icon.trim() || null,
        featured: form.featured,
        features: form.features
          .split(/\r?\n/)
          .map((item) => item.trim())
          .filter(Boolean),
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message || "Gagal menyimpan paket");
      return;
    }

    router.push("/admin/packages");
    router.refresh();
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="name">Nama Paket</label>
        <input id="name" value={form.name} onChange={(e) => update("name", e.target.value)} required />
      </div>
      <div>
        <label htmlFor="price">Harga Asli (Rp)</label>
        <input
          id="price"
          type="number"
          value={form.priceOriginalIdr}
          onChange={(e) => update("priceOriginalIdr", Number(e.target.value))}
          min={0}
          required
        />
      </div>
      <div>
        <label htmlFor="discountPercent">Diskon (%)</label>
        <input
          id="discountPercent"
          type="number"
          value={form.discountPercent}
          onChange={(e) => update("discountPercent", Number(e.target.value))}
          min={0}
          max={100}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <input
          id="discountActive"
          type="checkbox"
          checked={form.discountActive}
          onChange={(e) => update("discountActive", e.target.checked)}
        />
        <label htmlFor="discountActive">Aktifkan diskon</label>
      </div>
      <div className="admin-hint">
        <strong>Harga tampil:</strong> {formatIDR(finalPrice)} ({
          isActive ? `hemat ${sanitizedDiscountPercent}%` : "tanpa diskon"
        })
      </div>
      <div>
        <label htmlFor="detail">Detail Singkat</label>
        <input id="detail" value={form.detail ?? ""} onChange={(e) => update("detail", e.target.value)} />
      </div>
      <div>
        <label htmlFor="icon">Ikon</label>
        <input id="icon" value={form.icon ?? ""} onChange={(e) => update("icon", e.target.value)} placeholder="💼" />
      </div>
      <div>
        <label htmlFor="features">Fitur (pisahkan dengan baris baru)</label>
        <textarea id="features" value={form.features ?? ""} onChange={(e) => update("features", e.target.value)} />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <input
          id="featured"
          type="checkbox"
          checked={form.featured}
          onChange={(e) => update("featured", e.target.checked)}
        />
        <label htmlFor="featured">Tandai sebagai paket unggulan</label>
      </div>
      {error && <p className="login-error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Menyimpan..." : pkg ? "Simpan Perubahan" : "Tambah Paket"}
      </button>
    </form>
  );
}
