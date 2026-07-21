export interface ReceiptItem {
  id: string;
  name: string;
  qty: number;
  price: number;
}

export interface ReceiptState {
  rawText: string;
  items: ReceiptItem[];
  diners: string[];
  assignments: Record<string, Record<string, number>>; // itemId -> { dinerName -> quantity }
  tax: number;
  serviceCharge: number;
  savedAt: number | null; // Timestamp of save
  
  // Actions
  setRawText: (text: string) => void;
  setItems: (items: ReceiptItem[]) => void;
  updateItem: (id: string, updates: Partial<Omit<ReceiptItem, "id">>) => void;
  addItem: (item: Omit<ReceiptItem, "id">) => void;
  deleteItem: (id: string) => void;
  addDiner: (name: string) => void;
  removeDiner: (name: string) => void;
  assignItem: (itemId: string, dinerName: string, qty: number) => void;
  setTax: (tax: number) => void;
  setServiceCharge: (charge: number) => void;
  resetStore: () => void;
  checkExpiration: () => void;
}

// ── OCR API Response ─────────────────────────────────────────────────────────

/**
 * Mirrors the response shape of POST /api/ocr.
 * On success, includes the extracted text and how many uploads are left today.
 * On failure, includes an error code and optional reset timestamp.
 */
export type OCRResponse =
  | { success: true;  data: { text: string; remainingUploads: number } }
  | { success: false; error: string; message?: string; reset?: number };

/**
 * UI state machine for the upload → OCR flow.
 * Used by FileUploader and OCRScanner to drive conditional rendering.
 */
export type UploadStatus =
  | "idle"          // Waiting for user to select a file
  | "compressing"   // Canvas API is compressing the image
  | "scanning"      // POST /api/ocr request in flight
  | "done"          // OCR completed successfully
  | "rate_limited"  // 429 received — show countdown to reset
  | "api_error";    // 500 received — show retry option
