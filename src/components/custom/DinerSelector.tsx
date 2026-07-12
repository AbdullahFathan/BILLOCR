"use client";

import React, { useState } from "react";
import { Plus, X } from "lucide-react";
import { useReceiptStore } from "@/hooks/useReceiptStore";

interface DinerSelectorProps {
  activeDinerName: string | null;
  setActiveDinerName: (name: string | null) => void;
}

export default function DinerSelector({
  activeDinerName,
  setActiveDinerName,
}: DinerSelectorProps) {
  const [nameInput, setNameInput] = useState("");
  const [showInput, setShowInput] = useState(false);
  const { diners, addDiner, removeDiner } = useReceiptStore();

  const getInitials = (name: string) =>
    name
      .split(" ")
      .map((n) => n[0])
      .join("")
      .toUpperCase()
      .substring(0, 2);

  const handleAddDiner = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;

    addDiner(trimmed);
    setNameInput("");
    setShowInput(false);

    // Auto-select the first diner if none is active
    if (!activeDinerName) {
      setActiveDinerName(trimmed);
    }
  };

  const handleRemoveDiner = (name: string, e: React.MouseEvent) => {
    e.stopPropagation();
    removeDiner(name);

    if (activeDinerName === name) {
      const remaining = diners.filter((d) => d !== name);
      setActiveDinerName(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const handleSelectDiner = (name: string) => {
    setActiveDinerName(activeDinerName === name ? null : name);
  };

  return (
    <div className="space-y-4">
      {/* Pill row */}
      <div className="flex flex-wrap gap-2.5 items-center">
        {diners.map((name) => {
          const isActive = activeDinerName === name;
          return (
            <div
              key={name}
              onClick={() => handleSelectDiner(name)}
              className={`group relative flex items-center gap-2 pl-1 pr-3 py-1 rounded-full cursor-pointer select-none transition-all duration-200 active:scale-95 ${
                isActive
                  ? "bg-primary/15 border border-primary text-primary shadow-[0_0_0_1px_theme(colors.primary)] shadow-primary/20"
                  : "bg-secondary border border-border text-foreground hover:border-primary/40 hover:bg-secondary/80"
              }`}
            >
              {/* Avatar circle */}
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 transition-colors ${
                  isActive
                    ? "bg-primary text-primary-foreground"
                    : "bg-surface-high border border-border text-foreground"
                }`}
              >
                {getInitials(name)}
              </div>

              {/* Name */}
              <span className="text-xs font-semibold leading-none">{name}</span>

              {/* Remove button */}
              <button
                type="button"
                onClick={(e) => handleRemoveDiner(name, e)}
                className="ml-0.5 -mr-1 p-0.5 rounded-full text-foreground/30 hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer opacity-0 group-hover:opacity-100"
                title={`Remove ${name}`}
              >
                <X className="w-3 h-3" />
              </button>
            </div>
          );
        })}

        {/* + Tambah Orang dashed chip */}
        {!showInput && (
          <button
            type="button"
            onClick={() => setShowInput(true)}
            className="flex items-center gap-1.5 pl-1 pr-3 py-1 rounded-full border border-dashed border-primary/40 text-primary/70 hover:border-primary hover:text-primary hover:bg-primary/5 text-xs font-semibold transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <div className="w-7 h-7 rounded-full flex items-center justify-center bg-primary/10 border border-primary/20 shrink-0">
              <Plus className="w-3.5 h-3.5" />
            </div>
            Tambah Orang
          </button>
        )}
      </div>

      {/* Inline add input (shown when + chip is clicked) */}
      {showInput && (
        <form
          onSubmit={handleAddDiner}
          className="flex gap-2 animate-[fade-in_0.2s_ease-out]"
        >
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Nama orang..."
            className="flex-1 pl-4 pr-3 h-10 bg-input border border-border/60 focus:border-primary/60 text-foreground text-sm rounded-xl outline-none transition-all placeholder:text-muted/60"
            maxLength={20}
            autoFocus
          />
          <button
            type="submit"
            className="h-10 px-4 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-all active:scale-95 cursor-pointer shadow-sm"
          >
            Tambah
          </button>
          <button
            type="button"
            onClick={() => { setShowInput(false); setNameInput(""); }}
            className="h-10 w-10 flex items-center justify-center rounded-xl bg-secondary hover:brightness-110 border border-border text-muted transition-all active:scale-95 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </form>
      )}

      {/* Empty state */}
      {diners.length === 0 && !showInput && (
        <p className="text-xs text-muted text-center py-3 bg-surface-high/30 border border-dashed border-border/40 rounded-xl">
          Belum ada peserta. Ketuk{" "}
          <span className="text-primary font-semibold">+ Tambah Orang</span>{" "}
          untuk mulai split!
        </p>
      )}

      {/* Active diner hint */}
      {diners.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-[11px] text-muted">
            {activeDinerName ? (
              <>
                Fast-assign aktif:{" "}
                <span className="text-primary font-semibold">
                  {activeDinerName}
                </span>
              </>
            ) : (
              "Ketuk nama untuk pilih fast-assign"
            )}
          </p>
          {activeDinerName && (
            <button
              type="button"
              onClick={() => setActiveDinerName(null)}
              className="text-[10px] text-muted hover:text-primary transition-colors cursor-pointer"
            >
              Clear
            </button>
          )}
        </div>
      )}
    </div>
  );
}
