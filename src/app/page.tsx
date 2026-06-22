"use client";

import { useReceiptStore } from "@/hooks/useReceiptStore";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { Activity, Plus, RotateCcw } from "lucide-react";

export default function Home() {
  const hasHydrated = useHasHydrated();
  const { diners, tax, serviceCharge, addDiner, resetStore } = useReceiptStore();

  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <Activity className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-foreground/50">Loading store...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center p-6 bg-background text-foreground">
      <main className="w-full max-w-md p-6 rounded-2xl bg-card border border-border shadow-glass backdrop-blur-md">
        <h1 className="text-2xl font-bold font-heading text-foreground mb-4">
          Split Bill OCR
        </h1>
        <p className="text-sm text-foreground/75 mb-6">
          Milestone 1 Complete: Zustand state store and Tailwind v4 design system variables initialized.
        </p>

        <div className="space-y-4 mb-6">
          <div>
            <span className="block text-xs font-semibold uppercase tracking-wider text-foreground/50">
              Diners ({diners.length})
            </span>
            {diners.length === 0 ? (
              <p className="text-sm text-foreground/40 italic mt-1">No diners added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2 mt-2">
                {diners.map((diner) => (
                  <span
                    key={diner}
                    className="px-3 py-1 text-xs rounded-full bg-secondary border border-border text-foreground"
                  >
                    {diner}
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-foreground/50">
                Tax
              </span>
              <p className="text-sm font-medium mt-1">Rp {tax.toLocaleString()}</p>
            </div>
            <div>
              <span className="block text-xs font-semibold uppercase tracking-wider text-foreground/50">
                Service Charge
              </span>
              <p className="text-sm font-medium mt-1">Rp {serviceCharge.toLocaleString()}</p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <button
            onClick={() => addDiner(`Diner ${diners.length + 1}`)}
            className="flex-1 flex items-center justify-center gap-2 h-10 px-4 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-all active:scale-98 cursor-pointer"
          >
            <Plus className="w-4 h-4" /> Add Diner
          </button>
          
          <button
            onClick={resetStore}
            className="flex items-center justify-center w-10 h-10 rounded-lg bg-secondary hover:brightness-110 text-foreground transition-all active:scale-98 cursor-pointer"
            title="Reset Store"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
        </div>
      </main>
    </div>
  );
}
