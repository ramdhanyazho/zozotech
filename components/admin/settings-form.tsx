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
    clients: { name: string; logoUrl: string; websiteUrl: string }[];
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
    clients: settings.clients ?? [],
  });
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const faviconInputRef = useRef<HTMLInputElement | null>(null);
  const clientLogoInputRefs = useRef<Array<HTMLInputElement | null>>([]);
  const [loading, setLoading] = useState(false);
  const [uploadingAsset, setUploadingAsset] = useState<"logo" | "favicon" | null>(null);
  const [uploadingClientIndex, setUploadingClientIndex] = useState<number | null>(null);
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

  async function handleClientLogoUpload(file: File, index: number) {
    setError(null);
    setMessage(null);
    setUploadingClientIndex(index);

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await fetch("/api/admin/upload-client-logo", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const data = await response.json().catch(() => ({}));
        throw new Error(data.message || "Gagal mengunggah logo klien");
      }

      const data = await response.json();
      if (data?.url) {
        setForm((prev) => {
          const nextClients = [...prev.clients];
          nextClients[index] = { ...nextClients[index], logoUrl: data.url };
          return { ...prev, clients: nextClients };
        });
        setMessage("Logo klien berhasil diunggah");
      }
    } catch (uploadError) {
      const fallbackMessage = "Gagal mengunggah logo klien";
      const defaultMessage = uploadError instanceof Error ? uploadError.message || fallbackMessage : fallbackMessage;
      setError(defaultMessage);
    } finally {
      setUploadingClientIndex(null);
    }
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

  function onSelectClientLogoFile(index: number, event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) {
      return;
    }
    void handleClientLogoUpload(file, index);
    event.target.value = "";
  }

  function addClient() {
    setForm((prev) => ({
      ...prev,
      clients: [...prev.clients, { name: "", logoUrl: "", websiteUrl: "" }],
    }));
  }

  function removeClient(index: number) {
    setForm((prev) => ({
      ...prev,
      clients: prev.clients.filter((_, i) => i !== index),
    }));
  }

  function updateClient<K extends keyof (typeof form.clients)[number]>(index: number, key: K, value: string) {
    setForm((prev) => {
      const nextClients = [...prev.clients];
      nextClients[index] = { ...nextClients[index], [key]: value } as (typeof form.clients)[number];
      return { ...prev, clients: nextClients };
    });
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    setError(null);

    const sanitizedClients = form.clients
      .map((client) => ({
        name: client.name.trim(),
        logoUrl: client.logoUrl.trim(),
        websiteUrl: client.websiteUrl.trim(),
      }))
      .filter((client) => client.name && client.logoUrl && client.websiteUrl);

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
        clients: sanitizedClients,
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

      <div className="client-settings">
        <div className="client-settings-header">
          <div>
            <h3>Logo Klien</h3>
            <p className="client-settings-subtitle">Tambahkan logo dan tautan ke website resmi klien Anda.</p>
          </div>
          <button type="button" className="secondary" onClick={addClient} disabled={loading || uploadingAsset !== null}>
            Tambah Logo Klien
          </button>
        </div>

        {form.clients.length === 0 && <p className="muted">Belum ada logo klien ditambahkan.</p>}

        <div className="client-cards">
          {form.clients.map((client, index) => (
            <div key={`${client.name}-${index}`} className="client-card-form">
              <div className="client-card-header">
                <strong>Logo #{index + 1}</strong>
                <button
                  type="button"
                  className="link-button"
                  onClick={() => removeClient(index)}
                  disabled={loading}
                >
                  Hapus
                </button>
              </div>
              <div className="client-card-grid">
                <div>
                  <label htmlFor={`clientName-${index}`}>Nama Perusahaan</label>
                  <input
                    id={`clientName-${index}`}
                    value={client.name}
                    onChange={(e) => updateClient(index, "name", e.target.value)}
                    placeholder="Contoh: Bank Indonesia"
                  />
                </div>
                <div>
                  <label htmlFor={`clientUrl-${index}`}>URL Website</label>
                  <input
                    id={`clientUrl-${index}`}
                    value={client.websiteUrl}
                    onChange={(e) => updateClient(index, "websiteUrl", e.target.value)}
                    placeholder="https://contoh.com"
                  />
                </div>
                <div>
                  <label htmlFor={`clientLogo-${index}`}>URL Logo</label>
                  <input
                    id={`clientLogo-${index}`}
                    value={client.logoUrl}
                    onChange={(e) => updateClient(index, "logoUrl", e.target.value)}
                    placeholder="https://contoh.com/logo.png"
                  />
                  <div style={{ display: "flex", gap: "0.5rem", marginTop: "0.5rem", flexWrap: "wrap" }}>
                    <button
                      type="button"
                      onClick={() => clientLogoInputRefs.current[index]?.click()}
                      disabled={loading || uploadingClientIndex === index}
                    >
                      {uploadingClientIndex === index ? "Mengunggah..." : "Unggah Logo"}
                    </button>
                    {client.logoUrl && (
                      <a href={client.logoUrl} target="_blank" rel="noopener noreferrer">
                        Pratinjau Logo
                      </a>
                    )}
                  </div>
                  <input
                    ref={(node) => {
                      clientLogoInputRefs.current[index] = node;
                    }}
                    type="file"
                    accept="image/png,image/jpeg,image/webp,image/svg+xml"
                    style={{ display: "none" }}
                    onChange={(e) => onSelectClientLogoFile(index, e)}
                  />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
      <button type="submit" disabled={loading || uploadingAsset !== null}>
        {loading ? "Menyimpan..." : "Simpan Pengaturan"}
      </button>
    </form>
  );
}
