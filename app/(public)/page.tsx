import Link from "next/link";
import { getPackages, getPublishedPosts, getSiteSettings } from "@/lib/queries";
import { Navbar } from "@/components/navbar";
import { formatIDR } from "@/utils/pricing";

export const revalidate = 0;

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

  const sortedPackageList = [...packageList].sort(
    (a, b) => a.computed.priceFinalIdr - b.computed.priceFinalIdr
  );

  const baseWhatsappMessage = siteSettings.whatsappMessage?.trim() || "Halo, saya tertarik dengan layanan Anda";

  const whatsappUrl = siteSettings.whatsappNumber
    ? `https://wa.me/${siteSettings.whatsappNumber}?text=${encodeURIComponent(baseWhatsappMessage)}`
    : "#";

  function getPackageWhatsappUrl(pkg: (typeof packageList)[number]) {
    if (!siteSettings.whatsappNumber) {
      return "#";
    }

    const priceLabel = pkg.computed.isDiscountActive
      ? `${formatIDR(pkg.computed.priceFinalIdr)} (hemat ${pkg.discountPercent}% dari ${formatIDR(pkg.priceOriginalIdr)})`
      : formatIDR(pkg.priceOriginalIdr);

    const packageInfo = [`Saya tertarik dengan paket ${pkg.name} (${priceLabel})`];
    if (pkg.detail) {
      packageInfo.push(`Detail: ${pkg.detail}`);
    }
    if (pkg.features.length > 0) {
      packageInfo.push(["Fitur paket:", ...pkg.features.map((feature) => `- ${feature}`)].join("\n"));
    }

    const message = [baseWhatsappMessage, "", ...packageInfo].join("\n").trim();
    return `https://wa.me/${siteSettings.whatsappNumber}?text=${encodeURIComponent(message)}`;
  }

  const stats = [
    { value: "1.200+", label: "Klien aktif di seluruh Indonesia" },
    { value: "5+", label: "Tahun pengalaman membangun solusi" },
    { value: "99,9%", label: "Rata-rata uptime layanan cloud" },
    { value: "24/7", label: "Dukungan teknis responsif" },
  ];

  const serviceList = [
    {
      icon: "⚡",
      title: "Implementasi Cepat",
      description: "Onboarding singkat dengan migrasi data dan training lengkap untuk tim Anda.",
    },
    {
      icon: "📊",
      title: "Insight Real-time",
      description: "Dashboard interaktif untuk memantau penjualan dan stok kapan pun dibutuhkan.",
    },
    {
      icon: "🔒",
      title: "Keamanan Terjamin",
      description: "Standar keamanan modern dengan backup otomatis dan akses terkontrol.",
    },
    {
      icon: "💡",
      title: "Kustom Sesuai Bisnis",
      description: "Integrasi fitur dan workflow yang fleksibel sesuai cara kerja bisnis Anda.",
    },
  ];

  const aboutHighlights = [
    "Tim support lokal yang siap membantu kapan pun",
    "Pembaruan fitur berkala tanpa biaya tambahan",
    "Pendekatan konsultatif untuk setiap implementasi",
  ];

  const heroPoints = [
    "Sinkronisasi stok & transaksi otomatis",
    "Laporan penjualan lengkap dalam hitungan detik",
    "Integrasi WhatsApp & marketplace siap pakai",
  ];

  const featuredPackage = sortedPackageList.find((pkg) => pkg.featured);

  return (
    <>
      <Navbar siteName={siteSettings.siteName} logoUrl={siteSettings.navbarLogoUrl} />

      <section className="hero" id="beranda">
        <div className="hero-inner">
          <div className="hero-text animate-on-load">
            <span className="hero-label">Sistem POS &amp; Web Profesional</span>
            <h1>
              Transformasi Digital untuk Bisnis yang Lebih Lincah
            </h1>
            <p>
              Tingkatkan performa operasional bisnis dengan aplikasi kasir modern, laporan real-time, dan layanan pembuatan
              website yang siap mendukung pertumbuhan Anda.
            </p>
            <div className="hero-actions">
              <a href="#service" className="button-primary">
                Mulai Sekarang
              </a>
              <Link href="/galeri" className="button-secondary">
                Lihat Demo
              </Link>
            </div>
            <div className="hero-meta">
              <span>✨ Dipercaya ratusan UMKM &amp; enterprise</span>
              <span>🛠️ Instalasi &amp; support profesional</span>
            </div>
          </div>
          <div className="hero-visual animate-on-load animate-delay-2">
            <div className="hero-orb" aria-hidden="true" />
            <div className="hero-card">
              <h3>Paket Unggulan</h3>
              <p>Rekomendasi terbaik untuk memulai digitalisasi bisnis Anda.</p>
              <ul className="hero-card-list">
                {heroPoints.map((point, index) => (
                  <li key={index}>
                    <span>✓</span>
                    {point}
                  </li>
                ))}
              </ul>
              <div className="hero-actions" style={{ marginTop: 12 }}>
                <a href="#contact" className="button-secondary" style={{ paddingInline: 20 }}>
                  Konsultasi Gratis
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-container">
          <div className="stats-grid">
            {stats.map((item, index) => (
              <div key={item.label} className={`stat-card animate-on-load animate-delay-${(index % 4) + 1}`}>
                <h3>{item.value}</h3>
                <p>{item.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container" id="service">
        <h2 className="section-title">Paket Aplikasi POS Kasir</h2>
        <p className="section-subtitle">Pilih paket yang sesuai dengan kebutuhan operasional bisnis Anda</p>
        <div className="pricing-grid">
          {sortedPackageList.length === 0 && (
            <p className="muted">Belum ada paket yang dipublikasikan.</p>
          )}
          {sortedPackageList.map((pkg) => {
            const isFeatured = pkg.featured || pkg.id === featuredPackage?.id;
            return (
              <div key={pkg.id} className={`pricing-card animate-on-load ${isFeatured ? "featured" : ""}`}>
                {isFeatured && <span className="pricing-card-badge">Paling Populer</span>}
                <div className="card-icon" aria-hidden="true">
                  {pkg.icon || "💼"}
                </div>
                <div>
                  <h3>{pkg.name}</h3>
                  <div className="pricing-price">
                    {pkg.computed.isDiscountActive && (
                      <div className="price-meta">
                        <span className="price-original">{formatIDR(pkg.priceOriginalIdr)}</span>
                        <span className="discount-badge">-{pkg.discountPercent}%</span>
                      </div>
                    )}
                    <span className="price">{formatIDR(pkg.computed.priceFinalIdr)}</span>
                  </div>
                  {pkg.detail && <p className="pricing-description">{pkg.detail}</p>}
                </div>
                {pkg.features.length > 0 && (
                  <ul className="pricing-feature-list" aria-label={`Fitur paket ${pkg.name}`}>
                    {pkg.features.map((feature, idx) => (
                      <li key={idx}>{feature}</li>
                    ))}
                  </ul>
                )}
                <div className="pricing-card-footer">
                  <a
                    href={getPackageWhatsappUrl(pkg)}
                    className={`package-whatsapp-button${siteSettings.whatsappNumber ? "" : " disabled"}`}
                    target={siteSettings.whatsappNumber ? "_blank" : undefined}
                    rel={siteSettings.whatsappNumber ? "noopener noreferrer" : undefined}
                    aria-disabled={siteSettings.whatsappNumber ? undefined : true}
                  >
                    {pkg.computed.isDiscountActive
                      ? `Pesan Sekarang (Hemat ${pkg.discountPercent}%)`
                      : "Pesan Paket via WhatsApp"}
                  </a>
                  <p className="pricing-note">Termasuk setup awal, training, dan dukungan teknis.</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <section className="service-section" aria-labelledby="layanan">
        <div className="container" style={{ paddingBottom: 0 }}>
          <h2 id="layanan" className="section-title">
            Layanan Web &amp; Digital Kami
          </h2>
          <p className="section-subtitle" style={{ color: "rgba(226, 232, 240, 0.85)" }}>
            Solusi menyeluruh untuk memastikan bisnis Anda hadir profesional di ranah digital.
          </p>
          <div className="service-grid">
            {serviceList.map((service, index) => (
              <div key={service.title} className="service-card animate-on-load" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="service-icon" aria-hidden="true">
                  {service.icon}
                </div>
                <h3>{service.title}</h3>
                <p>{service.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="container" id="artikel">
        <h2 className="section-title">Artikel &amp; Tips Bisnis</h2>
        <p className="section-subtitle">Update terbaru seputar teknologi kasir dan pengembangan bisnis</p>
        <div className="article-grid">
          {postList.length === 0 && <p className="muted">Belum ada artikel yang dipublikasikan.</p>}
          {postList.map((post) => (
            <article key={post.id} className="article-card animate-on-load">
              <div className="article-icon" aria-hidden="true">
                {post.icon || "📰"}
              </div>
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

      <section className="about-section" id="about">
        <div className="container" style={{ paddingBottom: 0 }}>
          <h2 className="section-title">Tentang Kami</h2>
          <p className="section-subtitle">Mitra teknologi terpercaya untuk setiap perjalanan transformasi digital Anda</p>
          <div className="about-grid">
            <div className="about-visual animate-on-load">
              <h3>Visi Kami</h3>
              <p>
                Menjadi partner teknologi yang memberdayakan bisnis lintas industri dengan solusi modern yang adaptif dan
                berkelanjutan.
              </p>
              <p>
                Kami percaya kesuksesan digital dimulai dari pondasi sistem yang stabil, data yang akurat, dan tim support yang
                peduli.
              </p>
            </div>
            <div className="about-content animate-on-load animate-delay-2">
              <p>
                ZOZOTECH membantu ratusan brand memadukan operasional offline dan online melalui sistem POS, layanan website, dan
                konsultasi teknologi menyeluruh.
              </p>
              <ul className="about-list">
                {aboutHighlights.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      <div className="contact-section" id="contact">
        <h2 className="section-title">Hubungi Kami</h2>
        <p className="section-subtitle">Konsultasi gratis untuk kebutuhan POS dan website bisnis Anda</p>
        <a id="waBtn" href={whatsappUrl} className="whatsapp-button" target="_blank" rel="noopener noreferrer">
          <span style={{ fontSize: "1.5em" }} aria-hidden="true">
            💬
          </span>
          Chat via WhatsApp
        </a>
        <p style={{ marginTop: 20, color: "#64748b" }}>Tim kami siap membantu Anda memilih solusi terbaik</p>
      </div>

      <footer>
        <p>
          &copy; {new Date().getFullYear()} {siteSettings.siteName}. Solusi Kasir &amp; Website Profesional untuk Bisnis Anda.
        </p>
        <p style={{ marginTop: 10, opacity: 0.85 }}>Melayani dengan sepenuh hati untuk kesuksesan bisnis Anda</p>
      </footer>
    </>
  );
}
