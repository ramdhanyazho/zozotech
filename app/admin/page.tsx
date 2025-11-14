import Link from "next/link";
import { getPackages, getPublishedPosts, getSiteSettings } from "@/lib/queries";

export default async function AdminDashboardPage() {
  const [settings, posts, packages] = await Promise.all([
    getSiteSettings(),
    getPublishedPosts(),
    getPackages(),
  ]);

  const latestPost = posts[0];
  const featuredPackage = packages.find((item) => item.featured) ?? packages[0];

  const dashboardStats = [
    {
      label: "Artikel aktif",
      value: posts.length,
      description: latestPost ? `Terbaru: ${latestPost.title}` : "Belum ada artikel dipublikasikan",
      href: "/admin/posts",
    },
    {
      label: "Total paket",
      value: packages.length,
      description: featuredPackage ? `Unggulan: ${featuredPackage.name}` : "Belum ada paket dibuat",
      href: "/admin/packages",
    },
    {
      label: "Nomor WhatsApp",
      value: settings.whatsappNumber ? "Aktif" : "Belum diatur",
      description: settings.whatsappNumber || "Tambahkan nomor untuk memudahkan pemesanan",
      href: "/admin/settings",
    },
  ];

  return (
    <div className="dashboard-wrapper">
      <section className="dashboard-hero-card animate-on-load">
        <h2>Selamat datang kembali, admin!</h2>
        <p>
          Pantau performa konten, paket layanan, dan informasi penting lainnya dari satu tempat. Gunakan tombol di bawah untuk
          memperbarui data terbaru.
        </p>
        <div className="dashboard-hero-meta">
          <span>✨ {settings.siteName}</span>
          <span>📅 {new Date().toLocaleDateString("id-ID", { dateStyle: "full" })}</span>
        </div>
        <div className="dashboard-hero-actions">
          <Link href="/admin/posts" className="button-primary" style={{ paddingInline: 24 }}>
            Tulis Artikel Baru
          </Link>
          <Link href="/admin/packages" className="button-secondary" style={{ paddingInline: 24 }}>
            Tambah Paket
          </Link>
        </div>
      </section>

      <div className="dashboard-grid">
        {dashboardStats.map((item) => (
          <div key={item.label} className="dashboard-card animate-on-load">
            <h3>{item.label}</h3>
            <span className="dashboard-value">{item.value}</span>
            <p>{item.description}</p>
            <Link href={item.href} className="dashboard-link">
              Kelola {item.label.toLowerCase()} →
            </Link>
          </div>
        ))}
      </div>

      <div className="dashboard-panels">
        <div className="dashboard-panel animate-on-load">
          <h3>Informasi Situs</h3>
          <p>
            <strong>Nama situs:</strong> {settings.siteName}
          </p>
          <p>
            <strong>Logo navbar:</strong> {settings.navbarLogoUrl ? "Custom" : "Menggunakan default"}
          </p>
          <p>
            <strong>Favicon:</strong> {settings.faviconUrl ? "Custom" : "Menggunakan default"}
          </p>
          <p>
            <strong>Pesan WhatsApp:</strong> {settings.whatsappMessage || "Menggunakan pesan default"}
          </p>
          <Link href="/admin/settings">Perbarui pengaturan →</Link>
        </div>
        <div className="dashboard-panel animate-on-load animate-delay-2">
          <h3>Aktivitas Terbaru</h3>
          <p>
            <strong>Artikel terbaru:</strong> {latestPost ? latestPost.title : "Belum ada artikel"}
          </p>
          <p>
            <strong>Paket unggulan:</strong> {featuredPackage ? featuredPackage.name : "Belum ada paket"}
          </p>
          <p>
            <strong>WhatsApp default:</strong> {settings.whatsappNumber || "Belum diatur"}
          </p>
          <p>
            <strong>Mata uang:</strong> {settings.currency}
          </p>
        </div>
      </div>
    </div>
  );
}
