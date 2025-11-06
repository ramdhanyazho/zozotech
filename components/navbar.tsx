"use client";

import Image from "next/image";
import { useEffect, useState } from "react";

interface NavbarProps {
  siteName: string;
}

const NAV_ITEMS = [
  { href: "#beranda", label: "Beranda", isDefaultActive: true },
  { href: "#service", label: "Service" },
  { href: "#artikel", label: "Artikel" },
  { href: "#about", label: "About" },
  { href: "#contact", label: "Kontak" },
];

export function Navbar({ siteName }: NavbarProps) {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    function handleResize() {
      if (window.innerWidth > 768) {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  return (
    <nav id="navbar">
      <div className="nav-container">
        <div className="logo" id="logo">
          <Image
            src="/logo-zozotech.svg"
            alt={siteName}
            width={140}
            height={140}
            sizes="140px"
            priority
          />
        </div>

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
          {NAV_ITEMS.map(({ href, label, isDefaultActive }) => (
            <li key={href}>
              <a
                href={href}
                className={isDefaultActive ? "active" : undefined}
                onClick={() => setIsMenuOpen(false)}
              >
                {label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
