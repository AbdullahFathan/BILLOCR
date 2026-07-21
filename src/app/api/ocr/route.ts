import { NextRequest, NextResponse } from "next/server";
import { extractTextFromImage } from "@/lib/mistralOCR";

export const runtime = "nodejs";

/**
 * POST /api/ocr
 *
 * Accepts a JSON body with:
 *   - imageBase64: string  (base64-encoded image, no data URL prefix)
 *   - mimeType: string     (e.g. "image/jpeg")
 *
 * Rate limiting is handled upstream by middleware.ts (Upstash Redis).
 * This route reads the X-RateLimit-Remaining header forwarded by middleware.
 *
 * Returns:
 *   200 { success: true,  data: { text: string, remainingUploads: number } }
 *   400 { success: false, error: "INVALID_BODY" }
 *   500 { success: false, error: "API_ERROR", message: string }
 */
export async function POST(request: NextRequest) {
  // Parse request body
  let imageBase64: string;
  let mimeType: string;

  try {
    const body = await request.json();
    imageBase64 = body.imageBase64;
    mimeType = body.mimeType;

    if (!imageBase64 || typeof imageBase64 !== "string") {
      return NextResponse.json(
        { success: false, error: "INVALID_BODY", message: "imageBase64 is required." },
        { status: 400 }
      );
    }
    if (!mimeType || typeof mimeType !== "string") {
      return NextResponse.json(
        { success: false, error: "INVALID_BODY", message: "mimeType is required." },
        { status: 400 }
      );
    }
  } catch {
    return NextResponse.json(
      { success: false, error: "INVALID_BODY", message: "Invalid JSON body." },
      { status: 400 }
    );
  }

  // Read remaining uploads from header set by middleware
  const remainingHeader = request.headers.get("X-RateLimit-Remaining");
  const remainingUploads = remainingHeader !== null ? parseInt(remainingHeader, 10) : 4;

  // Call Mistral OCR
  try {
    const text = await extractTextFromImage(imageBase64, mimeType);

    return NextResponse.json({
      success: true,
      data: {
        text,
        remainingUploads: isNaN(remainingUploads) ? 4 : remainingUploads,
      },
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : "Unknown OCR error.";
    console.error("[OCR Route] Mistral API error:", message);

    return NextResponse.json(
      { success: false, error: "API_ERROR", message },
      { status: 500 }
    );
  }
}
