"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type SettingsFormProps = {
  settings: {
    siteName: string;
    whatsappNumber: string | null;
    whatsappMessage: string | null;
    currency: string;
    navbarLogoUrl: string;
  };
};

export function SettingsForm({ settings }: SettingsFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    siteName: settings.siteName,
    whatsappNumber: settings.whatsappNumber ?? "",
    whatsappMessage: settings.whatsappMessage ?? "",
    currency: settings.currency,
    navbarLogoUrl: settings.navbarLogoUrl ?? "",
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const response = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        siteName: form.siteName,
        whatsappNumber: form.whatsappNumber,
        whatsappMessage: form.whatsappMessage,
        currency: form.currency,
        navbarLogoUrl: form.navbarLogoUrl,
      }),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message || "Gagal memperbarui pengaturan");
      return;
    }

    setMessage("Pengaturan berhasil disimpan");
    router.refresh();
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="siteName">Nama Situs</label>
        <input id="siteName" value={form.siteName} onChange={(e) => update("siteName", e.target.value)} required />
      </div>
      <div>
        <label htmlFor="whatsappNumber">Nomor WhatsApp</label>
        <input
          id="whatsappNumber"
          value={form.whatsappNumber}
          onChange={(e) => update("whatsappNumber", e.target.value)}
          placeholder="6281234567890"
        />
      </div>
      <div>
        <label htmlFor="whatsappMessage">Pesan WhatsApp</label>
        <input
          id="whatsappMessage"
          value={form.whatsappMessage}
          onChange={(e) => update("whatsappMessage", e.target.value)}
          placeholder="Halo, saya tertarik dengan layanan Anda"
        />
      </div>
      <div>
        <label htmlFor="currency">Simbol Mata Uang</label>
        <input id="currency" value={form.currency} onChange={(e) => update("currency", e.target.value)} required />
      </div>
      <div>
        <label htmlFor="navbarLogoUrl">URL Logo Navbar</label>
        <input
          id="navbarLogoUrl"
          value={form.navbarLogoUrl}
          onChange={(e) => update("navbarLogoUrl", e.target.value)}
          placeholder="https://example.com/logo.png"
        />
      </div>
      {error && <p className="login-error">{error}</p>}
      {message && <p style={{ color: "#16a34a", margin: 0 }}>{message}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Menyimpan..." : "Simpan Pengaturan"}
      </button>
    </form>
  );
}
