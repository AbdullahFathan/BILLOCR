# UI Component Registry

This registry catalogs the UI components built for the BagiBill application, tracking their design patterns, file locations, and implementation statuses.

## Component Index

| Component Name | Description | Path | Status |
| :--- | :--- | :--- | :--- |
| **`FileUploader`** | Upload area for drag-and-drop or camera capture of receipt (max **10 MB**). Shows `remainingUploads/5` badge (restored from localStorage + `GET /api/ocr/quota` after refresh). | `src/components/custom/FileUploader.tsx` | ✅ Complete |
| **`OCRScanner`** | Scanning feedback with progress bar and scan beam. Always compresses via `compressForOcr` (1600px/q0.72, fallback 1200px/q0.6 if > 1 MB) before Mistral. Propagates `remaining`/`reset` on success, 429, and `API_ERROR` (token already consumed). | `src/components/custom/OCRScanner.tsx` | ✅ Complete |
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
  🧾 *BagiBill: [Store Name]*
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

---

## Component Imprints (M5.x Redesigns)

### OCRScanner

File: `src/components/custom/OCRScanner.tsx`
Last updated: 2026-07-12

| Property | Class |
| --- | --- |
| Outer wrapper | `space-y-4 animate-[fade-in_0.25s_ease-out]` |
| Header card bg | `bg-surface border border-border rounded-2xl p-5` |
| Icon container | `w-12 h-12 rounded-xl bg-surface-high border border-border` |
| Icon color | `text-primary` |
| Progress/error card bg | `bg-surface border border-border rounded-2xl p-5` |
| Receipt preview bg | `bg-surface-lowest` (no glassmorphism) |
| Scan beam | `animation: scan 3s ease-in-out infinite` via inline style |
| Progress bar track | `bg-surface-high rounded-full border border-border/40` |
| Progress bar fill | Gradient `primary → accent` + `boxShadow` glow |
| Progress % text | `text-primary font-bold font-heading tabular-nums` |
| Status label | `text-foreground/80 font-medium` + `Loader2 animate-spin text-primary` |
| Error card | `border border-destructive/30 bg-destructive/10 rounded-xl` |
| Button primary | `bg-primary hover:bg-primary-hover text-primary-foreground h-12 rounded-xl active:scale-95` |
| Button secondary | `bg-secondary hover:brightness-110 text-foreground border border-border h-12 rounded-xl active:scale-95` |
| Cancel X button | `w-9 h-9 bg-surface-high border border-border rounded-lg text-muted hover:border-primary` |
| Corner badge | `bg-surface-high border border-border rounded-full` + `text-primary text-[10px]` |

**Pattern notes:**
- Multi-card layout: header card + preview card + progress card (no single monolithic container).
- Scan beam uses inline `style` with CSS animation `scan` (defined in `globals.css @keyframes`).
- Progress bar fill uses a `primary → accent` gradient + orange glow shadow.
- No glassmorphism — `bg-surface-lowest` for image preview.
- Cancel available as both X icon (header) and full-width secondary button (progress card).
- Progress step labels derive from a `STEPS` threshold array rather than raw Tesseract status strings.

---

### ReceiptItemRow

File: `src/components/custom/ReceiptItemRow.tsx`
Last updated: 2026-07-12

| Property | Class |
| --- | --- |
| Row container (default) | `bg-surface border border-border rounded-2xl` |
| Row container (expanded) | `border-primary shadow-[0_0_0_1px_theme(colors.primary)]` |
| Row container (partial) | `bg-warning/5 border-warning/40` |
| Header area | `p-4 flex items-center justify-between cursor-pointer select-none gap-3` |
| Item name | `font-semibold text-sm text-foreground truncate` |
| Qty badge | `px-2 py-0.5 text-[10px] rounded-full bg-accent text-accent-foreground font-semibold` |
| Price per unit | `text-xs text-muted font-mono` with `text-primary font-semibold` for value |
| Total price | `text-sm font-bold font-heading text-primary tabular-nums` |
| Chevron button | `w-7 h-7 rounded-lg bg-surface-high border border-border text-muted` |
| Status pill (done) | `bg-success/15 text-success border border-success/25 rounded-full text-[10px]` |
| Status pill (partial) | `bg-warning/20 text-warning border border-warning/30 rounded-full animate-pulse` |
| Status pill (unassigned) | `bg-secondary border border-border text-muted rounded-full` |
| Avatar strip bg | `border-t border-border/20` (no bg tint — inherits row) |
| Avatar chip | `bg-primary/10 border border-primary/20 text-primary rounded-full text-[10px]` |
| Expanded drawer bg | `bg-surface-lowest border-t border-border/30` |
| Diner row (in drawer) | `bg-surface border border-border rounded-xl px-3 py-2.5` |
| Diner avatar (in drawer) | `w-7 h-7 rounded-full bg-primary/15 border border-primary/25 text-primary` |
| Stepper button | `w-7 h-7 rounded-lg bg-secondary border border-border hover:brightness-110 active:scale-90` |
| Qty counter display | `tabular-nums font-bold font-heading text-foreground` |
| Progress tracker row | `bg-surface border border-border/40 rounded-xl px-3 py-2.5` |
| Quick-add chip | `bg-secondary border border-border rounded-full hover:border-primary/50 hover:text-primary` |
| Active diner CTA | `bg-primary/10 border-dashed border-primary/40 rounded-xl text-primary hover:bg-primary/20` |

**Pattern notes:**
- Three distinct states: unallocated (default border), partially allocated (warning tint + pulse badge), fully allocated (success badge).
- Expanded state triggers `border-primary + shadow glow` — same active-border pattern as the design system.
- Qty badge always uses `bg-accent text-accent-foreground` (amber) — never primary orange.
- Price values always use `text-primary` for the number, `text-muted font-mono` for the label prefix.
- Expanded drawer background is `bg-surface-lowest` — deepest tonal layer to visually "sink" the controls.
- Stepper buttons are `rounded-lg` (not `rounded-full`) — consistent with form control radius, not pill radius.
- `tabular-nums` applied to all qty/price counters to prevent jitter on number changes.
- Avatar chips in the collapsed strip match diner avatar style in the Settle tab (consistent identity across screens).

---

### DinerSelector

File: `src/components/custom/DinerSelector.tsx`
Last updated: 2026-07-12

| Property | Class |
| --- | --- |
| Container | `space-y-4` |
| Diner pill (active) | `bg-primary/15 border border-primary text-primary shadow-[0_0_0_1px_theme(colors.primary)] shadow-primary/20` |
| Diner pill (inactive) | `bg-secondary border border-border text-foreground hover:border-primary/40 hover:bg-secondary/80` |
| Avatar circle (active) | `bg-primary text-primary-foreground` |
| Avatar circle (inactive) | `bg-surface-high border border-border text-foreground` |
| Tambah Orang button | `border border-dashed border-primary/40 text-primary/70 hover:border-primary hover:text-primary hover:bg-primary/5` |
| Add form input | `bg-input border border-border/60 focus:border-primary/60 text-foreground rounded-xl` |
| Add form button | `bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl` |

**Pattern notes:**
- Avatar circles inside pills show initials in uppercase (up to 2 chars).
- Active diner pill uses standard border-primary active glow.
- Dash button `+ Tambah Orang` allows dynamic addition inline.
- Removed old flex gap input and standardized on compact form layout with close X button.

---

### BillSummaryCard

File: `src/components/custom/BillSummaryCard.tsx`
Last updated: 2026-07-12

| Property | Class |
| --- | --- |
| Container | `bg-surface-low border border-border rounded-2xl overflow-hidden` |
| Featured diner area | `px-5 pt-5 pb-4 space-y-1` |
| Featured subtotal name | `text-[10px] font-semibold uppercase tracking-widest text-primary` |
| Featured subtotal price | `text-3xl font-bold font-heading text-foreground tracking-tighter tabular-nums` |
| Item drawer bg | `bg-surface-lowest rounded-xl p-3 space-y-1.5` |
| Other diners row | `border-t border-border/30 px-5 py-3` |
| Other diner chip | `bg-surface-high border border-border text-primary` |
| Grand total strip | `border-t border-border/40 px-5 py-3 bg-surface-lowest/60` |
| Action button | `bg-primary hover:bg-primary-hover text-primary-foreground rounded-xl shadow-md` |

**Pattern notes:**
- Features the currently selected active diner in a prominent way (large display header with detailed breakdown in drawer).
- Displays other diner totals in a clean list format underneath.
- Integrated the Salin Rekap copy CTA button directly inside the card for contextual priority.
- Uses `tabular-nums` for alignment stability during share calculations.
