import Link from "next/link";
import { ReactNode } from "react";
import { getSiteSettings } from "@/lib/queries";
import { getServerAuthSession } from "@/lib/auth";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { AdminSidebarNav, SidebarItem } from "@/components/admin/sidebar-nav";

export default async function AdminLayout({ children }: { children: ReactNode }) {
  const [session, settings] = await Promise.all([
    getServerAuthSession(),
    getSiteSettings(),
  ]);

  const adminEmail = session?.user?.email ?? "admin";
  const avatarInitial = adminEmail.charAt(0).toUpperCase();

  const navigation: SidebarItem[] = [
    { href: "/admin", label: "Dashboard", icon: "📊" },
    { href: "/admin/posts", label: "Artikel", icon: "📝" },
    { href: "/admin/packages", label: "Harga Paket", icon: "💼" },
    { href: "/admin/gallery", label: "Galeri", icon: "🖼️" },
    { href: "/admin/settings", label: "Pengaturan", icon: "⚙️" },
  ];

  return (
    <div className="admin-shell">
      <header className="admin-topbar">
        <div className="admin-topbar-brand">
          <h1>{settings.siteName} Admin</h1>
          <p>Kelola konten website, paket layanan, dan aset digital bisnis Anda.</p>
        </div>
        <details className="admin-user-menu">
          <summary>
            <span className="admin-avatar" aria-hidden="true">
              {avatarInitial}
            </span>
            <span>
              <span className="admin-user-name">{adminEmail}</span>
              <span className="admin-user-role">Administrator</span>
            </span>
          </summary>
          <div className="admin-user-menu-content">
            <Link href="/admin/settings">Profile</Link>
            <SignOutButton />
          </div>
        </details>
      </header>

      <div className="admin-layout">
        <aside className="admin-sidebar">
          <span className="admin-sidebar-title">Navigasi</span>
          <AdminSidebarNav items={navigation} />
        </aside>
        <main className="admin-main">{children}</main>
      </div>
    </div>
  );
}
