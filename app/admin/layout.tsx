import { ReactNode } from "react";
import { getSiteSettings } from "@/lib/queries";
import { getServerAuthSession } from "@/lib/auth";
import { SidebarItem } from "@/components/admin/sidebar-nav";
import { AdminDashboardShell } from "@/components/admin/admin-dashboard-shell";

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
    <AdminDashboardShell
      navigation={navigation}
      siteName={settings.siteName}
      adminEmail={adminEmail}
      avatarInitial={avatarInitial}
    >
      {children}
    </AdminDashboardShell>
  );
}
