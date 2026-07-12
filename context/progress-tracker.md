# Project Progress Tracker

This progress tracker is the single source of truth for the implementation status of features, context docs, and client state updates.

---

## 1. Project Context Documentation Status

| File | Goal / Purpose | Status |
| :--- | :--- | :--- |
| **`project-overview.md`** | High-level PRD & requirements. | ✅ Complete |
| **`architecture.md`** | System boundaries, file mapping. | ✅ Complete |
| **`ui-tokens.md`** | Theme details, colors, fonts, glassmorphism. | ✅ Complete |
| **`ui-rules.md`** | Styling rules, Tailwind v4 variables. | ✅ Complete |
| **`ui-registry.md`** | Catalogue of all custom client components. | ✅ Complete |
| **`code-standards.md`** | TypeScript guidelines, store patterns. | ✅ Complete |
| **`library-docs.md`** | Specific instructions for Tesseract, Zustand. | ✅ Complete |
| **`build-plan.md`** | Roadmap outlining task execution milestones. | ✅ Complete |
| **`progress-tracker.md`** | Tracker for overall implementation. | ✅ Active |

---

## 2. Milestone Execution Status

### Milestone 1: Foundations
- [x] Install dependencies (`zustand`, `tesseract.js`, `lucide-react`) ✅ *Complete*
- [x] Initialize Zustand receipt store with `persist` middleware ✅ *Complete*

### Milestone 2: OCR Extraction
- [x] Build canvas compression helper ✅ *Complete*
- [x] Implement `FileUploader` drag-and-drop / camera capture ✅ *Complete*
- [x] Connect `OCRScanner` worker lifecycle with progress tracking ✅ *Complete*

### Milestone 3: Parser Logic
- [x] Write regex receipt text parsing algorithm ✅ *Complete*
- [x] Add manual item review and correction card ✅ *Complete*

### Milestone 4: Zustand & Dashboard UI
- [x] Implement `DinerSelector` pill system ✅ *Complete*
- [x] Implement `ReceiptItemRow` allocation selectors ✅ *Complete*
- [x] Implement dynamic proportional tax calculations ✅ *Complete*




### Milestone 5: Aura Split UI Redesign (UI Only — Logic Untouched)

> **Design Source:** `context/ui_v1/` — mockup dari Google Stitch (Aura Split design system)  
> **Strategy:** Refaktor komponen existing — visual diubah, logic/state/parser tetap sama  
> **Token Strategy:** Ganti total — hapus token Electric Indigo, pakai token Aura Split (Golden Orange)  
> **Navigation:** Tambah Bottom Navigation Bar (Scan / Assign / Settle)  
> **Order:** Per screen/halaman — satu milestone per screen

---

#### M5.0 — Foundation: Token & Global CSS Migration
- [x] Update `src/app/globals.css` — ganti seluruh `@theme` tokens ke Aura Split palette (Golden Orange, Amber, deep navy) ✅ *Complete*
- [x] Update `ui-tokens.md` — dokumentasikan token baru (wajib sync dengan globals.css) ✅ *Complete*
- [x] Update `ui-rules.md` — update Design System Baseline section di `ui-registry.md` ke pattern baru ✅ *Complete*
- [x] Tambah Google Fonts: `Outfit` (heading) + `Inter` (body) di `layout.tsx` jika belum ✅ *Already in place*
- [x] Buat komponen `BottomNav.tsx` — bottom navigation bar dengan 3 tab: Scan / Assign / Settle ✅ *Complete*

#### M5.1 — Screen 1: Home / Upload Page
- [x] Refaktor `FileUploader.tsx` — visual ke desain Aura Split (dashed orange border card, camera icon, dark flat bg) ✅ *Complete*
- [x] Update `page.tsx` — section home/upload menggunakan token baru + layout baru (logo, tagline, feature chips) ✅ *Complete*
- [x] Integrasikan `BottomNav.tsx` di layout utama ✅ *Complete*

#### M5.2 — Screen 2: OCR Scanning Page
- [x] Refaktor `OCRScanner.tsx` — visual ke desain Aura Split (receipt preview, scan beam animasi, progress bar orange, info chip) ✅ *Complete*
- [x] Pastikan animasi scan beam tetap berjalan menggunakan CSS keyframes (`@keyframes scan`) ✅ *Complete*
- [x] Pertahankan seluruh lifecycle OCR worker & progress tracking logic ✅ *Complete*

#### M5.3 — Screen 3: Review Item Struk
- [x] Refaktor `ReceiptItemRow.tsx` — flat dark card, qty badge amber, price golden orange, edit icon ghost ✅ *Complete*
- [x] Update section review di `page.tsx` — header bar (title + summary chips row) ✅ *Complete*
- [x] Tambah section "Biaya Tambahan" (PB1/Pajak + Service Charge) dengan separator ✅ *Complete*

#### M5.4 — Screen 4: Assign & Split Dashboard
- [x] Refaktor `DinerSelector.tsx` — person pills dengan avatar initial, active border orange glow, "+ Tambah Orang" dashed chip ✅ *Complete*
- [x] Refaktor `BillSummaryCard.tsx` — sticky bottom panel (subtotal aktif + mini summary semua orang + Salin Rekap button) ✅ *Complete*
- [x] Update section dashboard di `page.tsx` — item rows flat card, counter buttons circular amber, split rata checkbox orange ✅ *Complete*

---

### Next Step (After Milestone 5):
- [ ] Change OCR to Google Vision API
