"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { RichTextEditor } from "./rich-text-editor";

type PostFormProps = {
  post?: {
    id: string;
    title: string;
    slug: string;
    date: string;
    excerpt: string | null;
    content: string | null;
    icon: string | null;
    published: boolean;
  };
};

const initialState = {
  title: "",
  slug: "",
  date: new Date().toISOString().slice(0, 10),
  excerpt: "",
  content: "",
  icon: "",
  published: true,
};

export function PostForm({ post }: PostFormProps) {
  const router = useRouter();
  const [form, setForm] = useState({
    ...initialState,
    ...post,
    excerpt: post?.excerpt ?? "",
    content: post?.content ?? "",
    icon: post?.icon ?? "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function update<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const contentValue = form.content ?? "";
    const hasContent = contentValue
      .replace(/<[^>]*>/g, "")
      .replace(/&nbsp;/g, "")
      .trim().length > 0;

    const payload = {
      title: form.title.trim(),
      slug: form.slug.trim(),
      date: form.date,
      excerpt: form.excerpt.trim() || null,
      content: hasContent ? contentValue : null,
      icon: form.icon.trim() || null,
      published: form.published,
    };

    const response = await fetch(post ? `/api/admin/posts/${post.id}` : "/api/admin/posts", {
      method: post ? "PUT" : "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    setLoading(false);

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      setError(data.message || "Gagal menyimpan artikel");
      return;
    }

    router.push("/admin/posts");
    router.refresh();
  }

  return (
    <form className="admin-form" onSubmit={handleSubmit}>
      <div>
        <label htmlFor="title">Judul</label>
        <input id="title" value={form.title} onChange={(e) => update("title", e.target.value)} required />
      </div>
      <div>
        <label htmlFor="slug">Slug</label>
        <input id="slug" value={form.slug} onChange={(e) => update("slug", e.target.value)} required />
      </div>
      <div>
        <label htmlFor="date">Tanggal</label>
        <input id="date" type="date" value={form.date} onChange={(e) => update("date", e.target.value)} required />
      </div>
      <div>
        <label htmlFor="icon">Ikon (opsional)</label>
        <input id="icon" value={form.icon ?? ""} onChange={(e) => update("icon", e.target.value)} placeholder="📰" />
      </div>
      <div>
        <label htmlFor="excerpt">Ringkasan</label>
        <textarea id="excerpt" value={form.excerpt ?? ""} onChange={(e) => update("excerpt", e.target.value)} />
      </div>
      <div>
        <label htmlFor="content">Konten Artikel</label>
        <RichTextEditor
          value={form.content ?? ""}
          onChange={(value) => update("content", value)}
        />
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
        <input
          id="published"
          type="checkbox"
          checked={form.published}
          onChange={(e) => update("published", e.target.checked)}
        />
        <label htmlFor="published">Publikasikan artikel</label>
      </div>
      {error && <p className="login-error">{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? "Menyimpan..." : post ? "Simpan Perubahan" : "Tambah Artikel"}
      </button>
    </form>
  );
}
