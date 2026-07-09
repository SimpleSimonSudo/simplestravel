"use client";

import React, { useState } from "react";
import { usePathname } from "next/navigation";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const pathname = usePathname();
  const isMapPage = pathname === "/map";

  // Dynamic header styles based on page type (light vs dark map)
  const headerBg = isOpen
    ? (isMapPage ? "#0d0c0b" : "#f4ede0")
    : (isMapPage 
        ? "linear-gradient(to bottom, rgba(13, 12, 11, 0.85), transparent)" 
        : "linear-gradient(to bottom, rgba(244,237,224,0.95), transparent)");

  const headerBorder = isOpen
    ? (isMapPage ? "1px solid rgba(255, 255, 255, 0.1)" : "1px solid rgba(13, 12, 11, 0.1)")
    : "none";

  const logoColor = isMapPage ? "#f4ede0" : "#0d0c0b";
  const navColor = isMapPage ? "#e8dfd0" : "#6b6359";

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: headerBg,
        borderBottom: headerBorder,
      }}
    >
      {/* Main header bar */}
      <div className="flex items-center justify-between px-8 py-5">
        {/* Wordmark logo */}
        {/* Wordmark logo */}
        <a 
          href="/" 
          className="font-display text-2xl tracking-wide hover:text-amber transition-colors"
          style={{ color: logoColor }}
        >
          <span className="italic">traveling</span>
          <span className="mx-1.5" style={{ color: navColor }}>·</span>
          <span className="font-light text-base uppercase tracking-widest2" style={{ color: navColor }}>planet earth</span>
        </a>

        {/* Desktop Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink href="/" color={navColor}>Journal</NavLink>
          <NavLink href="/countries" color={navColor}>Countries</NavLink>
          <NavLink href="/map" color={navColor}>Map</NavLink>
          <NavLink href="/community" color={navColor}>Community</NavLink>
        </nav>

        {/* Mobile menu toggle button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden hover:text-amber transition-colors focus:outline-none"
          style={{ color: navColor }}
          aria-label="Menu"
        >
          {isOpen ? (
            // Close 'X' SVG icon
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          ) : (
            // Hamburger SVG icon
            <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
              <line x1="0" y1="1" x2="22" y2="1" stroke="currentColor" strokeWidth="1.5" />
              <line x1="0" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5" />
              <line x1="0" y1="15" x2="22" y2="15" stroke="currentColor" strokeWidth="1.5" />
            </svg>
          )}
        </button>
      </div>

      {/* Mobile vertical dropdown menu flow */}
      {isOpen && (
        <div 
          className="md:hidden flex flex-col px-8 pb-8 pt-2 gap-4 animate-fade-in border-t"
          style={{ 
            backgroundColor: isMapPage ? "#0d0c0b" : "var(--color-paper)",
            borderColor: isMapPage ? "rgba(255, 255, 255, 0.1)" : "rgba(13, 12, 11, 0.05)"
          }}
        >
          <NavLink href="/" onClick={() => setIsOpen(false)} color={navColor}>Journal</NavLink>
          <NavLink href="/countries" onClick={() => setIsOpen(false)} color={navColor}>Countries</NavLink>
          <NavLink href="/map" onClick={() => setIsOpen(false)} color={navColor}>Map</NavLink>
          <NavLink href="/community" onClick={() => setIsOpen(false)} color={navColor}>Community</NavLink>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  children,
  onClick,
  color,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  color?: string;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="text-sm uppercase tracking-widest hover:text-amber transition-colors font-body py-1.5 block md:py-0"
      style={{ color: color }}
    >
      {children}
    </a>
  );
}
