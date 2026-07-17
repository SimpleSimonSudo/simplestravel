import type { NextRequest } from "next/server";
import { cookies } from "next/headers";

// Signed, per-visitor session tokens (HMAC-SHA256 via Web Crypto — works on both
// the Cloudflare Workers edge runtime and Node) instead of a single shared
// secret handed out to every visitor. Token shape: base64url(payload).base64url(signature).
// The secret itself never leaves the server; only the signed token sits in the cookie,
// so a leaked cookie compromises one visitor, not the whole site.

export interface SessionPayload {
  vid: string; // visitor_id (community_visitors.visitor_id)
  adm: boolean; // admin claim
  iat: number; // issued at, ms epoch
  exp: number; // expires at, ms epoch
}

// Browsers cap cookie lifetime at ~400 days regardless of Max-Age, so that's the
// practical ceiling for "stay logged in" — matching it here keeps the token and
// cookie expiry honest with each other.
export const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 400;

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function base64UrlEncode(bytes: Uint8Array): string {
  let binary = "";
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlDecode(value: string): Uint8Array<ArrayBuffer> {
  const normalized = value.replace(/-/g, "+").replace(/_/g, "/");
  const padded = normalized + "=".repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

async function getSigningKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign", "verify"]
  );
}

export async function createSessionToken(
  claims: { vid: string; adm: boolean },
  secret: string,
  ttlMs: number = SESSION_TTL_MS
): Promise<string> {
  const now = Date.now();
  const payload: SessionPayload = { ...claims, iat: now, exp: now + ttlMs };
  const payloadB64 = base64UrlEncode(encoder.encode(JSON.stringify(payload)));

  const key = await getSigningKey(secret);
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(payloadB64));
  const sigB64 = base64UrlEncode(new Uint8Array(signature));

  return `${payloadB64}.${sigB64}`;
}

export async function verifySessionToken(
  token: string | undefined | null,
  secret: string
): Promise<SessionPayload | null> {
  if (!token) return null;
  const parts = token.split(".");
  if (parts.length !== 2) return null;
  const [payloadB64, sigB64] = parts;

  try {
    const key = await getSigningKey(secret);
    const signatureValid = await crypto.subtle.verify(
      "HMAC",
      key,
      base64UrlDecode(sigB64),
      encoder.encode(payloadB64)
    );
    if (!signatureValid) return null;

    const payload = JSON.parse(decoder.decode(base64UrlDecode(payloadB64))) as SessionPayload;
    if (!payload.vid || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;

    return payload;
  } catch {
    // Malformed token (tampered, wrong secret, corrupt base64, ...) — treat as unauthenticated.
    return null;
  }
}

// Central place to get SESSION_SECRET. Throws instead of silently falling back to a
// guessable default — a missing secret should take the site down, not weaken it.
export function requireSessionSecret(): string {
  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    throw new Error("SESSION_SECRET is not configured. Refusing to issue or verify sessions.");
  }
  return secret;
}

export function sessionCookieOptions(isProd: boolean) {
  return {
    path: "/",
    maxAge: Math.floor(SESSION_TTL_MS / 1000),
    httpOnly: true,
    secure: isProd,
    sameSite: "strict" as const,
  };
}

// Reads + verifies the travel_session cookie from an incoming request. Returns null
// if the cookie is missing, expired, or fails signature verification — callers must
// never trust a raw cookie value for identity (that was the old visitor_profile bug).
export async function getVerifiedSession(request: NextRequest): Promise<SessionPayload | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const token = request.cookies.get("travel_session")?.value;
  return verifySessionToken(token, secret);
}

// Server Actions ("use server" functions) aren't route handlers — they don't
// receive a NextRequest, and Next.js invokes them by action ID via POST to
// whatever page they're called from, not necessarily under /admin/*. That
// means middleware's path-based admin check isn't a guarantee for them; each
// admin action must verify the session itself. Reads the cookie via
// next/headers, which is what Server Actions have access to.
export async function getAdminSessionOrNull(): Promise<SessionPayload | null> {
  const secret = process.env.SESSION_SECRET;
  if (!secret) return null;
  const cookieStore = await cookies();
  const token = cookieStore.get("travel_session")?.value;
  const session = await verifySessionToken(token, secret);
  if (!session || !session.adm) return null;
  return session;
}
