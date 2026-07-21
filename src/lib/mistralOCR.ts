import { Mistral } from "@mistralai/mistralai";

/**
 * Extracts text from a receipt image using Mistral OCR API.
 *
 * @param base64   - Base64-encoded image string (without data URL prefix)
 * @param mimeType - MIME type of the image (e.g. "image/jpeg", "image/png")
 * @returns        - Raw OCR text, combining all pages into one block
 * @throws         - Throws an error if the API call fails or returns no text
 */
export async function extractTextFromImage(
  base64: string,
  mimeType: string
): Promise<string> {
  if (!process.env.MISTRAL_API_KEY) {
    throw new Error("MISTRAL_API_KEY environment variable is not set.");
  }

  const client = new Mistral({ apiKey: process.env.MISTRAL_API_KEY });

  const response = await client.ocr.process({
    model: "mistral-ocr-latest",
    document: {
      type: "image_url",
      imageUrl: `data:${mimeType};base64,${base64}`,
    },
  });

  // Combine all pages into a single text block
  const text = response.pages.map((p: { markdown: string }) => p.markdown).join("\n");

  if (!text || text.trim() === "") {
    throw new Error(
      "No readable text could be extracted from the receipt. Please try a clearer photo."
    );
  }

  return text;
}
