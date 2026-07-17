import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import RecoveryToast from "@/components/RecoveryToast";
import { getTripsWithCountries } from "@/lib/queries";
import type { TripWithCountries } from "@/lib/types";

export const metadata: Metadata = {
  title: {
    default: "Traveling Planet Earth",
    template: "%s · Traveling Planet Earth",
  },
  description: "A private travel journal — 608 posts, 42 countries, 15 trips.",
  robots: { index: false, follow: false }, // Private blog
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // Fetched here (server-side, once per request) instead of in Header via a
  // client-side useEffect — avoids the nav-dropdown's "empty, then pop in
  // after hydration" flicker and drops a client-side anon-key Supabase call.
  let trips: TripWithCountries[] = [];
  try {
    trips = await getTripsWithCountries();
  } catch (err) {
    console.error("Failed to fetch trips for header:", err);
  }

  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
      </head>
      <body>
        <Header trips={trips} />
        <main>{children}</main>
        <Footer />
        <RecoveryToast />
      </body>
    </html>
  );
}
