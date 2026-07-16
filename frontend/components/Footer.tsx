"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Footer() {
  const pathname = usePathname();

  // Hide footer on admin pages
  if (pathname === "/admin" || pathname?.startsWith("/admin/")) {
    return null;
  }

  return (
    <footer className="border-t border-ink/10 mt-32 px-8 py-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <p className="font-display italic text-ink text-lg">traveling planet earth</p>
          <p className="text-dust text-xs mt-2 font-body">2018 – 2026</p>
        </div>
        <div className="text-left md:text-center md:flex-1 md:px-8">
          <p className="font-display italic text-amber text-lg leading-relaxed">
            Thanks for being part of this journey.
          </p>
          <p className="text-dust text-xs font-body mt-1 tracking-wide">
            Keep exploring — with an open heart and curious eyes.
          </p>
        </div>
        <div className="flex flex-col items-start md:items-end gap-2">
          <p className="text-dust text-xs tracking-wide font-body select-none">
            Private journal. All rights reserved.
            <Link 
              href="/admin-login" 
              className="opacity-0 hover:opacity-100 focus:opacity-100 text-[10px] text-amber ml-1 transition-opacity duration-300"
              title="Control Panel"
            >
              ·
            </Link>
          </p>
          <div className="flex items-center gap-3 text-xs font-body text-dust">
            <Link href="/impressum" className="hover:text-amber transition-colors duration-200">
              Legal Notice
            </Link>
            <span className="opacity-40">·</span>
            <Link href="/datenschutz" className="hover:text-amber transition-colors duration-200">
              Privacy Policy
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
