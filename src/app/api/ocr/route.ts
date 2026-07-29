import { NextRequest, NextResponse } from "next/server";
import { extractTextFromImage } from "@/lib/mistralOCR";
import { clientIp, ratelimit } from "@/lib/ratelimit";

export const runtime = "nodejs";

/**
 * POST /api/ocr
 *
 * Accepts a JSON body with:
 *   - imageBase64: string  (base64-encoded image, no data URL prefix)
 *   - mimeType: string     (e.g. "image/jpeg")
 *
 * Rate limiting is enforced here (same Node runtime as GET /api/ocr/quota)
 * so consume + peek share the same IP key in Redis.
 *
 * Returns:
 *   200 { success: true,  data: { text, remainingUploads, reset } }
 *   400 { success: false, error: "INVALID_BODY" | "INVALID_MIME_TYPE" }
 *   429 { success: false, error: "RATE_LIMIT_EXCEEDED", reset }
 *   500 { success: false, error: "API_ERROR", message: string }
 */
export async function POST(request: NextRequest) {
  let imageBase64: string;
  let mimeType: string;

  try {
    const body = await request.json();
    imageBase64 = body.imageBase64;
    mimeType = body.mimeType;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_BODY",
          message: "imageBase64 is required.",
        },
        { status: 400 },
      );
    }
    if (!mimeType || typeof mimeType !== "string") {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_BODY",
          message: "mimeType is required.",
        },
        { status: 400 },
      );
    }

    const ALLOWED_MIME_TYPES = [
      "image/jpeg",
      "image/png",
      "image/webp",
      "image/gif",
    ];
    if (!ALLOWED_MIME_TYPES.includes(mimeType)) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_MIME_TYPE",
          message: `Tipe file tidak didukung: ${mimeType}. Gunakan JPEG, PNG, WebP, atau GIF.`,
        },
        { status: 400 },
      );
    }

    // Match client 10 MB file cap (base64 is ~4/3 of binary size)
    const MAX_BASE64_LENGTH = Math.ceil(10 * 1024 * 1024 * (4 / 3));
    if (imageBase64.length > MAX_BASE64_LENGTH) {
      return NextResponse.json(
        {
          success: false,
          error: "INVALID_BODY",
          message: "Ukuran gambar terlalu besar. Maksimal 10 MB.",
        },
        { status: 400 },
      );
    }
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: "INVALID_BODY",
        message: "Invalid JSON body.",
      },
      { status: 400 },
    );
  }

  // Consume one scan token — remaining comes from Redis, not middleware headers
  const ip = clientIp(request);
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
      },
    );
  }

  try {
    const text = await extractTextFromImage(imageBase64, mimeType);

    return NextResponse.json(
      {
        success: true,
        data: {
          text,
          remainingUploads: remaining,
          reset,
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
    const message = err instanceof Error ? err.message : "Unknown OCR error.";
    console.error("[OCR Route] Mistral API error:", message);

    // Token already consumed — still report current remaining so UI stays honest
    return NextResponse.json(
      {
        success: false,
        error: "API_ERROR",
        message,
        remaining,
        reset,
      },
      {
        status: 500,
        headers: {
          "X-RateLimit-Limit": String(limit),
          "X-RateLimit-Remaining": String(remaining),
          "X-RateLimit-Reset": String(reset),
        },
      },
    );
  }
}
