"use client";

import React, { useState } from "react";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 transition-all duration-300"
      style={{
        background: isOpen
          ? "#f4ede0"
          : "linear-gradient(to bottom, rgba(244,237,224,0.95), transparent)",
        borderBottom: isOpen ? "1px solid rgba(13, 12, 11, 0.1)" : "none",
      }}
    >
      {/* Main header bar */}
      <div className="flex items-center justify-between px-8 py-5">
        {/* Wordmark logo */}
        <a href="/" className="font-display text-2xl tracking-wide text-ink hover:text-amber transition-colors">
          <span className="italic">traveling</span>
          <span className="text-dust mx-1.5">·</span>
          <span className="font-light text-dust text-base uppercase tracking-widest2">planet earth</span>
        </a>

        {/* Desktop Nav links */}
        <nav className="hidden md:flex items-center gap-8">
          <NavLink href="/">Journal</NavLink>
          <NavLink href="/countries">Countries</NavLink>
          <NavLink href="/map">Map</NavLink>
        </nav>

        {/* Mobile menu toggle button */}
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="md:hidden text-dust hover:text-ink transition-colors focus:outline-none"
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
        <div className="md:hidden flex flex-col px-8 pb-8 pt-2 gap-4 bg-paper animate-fade-in border-t border-ink/5">
          <NavLink href="/" onClick={() => setIsOpen(false)}>Journal</NavLink>
          <NavLink href="/countries" onClick={() => setIsOpen(false)}>Countries</NavLink>
          <NavLink href="/map" onClick={() => setIsOpen(false)}>Map</NavLink>
        </div>
      )}
    </header>
  );
}

function NavLink({
  href,
  children,
  onClick,
}: {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <a
      href={href}
      onClick={onClick}
      className="text-sm uppercase tracking-widest text-dust hover:text-amber transition-colors font-body py-1.5 block md:py-0"
    >
      {children}
    </a>
  );
}
