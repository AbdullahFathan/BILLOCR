# Project Progress Tracker

This progress tracker is the single source of truth for the implementation status of features, context docs, and client state updates.

---

## 1. Project Context Documentation Status

| File                      | Goal / Purpose                                | Status      |
| :------------------------ | :-------------------------------------------- | :---------- |
| **`project-overview.md`** | High-level PRD & requirements.                | ✅ Complete |
| **`architecture.md`**     | System boundaries, file mapping.              | ✅ Complete |
| **`ui-tokens.md`**        | Theme details, colors, fonts, glassmorphism.  | ✅ Complete |
| **`ui-rules.md`**         | Styling rules, Tailwind v4 variables.         | ✅ Complete |
| **`ui-registry.md`**      | Catalogue of all custom client components.    | ✅ Complete |
| **`code-standards.md`**   | TypeScript guidelines, store patterns.        | ✅ Complete |
| **`library-docs.md`**     | Specific instructions for Tesseract, Zustand. | ✅ Complete |
| **`build-plan.md`**       | Roadmap outlining task execution milestones.  | ✅ Complete |
| **`progress-tracker.md`** | Tracker for overall implementation.           | ✅ Active   |

---

## 2. Milestone Execution Status

### Milestone 1: Foundations

- [x] Install dependencies (`zustand`, `tesseract.js`, `lucide-react`) ✅ _Complete_
- [x] Initialize Zustand receipt store with `persist` middleware ✅ _Complete_

### Milestone 2: OCR Extraction

- [x] Build canvas compression helper ✅ _Complete_
- [x] Implement `FileUploader` drag-and-drop / camera capture ✅ _Complete_
- [x] Connect `OCRScanner` worker lifecycle with progress tracking ✅ _Complete_

### Milestone 3: Parser Logic

- [x] Write regex receipt text parsing algorithm ✅ _Complete_
- [x] Add manual item review and correction card ✅ _Complete_

### Milestone 4: Zustand & Dashboard UI

- [x] Implement `DinerSelector` pill system ✅ _Complete_
- [x] Implement `ReceiptItemRow` allocation selectors ✅ _Complete_
- [x] Implement dynamic proportional tax calculations ✅ _Complete_

### Milestone 5: Aura Split UI Redesign (UI Only — Logic Untouched)

> **Design Source:** `context/ui_v1/` — mockup dari Google Stitch (Aura Split design system)  
> **Strategy:** Refaktor komponen existing — visual diubah, logic/state/parser tetap sama  
> **Token Strategy:** Ganti total — hapus token Electric Indigo, pakai token Aura Split (Golden Orange)  
> **Navigation:** Tambah Bottom Navigation Bar (Scan / Assign / Settle)  
> **Order:** Per screen/halaman — satu milestone per screen

---

#### M5.0 — Foundation: Token & Global CSS Migration

- [x] Update `src/app/globals.css` — ganti seluruh `@theme` tokens ke Aura Split palette (Golden Orange, Amber, deep navy) ✅ _Complete_
- [x] Update `ui-tokens.md` — dokumentasikan token baru (wajib sync dengan globals.css) ✅ _Complete_
- [x] Update `ui-rules.md` — update Design System Baseline section di `ui-registry.md` ke pattern baru ✅ _Complete_
- [x] Tambah Google Fonts: `Outfit` (heading) + `Inter` (body) di `layout.tsx` jika belum ✅ _Already in place_
- [x] Buat komponen `BottomNav.tsx` — bottom navigation bar dengan 3 tab: Scan / Assign / Settle ✅ _Complete_

#### M5.1 — Screen 1: Home / Upload Page

- [x] Refaktor `FileUploader.tsx` — visual ke desain Aura Split (dashed orange border card, camera icon, dark flat bg) ✅ _Complete_
- [x] Update `page.tsx` — section home/upload menggunakan token baru + layout baru (logo, tagline, feature chips) ✅ _Complete_
- [x] Integrasikan `BottomNav.tsx` di layout utama ✅ _Complete_

#### M5.2 — Screen 2: OCR Scanning Page

- [x] Refaktor `OCRScanner.tsx` — visual ke desain Aura Split (receipt preview, scan beam animasi, progress bar orange, info chip) ✅ _Complete_
- [x] Pastikan animasi scan beam tetap berjalan menggunakan CSS keyframes (`@keyframes scan`) ✅ _Complete_
- [x] Pertahankan seluruh lifecycle OCR worker & progress tracking logic ✅ _Complete_

#### M5.3 — Screen 3: Review Item Struk

- [x] Refaktor `ReceiptItemRow.tsx` — flat dark card, qty badge amber, price golden orange, edit icon ghost ✅ _Complete_
- [x] Update section review di `page.tsx` — header bar (title + summary chips row) ✅ _Complete_
- [x] Tambah section "Biaya Tambahan" (PB1/Pajak + Service Charge) dengan separator ✅ _Complete_

#### M5.4 — Screen 4: Assign & Split Dashboard

- [x] Refaktor `DinerSelector.tsx` — person pills dengan avatar initial, active border orange glow, "+ Tambah Orang" dashed chip ✅ _Complete_
- [x] Refaktor `BillSummaryCard.tsx` — sticky bottom panel (subtotal aktif + mini summary semua orang + Salin Rekap button) ✅ _Complete_
- [x] Update section dashboard di `page.tsx` — item rows flat card, counter buttons circular amber, split rata checkbox orange ✅ _Complete_

---

---

### Milestone 6: Migrasi OCR Engine → Mistral OCR + Upstash Redis

> **Strategy:** Ganti Tesseract.js (client-side WASM) → Mistral OCR API (server-side).
> Rate limiting enforced di Edge via Upstash Redis (5 upload/IP/24 jam).

- [x] Install `@mistralai/mistralai`, `@upstash/redis`, `@upstash/ratelimit` ✅ _Complete_
- [x] Buat `.env.local` template (`MISTRAL_API_KEY`, `UPSTASH_REDIS_REST_URL`, `UPSTASH_REDIS_REST_TOKEN`) ✅ _Complete_
- [x] Buat `src/lib/mistralOCR.ts` — helper wrapper Mistral SDK ✅ _Complete_
- [x] Buat `src/app/api/ocr/route.ts` — Route Handler POST /api/ocr ✅ _Complete_
- [x] Buat `middleware.ts` — Edge rate limit guard (Upstash Sliding Window 5/24h) ✅ _Complete_ → **superseded** (consume moved to `POST /api/ocr`)
- [x] Update `src/types/index.ts` — tambah `OCRResponse` dan `UploadStatus` types ✅ _Complete_
- [x] Rewrite `OCRScanner.tsx` — hapus Tesseract worker, ganti fetch ke /api/ocr, indeterminate progress, rate limit UI ✅ _Complete_
- [x] Update `FileUploader.tsx` — tambah `remainingUploads` prop + counter badge ✅ _Complete_
- [x] Update `page.tsx` — hapus `isCompressing`, update signature `handleOCRCompleted`, pass `remainingUploads` ✅ _Complete_
- [x] Fix quota counter — `limit()` + `getRemaining()` both in Node routes; remove Edge consume + hardcoded remaining fallback ✅ _Complete_
- [x] Fix quota sync races — `quotaEpoch` + ignore stale peek; apply `remaining` on `API_ERROR`; re-peek on scan end / reset expiry; reject oversized base64 before `limit()` ✅ _Complete_
- [x] Upload 10 MB + OCR compress — accept 10 MB in `FileUploader` (fixed error copy); always `compressForOcr` (1600/0.72, one fallback 1200/0.6 if > 1 MB); API soft cap ~2 MB binary ✅ _Complete_
- [x] Update `context/library-docs.md` ✅ _Complete_
- [x] Update `context/architecture.md` ✅ _Complete_
- [x] Update `src/app/globals.css` — tambah `@keyframes indeterminate` ✅ _Complete_

### Milestone 7: Branding

- [x] Rename product brand **Aura Split / Split Bill OCR → BagiBill** ✅ _Complete_
  - `layout.tsx` metadata title, `page.tsx` hero H1, share recap header, README, project-overview, ui-registry

### Milestone 8: Bahasa Indonesia UI

- [x] Terjemahkan seluruh teks UI (page, layout metadata, komponen custom, pesan error OCR) ke bahasa Indonesia; `html lang="id"` ✅ _Complete_
- [x] Favicon memakai `public/icon.svg` via metadata `icons` di `layout.tsx` ✅ _Complete_
