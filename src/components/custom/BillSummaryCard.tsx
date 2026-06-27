"use client";

import React, { useState } from "react";
import { ReceiptItem } from "@/types";
import { ChevronDown, ChevronUp, Users, Info } from "lucide-react";

interface BillSummaryCardProps {
  items: ReceiptItem[];
  diners: string[];
  assignments: Record<string, Record<string, number>>; // itemId -> dinerName -> quantity
  tax: number;
  serviceCharge: number;
}

export default function BillSummaryCard({
  items,
  diners,
  assignments,
  tax,
  serviceCharge,
}: BillSummaryCardProps) {
  const [expandedDiner, setExpandedDiner] = useState<string | null>(null);

  // 1. Calculate overall subtotal
  const overallSubtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const grandTotal = overallSubtotal + tax + serviceCharge;

  // Helper to get initials
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  // 2. Calculate breakdowns per diner
  const dinerBreakdowns = diners.map((dinerName) => {
    let dinerSubtotal = 0;
    const itemizedList: Array<{
      itemName: string;
      qty: number;
      price: number;
      shareCost: number;
    }> = [];

    // Calculate diner portion of each item
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

    // Proportional splits
    const dinerTax = overallSubtotal > 0 ? (dinerSubtotal / overallSubtotal) * tax : 0;
    const dinerServiceCharge =
      overallSubtotal > 0 ? (dinerSubtotal / overallSubtotal) * serviceCharge : 0;
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

  // Calculate total allocated money to show if there's any discrepancy due to rounding or unassigned items
  const totalAllocatedSubtotal = dinerBreakdowns.reduce((sum, d) => sum + d.subtotal, 0);
  const totalAllocatedGrandTotal = dinerBreakdowns.reduce((sum, d) => sum + d.total, 0);
  const unassignedSubtotal = Math.max(0, overallSubtotal - totalAllocatedSubtotal);

  const toggleDinerExpand = (name: string) => {
    setExpandedDiner(expandedDiner === name ? null : name);
  };

  return (
    <div className="bg-card backdrop-blur-md border border-border shadow-glass rounded-2xl p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3 border-b border-border/40 pb-3">
        <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
          <Users className="w-5 h-5" />
        </div>
        <div>
          <h3 className="text-sm font-bold font-heading text-foreground">
            Split Bill Breakdowns
          </h3>
          <p className="text-[10px] text-foreground/50">
            Calculated proportionally based on diner subtotal
          </p>
        </div>
      </div>

      {/* Diners list with individual totals */}
      <div className="space-y-2.5">
        {diners.length === 0 ? (
          <p className="text-xs text-foreground/40 text-center py-4 italic">
            Add diners to see split calculations.
          </p>
        ) : (
          dinerBreakdowns.map((diner) => {
            const isExpanded = expandedDiner === diner.name;
            return (
              <div
                key={diner.name}
                className={`border rounded-xl transition-all overflow-hidden ${
                  isExpanded
                    ? "border-primary/50 bg-secondary/15"
                    : "border-border/40 bg-secondary/5 hover:border-border/80"
                }`}
              >
                {/* Diner Row Header */}
                <div
                  onClick={() => toggleDinerExpand(diner.name)}
                  className="p-3 flex items-center justify-between cursor-pointer select-none"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-7 h-7 rounded-full bg-secondary border border-border text-foreground text-[10px] font-bold flex items-center justify-center">
                      {getInitials(diner.name)}
                    </div>
                    <span className="text-xs font-bold text-foreground">
                      {diner.name}
                    </span>
                  </div>

                  <div className="flex items-center gap-2.5">
                    <div className="text-right">
                      <div className="text-xs font-bold font-mono text-foreground">
                        Rp {diner.total.toLocaleString("id-ID")}
                      </div>
                      {diner.subtotal > 0 && (
                        <div className="text-[9px] text-foreground/50">
                          {((diner.subtotal / overallSubtotal) * 100).toFixed(0)}% of bill
                        </div>
                      )}
                    </div>
                    <div className="text-foreground/45">
                      {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                    </div>
                  </div>
                </div>

                {/* Diner Itemized Breakdown Expandable Details */}
                {isExpanded && (
                  <div className="px-3 pb-3 pt-1.5 border-t border-border/10 bg-input/20 space-y-2.5">
                    {diner.items.length === 0 ? (
                      <p className="text-[10px] text-foreground/45 italic py-1">
                        No items assigned to this diner.
                      </p>
                    ) : (
                      <>
                        <div className="space-y-1.5">
                          {diner.items.map((item, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between items-center text-[10px] text-foreground/75"
                            >
                              <div className="truncate max-w-[180px]">
                                <span className="font-medium">{item.itemName}</span>
                                <span className="text-foreground/45 ml-1">x{item.qty}</span>
                              </div>
                              <span className="font-mono">
                                Rp {item.shareCost.toLocaleString("id-ID")}
                              </span>
                            </div>
                          ))}
                        </div>

                        {/* Charges breakdown */}
                        <div className="border-t border-border/20 pt-2 space-y-1 text-[9px] text-foreground/50 font-mono">
                          <div className="flex justify-between">
                            <span>Subtotal</span>
                            <span>Rp {diner.subtotal.toLocaleString("id-ID")}</span>
                          </div>
                          {diner.tax > 0 && (
                            <div className="flex justify-between">
                              <span>Share Pajak (Tax)</span>
                              <span>Rp {Math.round(diner.tax).toLocaleString("id-ID")}</span>
                            </div>
                          )}
                          {diner.serviceCharge > 0 && (
                            <div className="flex justify-between">
                              <span>Share Service</span>
                              <span>Rp {Math.round(diner.serviceCharge).toLocaleString("id-ID")}</span>
                            </div>
                          )}
                          <div className="flex justify-between font-bold text-foreground/80 border-t border-border/10 pt-1 mt-1">
                            <span>Total Individu</span>
                            <span>Rp {diner.total.toLocaleString("id-ID")}</span>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Bill summary breakdown status (e.g. alerts for remaining unassigned value) */}
      {unassignedSubtotal > 0 && diners.length > 0 && (
        <div className="bg-warning/10 border border-warning/20 text-warning text-[10px] p-2.5 rounded-xl flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 mt-0.5" />
          <div className="space-y-0.5">
            <span className="font-bold">Unassigned Items Exist</span>
            <p className="text-foreground/60 leading-normal">
              Rp {unassignedSubtotal.toLocaleString("id-ID")} of food items is not yet allocated to diners. Please allocate all items to ensure accurate tax division.
            </p>
          </div>
        </div>
      )}

      {/* Main Totals Breakdown */}
      <div className="bg-secondary/15 border border-border/30 rounded-xl p-3.5 space-y-1.5 text-xs">
        <div className="flex justify-between text-foreground/60 font-medium">
          <span>Subtotal Makanan</span>
          <span>Rp {overallSubtotal.toLocaleString("id-ID")}</span>
        </div>
        {tax > 0 && (
          <div className="flex justify-between text-foreground/60 font-medium">
            <span>Total Pajak (Tax)</span>
            <span>Rp {tax.toLocaleString("id-ID")}</span>
          </div>
        )}
        {serviceCharge > 0 && (
          <div className="flex justify-between text-foreground/60 font-medium">
            <span>Total Service Charge</span>
            <span>Rp {serviceCharge.toLocaleString("id-ID")}</span>
          </div>
        )}
        <div className="flex justify-between font-bold text-foreground border-t border-border/30 pt-2 mt-1">
          <span>Grand Total Struk</span>
          <span className="text-primary text-sm font-mono">Rp {grandTotal.toLocaleString("id-ID")}</span>
        </div>
        {diners.length > 0 && (
          <div className="flex justify-between font-medium text-foreground/40 border-t border-border/10 pt-1 mt-1 text-[10px]">
            <span>Split allocated sum</span>
            <span>Rp {totalAllocatedGrandTotal.toLocaleString("id-ID")}</span>
          </div>
        )}
      </div>
    </div>
  );
}
