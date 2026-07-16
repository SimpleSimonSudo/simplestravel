"use client";

import Link from "next/link";
import { LayoutDashboard, PenSquare, Map, Globe, LogOut, Menu, X } from "lucide-react";
import React, { useState } from "react";

export default function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isMobileOpen, setIsMobileOpen] = useState(false);

  const closeMenu = () => setIsMobileOpen(false);

  return (
    <div className="min-h-screen bg-paper flex flex-col md:flex-row">
      {/* Mobile Header / Desktop Sidebar */}
      <aside className="w-full md:w-64 bg-white border-b md:border-b-0 md:border-r border-ink/10 flex flex-col md:fixed md:h-full z-10">
        <div className="p-6 flex items-center justify-between md:justify-center border-b border-ink/10">
          <Link href="/admin" onClick={closeMenu} className="font-display italic text-amber text-xl tracking-wide">
            Diary Admin
          </Link>
          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setIsMobileOpen(!isMobileOpen)}
            className="md:hidden p-2 text-ink hover:text-amber transition-colors focus:outline-none"
            aria-label="Toggle navigation menu"
          >
            {isMobileOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        <nav className={`${isMobileOpen ? "flex" : "hidden"} md:flex flex-col p-4 gap-2 flex-1`}>
          <NavItem href="/admin" icon={<LayoutDashboard size={18} />} label="Dashboard" onClick={closeMenu} />
          <NavItem href="/admin/posts" icon={<PenSquare size={18} />} label="Posts" onClick={closeMenu} />
          <NavItem href="/admin/trips" icon={<Map size={18} />} label="Trips" onClick={closeMenu} />
          <NavItem href="/admin/countries" icon={<Globe size={18} />} label="Countries" onClick={closeMenu} />
        </nav>

        <div className={`${isMobileOpen ? "block" : "hidden"} md:block p-4 border-t border-ink/10`}>
          <Link
            href="/"
            onClick={closeMenu}
            className="flex items-center gap-3 px-4 py-2 text-sm text-dust hover:text-ink transition-colors rounded-md hover:bg-cream"
          >
            <LogOut size={18} />
            Exit Admin
          </Link>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 md:ml-64 p-6 md:p-10 max-w-6xl mx-auto w-full">
        {children}
      </main>
    </div>
  );
}

function NavItem({
  href,
  icon,
  label,
  onClick,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-dust hover:text-ink hover:bg-cream/50 rounded-md transition-colors"
    >
      {icon}
      {label}
    </Link>
  );
}
