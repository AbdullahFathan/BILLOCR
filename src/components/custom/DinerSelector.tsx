"use client";

import React, { useState } from "react";
import { Plus, X, User } from "lucide-react";
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
  const { diners, addDiner, removeDiner } = useReceiptStore();

  const handleAddDiner = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = nameInput.trim();
    if (!trimmed) return;
    
    addDiner(trimmed);
    setNameInput("");
    
    // Auto-select the first diner if none is active
    if (!activeDinerName) {
      setActiveDinerName(trimmed);
    }
  };

  const handleRemoveDiner = (name: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent setting as active diner
    removeDiner(name);
    
    // If the active diner is removed, clear it or select another
    if (activeDinerName === name) {
      const remaining = diners.filter((d) => d !== name);
      setActiveDinerName(remaining.length > 0 ? remaining[0] : null);
    }
  };

  const handleSelectDiner = (name: string) => {
    if (activeDinerName === name) {
      // Toggle off if clicking the already active diner
      setActiveDinerName(null);
    } else {
      setActiveDinerName(name);
    }
  };

  return (
    <div className="space-y-4">
      {/* Input Form */}
      <form onSubmit={handleAddDiner} className="flex gap-2">
        <div className="relative flex-1">
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-foreground/40">
            <User className="w-4 h-4" />
          </span>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => setNameInput(e.target.value)}
            placeholder="Enter diner name..."
            className="w-full pl-10 pr-4 h-11 bg-input border border-border/60 text-foreground text-sm rounded-lg outline-none transition-all focus:border-primary/60"
            maxLength={20}
          />
        </div>
        <button
          type="submit"
          className="flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-all active:scale-98 cursor-pointer shadow-md"
        >
          <Plus className="w-4 h-4" />
          Add
        </button>
      </form>

      {/* Diners Pills list */}
      {diners.length > 0 ? (
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-xs text-foreground/50 font-medium">
              Tap a diner to select as "Active" for fast-assign:
            </span>
            {activeDinerName && (
              <button
                type="button"
                onClick={() => setActiveDinerName(null)}
                className="text-[10px] text-primary hover:underline cursor-pointer"
              >
                Clear Active
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2 max-h-[120px] overflow-y-auto pr-1 scrollbar-thin">
            {diners.map((name) => {
              const isActive = activeDinerName === name;
              return (
                <div
                  key={name}
                  onClick={() => handleSelectDiner(name)}
                  className={`flex items-center gap-2 px-3.5 py-1.5 text-xs font-semibold rounded-full border cursor-pointer select-none transition-all duration-200 active:scale-95 ${
                    isActive
                      ? "bg-primary/20 border-primary text-primary shadow-[0_0_12px_rgba(250,95,68,0.25)] ring-1 ring-primary/45"
                      : "bg-secondary border-border text-foreground hover:brightness-110"
                  }`}
                >
                  <span>{name}</span>
                  <button
                    type="button"
                    onClick={(e) => handleRemoveDiner(name, e)}
                    className="p-0.5 -mr-1 rounded-full text-foreground/40 hover:text-destructive hover:bg-destructive/10 transition-all cursor-pointer"
                    title={`Remove ${name}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      ) : (
        <p className="text-xs text-foreground/40 text-center py-2.5 bg-secondary/10 border border-border/30 rounded-xl">
          No diners added yet. Add participants to start splitting!
        </p>
      )}
    </div>
  );
}
