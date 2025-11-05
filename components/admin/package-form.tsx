"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PackageFormProps = {
  pkg?: {
    id: string;
    name: string;
    price: number;
    detail: string | null;
    icon: string | null;
    featured: boolean;
    features: string[];
  };
};

const defaultForm = {
  name: "",
  price: 0,
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
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
        price: Number(form.price),
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
        <label htmlFor="price">Harga</label>
        <input
          id="price"
          type="number"
          value={form.price}
          onChange={(e) => update("price", Number(e.target.value))}
          min={0}
          required
        />
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
