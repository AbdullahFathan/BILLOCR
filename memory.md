# Memory — Milestone 5: Aura Split UI Redesign (M5.0 + M5.1 Complete)

Last updated: 2026-07-12T16:00:00+07:00

## What was built

### M5.0 — Foundation (already complete before this session)
- `src/app/globals.css` — full `@theme` token migration to Aura Split palette (Golden Orange primary, deep navy background, tonal surface layers replacing glassmorphism)
- `context/ui-tokens.md` — synced to new tokens
- `context/ui-rules.md` — updated Design System Baseline
- `src/app/layout.tsx` — Outfit (heading) + Inter (body) fonts confirmed in place
- `src/components/custom/BottomNav.tsx` — 3-tab bottom nav (Scan / Assign / Settle) with golden orange progress stepper bar, active dot indicator, disabled state for locked tabs

### M5.1 — Screen 1: Home / Upload Page (completed this session)
- **`src/components/custom/FileUploader.tsx`** — Full Aura Split visual redesign:
  - `ScanLine` hero icon in `surface-high` tonal container (replaced old `FileImage`)
  - Dashed border dropzone with `border-primary` + orange glow on drag-active
  - `Gallery` (primary CTA, h-12 rounded-xl) + `Camera` (secondary) buttons
  - 3 feature chips below: **Instant OCR**, **100% Private**, **2-hr Auto Save** with `text-primary` icons
  - `fade-in` entry animation; all upload/reset logic untouched
- **`src/app/page.tsx`** — Full restructure to tab-based layout:
  - App header: Receipt logo icon + "Aura Split" heading + tagline (visible on Scan tab only)
  - `BottomNav` wired with `activeTab` state (`scan` | `assign` | `settle`)
  - `enabledTabs` logic: Assign & Settle only unlock after a receipt is scanned
  - Auto-advances to `assign` tab after OCR completes
  - `pb-nav` padding on `<main>` so content never hides behind fixed bottom bar
  - Settle tab renders per-diner breakdown cards with avatar initials before copy action
  - All existing OCR, parsing, Zustand, and calculation logic preserved — visual-only refactor
- **`context/progress-tracker.md`** — M5.1 marked `[x]` complete

## Decisions made

- **Tab-driven navigation (not step-driven)**: Replaced the old `step: "review" | "assign"` string state with `activeTab: NavTab` ("scan" | "assign" | "settle") tied directly to `BottomNav`. The Assign tab now contains both the Review & Adjust section and the Diner Assignment section — combined into one scrollable screen instead of two separate steps.
- **No glassmorphism by default (M5+)**: All cards use flat tonal layering (`bg-surface`, `bg-surface-high`, `bg-surface-lowest`) per Aura Split design system. The `glass` utility is kept in globals.css only for compat.
- **enabledTabs locks downstream tabs**: Assign and Settle are disabled until `rawText && items.length > 0`, preventing navigation to incomplete states.
- **Auto-advance on OCR complete**: After `handleOCRCompleted`, `setActiveTab("assign")` fires automatically — no manual navigation needed by the user.
- **Resume nudge on Scan tab**: If localStorage has existing items, a "Resume last session (N items)" button appears on the Scan screen.

## Problems solved

- **Windows PowerShell Execution Policy**: `npm run dev` fails with PSSecurityException. Always use `cmd /c "npm run dev"` or `cmd /c "npm run build"` instead.

## Current state

- **M5.0** ✅ Complete — Token migration, BottomNav built
- **M5.1** ✅ Complete — Home/Upload screen visually redesigned, BottomNav integrated
- **M5.2** ⬜ Not started — OCRScanner.tsx visual redesign pending
- **M5.3** ⬜ Not started — ReceiptItemRow.tsx visual redesign pending
- **M5.4** ⬜ Not started — DinerSelector.tsx + BillSummaryCard.tsx visual redesign pending
- Dev server confirmed running and rendering correctly at localhost:3000

## Next session starts with

**M5.2 — Screen 2: OCR Scanning Page**
- Refactor `src/components/custom/OCRScanner.tsx` — visual to Aura Split (receipt preview, scan beam animation using `@keyframes scan`, progress bar orange, info chip)
- Ensure scan beam animation runs via CSS keyframes (`animate-scan`)
- Preserve all OCR worker lifecycle and progress tracking logic — visual-only refactor
- Run `/remember restore` first, then proceed directly to `OCRScanner.tsx`

## Open questions

- None currently.
