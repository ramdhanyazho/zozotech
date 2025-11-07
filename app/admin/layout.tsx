import Link from "next/link";
import { ReactNode } from "react";
import { getSiteSettings } from "@/lib/queries";
import { getServerAuthSession } from "@/lib/auth";
import { SignOutButton } from "@/components/admin/sign-out-button";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [session, settings] = await Promise.all([
    getServerAuthSession(),
    getSiteSettings(),
  ]);

  const adminEmail = session?.user?.email ?? "admin";

  return (
    <div className="admin-shell">
      <header className="admin-header">
        <div>
          <h1>{settings.siteName} Admin</h1>
          <p className="admin-subtitle">Kelola konten website dan paket layanan Anda</p>
        </div>
        <div className="admin-user">{adminEmail}</div>
      </header>
      <nav className="admin-nav">
        <Link href="/admin">Dashboard</Link>
        <Link href="/admin/posts">Artikel</Link>
        <Link href="/admin/packages">Harga Paket</Link>
        <Link href="/admin/gallery">Galeri Aplikasi</Link>
        <Link href="/admin/settings">Pengaturan</Link>
        <SignOutButton />
      </nav>
      <main className="admin-content">{children}</main>
    </div>
  );
}
