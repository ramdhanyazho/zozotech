import Link from "next/link";
import { getPackages, getPublishedPosts, getSiteSettings } from "@/lib/queries";
import { Navbar } from "@/components/navbar";

export const revalidate = 0;

function formatCurrency(value: number, currency: string) {
  const formatter = new Intl.NumberFormat("id-ID");
  return `${currency} ${formatter.format(value)}`.trim();
}

function formatDate(value: string) {
  try {
    const date = new Date(`${value}T00:00:00`);
    return new Intl.DateTimeFormat("id-ID", {
      day: "2-digit",
      month: "long",
      year: "numeric",
    }).format(date);
  } catch (err) {
    return value;
  }
}

export default async function HomePage() {
  const [siteSettings, postList, packageList] = await Promise.all([
    getSiteSettings(),
    getPublishedPosts(),
    getPackages(),
  ]);

  const baseWhatsappMessage = siteSettings.whatsappMessage?.trim() || "Halo, saya tertarik dengan layanan Anda";

  const whatsappUrl = siteSettings.whatsappNumber
    ? `https://wa.me/${siteSettings.whatsappNumber}?text=${encodeURIComponent(baseWhatsappMessage)}`
    : "#";

  function getPackageWhatsappUrl(pkg: (typeof packageList)[number]) {
    if (!siteSettings.whatsappNumber) {
      return "#";
    }

    const packageInfo = [`Saya tertarik dengan paket ${pkg.name} (${formatCurrency(pkg.price, siteSettings.currency)})`];
    if (pkg.detail) {
      packageInfo.push(`Detail: ${pkg.detail}`);
    }
    if (pkg.features.length > 0) {
      packageInfo.push(["Fitur paket:", ...pkg.features.map((feature) => `- ${feature}`)].join("\n"));
    }

    const message = [baseWhatsappMessage, "", ...packageInfo].join("\n").trim();
    return `https://wa.me/${siteSettings.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  return (
    <>
      <Navbar siteName={siteSettings.siteName} logoUrl={siteSettings.navbarLogoUrl} />

      <div className="hero" id="beranda">
        <div className="hero-content">
          <h1>Solusi POS Kasir Terbaik untuk Bisnis Anda</h1>
          <p>
            Aplikasi kasir modern untuk PC &amp; Android dengan fitur lengkap dan support terpercaya
          </p>
          <a href="#service" className="cta-button">
            Lihat Paket Kami
          </a>
        </div>
      </div>

      <div className="container" id="service">
        <h2 className="section-title">Paket Aplikasi POS Kasir</h2>
        <p className="section-subtitle">Pilih paket yang sesuai dengan kebutuhan bisnis Anda</p>
        <div className="pricing-grid">
          {packageList.length === 0 && (
            <p className="muted">Belum ada paket yang dipublikasikan.</p>
          )}
          {packageList.map((pkg) => (
            <div key={pkg.id} className={`pricing-card ${pkg.featured ? "featured" : ""}`}>
              <div className="card-icon">{pkg.icon || "💼"}</div>
              <h3>{pkg.name}</h3>
              <p className="price">{formatCurrency(pkg.price, siteSettings.currency)}</p>
              {pkg.detail && <p style={{ color: "#666", minHeight: "48px" }}>{pkg.detail}</p>}
              {pkg.features.length > 0 && (
                <ul className="feature-list">
                  {pkg.features.map((feature, idx) => (
                    <li key={idx}>{feature}</li>
                  ))}
                </ul>
              )}
              <a
                href={getPackageWhatsappUrl(pkg)}
                className={`package-whatsapp-button${siteSettings.whatsappNumber ? "" : " disabled"}`}
                target={siteSettings.whatsappNumber ? "_blank" : undefined}
                rel={siteSettings.whatsappNumber ? "noopener noreferrer" : undefined}
                aria-disabled={siteSettings.whatsappNumber ? undefined : true}
              >
                Pesan Paket via WhatsApp
              </a>
            </div>
          ))}
        </div>
      </div>

      <div className="web-service">
        <h2>Jasa Pembuatan Website Profesional</h2>
        <p>
          Kami juga menyediakan jasa pembuatan website dengan desain modern dan fungsionalitas terbaik untuk
          meningkatkan bisnis Anda
        </p>

        <div className="features-grid">
          <div className="feature-item">
            <h3>🎨 Desain Modern</h3>
            <p>UI/UX menarik dan responsif di semua perangkat</p>
          </div>
          <div className="feature-item">
            <h3>⚡ Performa Cepat</h3>
            <p>Website dioptimasi untuk kecepatan maksimal</p>
          </div>
          <div className="feature-item">
            <h3>🔒 Aman &amp; Terpercaya</h3>
            <p>Keamanan data terjamin dengan teknologi terkini</p>
          </div>
          <div className="feature-item">
            <h3>💬 Konsultasi Gratis</h3>
            <p>Diskusi kebutuhan website Anda bersama expert kami</p>
          </div>
        </div>

        <p style={{ marginTop: 40, fontSize: "1.1em" }}>
          Dapatkan website impian Anda dengan konsultasi terbaik dari tim profesional kami
        </p>
      </div>

      <div className="container" id="artikel">
        <h2 className="section-title">Artikel &amp; Tips Bisnis</h2>
        <p className="section-subtitle">Update terbaru seputar teknologi kasir dan pengembangan bisnis</p>
        <div className="article-grid">
          {postList.length === 0 && <p className="muted">Belum ada artikel yang dipublikasikan.</p>}
          {postList.map((post) => (
            <article key={post.id} className="article-card">
              <div className="article-icon">{post.icon || "📰"}</div>
              <h3>{post.title}</h3>
              <p className="article-meta">{formatDate(post.date)}</p>
              {post.excerpt && <p>{post.excerpt}</p>}
              <Link href={`/artikel/${post.slug}`} className="article-link">
                Baca selengkapnya →
              </Link>
            </article>
          ))}
        </div>
      </div>

      <div className="container" id="about">
        <h2 className="section-title">Tentang Kami</h2>
        <p className="section-subtitle">Mitra terpercaya untuk solusi teknologi bisnis Anda</p>

        <div style={{ maxWidth: 900, margin: "0 auto" }}>
          <div
            style={{
              background: "linear-gradient(135deg, #667eea 0%, #764ba2 100%)",
              color: "white",
              padding: "60px 40px",
              borderRadius: "20px",
              marginBottom: "40px",
              textAlign: "center",
            }}
          >
            <h3 style={{ fontSize: "2em", marginBottom: "20px" }}>Visi Kami</h3>
            <p style={{ fontSize: "1.2em", lineHeight: 1.8, opacity: 0.95 }}>
              Menjadi penyedia solusi teknologi terdepan yang membantu setiap bisnis berkembang dengan sistem yang
              efisien dan terpercaya
            </p>
          </div>

          <div className="pricing-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))" }}>
            <div className="pricing-card" style={{ textAlign: "center" }}>
              <div className="card-icon" style={{ margin: "0 auto 20px" }}>
                🎯
              </div>
              <h3>Pengalaman</h3>
              <p style={{ color: "#666", marginTop: 15 }}>
                Lebih dari 5 tahun melayani berbagai jenis bisnis dari UMKM hingga perusahaan besar
              </p>
            </div>
            <div className="pricing-card" style={{ textAlign: "center" }}>
              <div className="card-icon" style={{ margin: "0 auto 20px" }}>
                👥
              </div>
              <h3>Tim Profesional</h3>
              <p style={{ color: "#666", marginTop: 15 }}>
                Didukung oleh tim developer dan support yang berpengalaman dan siap membantu
              </p>
            </div>
            <div className="pricing-card" style={{ textAlign: "center" }}>
              <div className="card-icon" style={{ margin: "0 auto 20px" }}>
                ✨
              </div>
              <h3>Inovasi</h3>
              <p style={{ color: "#666", marginTop: 15 }}>
                Terus berinovasi menghadirkan fitur-fitur terbaru sesuai kebutuhan pasar
              </p>
            </div>
          </div>
        </div>
      </div>

      <div className="contact-section" id="contact">
        <h2 className="section-title">Hubungi Kami</h2>
        <p className="section-subtitle">Konsultasi gratis untuk kebutuhan POS dan website bisnis Anda</p>
        <a id="waBtn" href={whatsappUrl} className="whatsapp-button" target="_blank" rel="noopener noreferrer">
          <span style={{ fontSize: "1.5em" }}>💬</span> Chat via WhatsApp
        </a>
        <p style={{ marginTop: 20, color: "#666" }}>Tim kami siap membantu Anda memilih solusi terbaik</p>
      </div>

      <footer>
        <p>
          &copy; {new Date().getFullYear()} {siteSettings.siteName}. Solusi Kasir &amp; Website Profesional untuk Bisnis
          Anda.
        </p>
        <p style={{ marginTop: 10, opacity: 0.8 }}>Melayani dengan sepenuh hati untuk kesuksesan bisnis Anda</p>
      </footer>
    </>
  );
}
