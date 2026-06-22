import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  // In development mode, bypass the gate redirect entirely
  if (process.env.NODE_ENV === "development") {
    return NextResponse.next();
  }

  const path = request.nextUrl.pathname;

  // 1. Erlaube Zugriffe auf statische Dateien, die Gate-Seite und den API-Verifikations-Endpunkt
  if (
    path.startsWith("/_next") ||
    path.startsWith("/gate") ||
    path.startsWith("/api/verify") ||
    path === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // 2. Lese das Session-Cookie aus
  const sessionToken = request.cookies.get("travel_session")?.value;
  const expectedSecret = process.env.SESSION_SECRET || "default_session_secret_key_123";

  // 3. Umleitung zur Gate-Seite, falls Cookie fehlt oder ungültig ist
  if (!sessionToken || sessionToken !== expectedSecret) {
    const gateUrl = new URL("/gate", request.url);
    return NextResponse.redirect(gateUrl);
  }

  return NextResponse.next();
}

// Konfiguration: Für alle Pfade ausführen, außer für statische Next-Ressourcen
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
