import { getPackages, getPublishedPosts, getSiteSettings } from "@/lib/queries";

export default async function AdminDashboardPage() {
  const [settings, posts, packages] = await Promise.all([
    getSiteSettings(),
    getPublishedPosts(),
    getPackages(),
  ]);

  return (
    <div className="admin-grid">
      <div className="admin-card">
        <h2>Informasi Situs</h2>
        <p>Nama situs: <strong>{settings.siteName}</strong></p>
        <p>Nomor WhatsApp: {settings.whatsappNumber || "Belum diatur"}</p>
        <p>Mata uang: {settings.currency}</p>
      </div>
      <div className="admin-card">
        <h2>Artikel Dipublikasikan</h2>
        <p>Total artikel aktif: <strong>{posts.length}</strong></p>
        <p>
          Artikel terbaru: {posts[0] ? posts[0].title : "Belum ada artikel"}
        </p>
      </div>
      <div className="admin-card">
        <h2>Paket Harga</h2>
        <p>Total paket: <strong>{packages.length}</strong></p>
        <p>
          Paket unggulan: {packages.find((item) => item.featured)?.name || "Belum ada"}
        </p>
      </div>
    </div>
  );
}
