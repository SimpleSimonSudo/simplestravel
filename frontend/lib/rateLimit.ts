import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { NextRequest } from "next/server";

// Minimal shape of the Cloudflare Workers Rate Limiting binding — kept local
// instead of pulling in @cloudflare/workers-types just for this one type.
interface RateLimitBinding {
  limit(options: { key: string }): Promise<{ success: boolean }>;
}

export type RateLimiterName = "VERIFY_RATE_LIMITER" | "ADMIN_LOGIN_RATE_LIMITER";

export function getClientIp(request: NextRequest): string {
  // Set by Cloudflare's edge on every request that reaches the Worker; the
  // client cannot spoof it (Cloudflare overwrites whatever the client sent).
  return request.headers.get("cf-connecting-ip") || "unknown";
}

// Fails open (allows the request) if the binding isn't reachable — e.g. under
// plain `next dev`, which has no real Cloudflare runtime behind it. Rate
// limiting here is defense-in-depth on top of Turnstile and the existing
// per-visitor limits, not the only line of defense, so failing open locally
// (never in production, where the binding is always present) is the right
// trade-off over breaking local development.
export async function checkIpRateLimit(bindingName: RateLimiterName, request: NextRequest): Promise<boolean> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const limiter = (env as unknown as Record<string, RateLimitBinding | undefined>)[bindingName];
    if (!limiter) return true;

    const ip = getClientIp(request);
    if (ip === "unknown") return true;

    const { success } = await limiter.limit({ key: ip });
    return success;
  } catch {
    return true;
  }
}
