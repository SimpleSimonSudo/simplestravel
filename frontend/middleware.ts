import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createSessionToken, sessionCookieOptions, SESSION_TTL_MS, verifySessionToken } from "@/lib/session";
import { applySecurityHeaders } from "@/lib/securityHeaders";

export async function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname;

  // 1. Erlaube Zugriffe auf statische Dateien, die Gate-Seite und den API-Verifikations-Endpunkt
  if (
    path.startsWith("/_next") ||
    path.startsWith("/gate") ||
    path.startsWith("/admin-login") ||
    path.startsWith("/api/admin-login") ||
    path.startsWith("/api/verify") ||
    path.startsWith("/page_media") ||
    path === "/favicon.ico"
  ) {
    return applySecurityHeaders(NextResponse.next());
  }

  const sessionSecret = process.env.SESSION_SECRET;
  if (!sessionSecret) {
    // Fail closed: never fall back to a hardcoded default that ships with the source.
    return applySecurityHeaders(new NextResponse("Server misconfigured.", { status: 500 }));
  }

  // 2. Signiertes Session-Cookie verifizieren (kein geteiltes Geheimnis mehr im Cookie selbst)
  const token = request.cookies.get("travel_session")?.value;
  const session = await verifySessionToken(token, sessionSecret);

  // 3. Umleitung zur Gate-Seite, falls Cookie fehlt, abgelaufen oder ungültig ist
  if (!session) {
    const gateUrl = new URL("/gate", request.url);
    return applySecurityHeaders(NextResponse.redirect(gateUrl));
  }

  // 4. Admin-Pfad-Schutz für /admin und /api/admin — Claim steckt im signierten Token,
  //    kann also nicht durch simples Cookie-Editieren erschlichen werden.
  if (path.startsWith("/admin") || path.startsWith("/api/admin")) {
    if (!session.adm) {
      if (path.startsWith("/api/")) {
        return applySecurityHeaders(new NextResponse(
          JSON.stringify({ success: false, error: "Unauthorized admin access." }),
          { status: 403, headers: { "content-type": "application/json" } }
        ));
      }
      const gateUrl = new URL("/gate", request.url);
      return applySecurityHeaders(NextResponse.redirect(gateUrl));
    }
  }

  const response = NextResponse.next();

  // 5. Sliding expiration: Aktive Besucher bekommen ihr Token verlängert, solange sie
  //    wiederkommen, damit sie nie wieder durchs Gate müssen. Inaktive/geleakte Tokens
  //    laufen dagegen nach spätestens ~400 Tagen ohne Besuch von selbst aus.
  const remaining = session.exp - Date.now();
  if (remaining < SESSION_TTL_MS / 2) {
    const refreshed = await createSessionToken({ vid: session.vid, adm: session.adm }, sessionSecret);
    const isSecure = process.env.NODE_ENV === "production";
    response.cookies.set("travel_session", refreshed, sessionCookieOptions(isSecure));
  }

  return applySecurityHeaders(response);
}

// Konfiguration: Für alle Pfade ausführen, außer für statische Next-Ressourcen
export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico).*)",
  ],
};
