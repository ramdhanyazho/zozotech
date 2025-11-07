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
    setIsMenuOpen(false);
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
        </ul>
      </div>
    </nav>
  );
}
