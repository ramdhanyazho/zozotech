"use client";

import Link from "next/link";
import { ReactNode, useEffect, useMemo, useState } from "react";
import { SignOutButton } from "@/components/admin/sign-out-button";
import { AdminSidebarNav, SidebarItem } from "@/components/admin/sidebar-nav";

type AdminDashboardShellProps = {
  children: ReactNode;
  navigation: SidebarItem[];
  siteName: string;
  adminEmail: string;
  avatarInitial: string;
};

export function AdminDashboardShell({
  children,
  navigation,
  siteName,
  adminEmail,
  avatarInitial,
}: AdminDashboardShellProps) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const desktop = window.innerWidth >= 1024;
      setIsDesktop(desktop);

      if (desktop) {
        setIsMobileOpen(false);
      } else {
        setIsCollapsed(false);
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);

    return () => {
      window.removeEventListener("resize", handleResize);
    };
  }, []);

  useEffect(() => {
    if (!isMobileOpen) {
      return;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsMobileOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMobileOpen]);

  const toggleSidebar = () => {
    if (window.innerWidth < 1024) {
      setIsMobileOpen((open) => !open);
    } else {
      setIsCollapsed((collapsed) => !collapsed);
    }
  };

  const closeMobileSidebar = () => setIsMobileOpen(false);

  const shellClassName = useMemo(() => {
    return [
      "admin-shell",
      isCollapsed ? "sidebar-collapsed" : "",
      isMobileOpen ? "sidebar-open" : "",
    ]
      .filter(Boolean)
      .join(" ");
  }, [isCollapsed, isMobileOpen]);

  return (
    <div className={shellClassName}>
      <div className="admin-dashboard">
        <aside
          id="admin-sidebar"
          className="admin-sidebar"
          aria-label="Navigasi admin"
        >
          <button
            type="button"
            className="admin-sidebar-close"
            onClick={closeMobileSidebar}
            aria-label="Tutup navigasi"
          >
            ×
          </button>
          <span className="admin-sidebar-title">Navigasi</span>
          <AdminSidebarNav items={navigation} />
        </aside>

        <div className="admin-main-area">
          <header className="admin-topbar">
            <button
              type="button"
              className="admin-sidebar-toggle"
              onClick={toggleSidebar}
              aria-label="Toggle navigasi"
              aria-controls="admin-sidebar"
              aria-expanded={isDesktop ? !isCollapsed : isMobileOpen}
            >
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
              <span aria-hidden="true"></span>
            </button>

            <div className="admin-topbar-brand">
              <h1>{siteName} Admin</h1>
              <p>
                Kelola konten website, paket layanan, dan aset digital bisnis
                Anda.
              </p>
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

          <div className="admin-main-content">
            <main className="admin-main">{children}</main>
          </div>
        </div>
      </div>

      <div
        className="admin-sidebar-backdrop"
        role="presentation"
        onClick={closeMobileSidebar}
      />
    </div>
  );
}
