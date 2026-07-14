import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Link from "next/link";

export const metadata: Metadata = {
  title: {
    default: "Traveling Planet Earth",
    template: "%s · Traveling Planet Earth",
  },
  description: "A private travel journal — 608 posts, 42 countries, 15 trips.",
  robots: { index: false, follow: false }, // Private blog
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Header />
        <main>{children}</main>
        <Footer />
      </body>
    </html>
  );
}

function Footer() {
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
