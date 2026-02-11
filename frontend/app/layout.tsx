import type { Metadata } from "next";
import "./globals.css";

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

function Header() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-8 py-5"
      style={{ background: "linear-gradient(to bottom, rgba(244,237,224,0.95), transparent)" }}>
      {/* Wordmark */}
      <a href="/" className="font-display text-lg tracking-wide text-ink hover:text-amber transition-colors">
        <span className="italic">traveling</span>
        <span className="text-dust mx-1.5">·</span>
        <span className="font-light text-dust text-sm uppercase tracking-widest2">planet earth</span>
      </a>

      {/* Nav */}
      <nav className="hidden md:flex items-center gap-8">
        <NavLink href="/">Journal</NavLink>
        <NavLink href="/trips">Trips</NavLink>
        <NavLink href="/countries">Countries</NavLink>
        <NavLink href="/map">Map</NavLink>
      </nav>

      {/* Mobile burger (placeholder) */}
      <button className="md:hidden text-dust hover:text-ink transition-colors" aria-label="Menu">
        <svg width="22" height="16" viewBox="0 0 22 16" fill="none">
          <line x1="0" y1="1" x2="22" y2="1" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="0" y1="8" x2="16" y2="8" stroke="currentColor" strokeWidth="1.5"/>
          <line x1="0" y1="15" x2="22" y2="15" stroke="currentColor" strokeWidth="1.5"/>
        </svg>
      </button>
    </header>
  );
}

function NavLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a
      href={href}
      className="text-xs uppercase tracking-widest text-dust hover:text-amber transition-colors font-body"
    >
      {children}
    </a>
  );
}

function Footer() {
  return (
    <footer className="border-t border-ink/10 mt-32 px-8 py-12">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-start justify-between gap-8">
        <div>
          <p className="font-display italic text-ink text-lg">traveling planet earth</p>
          <p className="text-dust text-xs mt-2 font-body">2018 – 2025</p>
        </div>
        <p className="text-dust text-xs tracking-wide font-body">Private journal. All rights reserved.</p>
      </div>
    </footer>
  );
}
