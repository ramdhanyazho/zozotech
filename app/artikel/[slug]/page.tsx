import { notFound } from "next/navigation";
import { Navbar } from "@/components/navbar";
import { getPostBySlug, getSiteSettings } from "@/lib/queries";

export default async function ArticleDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const [settings, post] = await Promise.all([
    getSiteSettings(),
    getPostBySlug(slug),
  ]);

  if (!post) {
    notFound();
  }

  return (
    <>
      <Navbar siteName={settings.siteName} logoUrl={settings.navbarLogoUrl} />

      <main className="article-detail">
        <div className="container">
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
    </>
  );
}
