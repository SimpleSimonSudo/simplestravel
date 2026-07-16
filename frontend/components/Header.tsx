"use client";

import React, { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { TripWithCountries } from "@/lib/types";

export default function Header() {
  const [isOpen, setIsOpen] = useState(false);
  const [isJournalDropdownOpen, setIsJournalDropdownOpen] = useState(false);
  const [trips, setTrips] = useState<TripWithCountries[]>([]);
  const pathname = usePathname();
  const isMapPage = pathname === "/map";

  // Hide the header completely in the admin panel (but not on admin-login)
  if (pathname === "/admin" || pathname?.startsWith("/admin/")) {
    return null;
  }

  useEffect(() => {
    async function fetchTrips() {
      try {
        const { data, error } = await supabase
          .from("trips_with_countries")
          .select("*")
          .order("start_date", { ascending: false, nullsFirst: false });

        if (error) {
          console.error("Error fetching trips for header:", error);
          return;
        }

        // Filter out Tiny Journeys (trips with post_count < 10)
        const filtered = ((data as TripWithCountries[]) ?? []).filter((trip) => trip.post_count >= 10);
        setTrips(filtered);
      } catch (err) {
        console.error("Failed to fetch trips for header:", err);
      }
    }
    fetchTrips();
  }, []);

  const toggleMenu = () => {
    setIsOpen(!isOpen);
    if (isOpen) {
      setIsJournalDropdownOpen(false);
    }
  };

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

  const dropdownBg = isMapPage ? "var(--color-smoke)" : "var(--color-paper)";
  const dropdownTextColor = isMapPage ? "var(--color-paper)" : "var(--color-ink)";
  const itemHoverClass = isMapPage 
    ? "hover:bg-mist hover:text-amber" 
    : "hover:bg-cream hover:text-amber";

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
          <div className="relative group py-2">
            <NavLink href="/" color={navColor}>Journal</NavLink>
            {trips.length > 0 && (
              <div 
                className="absolute top-full left-0 mt-1 w-64 rounded-sm shadow-md opacity-0 translate-y-2 pointer-events-none group-hover:opacity-100 group-hover:translate-y-0 group-hover:pointer-events-auto transition-all duration-200 z-50 py-2 border font-body text-sm"
                style={{
                  backgroundColor: dropdownBg,
                  borderColor: isMapPage ? "rgba(255, 255, 255, 0.15)" : "var(--color-cream)",
                  color: dropdownTextColor
                }}
              >
                {trips.map((trip) => (
                  <a
                    key={trip.trip_id}
                    href={`/trips/${trip.trip_id}`}
                    className={`block px-4 py-2.5 transition-colors font-medium text-[13px] tracking-wide ${itemHoverClass}`}
                  >
                    {trip.trip_name}
                  </a>
                ))}
              </div>
            )}
          </div>
          <NavLink href="/countries" color={navColor}>Countries</NavLink>
          <NavLink href="/map" color={navColor}>Map</NavLink>
          <NavLink href="/community" color={navColor}>Community</NavLink>
        </nav>

        {/* Mobile menu toggle button */}
        <button
          onClick={toggleMenu}
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
          <div className="flex flex-col">
            <div className="flex items-center justify-between">
              <NavLink href="/" onClick={() => setIsOpen(false)} color={navColor}>Journal</NavLink>
              {trips.length > 0 && (
                <button
                  onClick={() => setIsJournalDropdownOpen(!isJournalDropdownOpen)}
                  className="p-2 -mr-2 transition-colors focus:outline-none"
                  style={{ color: navColor }}
                  aria-label="Toggle Trips Submenu"
                >
                  <svg 
                    className={`w-4 h-4 transform transition-transform duration-200 ${isJournalDropdownOpen ? "rotate-90" : ""}`} 
                    fill="none" 
                    viewBox="0 0 24 24" 
                    stroke="currentColor" 
                    strokeWidth="2"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </button>
              )}
            </div>
            
            {isJournalDropdownOpen && trips.length > 0 && (
              <div className="pl-4 mt-2 mb-1 flex flex-col gap-3 border-l border-amber/35">
                {trips.map((trip) => (
                  <a
                    key={trip.trip_id}
                    href={`/trips/${trip.trip_id}`}
                    onClick={() => {
                      setIsOpen(false);
                      setIsJournalDropdownOpen(false);
                    }}
                    className="text-xs uppercase tracking-widest font-body py-1 hover:text-amber transition-colors"
                    style={{ color: navColor }}
                  >
                    {trip.trip_name}
                  </a>
                ))}
              </div>
            )}
          </div>

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
