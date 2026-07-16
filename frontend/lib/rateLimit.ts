import { getCloudflareContext } from "@opennextjs/cloudflare";
import type { NextRequest } from "next/server";

// Minimal shape of the Cloudflare KV binding — kept local instead of pulling
// in @cloudflare/workers-types just for this one type.
interface KVBinding {
  get(key: string): Promise<string | null>;
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
}

export interface RateLimitConfig {
  /** Prefix distinguishing this limiter's keys from others sharing the KV namespace. */
  prefix: string;
  /** Max requests allowed per window. */
  limit: number;
  /** Window length in seconds. KV's minimum TTL is 60s. */
  windowSeconds: number;
}

export function getClientIp(request: NextRequest): string {
  // Set by Cloudflare's edge on every request that reaches the Worker; the
  // client cannot spoof it (Cloudflare overwrites whatever the client sent).
  return request.headers.get("cf-connecting-ip") || "unknown";
}

// Fixed-window counter in KV. Deliberate trade-off: KV is only eventually
// consistent across edge locations (confirmed in production — a client whose
// requests land on different colos can under-count for up to ~60s), so this
// is defense-in-depth against a scripted attacker hitting the endpoint
// repeatedly from one location, not a hard guarantee against distributed
// traffic. A Durable Object would close that gap but requires a second,
// separately deployed Worker on Cloudflare Pages — decided against that
// extra infrastructure for this project.
//
// Fails open (allows the request) if the binding isn't reachable — e.g. under
// plain `next dev`, which has no real Cloudflare runtime behind it.
export async function checkIpRateLimit(config: RateLimitConfig, request: NextRequest): Promise<boolean> {
  try {
    const { env } = await getCloudflareContext({ async: true });
    const kv = (env as unknown as Record<string, KVBinding | undefined>).RATE_LIMIT_KV;
    if (!kv) return true;

    const ip = getClientIp(request);
    if (ip === "unknown") return true;

    const key = `${config.prefix}:${ip}`;
    const current = await kv.get(key);
    const count = current ? parseInt(current, 10) : 0;

    if (count >= config.limit) return false;

    await kv.put(key, String(count + 1), { expirationTtl: Math.max(config.windowSeconds, 60) });
    return true;
  } catch (err) {
    console.error("[rateLimit] error, failing open:", err);
    return true;
  }
}
