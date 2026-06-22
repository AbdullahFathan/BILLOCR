# Build Plan

This build plan outlines the phased execution strategy for the Split Bill OCR application. It divides development into logical milestones to ensure high quality and incremental verification.

---

## Milestone 1: Initialization & Local Scaffold

### Goal
Establish the coding scaffolding, install client-side packages, set up Zustand state structure, and confirm Next.js dev server runs.

### Tasks
1. **Dependencies Installation**:
   - Install `tesseract.js` for client-side OCR.
   - Install `zustand` for client state management.
   - Install `lucide-react` for premium icon indicators.
2. **State Store Initialization**:
   - Create `src/hooks/useReceiptStore.ts` utilizing Zustand's `persist` middleware to automatically sync bill details to `localStorage`.
3. **Smoke Test Environment**:
   - Propose and launch local Next.js dev server to verify initial configuration and CSS loads.

---

## Milestone 2: Image Ingestion & Client-Side OCR

### Goal
Implement local image uploading, preprocessing, text extraction via WebAssembly, and display extraction progress.

### Tasks
1. **Image Preprocessing Component (`FileUploader`)**:
   - Build a file dropzone supporting drag-and-drop and mobile camera inputs.
   - Compress the image using Canvas API before loading into the OCR worker to optimize extraction speed.
2. **OCR Engine Integration (`OCRScanner`)**:
   - Integrate dynamic workers for `tesseract.js`.
   - Design a glassmorphic loader overlay with a scanning line animation beam showing real-time text conversion feedback.
3. **Result Text Output**:
   - Capture the output raw text and log it into local store.

---

## Milestone 3: Text Parsing Engine

### Goal
Develop the Regex parsing utility to split list items, quantities, prices, tax, and service charges.

### Tasks
1. **Regex Parser Library (`src/lib/parser.ts`)**:
   - Build a modular client-side pattern matching parser targeting typical Indonesian/English restaurant receipt structures (items starting with numbers, trailing prices).
   - Recognize tax indicators (`PB1`, `Pajak`, `Tax`, `10%`) and service charges (`Service`, `SVC`).
2. **Manual Adjust Layout**:
   - Add a structured fallback text editor component so that if the regex parsing misses an item, users can easily type/edit the raw items list before starting the allocation phase.

---

## Milestone 4: Zustand Store & Split Dashboard UI

### Goal
Build the assignment dashboard and state synchronization.

### Tasks
1. **Interactive UI (`DinerSelector` & `ReceiptItemRow`)**:
   - Let users input custom diner names to build the diner list.
   - Design card layouts for each item with increment/decrement split counters (e.g. sharing an item 1/2 or 1/3).
2. **Auto-Calculation Engine**:
   - Compute subtotal, apply proportional tax and service splits, and round values.

---

## Milestone 5: Report Export & Deployment

### Goal
Persist splits to `localStorage`, format the copyable clipboard report output, and launch the application.

### Tasks
1. **Clipboard Report UI (`ShareReportButton`)**:
   - Generate structured text layouts for easy copying.
   - Design a copy button with dynamic success feedback animations.
2. **Production Build & Launch**:
   - Run production test builds (`npm run build`) and launch on Vercel.
