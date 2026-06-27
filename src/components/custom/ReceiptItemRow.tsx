"use client";

import React from "react";
import { ReceiptItem } from "@/types";
import { ChevronDown, ChevronUp, Plus, Minus, User, AlertCircle } from "lucide-react";

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
  // Calculate total assigned quantity
  const totalAssigned = Object.values(assignments).reduce((sum, qty) => sum + qty, 0);
  // Using epsilon/rounding to handle floating point issues (e.g. 0.1 + 0.2 = 0.30000000000000004)
  const remainingQty = Math.max(0, parseFloat((item.qty - totalAssigned).toFixed(4)));
  const isFullyAllocated = remainingQty === 0;
  const isPartiallyAllocated = totalAssigned > 0 && !isFullyAllocated;
  const isUnallocated = totalAssigned === 0;

  // Get initials for avatar badges
  const getInitials = (name: string) => {
    return name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);
  };

  const handleIncrement = (dinerName: string) => {
    const currentQty = assignments[dinerName] || 0;
    // We increment by 0.5 or 1.0, whichever is smaller/available
    const increment = remainingQty >= 0.5 ? 0.5 : remainingQty;
    if (increment > 0) {
      onAssign(item.id, dinerName, parseFloat((currentQty + increment).toFixed(2)));
    }
  };

  const handleDecrement = (dinerName: string) => {
    const currentQty = assignments[dinerName] || 0;
    if (currentQty > 0) {
      const decrement = currentQty >= 0.5 ? 0.5 : currentQty;
      onAssign(item.id, dinerName, parseFloat((currentQty - decrement).toFixed(2)));
    }
  };

  const handleQuickAssign = (dinerName: string) => {
    if (remainingQty <= 0) return;
    // Default to 1.0 share, or remaining quantity if less than 1.0
    const initialQty = remainingQty >= 1 ? 1 : remainingQty;
    onAssign(item.id, dinerName, initialQty);
  };

  // Get diners not yet assigned to this item
  const unassignedDiners = diners.filter((diner) => !(diner in assignments));

  return (
    <div
      className={`border rounded-2xl transition-all duration-300 overflow-hidden ${
        isExpanded
          ? "border-primary bg-card/75 shadow-[0_0_20px_rgba(250,95,68,0.08)]"
          : !isFullyAllocated && totalAssigned > 0
          ? "border-warning/50 bg-warning/5 hover:border-warning/80"
          : "border-border hover:border-border/80 bg-card/40"
      }`}
    >
      {/* Collapsed Header Info */}
      <div
        onClick={onToggleExpand}
        className="p-4 flex items-center justify-between cursor-pointer select-none"
      >
        <div className="space-y-1 flex-1 min-w-0 pr-4">
          <div className="flex items-center gap-2">
            <h4 className="font-bold text-sm text-foreground truncate max-w-[200px]">
              {item.name}
            </h4>
            {/* Warning badge if under-allocated and assignments exist */}
            {!isFullyAllocated && totalAssigned > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 text-[10px] font-semibold bg-warning/20 text-warning rounded-full border border-warning/30 animate-pulse">
                <AlertCircle className="w-2.5 h-2.5" />
                {remainingQty} left
              </span>
            )}
            {isUnallocated && diners.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-semibold bg-secondary border border-border text-foreground/50 rounded-full">
                Unassigned
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 text-xs text-foreground/55 font-mono">
            <span>Qty: {item.qty}</span>
            <span>•</span>
            <span>Rp {item.price.toLocaleString("id-ID")} each</span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          <div className="text-right font-semibold font-mono text-sm text-foreground">
            Rp {(item.qty * item.price).toLocaleString("id-ID")}
          </div>

          <div className="text-foreground/40 hover:text-foreground transition-all">
            {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
          </div>
        </div>
      </div>

      {/* Avatar Row in Collapsed State */}
      {!isExpanded && totalAssigned > 0 && (
        <div className="px-4 pb-3 border-t border-border/10 pt-2 flex flex-wrap gap-1.5 items-center bg-secondary/5">
          <span className="text-[10px] text-foreground/40 font-medium">Assigned:</span>
          {Object.entries(assignments).map(([dinerName, qty]) => (
            <div
              key={dinerName}
              className="group relative flex items-center justify-center h-5 px-2 rounded bg-primary/10 border border-primary/20 text-primary text-[10px] font-semibold transition-all hover:bg-primary/20"
              title={`${dinerName}: ${qty} shares`}
            >
              <span>
                {getInitials(dinerName)}
                <span className="opacity-80 ml-1">({qty})</span>
              </span>
              
              {/* Custom Tooltip */}
              <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 hidden group-hover:block z-20 bg-popover text-popover-foreground text-[10px] font-medium py-1 px-2 rounded shadow-md border border-border whitespace-nowrap">
                {dinerName}: {qty} {qty === 1 ? "share" : "shares"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Expanded Controls Drawer */}
      {isExpanded && (
        <div className="border-t border-border/40 p-4 space-y-4 bg-secondary/15">
          {/* Stepper Allocations List */}
          {Object.keys(assignments).length > 0 ? (
            <div className="space-y-2.5">
              <span className="text-xs text-foreground/50 font-semibold block">Diner Splits:</span>
              <div className="space-y-2">
                {Object.entries(assignments).map(([dinerName, qty]) => (
                  <div
                    key={dinerName}
                    className="flex items-center justify-between bg-card/60 border border-border/40 p-2.5 rounded-xl"
                  >
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded bg-primary/10 border border-primary/20 text-primary text-[10px] font-bold flex items-center justify-center">
                        {getInitials(dinerName)}
                      </div>
                      <span className="text-xs font-semibold text-foreground truncate max-w-[120px]">
                        {dinerName}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleDecrement(dinerName)}
                        className="w-7 h-7 flex items-center justify-center rounded bg-secondary hover:brightness-110 text-foreground transition-all active:scale-90 font-bold select-none cursor-pointer"
                      >
                        <Minus className="w-3.5 h-3.5" />
                      </button>
                      <span className="w-12 text-center text-xs font-bold text-foreground font-mono">
                        {qty}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleIncrement(dinerName)}
                        disabled={isFullyAllocated}
                        className={`w-7 h-7 flex items-center justify-center rounded transition-all font-bold select-none ${
                          isFullyAllocated
                            ? "bg-secondary/40 text-foreground/20 cursor-not-allowed"
                            : "bg-secondary hover:brightness-110 text-foreground active:scale-90 cursor-pointer"
                        }`}
                      >
                        <Plus className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <p className="text-xs text-foreground/45 italic py-1 text-center">
              No diners assigned yet.
            </p>
          )}

          {/* Quantity Tracker Bar */}
          <div className="bg-card/40 border border-border/30 rounded-xl p-3 flex justify-between items-center text-xs">
            <span className="text-foreground/50 font-medium">Split Progress:</span>
            <div className="flex items-center gap-2">
              <span className="font-mono font-bold text-foreground">
                {totalAssigned} / {item.qty} shares
              </span>
              {!isFullyAllocated ? (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-warning/20 text-warning rounded-full border border-warning/20">
                  {remainingQty} left
                </span>
              ) : (
                <span className="px-2 py-0.5 text-[10px] font-semibold bg-success/20 text-success rounded-full border border-success/20">
                  Completed
                </span>
              )}
            </div>
          </div>

          {/* Quick-Assign Other Diners */}
          {diners.length > 0 && unassignedDiners.length > 0 && (
            <div className="space-y-2">
              <span className="text-xs text-foreground/50 font-semibold block">Quick Add Diner:</span>
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
                        : "bg-secondary border-border text-foreground hover:border-primary/40 active:scale-95 cursor-pointer"
                    }`}
                  >
                    <Plus className="w-3 h-3 text-primary" />
                    <span>{dinerName}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Active Diner Auto-Assign Callout */}
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
              className="w-full py-2 bg-primary/10 border border-dashed border-primary/30 rounded-xl hover:bg-primary/20 text-primary text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              Assign Active Diner: <span className="underline">{activeDinerName}</span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}
