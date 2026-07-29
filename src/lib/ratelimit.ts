import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest } from "next/server";

/**
 * Shared Upstash rate limiter (5 OCR uploads / IP / 24h).
 * Used by POST /api/ocr (consume) and GET /api/ocr/quota (peek).
 * Both run in the Node.js Route Handlers so the IP key stays consistent.
 */
export const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "24 h"),
  prefix: "billocr:ocr_upload",
  analytics: true,
});

/**
 * Stable client identifier for rate-limit keys.
 * Prefer proxy headers, then fall back to a single local-dev bucket.
 */
export function clientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }

  const realIp = request.headers.get("x-real-ip")?.trim();
  if (realIp) return realIp;

  // Local `next dev` often has no forwarded IP — keep one shared bucket
  return "anonymous";
}
