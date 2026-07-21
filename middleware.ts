import { Ratelimit } from "@upstash/ratelimit";
import { Redis } from "@upstash/redis";
import { NextRequest, NextResponse } from "next/server";

/**
 * Rate limiter: 5 OCR uploads per IP per 24 hours.
 * Uses Upstash Redis with Sliding Window algorithm.
 * Sliding window is more accurate than fixed window — prevents burst
 * abuse at window boundaries.
 */
const ratelimit = new Ratelimit({
  redis: Redis.fromEnv(),
  limiter: Ratelimit.slidingWindow(5, "24 h"),
  prefix: "billocr:ocr_upload",
  analytics: true,
});

export async function middleware(request: NextRequest) {
  // Identify by IP; Vercel sets x-forwarded-for automatically on deployments
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : "anonymous";

  const { success, limit, remaining, reset } = await ratelimit.limit(ip);

  if (!success) {
    return NextResponse.json(
      {
        success: false,
        error: "RATE_LIMIT_EXCEEDED",
        message: `Batas upload harian tercapai (${limit}x per hari). Coba lagi besok.`,
        reset,
        remaining: 0,
      },
      {
        status: 429,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(reset),
        },
      }
    );
  }

  // Pass through — attach rate limit headers for the route to consume
  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(limit));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(reset));
  return response;
}

export const config = {
  // Only apply middleware to the OCR API route
  matcher: ["/api/ocr"],
};
