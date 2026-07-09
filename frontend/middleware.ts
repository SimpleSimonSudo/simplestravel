import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Erlaube Zugriffe auf statische Dateien, die Gate-Seite und den API-Verifikations-Endpunkt
  if (
    path.startsWith("/_next") ||
    path.startsWith("/gate") ||
    path.startsWith("/api/verify") ||
    path.startsWith("/page_media") ||
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

  // 4. Admin-Pfad-Schutz für /admin und /api/admin
  if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
    const adminToken = request.cookies.get("admin_session")?.value;
    const expectedAdminSecret = process.env.ADMIN_SESSION_SECRET || (expectedSecret + "_admin_secret");
    if (!adminToken || adminToken !== expectedAdminSecret) {
      if (path.startsWith("/api/")) {
        return new NextResponse(
          JSON.stringify({ success: false, error: "Unauthorized admin access." }),
          { status: 403, headers: { "content-type": "application/json" } }
        );
      }
      const gateUrl = new URL("/gate", request.url);
      return NextResponse.redirect(gateUrl);
    }
  }

  return NextResponse.next();
}

// Konfiguration: Für alle Pfade ausführen, außer für statische Next-Ressourcen
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
