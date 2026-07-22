"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import { ReceiptItem } from "@/types";
import { calcDinerBreakdowns } from "@/lib/calculator";
import AlertModal from "@/components/custom/AlertModal";

interface ShareReportButtonProps {
  diners: string[];
  items: ReceiptItem[];
  assignments: Record<string, Record<string, number>>;
  tax: number;
  serviceCharge: number;
  /** Optional extra class names to apply to the button */
  className?: string;
}

/**
 * ShareReportButton
 *
 * Renders a "Copy Recap" button that builds the WhatsApp-formatted split bill
 * summary and writes it to the clipboard.  Falls back to AlertModal (warning
 * variant) if the Clipboard API is unavailable.
 */
export default function ShareReportButton({
  diners,
  items,
  assignments,
  tax,
  serviceCharge,
  className = "",
}: ShareReportButtonProps) {
  const [copySuccess, setCopySuccess] = useState(false);
  const [clipboardError, setClipboardError] = useState(false);

  const handleCopy = () => {
    const overallSubtotal = items.reduce(
      (sum, item) => sum + item.qty * item.price,
      0,
    );
    const grandTotal = overallSubtotal + tax + serviceCharge;
    const breakdowns = calcDinerBreakdowns(diners, items, assignments, tax, serviceCharge);

    let text = `🧾 *Split Bill: Struk Belanja*\n`;
    text += `-------------------------\n`;

    breakdowns.forEach((diner) => {
      if (diner.subtotal === 0) return;

      text += `👤 *${diner.name}*: Rp ${diner.total.toLocaleString("id-ID")}\n`;
      diner.items.forEach((it) => {
        text += `- ${it.itemName} (x${it.qty}): Rp ${it.shareCost.toLocaleString("id-ID")}\n`;
      });
      if (diner.tax > 0 || diner.serviceCharge > 0) {
        text += `- Pajak & Layanan: Rp ${Math.round(diner.tax + diner.serviceCharge).toLocaleString("id-ID")}\n`;
      }
      text += `-------------------------\n`;
    });

    text += `Total Tagihan: Rp ${grandTotal.toLocaleString("id-ID")}`;

    navigator.clipboard
      .writeText(text)
      .then(() => {
        setCopySuccess(true);
        setTimeout(() => setCopySuccess(false), 2000);
      })
      .catch(() => {
        setClipboardError(true);
      });
  };

  const isDisabled = diners.length === 0;

  return (
    <>
      {/* Clipboard Error Modal */}
      <AlertModal
        open={clipboardError}
        onClose={() => setClipboardError(false)}
        title="Gagal Menyalin Rekap"
        message="Browser kamu tidak mengizinkan akses clipboard. Silakan salin teks secara manual dari tampilan di atas."
        variant="warning"
        closeLabel="Oke, Mengerti"
      />

      <button
        id="share-report-btn"
        type="button"
        onClick={handleCopy}
        disabled={isDisabled}
        aria-label="Salin rekap tagihan"
        className={[
          "flex items-center justify-center gap-2 font-semibold text-sm transition-all duration-200 active:scale-95",
          isDisabled
            ? "bg-primary/30 text-primary-foreground/40 cursor-not-allowed"
            : "bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer shadow-md",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
      >
        {copySuccess ? (
          <>
            <Check className="w-4 h-4 text-success" />
            Tersalin!
          </>
        ) : (
          <>
            <Copy className="w-4 h-4" />
            Salin Rekap
          </>
        )}
      </button>
    </>
  );
}
