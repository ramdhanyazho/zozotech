import Link from "next/link";
import { notFound } from "next/navigation";
import { getPostBySlug, getSiteSettings } from "@/lib/queries";

export default async function ArticleDetailPage({
  params,
}: {
  params: { slug: string };
}) {
  const [settings, post] = await Promise.all([
    getSiteSettings(),
    getPostBySlug(params.slug),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <main className="article-detail">
      <div className="container">
        <nav className="breadcrumb">
          <Link href="/">&larr; Kembali ke beranda</Link>
        </nav>
        <header className="article-header">
          <div className="article-icon detail">{post.icon || "📰"}</div>
          <h1>{post.title}</h1>
          <p className="article-meta">
            {new Intl.DateTimeFormat("id-ID", {
              day: "2-digit",
              month: "long",
              year: "numeric",
            }).format(new Date(`${post.date}T00:00:00`))}
          </p>
        </header>
        <section className="article-content" dangerouslySetInnerHTML={{ __html: post.content || "" }} />
      </div>
      <footer className="article-footer">
        &copy; {new Date().getFullYear()} {settings.siteName}. Semua hak dilindungi.
      </footer>
    </main>
  );
}
