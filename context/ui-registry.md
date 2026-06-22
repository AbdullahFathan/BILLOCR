# UI Component Registry

This registry catalogs the UI components built for the Split Bill OCR application, tracking their design patterns, file locations, and implementation statuses.

## Component Index

| Component Name | Description | Path | Status |
| :--- | :--- | :--- | :--- |
| **`FileUploader`** | Upload area for drag-and-drop or camera capture of receipt. | `src/components/custom/FileUploader.tsx` | ⏳ Pending |
| **`OCRScanner`** | Scanning feedback component with progress bar and animated scan beam. | `src/components/custom/OCRScanner.tsx` | ⏳ Pending |
| **`DinerSelector`** | Controls to add, edit, or select participants (diners). | `src/components/custom/DinerSelector.tsx` | ⏳ Pending |
| **`ReceiptItemRow`** | Individual receipt item card displaying pricing, qty, and allocation controls. | `src/components/custom/ReceiptItemRow.tsx` | ⏳ Pending |
| **`BillSummaryCard`** | Display card showing subtotal, taxes, service charges, and individual breakdown. | `src/components/custom/BillSummaryCard.tsx` | ⏳ Pending |
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
