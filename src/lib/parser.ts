import { ReceiptItem } from "@/types";

/**
 * Sanitizes a price string from OCR:
 * 1. Replaces common OCR mistakes: letter 'o' or 'O' -> '0'
 * 2. Removes trailing decimal cents/sen (e.g. .00 or ,00)
 * 3. Strips all non-digit characters
 */
export function cleanNumberString(str: string): number {
  let clean = str.trim();
  // Replace letter 'o' or 'O' with '0'
  clean = clean.replace(/[oO]/g, "0");
  // Remove decimal cents if .00 or ,00
  clean = clean.replace(/[\.,]00$/, "");
  // Remove all non-digit characters
  clean = clean.replace(/\D/g, "");
  
  const parsed = parseInt(clean, 10);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Checks if a line contains any subtotal or total indicators
 */
function isSubtotalOrTotalLine(line: string): boolean {
  const normalized = line.toLowerCase();
  const keywords = [
    "subtotal",
    "sub total",
    "grand total",
    "grandtotal",
    "total",
    "jumlah",
    "nett",
    "net total",
    "netto",
    "amount due",
    "due",
    "sub_total",
    "pay amount"
  ];
  return keywords.some((keyword) => normalized.includes(keyword));
}

/**
 * Checks if a line is a header or metadata containing non-item details (date, table number, etc.)
 */
function isHeaderOrMetadataLine(line: string): boolean {
  const normalized = line.toLowerCase();
  const keywords = [
    "table",
    "check",
    "guest",
    "cover",
    "cashier",
    "print",
    "server",
    "time",
    "date",
    "no.",
    "telp",
    "phone",
    "address",
    "receipt",
    "transaction"
  ];
  return keywords.some((keyword) => normalized.includes(keyword));
}

/**
 * Parses raw text from a receipt and extracts items, tax, and service charge.
 */
export function parseReceipt(rawText: string): {
  items: ReceiptItem[];
  tax: number;
  serviceCharge: number;
} {
  const items: ReceiptItem[] = [];
  let tax = 0;
  let serviceCharge = 0;

  if (!rawText) {
    return { items, tax, serviceCharge };
  }

  const lines = rawText.split(/\r?\n/);

  for (let line of lines) {
    line = line.trim();
    if (!line) continue;

    // 1. Detect Tax line
    const taxKeywords = ["tax", "pajak", "pb1", "vat", "gst", "ppn"];
    const isTax = taxKeywords.some((kw) => line.toLowerCase().includes(kw));
    if (isTax && !isSubtotalOrTotalLine(line)) {
      const numMatches = line.match(/[\doO\.,]{3,}/g);
      if (numMatches && numMatches.length > 0) {
        tax = cleanNumberString(numMatches[numMatches.length - 1]);
      }
      continue;
    }

    // 2. Detect Service Charge line
    const serviceKeywords = ["service", "svc", "sc", "layanan", "charge"];
    const isService = serviceKeywords.some((kw) => line.toLowerCase().includes(kw));
    if (isService && !isSubtotalOrTotalLine(line)) {
      const numMatches = line.match(/[\doO\.,]{3,}/g);
      if (numMatches && numMatches.length > 0) {
        serviceCharge = cleanNumberString(numMatches[numMatches.length - 1]);
      }
      continue;
    }

    // 3. Skip overall total/subtotal/metadata lines
    if (isSubtotalOrTotalLine(line) || isHeaderOrMetadataLine(line)) {
      continue;
    }

    // 4. Parse menu items using a price anchor search (numbers of 3+ digits with optional separators)
    const priceRegex = /\b\d+[\.,]?[0-9oO]{3,}\b|\b\d{4,6}\b/g;
    const priceMatches = line.match(priceRegex);

    if (priceMatches && priceMatches.length > 0) {
      const priceStr = priceMatches[priceMatches.length - 1];
      const totalPrice = cleanNumberString(priceStr);

      if (totalPrice > 0) {
        const priceIdx = line.lastIndexOf(priceStr);
        let beforePrice = line.substring(0, priceIdx).trim();

        // Clean leading/trailing non-alphanumeric noise characters from the item text
        beforePrice = beforePrice
          .replace(/^[^A-Za-z0-9]+/, "")
          .replace(/[^A-Za-z0-9]+$/, "")
          .trim();

        if (beforePrice.length > 1) {
          let name = beforePrice;
          let qty = 1;

          // Look for quantity at the start (e.g. "1 MINERAL WATER" or "2x SPRITE")
          const qtyStartMatch = name.match(/^(\d+)\s*(?:x|@)?\s+/i);
          if (qtyStartMatch) {
            qty = parseInt(qtyStartMatch[1], 10);
            name = name.substring(qtyStartMatch[0].length).trim();
          } else {
            // Look for quantity at the end (e.g. "MINERAL WATER 1" or "SPRITE 2x")
            const qtyEndMatch = name.match(/\s+(\d+)\s*(?:x|@)?$/i);
            if (qtyEndMatch) {
              qty = parseInt(qtyEndMatch[1], 10);
              name = name.substring(0, name.length - qtyEndMatch[0].length).trim();
            }
          }

          // Strip standard noise prefixes like "ord "
          name = name.replace(/^ord\s+/i, "").trim();

          if (name.length > 1 && qty > 0) {
            const unitPrice = Math.round(totalPrice / qty);
            items.push({
              id:
                typeof crypto !== "undefined" && crypto.randomUUID
                  ? crypto.randomUUID()
                  : Math.random().toString(36).substring(2, 9),
              name,
              qty,
              price: unitPrice
            });
          }
        }
      }
    }
  }

  return { items, tax, serviceCharge };
}
