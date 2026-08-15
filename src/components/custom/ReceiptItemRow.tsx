"use client";

import React from "react";
import { ReceiptItem } from "@/types";
import {
  ChevronDown,
  ChevronUp,
  Plus,
  Minus,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

interface ReceiptItemRowProps {
  item: ReceiptItem;
  assignments: Record<string, number>; // dinerName -> quantity
  onAssign: (itemId: string, dinerName: string, qty: number) => void;
  diners: string[];
  activeDinerName: string | null;
  isExpanded: boolean;
  onToggleExpand: () => void;
}

export default function ReceiptItemRow({
  item,
  assignments,
  onAssign,
  diners,
  activeDinerName,
  isExpanded,
  onToggleExpand,
}: ReceiptItemRowProps) {
  /* ── Allocation math ───────────────────────────────────────── */
  const totalAssigned = Object.values(assignments).reduce(
    (sum, qty) => sum + qty,
    0,
  );
  const remainingQty = Math.max(
    0,
    parseFloat((item.qty - totalAssigned).toFixed(4)),
  );
  const isFullyAllocated = remainingQty === 0;
  const isUnallocated = totalAssigned === 0;

  /* ── Helpers ───────────────────────────────────────────────── */
  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

  const handleIncrement = (dinerName: string) => {
    const currentQty = assignments[dinerName] || 0;
    const increment = remainingQty >= 0.5 ? 0.5 : remainingQty;
    if (increment > 0)
      onAssign(
        item.id,
        dinerName,
        parseFloat((currentQty + increment).toFixed(2)),
      );
  };

  const handleDecrement = (dinerName: string) => {
    const currentQty = assignments[dinerName] || 0;
    if (currentQty > 0) {
      const decrement = currentQty >= 0.5 ? 0.5 : currentQty;
      onAssign(
        item.id,
        dinerName,
        parseFloat((currentQty - decrement).toFixed(2)),
      );
    }
  };

  const handleQuickAssign = (dinerName: string) => {
    if (remainingQty <= 0) return;
    const initialQty = remainingQty >= 1 ? 1 : remainingQty;
    onAssign(item.id, dinerName, initialQty);
  };

  const unassignedDiners = diners.filter((d) => !(d in assignments));

  /* ── Status helpers ────────────────────────────────────────── */
  const rowBorderClass = isExpanded
    ? "border-primary shadow-[0_0_0_1px_theme(colors.primary)]"
    : !isFullyAllocated && totalAssigned > 0
      ? "border-warning/40 hover:border-warning/70"
      : "border-border hover:border-border-active/40";

  const rowBgClass = isExpanded
    ? "bg-surface"
    : !isFullyAllocated && totalAssigned > 0
      ? "bg-warning/5"
      : "bg-surface";

  /* ────────────────────────────────────────────────────────────── */
  return (
    <div
      className={`border rounded-2xl transition-all duration-200 overflow-hidden ${rowBorderClass} ${rowBgClass}`}
    >
      {/* ── Collapsed Header ─────────────────────────────────── */}
      <div
        onClick={onToggleExpand}
        role="button"
        tabIndex={0}
        aria-expanded={isExpanded}
        aria-label={`${isExpanded ? "Tutup" : "Buka"} detail ${item.name}`}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") onToggleExpand();
        }}
        className="p-4 flex items-center justify-between cursor-pointer select-none gap-3"
      >
        {/* Left: name + meta */}
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            <h4 className="font-semibold text-sm text-foreground truncate max-w-45">
              {item.name}
            </h4>

            {/* Qty badge — amber */}
            <span className="px-2 py-0.5 text-[10px] rounded-full bg-accent text-accent-foreground font-semibold shrink-0">
              ×{item.qty}
            </span>

            {/* Status pill */}
            {isFullyAllocated && totalAssigned > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-success/15 text-success rounded-full border border-success/25 shrink-0">
                <CheckCircle2 className="w-2.5 h-2.5" />
                Selesai
              </span>
            )}
            {!isFullyAllocated && totalAssigned > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-warning/20 text-warning rounded-full border border-warning/30 animate-pulse shrink-0">
                <AlertCircle className="w-2.5 h-2.5" />
                {remainingQty} sisa
              </span>
            )}
            {isUnallocated && diners.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-secondary border border-border text-muted rounded-full shrink-0">
                Belum dibagi
              </span>
            )}
          </div>

          {/* Price per unit — golden orange */}
          <p className="text-xs text-muted font-mono">
            Rp{" "}
            <span className="text-primary font-semibold">
              {item.price.toLocaleString("id-ID")}
            </span>{" "}
            / satuan
          </p>
        </div>

        {/* Right: total price + chevron */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="text-right">
            <p className="text-xs text-muted font-medium leading-none mb-0.5">
              Total
            </p>
            <p className="text-sm font-bold font-heading text-primary tabular-nums">
              Rp {(item.qty * item.price).toLocaleString("id-ID")}
            </p>
          </div>
          <div className="w-7 h-7 flex items-center justify-center rounded-lg bg-surface-high border border-border text-muted hover:text-foreground hover:border-primary/40 transition-all">
            {isExpanded ? (
              <ChevronUp className="w-3.5 h-3.5" />
            ) : (
              <ChevronDown className="w-3.5 h-3.5" />
            )}
          </div>
        </div>
      </div>

      {/* ── Avatar strip (collapsed, has assignments) ─────────── */}
      {!isExpanded && totalAssigned > 0 && (
        <div className="px-4 pb-3 pt-1 border-t border-border/20 flex flex-wrap gap-1.5 items-center">
          <span className="text-[10px] text-muted font-medium">Bagi:</span>
          {Object.entries(assignments).map(([dinerName, qty]) => (
            <div
              key={dinerName}
              className="group relative flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold transition-all hover:bg-primary/20 cursor-default"
              title={`${dinerName}: ${qty} porsi`}
            >
              <span className="w-3.5 h-3.5 rounded-full bg-primary/20 flex items-center justify-center text-[8px] font-bold">
                {getInitials(dinerName).charAt(0)}
              </span>
              <span>{getInitials(dinerName)}</span>
              <span className="opacity-70">({qty})</span>

              {/* Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-20 bg-surface-highest border border-border rounded-lg text-[10px] font-medium py-1 px-2.5 shadow-md whitespace-nowrap text-foreground">
                {dinerName}: {qty} porsi
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Expanded Controls Drawer ──────────────────────────── */}
      {isExpanded && (
        <div className="border-t border-border/30 bg-surface-lowest p-4 space-y-4 animate-[fade-in_0.15s_ease-out]">
          {/* Allocation list */}
          {Object.keys(assignments).length > 0 ? (
            <div className="space-y-2">
              <span className="text-[11px] text-muted font-semibold uppercase tracking-wider block">
                Pembagian
              </span>
              <div className="space-y-2">
                {Object.entries(assignments).map(([dinerName, qty]) => (
                  <div
                    key={dinerName}
                    className="flex items-center justify-between bg-surface border border-border rounded-xl px-3 py-2.5"
                  >
                    {/* Avatar + name */}
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-full bg-primary/15 border border-primary/25 text-primary text-[10px] font-bold flex items-center justify-center shrink-0 font-heading">
                        {getInitials(dinerName).charAt(0)}
                      </div>
                      <span className="text-xs font-semibold text-foreground truncate max-w-27.5">
                        {dinerName}
                      </span>
                    </div>

                    {/* Stepper */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDecrement(dinerName)}
                        aria-label={`Kurangi porsi ${dinerName} untuk ${item.name}`}
                        className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary hover:brightness-110 text-foreground transition-all active:scale-90 cursor-pointer border border-border"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-10 text-center text-xs font-bold text-foreground tabular-nums font-heading">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleIncrement(dinerName)}
                        disabled={isFullyAllocated}
                        aria-label={`Tambah porsi ${dinerName} untuk ${item.name}`}
                        className={`w-7 h-7 flex items-center justify-center rounded-lg transition-all font-bold select-none border ${
                          isFullyAllocated
                            ? "bg-secondary/40 text-foreground/20 cursor-not-allowed border-border/30"
                            : "bg-secondary hover:brightness-110 text-foreground active:scale-90 cursor-pointer border-border"
                        }`}
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted italic py-1 text-center">
              Belum ada orang yang ditugaskan.
            </p>
          )}

          {/* Split progress tracker */}
          <div className="bg-surface border border-border/40 rounded-xl px-3 py-2.5 flex justify-between items-center text-xs">
            <span className="text-muted font-medium">Progres</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-foreground tabular-nums">
                {totalAssigned} / {item.qty}
              </span>
              {!isFullyAllocated ? (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-warning/20 text-warning rounded-full border border-warning/20">
                  {remainingQty} sisa
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-success/20 text-success rounded-full border border-success/20">
                  Lengkap
                </span>
              )}
            </div>
          </div>

          {/* Quick-add unassigned diners */}
          {diners.length > 0 && unassignedDiners.length > 0 && (
            <div className="space-y-2">
              <span className="text-[11px] text-muted font-semibold uppercase tracking-wider block">
                Tambah Cepat
              </span>
              <div className="flex flex-wrap gap-2">
                {unassignedDiners.map((dinerName) => (
                  <button
                    key={dinerName}
                    type="button"
                    onClick={() => handleQuickAssign(dinerName)}
                    disabled={isFullyAllocated}
                    className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-all duration-200 ${
                      isFullyAllocated
                        ? "bg-secondary/40 border-border/40 text-foreground/20 cursor-not-allowed"
                        : "bg-secondary border-border text-foreground hover:border-primary/50 hover:text-primary active:scale-95 cursor-pointer"
                    }`}
                  >
                    <Plus className="w-3 h-3 text-primary" />
                    {dinerName}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active diner fast-assign CTA */}
          {activeDinerName && !isFullyAllocated && (
            <button
              type="button"
              onClick={() => {
                if (activeDinerName in assignments) {
                  handleIncrement(activeDinerName);
                } else {
                  handleQuickAssign(activeDinerName);
                }
              }}
              className="w-full py-2.5 bg-primary/10 border border-dashed border-primary/40 rounded-xl hover:bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              Tugaskan ke{" "}
              <span className="underline underline-offset-2">
                {activeDinerName}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
