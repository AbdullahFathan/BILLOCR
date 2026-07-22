"use client";

import { useEffect } from "react";
import { X, AlertTriangle, Info, CheckCircle, XCircle } from "lucide-react";

type AlertModalVariant = "error" | "warning" | "info" | "success";

interface AlertModalProps {
  /** Controls visibility */
  open: boolean;
  /** Callback fired when the user closes the modal */
  onClose: () => void;
  /** Modal title text */
  title: string;
  /** Modal body message */
  message: string;
  /** Visual variant — affects icon and accent colour. Defaults to "error". */
  variant?: AlertModalVariant;
  /** Label for the close button. Defaults to "Mengerti". */
  closeLabel?: string;
}

const VARIANT_CONFIG: Record<
  AlertModalVariant,
  {
    Icon: React.FC<{ className?: string }>;
    iconBg: string;
    iconColor: string;
    accentBorder: string;
  }
> = {
  error: {
    Icon: XCircle,
    iconBg: "bg-destructive/10",
    iconColor: "text-destructive",
    accentBorder: "border-destructive/30",
  },
  warning: {
    Icon: AlertTriangle,
    iconBg: "bg-warning/10",
    iconColor: "text-warning",
    accentBorder: "border-warning/30",
  },
  info: {
    Icon: Info,
    iconBg: "bg-info/10",
    iconColor: "text-info",
    accentBorder: "border-info/30",
  },
  success: {
    Icon: CheckCircle,
    iconBg: "bg-success/10",
    iconColor: "text-success",
    accentBorder: "border-success/30",
  },
};

export default function AlertModal({
  open,
  onClose,
  title,
  message,
  variant = "error",
  closeLabel = "Mengerti",
}: AlertModalProps) {
  const { Icon, iconBg, iconColor, accentBorder } = VARIANT_CONFIG[variant];

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open, onClose]);

  // Lock body scroll when open
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  if (!open) return null;

  return (
    /* ── Backdrop ───────────────────────────────────────────────── */
    <div
      className="fixed inset-0 z-50 flex items-center justify-center px-5 animate-[fade-in_0.2s_ease-out]"
      style={{
        backgroundColor: "rgba(4, 20, 38, 0.75)",
        backdropFilter: "blur(6px)",
      }}
      onClick={onClose}
      aria-modal="true"
      role="dialog"
      aria-labelledby="alert-modal-title"
    >
      {/* ── Modal Card ────────────────────────────────────────────── */}
      <div
        className="relative w-full max-w-sm bg-surface border border-border rounded-2xl shadow-(--shadow-glass) animate-[slide-up_0.25s_ease-out] overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Top accent line */}
        <div
          className={`h-0.5 w-full ${accentBorder.replace("border-", "bg-").replace("/30", "/60")}`}
        />

        {/* Header */}
        <div className="flex items-start justify-between gap-3 px-5 pt-5 pb-4">
          {/* Icon */}
          <div
            className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border ${accentBorder} ${iconBg}`}
          >
            <Icon className={`w-5 h-5 ${iconColor}`} />
          </div>

          {/* Title + message */}
          <div className="flex-1 min-w-0 space-y-1 pt-0.5">
            <h3
              id="alert-modal-title"
              className="text-sm font-bold font-heading text-foreground leading-tight"
            >
              {title}
            </h3>
            <p className="text-xs text-muted leading-relaxed">{message}</p>
          </div>

          {/* Close X */}
          <button
            onClick={onClose}
            aria-label="Tutup modal"
            className="shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-surface-high border border-border text-muted hover:text-foreground hover:border-border-active transition-all duration-200 active:scale-90 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Divider */}
        <div className="h-px bg-border/50 mx-5" />

        {/* Footer CTA */}
        <div className="px-5 py-4">
          <button
            id="alert-modal-close-btn"
            onClick={onClose}
            className="w-full h-11 flex items-center justify-center rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer shadow-md"
          >
            {closeLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
