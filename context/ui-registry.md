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
| **`BottomNav`** | Bottom navigation bar with 3 tabs (Scan/Assign/Settle) + progress stepper. | `src/components/custom/BottomNav.tsx` | ✅ Complete (M5.0) |
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

> **Updated M5.0** — Aura Split Design System (Golden Orange). Modern-Flat, no glassmorphism by default.

| Property | Correct Class / Pattern |
| -------- | ----------------------- |
| Card Background (flat) | `bg-card border border-border rounded-xl p-5` |
| Card Background (elevated) | `bg-surface-high border border-border rounded-xl p-5` |
| Card Background (glass — compat only) | `glass border border-border rounded-2xl p-6` |
| Text — Primary | `text-foreground` |
| Text — Secondary | `text-foreground/75` |
| Text — Muted | `text-muted` |
| Heading 1 | `text-2xl font-bold font-heading text-foreground` |
| Heading 2 | `text-xl font-semibold font-heading text-foreground` |
| Price Display | `text-4xl font-bold font-heading tracking-tighter text-primary` |
| Button Primary (CTA) | `bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer h-12 px-5 rounded-xl` |
| Button Secondary | `bg-secondary hover:brightness-110 text-foreground transition-all duration-200 active:scale-95 cursor-pointer h-12 px-5 rounded-xl border border-border` |
| Button Ghost | `bg-transparent border border-accent text-accent hover:bg-accent/10 transition-all duration-200 active:scale-95 cursor-pointer h-12 px-5 rounded-xl` |
| Pill Badge (inactive) | `px-3 py-1 text-xs rounded-full bg-secondary border border-border text-foreground` |
| Pill Badge (active) | `px-3 py-1 text-xs rounded-full border border-primary text-primary bg-primary/10` |
| Qty Badge | `px-2 py-0.5 text-xs rounded-full bg-accent text-accent-foreground font-semibold` |
| Icon Size (standard) | `w-5 h-5` (stroke-width via Lucide default) |
| Active Border Glow | `border border-primary shadow-[0_0_0_1px_theme(colors.primary)]` |
| Bottom Nav Tab (active) | `text-primary` |
| Bottom Nav Tab (inactive) | `text-muted` |

**Pattern notes:**
- **Colors**: Never use raw Tailwind colors or hexes. Colors are strictly driven by HSL theme tokens via CSS variables.
- **Elevation**: Use `bg-surface` for cards, `bg-surface-high` for elevated panels. No glassmorphism unless explicitly needed.
- **Active State**: When an element is selected, use `border-primary` + subtle glow `shadow-[0_0_0_1px_...]` instead of opacity/brightness.
- **Transitions**: Every interactive element must have `transition-all duration-200 active:scale-95` for organic feedback.
- **Touch Targets**: Minimum `48px` height for all interactive elements (buttons, rows, tabs).

