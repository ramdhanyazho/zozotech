"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";

type SettingsFormProps = {
  settings: {
    siteName: string;
    whatsappNumber: string | null;
    whatsappMessage: string | null;
    currency: string;
    navbarLogoUrl: string;
    faviconUrl: string;
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
    faviconUrl: settings.faviconUrl ?? "",
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const faviconInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<"logo" | "favicon" | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function uploadAsset(file: File, type: "logo" | "favicon") {
    setError(null);
    setMessage(null);
    setUploadingAsset(type);

    const formData = new FormData();
    formData.append("file", file);

    const endpoint = type === "logo" ? "/api/admin/upload-logo" : "/api/admin/upload-favicon";
    const errorLabel = type === "logo" ? "logo" : "favicon";

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || `Gagal mengunggah ${errorLabel}`);
      }

      const data = await response.json();
      if (data?.url) {
        if (type === "logo") {
          update("navbarLogoUrl", data.url);
          setMessage("Logo berhasil diunggah");
        } else {
          update("faviconUrl", data.url);
          setMessage("Favicon berhasil diunggah");
        }
      }
    } catch (uploadError) {
      const fallbackMessage = `Gagal mengunggah ${errorLabel}`;
      const defaultMessage = uploadError instanceof Error ? uploadError.message || fallbackMessage : fallbackMessage;
      setError(defaultMessage);
    } finally {
      setUploadingAsset(null);
    }
  }

  async function handleLogoUpload(file: File) {
    await uploadAsset(file, "logo");
  }

  async function handleFaviconUpload(file: File) {
    await uploadAsset(file, "favicon");
  }

  function onSelectLogoFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    void handleLogoUpload(file);
    // Reset value to allow re-uploading the same file if needed
    event.target.value = "";
  }

  function onSelectFaviconFile(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    void handleFaviconUpload(file);
    event.target.value = "";
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
        faviconUrl: form.faviconUrl,
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
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploadingAsset !== null || loading}
          >
            {uploadingAsset === "logo" ? "Mengunggah..." : "Unggah Logo"}
          </button>
          {form.navbarLogoUrl && (
            <a href={form.navbarLogoUrl} target="_blank" rel="noopener noreferrer">
              Pratinjau Logo
            </a>
          )}
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml"
          style={{ display: "none" }}
          onChange={onSelectLogoFile}
        />
      </div>
      <div>
        <label htmlFor="faviconUrl">URL Favicon</label>
        <input
          id="faviconUrl"
          value={form.faviconUrl}
          onChange={(e) => update("faviconUrl", e.target.value)}
          placeholder="https://example.com/favicon.png"
        />
        <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => faviconInputRef.current?.click()}
            disabled={uploadingAsset !== null || loading}
          >
            {uploadingAsset === "favicon" ? "Mengunggah..." : "Unggah Favicon"}
          </button>
          {form.faviconUrl && (
            <a href={form.faviconUrl} target="_blank" rel="noopener noreferrer">
              Pratinjau Favicon
            </a>
          )}
        </div>
        <input
          ref={faviconInputRef}
          type="file"
          accept="image/png,image/jpeg,image/webp,image/svg+xml,image/x-icon,.ico"
          style={{ display: "none" }}
          onChange={onSelectFaviconFile}
        />
      </div>
      {error && <p className="login-error">{error}</p>}
      {message && <p style={{ color: "#16a34a", margin: 0 }}>{message}</p>}
      <button type="submit" disabled={loading || uploadingAsset !== null}>
        {loading ? "Menyimpan..." : "Simpan Pengaturan"}
      </button>
    </form>
  );
}
