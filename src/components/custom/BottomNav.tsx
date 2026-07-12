"use client";

import { ScanLine, Users, Receipt } from "lucide-react";

export type NavTab = "scan" | "assign" | "settle";

interface BottomNavProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  /** Show/hide individual tabs based on app flow state */
  enabledTabs?: NavTab[];
}

const tabs: { id: NavTab; label: string; Icon: React.ElementType }[] = [
  { id: "scan",   label: "Scan",   Icon: ScanLine },
  { id: "assign", label: "Assign", Icon: Users    },
  { id: "settle", label: "Settle", Icon: Receipt  },
];

export default function BottomNav({
  activeTab,
  onTabChange,
  enabledTabs = ["scan", "assign", "settle"],
}: BottomNavProps) {
  const activeIndex = tabs.findIndex((t) => t.id === activeTab);

  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-50"
      aria-label="Main navigation"
    >
      {/* ── Progress stepper bar (4px, fills with golden orange) ── */}
      <div
        className="relative h-[3px] bg-surface-high overflow-hidden"
        role="progressbar"
        aria-valuenow={activeIndex + 1}
        aria-valuemin={1}
        aria-valuemax={tabs.length}
      >
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${((activeIndex + 1) / tabs.length) * 100}%` }}
        />
      </div>

      {/* ── Tab strip ─────────────────────────────────────────────── */}
      <div className="bg-surface-lowest border-t border-border">
        <div className="flex items-stretch h-16 px-2 pb-safe">
          {tabs.map(({ id, label, Icon }) => {
            const isActive  = activeTab === id;
            const isEnabled = enabledTabs.includes(id);

            return (
              <button
                key={id}
                id={`bottom-nav-${id}`}
                aria-label={label}
                aria-current={isActive ? "page" : undefined}
                disabled={!isEnabled}
                onClick={() => isEnabled && onTabChange(id)}
                className={[
                  "flex flex-1 flex-col items-center justify-center gap-1 min-h-[44px]",
                  "transition-all duration-200 active:scale-95 rounded-lg mx-1",
                  isActive
                    ? "text-primary"
                    : isEnabled
                    ? "text-muted hover:text-foreground"
                    : "text-muted opacity-30 cursor-not-allowed",
                ].join(" ")}
              >
                {/* Icon with active glow */}
                <span
                  className={[
                    "relative flex items-center justify-center w-10 h-6",
                    isActive ? "animate-pulse-glow" : "",
                  ].join(" ")}
                >
                  <Icon
                    className={`w-5 h-5 transition-all duration-200 ${
                      isActive ? "stroke-[2.5]" : "stroke-[1.5]"
                    }`}
                    aria-hidden="true"
                  />
                  {/* Active indicator dot */}
                  {isActive && (
                    <span
                      className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-primary animate-fade-in"
                      aria-hidden="true"
                    />
                  )}
                </span>

                {/* Label */}
                <span
                  className={`text-[10px] font-semibold uppercase tracking-widest transition-all duration-200 ${
                    isActive ? "text-primary" : ""
                  }`}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </nav>
  );
}
