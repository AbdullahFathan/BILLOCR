"use client";

import React from "react";
import { ReceiptItem } from "@/types";
import { Copy, Check, Info, ChevronDown, ChevronUp } from "lucide-react";
import { useState } from "react";

interface BillSummaryCardProps {
  items: ReceiptItem[];
  diners: string[];
  assignments: Record<string, Record<string, number>>; // itemId -> dinerName -> quantity
  tax: number;
  serviceCharge: number;
  activeDinerName?: string | null;
  onCopyRecap?: () => void;
  copySuccess?: boolean;
}

export default function BillSummaryCard({
  items,
  diners,
  assignments,
  tax,
  serviceCharge,
  activeDinerName,
  onCopyRecap,
  copySuccess,
}: BillSummaryCardProps) {
  const [expandedDiner, setExpandedDiner] = useState<string | null>(null);

  /* ── Calculations ─────────────────────────────────────────── */
  const overallSubtotal = items.reduce(
    (sum, item) => sum + item.qty * item.price,
    0
  );
  const grandTotal = overallSubtotal + tax + serviceCharge;

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

  const dinerBreakdowns = diners.map((dinerName) => {
    let dinerSubtotal = 0;
    const itemizedList: Array<{
      itemName: string;
      qty: number;
      price: number;
      shareCost: number;
    }> = [];

    items.forEach((item) => {
      const itemAssignments = assignments[item.id] || {};
      const assignedQty = itemAssignments[dinerName] || 0;
      if (assignedQty > 0) {
        const shareCost = assignedQty * item.price;
        dinerSubtotal += shareCost;
        itemizedList.push({
          itemName: item.name,
          qty: assignedQty,
          price: item.price,
          shareCost,
        });
      }
    });

    const dinerTax =
      overallSubtotal > 0 ? (dinerSubtotal / overallSubtotal) * tax : 0;
    const dinerServiceCharge =
      overallSubtotal > 0
        ? (dinerSubtotal / overallSubtotal) * serviceCharge
        : 0;
    const dinerTotal = Math.round(dinerSubtotal + dinerTax + dinerServiceCharge);

    return {
      name: dinerName,
      subtotal: dinerSubtotal,
      tax: dinerTax,
      serviceCharge: dinerServiceCharge,
      total: dinerTotal,
      items: itemizedList,
    };
  });

  const totalAllocatedSubtotal = dinerBreakdowns.reduce(
    (sum, d) => sum + d.subtotal,
    0
  );
  const unassignedSubtotal = Math.max(
    0,
    overallSubtotal - totalAllocatedSubtotal
  );

  /* Determine active diner breakdown to feature */
  const featuredDiner =
    dinerBreakdowns.find((d) => d.name === activeDinerName) ??
    dinerBreakdowns[0] ??
    null;
  const otherDiners = dinerBreakdowns.filter(
    (d) => d.name !== featuredDiner?.name
  );

  /* ── Render ───────────────────────────────────────────────── */
  return (
    <div className="bg-surface-low border border-border rounded-2xl overflow-hidden">
      {/* ── Unassigned warning ─────────────────────────────── */}
      {unassignedSubtotal > 0 && diners.length > 0 && (
        <div className="flex items-start gap-2 px-4 py-3 bg-warning/8 border-b border-warning/15 text-warning text-[11px]">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <span>
            <span className="font-bold">
              Rp {unassignedSubtotal.toLocaleString("id-ID")}
            </span>{" "}
            belum dibagi ke siapapun. Alokasikan semua item agar pajak terbagi
            akurat.
          </span>
        </div>
      )}

      {/* ── Featured diner: big total ──────────────────────── */}
      {featuredDiner ? (
        <div className="px-5 pt-5 pb-4 space-y-1">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-primary">
            Subtotal {featuredDiner.name.toUpperCase()}
          </p>
          <div className="flex items-end justify-between">
            <p className="text-3xl font-bold font-heading text-foreground tracking-tighter tabular-nums">
              Rp {featuredDiner.total.toLocaleString("id-ID")}
            </p>
            {/* Expand item detail */}
            <button
              type="button"
              onClick={() =>
                setExpandedDiner(
                  expandedDiner === featuredDiner.name
                    ? null
                    : featuredDiner.name
                )
              }
              className="flex items-center gap-1 text-[11px] text-muted hover:text-foreground transition-colors cursor-pointer pb-1"
            >
              Rincian
              {expandedDiner === featuredDiner.name ? (
                <ChevronUp className="w-3.5 h-3.5" />
              ) : (
                <ChevronDown className="w-3.5 h-3.5" />
              )}
            </button>
          </div>
          <p className="text-[11px] text-muted">
            Termasuk pajak &amp; layanan proporsional
          </p>

          {/* Item detail drawer */}
          {expandedDiner === featuredDiner.name && (
            <div className="mt-3 bg-surface-lowest rounded-xl p-3 space-y-1.5 animate-[fade-in_0.2s_ease-out]">
              {featuredDiner.items.length === 0 ? (
                <p className="text-[10px] text-muted italic text-center py-1">
                  Belum ada item untuk {featuredDiner.name}
                </p>
              ) : (
                <>
                  {featuredDiner.items.map((it, i) => (
                    <div
                      key={i}
                      className="flex justify-between text-[11px] text-foreground/75"
                    >
                      <span className="truncate max-w-[180px]">
                        {it.itemName}{" "}
                        <span className="text-muted">×{it.qty}</span>
                      </span>
                      <span className="font-mono text-foreground">
                        Rp {it.shareCost.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                  {(featuredDiner.tax > 0 ||
                    featuredDiner.serviceCharge > 0) && (
                    <div className="border-t border-border/20 pt-1.5 space-y-1">
                      {featuredDiner.tax > 0 && (
                        <div className="flex justify-between text-[10px] text-muted font-mono">
                          <span>Pajak</span>
                          <span>
                            Rp{" "}
                            {Math.round(featuredDiner.tax).toLocaleString(
                              "id-ID"
                            )}
                          </span>
                        </div>
                      )}
                      {featuredDiner.serviceCharge > 0 && (
                        <div className="flex justify-between text-[10px] text-muted font-mono">
                          <span>Layanan</span>
                          <span>
                            Rp{" "}
                            {Math.round(
                              featuredDiner.serviceCharge
                            ).toLocaleString("id-ID")}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <div className="px-5 pt-5 pb-4">
          <p className="text-[10px] font-semibold uppercase tracking-widest text-muted mb-1">
            Ringkasan Tagihan
          </p>
          <p className="text-3xl font-bold font-heading text-foreground tracking-tighter tabular-nums">
            Rp {grandTotal.toLocaleString("id-ID")}
          </p>
          <p className="text-[11px] text-muted mt-0.5">
            Tambah peserta untuk split otomatis
          </p>
        </div>
      )}

      {/* ── Other diners mini row ──────────────────────────── */}
      {otherDiners.length > 0 && (
        <div className="border-t border-border/30 px-5 py-3">
          <div className="flex flex-wrap gap-x-4 gap-y-1">
            {otherDiners.map((d) => (
              <button
                key={d.name}
                type="button"
                onClick={() =>
                  setExpandedDiner(expandedDiner === d.name ? null : d.name)
                }
                className="flex items-center gap-1.5 text-[11px] text-foreground/60 hover:text-foreground transition-colors cursor-pointer"
              >
                <div className="w-5 h-5 rounded-full bg-surface-high border border-border flex items-center justify-center text-[9px] font-bold text-primary shrink-0">
                  {getInitials(d.name)}
                </div>
                <span className="font-medium">{d.name}:</span>
                <span className="font-bold font-heading text-foreground/80">
                  Rp {d.total.toLocaleString("id-ID")}
                </span>
              </button>
            ))}
          </div>

          {/* Other diner expanded detail */}
          {otherDiners.map(
            (d) =>
              expandedDiner === d.name && (
                <div
                  key={d.name}
                  className="mt-2 bg-surface-lowest rounded-xl p-3 space-y-1.5 animate-[fade-in_0.2s_ease-out]"
                >
                  <p className="text-[10px] font-bold text-primary uppercase tracking-wider">
                    {d.name}
                  </p>
                  {d.items.length === 0 ? (
                    <p className="text-[10px] text-muted italic">
                      Belum ada item
                    </p>
                  ) : (
                    d.items.map((it, i) => (
                      <div
                        key={i}
                        className="flex justify-between text-[11px] text-foreground/70"
                      >
                        <span className="truncate max-w-[160px]">
                          {it.itemName}{" "}
                          <span className="text-muted">×{it.qty}</span>
                        </span>
                        <span className="font-mono">
                          Rp {it.shareCost.toLocaleString("id-ID")}
                        </span>
                      </div>
                    ))
                  )}
                  <div className="border-t border-border/20 pt-1.5 flex justify-between text-[11px] font-bold text-foreground/80 font-mono">
                    <span>Total</span>
                    <span>Rp {d.total.toLocaleString("id-ID")}</span>
                  </div>
                </div>
              )
          )}
        </div>
      )}

      {/* ── Grand total strip ──────────────────────────────── */}
      <div className="border-t border-border/40 px-5 py-3 flex justify-between items-center bg-surface-lowest/60">
        <span className="text-[11px] text-muted font-medium">
          Grand Total Struk
        </span>
        <span className="text-sm font-bold text-primary font-heading tabular-nums">
          Rp {grandTotal.toLocaleString("id-ID")}
        </span>
      </div>

      {/* ── Salin Rekap CTA ────────────────────────────────── */}
      {onCopyRecap && (
        <div className="px-5 pb-5 pt-3">
          <button
            type="button"
            onClick={onCopyRecap}
            disabled={diners.length === 0}
            className={`w-full flex items-center justify-center gap-2 h-12 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 ${
              diners.length === 0
                ? "bg-primary/25 text-primary-foreground/40 cursor-not-allowed"
                : "bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer shadow-md"
            }`}
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
        </div>
      )}
    </div>
  );
}
