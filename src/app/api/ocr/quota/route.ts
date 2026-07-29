import { NextRequest, NextResponse } from "next/server";
import { clientIp, ratelimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

/**
 * GET /api/ocr/quota
 *
 * Returns remaining scan quota for this IP without consuming a token.
 * Source of truth: Upstash Redis via `ratelimit.getRemaining`.
 */
export async function GET(request: NextRequest) {
  try {
    const ip = clientIp(request);
    const { remaining, reset, limit } = await ratelimit.getRemaining(ip);

    return NextResponse.json(
      {
        success: true,
        data: {
          remainingUploads: remaining,
          reset,
          limit,
        },
      },
      {
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
        },
      },
    );
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Quota check failed.";
    console.error("[OCR Quota]", message);
    return NextResponse.json(
      { success: false, error: "QUOTA_ERROR", message },
      { status: 500 },
    );
  }
}
