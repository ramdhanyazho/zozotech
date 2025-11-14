"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ReactNode } from "react";

export type SidebarItem = {
  href: string;
  label: string;
  icon: ReactNode;
};

export function AdminSidebarNav({ items }: { items: SidebarItem[] }) {
  const pathname = usePathname();

  return (
    <nav className="admin-sidebar-nav">
      {items.map((item) => {
        const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
        return (
          <Link key={item.href} href={item.href} className={`admin-sidebar-link${isActive ? " active" : ""}`}>
            <span className="sidebar-icon" aria-hidden="true">
              {item.icon}
            </span>
            <span>{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
