"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState, type MouseEvent } from "react";

interface NavbarProps {
  siteName: string;
  logoUrl: string;
}

const NAV_ITEMS = [
  { href: "#beranda", label: "Beranda", isDefaultActive: true },
  { href: "#service", label: "Service" },
  { href: "#artikel", label: "Artikel" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Kontak" },
];

export function Navbar({ siteName, logoUrl }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [activeSection, setActiveSection] = useState(
    NAV_ITEMS.find((item) => item.isDefaultActive)?.href ?? NAV_ITEMS[0]?.href ?? ""
  );
  const pathname = usePathname();
  const isHomePage = pathname === "/";
  const isGalleryActive = pathname.startsWith("/galeri");

  function closeMenu() {
    setIsMenuOpen(false);
  }

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    function syncActiveSection() {
      if (window.location.hash) {
        setActiveSection(window.location.hash);
      }
    }

    syncActiveSection();
    window.addEventListener("hashchange", syncActiveSection);
    return () => window.removeEventListener("hashchange", syncActiveSection);
  }, []);

  function handleNavClick(event: MouseEvent<HTMLAnchorElement>, href: string) {
    if (isHomePage && href.startsWith("#")) {
      event.preventDefault();
      const targetId = href.slice(1);
      const target = document.getElementById(targetId);
      if (target) {
        target.scrollIntoView({ behavior: "smooth", block: "start" });
        setActiveSection(href);
      }
    }
    closeMenu();
  }

  return (
    <nav id="navbar">
      <div className="nav-container">
        <Link href="/" className="logo" id="logo">
          <img src={logoUrl || "/logo-zozotech.svg"} alt={siteName} height={60} />
        </Link>

        <button
          type="button"
          className={`mobile-toggle${isMenuOpen ? " active" : ""}`}
          aria-label="Toggle navigation menu"
          aria-expanded={isMenuOpen}
          onClick={() => setIsMenuOpen((prev) => !prev)}
        >
          <span />
          <span />
          <span />
        </button>

        <ul className={`nav-menu${isMenuOpen ? " active" : ""}`} id="navMenu">
          {NAV_ITEMS.map(({ href, label, isDefaultActive }) => {
            const linkHref = !isHomePage && href.startsWith("#") ? `/${href}` : href;

            return (
              <li key={href}>
              <a
                href={linkHref}
                className={
                  isHomePage && (activeSection === href || (isDefaultActive && !activeSection))
                    ? "active"
                    : undefined
                }
                onClick={(event) => handleNavClick(event, href)}
              >
                {label}
              </a>
            </li>
            );
          })}
          <li className="nav-gallery-item">
            <div className="dropdown-desktop">
              <Link
                href="/galeri"
                className={`dropdown-toggle${isGalleryActive ? " active" : ""}`}
                onClick={closeMenu}
              >
                Galeri Aplikasi
                <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M5 7l5 6 5-6H5z" fill="currentColor" />
                </svg>
              </Link>
              <div className="dropdown-menu">
                <Link href="/galeri" onClick={closeMenu}>
                  Lihat Semua Galeri
                </Link>
                <div className="dropdown-divider" />
                <Link href="/galeri/open-retail" onClick={closeMenu}>
                  Open Retail (PC)
                </Link>
                <Link href="/galeri/eco-pos" onClick={closeMenu}>
                  Eco POS (Android)
                </Link>
              </div>
            </div>
            <details className="dropdown-mobile">
              <summary className={isGalleryActive ? "active" : undefined}>
                <span>Galeri Aplikasi</span>
                <svg width="14" height="14" viewBox="0 0 20 20" aria-hidden="true">
                  <path d="M5 7l5 6 5-6H5z" fill="currentColor" />
                </svg>
              </summary>
              <div className="dropdown-mobile-menu">
                <Link href="/galeri" onClick={closeMenu}>
                  Lihat Semua Galeri
                </Link>
                <Link href="/galeri/open-retail" onClick={closeMenu}>
                  Open Retail (PC)
                </Link>
                <Link href="/galeri/eco-pos" onClick={closeMenu}>
                  Eco POS (Android)
                </Link>
              </div>
            </details>
          </li>
        </ul>
      </div>
    </nav>
  );
}
