# UI Component Registry

This registry catalogs the UI components built for the Split Bill OCR application, tracking their design patterns, file locations, and implementation statuses.

## Component Index

| Component Name | Description | Path | Status |
| :--- | :--- | :--- | :--- |
| **`FileUploader`** | Upload area for drag-and-drop or camera capture of receipt. | `src/components/custom/FileUploader.tsx` | ✅ Complete |
| **`OCRScanner`** | Scanning feedback component with progress bar and animated scan beam. | `src/components/custom/OCRScanner.tsx` | ✅ Complete |
| **`DinerSelector`** | Controls to add, edit, or select participants (diners). | `src/components/custom/DinerSelector.tsx` | ✅ Complete |
| **`ReceiptItemRow`** | Individual receipt item card displaying pricing, qty, and allocation controls. | `src/components/custom/ReceiptItemRow.tsx` | ✅ Complete |
| **`BillSummaryCard`** | Display card showing subtotal, taxes, service charges, and individual breakdown. | `src/components/custom/BillSummaryCard.tsx` | ✅ Complete |
| **`ShareReportButton`** | Logic and button to copy formatted split text/share directly to WhatsApp. | `src/components/custom/ShareReportButton.tsx` | ⏳ Pending |

---

## Pattern Details & Reuse Guidelines

### 1. `ReceiptItemRow` (Core Interaction)
- **Props**: Receives item details (name, price, total quantity) and active assignments.
- **Controls**: Includes `+`/`-` stepper buttons for allocating fractions (e.g. 0.5 shares) and toggle chips for diners.
- **Design Constraint**: Must display avatar chips representing allocated diners. Hovering over a chip should highlight that diner's share.

### 2. `DinerSelector` (Diner Management)
- **Props**: Receives diner names list and callback handlers to add/remove diners.
- **Styling**: Utilizes pill badges with exit cross buttons. Glow outline is added to the active diner currently selected for fast-assign modes.

### 3. `ShareReportButton`
- **Props**: Receives final calculated list of diners, subtotals, tax fractions, and receipt name.
- **Formatting Template**:
  ```
  🧾 *Split Bill: [Store Name]*
  -------------------------
  👤 *[Diner Name]*: Rp [Individual Total]
  - [Item Name] (x[Qty]): Rp [Share Price]
  - Pajak & Layanan: Rp [Share Tax]
  -------------------------
  Total Tagihan: Rp [Grand Total]
  ```

---

## Design System Baseline

Established from `src/app/page.tsx` on 2026-06-23.

| Property         | Correct Class / Pattern |
| ---------------- | ----------------------- |
| Card Background  | `bg-card backdrop-blur-md border border-border shadow-glass rounded-2xl p-6` |
| Text — Primary   | `text-foreground` |
| Text — Secondary | `text-foreground/75` |
| Text — Muted     | `text-foreground/50` or `text-foreground/40` |
| Heading 1        | `text-2xl font-bold font-heading text-foreground` |
| Button Primary   | `bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-all active:scale-98 cursor-pointer h-10 px-4 rounded-lg` |
| Button Secondary | `bg-secondary hover:brightness-110 text-foreground transition-all active:scale-98 cursor-pointer w-10 h-10 rounded-lg` |
| Pill Badges      | `px-3 py-1 text-xs rounded-full bg-secondary border border-border text-foreground` |

**Pattern notes:**
- **Colors**: Never use raw Tailwind colors or hexes. Colors are strictly driven by HSL theme tokens mapped via CSS variables.
- **Glassmorphism**: When creating cards or overlays, use `backdrop-blur-md border border-border shadow-glass bg-card` or the custom `@utility glass` class.
- **Transitions**: Every interactive element should have `transition-all duration-200 active:scale-98` for organic feedback.

