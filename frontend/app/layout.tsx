import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

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
