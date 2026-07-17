import type { NextResponse } from "next/server";

// Security headers applied to every response in middleware.ts. CSP is built
// from the actual external resources this app loads (verified by grepping
// the codebase, not guessed) — Turnstile widget/script, maplibre-gl map
// tiles + its unpkg-hosted CSS + web workers, Nominatim reverse-geocoding
// (admin location picker), Supabase (client-side reads in a few components),
// R2 (direct browser-to-bucket presigned uploads), Google Fonts
// (globals.css @import's the stylesheet from fonts.googleapis.com, which in
// turn references font files on fonts.gstatic.com).
//
// script-src/style-src include 'unsafe-inline': Next.js App Router injects
// an inline hydration bootstrap script and styled-jsx injects inline
// <style> tags at runtime; neither uses a nonce here (that needs deeper
// Next.js integration — see CSP finding in security memory for what a
// stricter nonce-based setup would take). This is a real, accepted trade-off,
// not an oversight.
export function buildContentSecurityPolicy(): string {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
  const r2Endpoint = process.env.R2_ENDPOINT || "";
  const isDev = process.env.NODE_ENV !== "production";

  const directives: Record<string, string[]> = {
    "default-src": ["'self'"],
    // 'unsafe-eval' only in dev: Next.js's webpack dev server (Fast Refresh /
    // HMR) evaluates code via eval() under `next dev`. Verified this is NOT
    // needed in the actual production build (tested against the real
    // Workers runtime via `wrangler pages dev` on a `next build` output —
    // admin login, cookie-setting, and map rendering all work with a strict
    // script-src there). Keeping it out of production keeps the policy as
    // tight as it can be where it actually matters.
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      "https://challenges.cloudflare.com",
      ...(isDev ? ["'unsafe-eval'"] : []),
    ],
    "style-src": ["'self'", "'unsafe-inline'", "https://unpkg.com", "https://fonts.googleapis.com"],
    "img-src": [
      "'self'",
      "data:",
      "blob:",
      "https://64.media.tumblr.com",
      "https://*.supabase.co",
      "https://pub-b3a0e6a319434721bf2acd7052d64b6e.r2.dev",
      "https://*.basemaps.cartocdn.com",
      "https://server.arcgisonline.com",
    ],
    "font-src": ["'self'", "data:", "https://fonts.gstatic.com"],
    "connect-src": [
      "'self'",
      "https://*.supabase.co",
      "https://challenges.cloudflare.com",
      "https://*.basemaps.cartocdn.com",
      "https://server.arcgisonline.com",
      "https://nominatim.openstreetmap.org",
      ...(supabaseUrl ? [supabaseUrl] : []),
      ...(r2Endpoint ? [r2Endpoint] : []),
    ],
    "frame-src": ["https://challenges.cloudflare.com"],
    "worker-src": ["'self'", "blob:"],
    "object-src": ["'none'"],
    "base-uri": ["'self'"],
    "form-action": ["'self'"],
    "frame-ancestors": ["'none'"],
  };

  return Object.entries(directives)
    .map(([key, values]) => `${key} ${values.join(" ")}`)
    .join("; ");
}

export function applySecurityHeaders(response: NextResponse): NextResponse {
  response.headers.set("Content-Security-Policy", buildContentSecurityPolicy());
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  response.headers.set("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  return response;
}
