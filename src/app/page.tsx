"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useReceiptStore } from "@/hooks/useReceiptStore";
import { useHasHydrated } from "@/hooks/useHasHydrated";

import FileUploader from "@/components/custom/FileUploader";
import OCRScanner from "@/components/custom/OCRScanner";
import DinerSelector from "@/components/custom/DinerSelector";
import ReceiptItemRow from "@/components/custom/ReceiptItemRow";
import BillSummaryCard from "@/components/custom/BillSummaryCard";
import type { NavTab } from "@/components/custom/BottomNav";
import AlertModal from "@/components/custom/AlertModal";
import ShareReportButton from "@/components/custom/ShareReportButton";
import { parseReceipt } from "@/lib/parser";
import { calcDinerBreakdowns } from "@/lib/calculator";
import {
  Activity,
  FileText,
  RefreshCw,
  ArrowRight,
  Trash2,
  Plus,
  Users,
  Receipt,
  Percent,
  Utensils,
  LayoutList,
} from "lucide-react";

const RATE_LIMIT_KEY = "aura_split_rate_limit_reset";
const QUOTA_KEY = "aura_split_scan_quota";
const DAILY_SCAN_LIMIT = 5;

type StoredQuota = {
  remaining: number;
  /** Unix ms when this cached quota should be treated as stale / reset. */
  reset: number;
};

/** Persist remaining scan quota so a refresh does not flash back to 5/5. */
function writeStoredQuota(remaining: number, resetMs: number): void {
  if (typeof window === "undefined") return;
  try {
    const payload: StoredQuota = { remaining, reset: resetMs };
    localStorage.setItem(QUOTA_KEY, JSON.stringify(payload));
    if (remaining === 0) {
      localStorage.setItem(RATE_LIMIT_KEY, String(resetMs));
    } else {
      localStorage.removeItem(RATE_LIMIT_KEY);
    }
  } catch (e) {
    console.warn("Failed to save scan quota to localStorage:", e);
  }
}

function clearStoredQuota(): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(QUOTA_KEY);
    localStorage.removeItem(RATE_LIMIT_KEY);
  } catch (e) {
    console.warn("Failed to clear scan quota from localStorage:", e);
  }
}

/**
 * Read persisted scan quota (client only).
 * Expired cache is cleared and returns null — caller should re-peek Redis
 * instead of assuming DAILY_SCAN_LIMIT.
 */
function readStoredQuota(): StoredQuota | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(QUOTA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredQuota;
      if (
        typeof parsed.remaining === "number" &&
        typeof parsed.reset === "number" &&
        !isNaN(parsed.remaining) &&
        !isNaN(parsed.reset)
      ) {
        if (Date.now() < parsed.reset) return parsed;
        clearStoredQuota();
        return null;
      }
    }

    // Legacy: only the exhausted-block timestamp was stored
    const storedReset = localStorage.getItem(RATE_LIMIT_KEY);
    if (!storedReset) return null;
    const resetMs = parseInt(storedReset, 10);
    if (!isNaN(resetMs) && Date.now() < resetMs) {
      return { remaining: 0, reset: resetMs };
    }
    clearStoredQuota();
  } catch (e) {
    console.warn("Failed to read scan quota from localStorage:", e);
  }
  return null;
}

/** Normalize Upstash reset (ms) or RateLimit header seconds → ms. */
function normalizeResetMs(raw: number | null | undefined): number {
  if (raw == null || isNaN(raw)) return Date.now() + 86_400_000;
  // Seconds timestamps are ~1e9; ms timestamps are ~1e12
  return raw < 1e12 ? raw * 1000 : raw;
}

export default function Home() {
  const hasHydrated = useHasHydrated();
  const {
    rawText,
    items,
    tax,
    serviceCharge,
    resetStore,
    setItems,
    updateItem,
    addItem,
    deleteItem,
    setTax,
    setServiceCharge,
    diners,
    assignments,
    assignItem,
  } = useReceiptStore();

  const [selectedFile, setSelectedFile] = useState<Blob | null>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [activeTab, setActiveTab] = useState<NavTab>("scan");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [activeDinerName, setActiveDinerName] = useState<string | null>(null);
  const [remainingUploads, setRemainingUploads] = useState<number>(() => {
    const stored = readStoredQuota();
    return stored ? stored.remaining : DAILY_SCAN_LIMIT;
  });
  const [rateLimitResetTime, setRateLimitResetTime] = useState<number | null>(
    () => {
      const stored = readStoredQuota();
      return stored && stored.remaining === 0 ? stored.reset : null;
    },
  );
  const [parseError, setParseError] = useState(false);
  const [rateLimitSynced, setRateLimitSynced] = useState(false);

  /** Bumped on every OCR-driven quota write so stale peeks cannot overwrite. */
  const quotaEpochRef = useRef(0);
  const isScanningRef = useRef(false);
  const wasScanningRef = useRef(false);

  /** Apply remaining/reset to state + localStorage. OCR paths bump epoch. */
  const applyQuota = useCallback(
    (remaining: number, resetMs: number, options?: { bumpEpoch?: boolean }) => {
      const normalizedReset = normalizeResetMs(resetMs);
      if (options?.bumpEpoch) {
        quotaEpochRef.current += 1;
      }
      setRemainingUploads(remaining);
      if (remaining === 0) {
        setRateLimitResetTime(normalizedReset);
      } else {
        setRateLimitResetTime(null);
      }
      writeStoredQuota(remaining, normalizedReset);
    },
    [],
  );

  /**
   * Peek Redis remaining without consuming a scan.
   * Applies only if epoch is unchanged and a scan is not in flight.
   */
  const syncQuotaFromServer = useCallback(async () => {
    const startedAt = quotaEpochRef.current;
    try {
      const res = await fetch("/api/ocr/quota");
      if (!res.ok) return;
      const json = (await res.json()) as {
        success?: boolean;
        data?: { remainingUploads?: number; reset?: number };
      };
      if (!json.success || !json.data) return;
      if (quotaEpochRef.current !== startedAt) return;
      if (isScanningRef.current) return;

      const remaining =
        typeof json.data.remainingUploads === "number"
          ? json.data.remainingUploads
          : DAILY_SCAN_LIMIT;
      applyQuota(remaining, normalizeResetMs(json.data.reset), {
        bumpEpoch: false,
      });
    } catch (e) {
      console.warn("Failed to sync scan quota:", e);
    }
  }, [applyQuota]);

  // Restore rate limit / quota from localStorage after hydration (render-time state adjust).
  if (hasHydrated && !rateLimitSynced) {
    setRateLimitSynced(true);
    const stored = readStoredQuota();
    if (stored) {
      setRemainingUploads(stored.remaining);
      setRateLimitResetTime(stored.remaining === 0 ? stored.reset : null);
    }
  }

  /* ── Sync remaining quota from Redis on mount (does not consume) ── */
  useEffect(() => {
    if (!hasHydrated) return;
    let cancelled = false;

    async function syncOnMount() {
      const startedAt = quotaEpochRef.current;
      try {
        const res = await fetch("/api/ocr/quota");
        if (!res.ok || cancelled) return;
        const json = (await res.json()) as {
          success?: boolean;
          data?: { remainingUploads?: number; reset?: number };
        };
        if (cancelled || !json.success || !json.data) return;
        if (quotaEpochRef.current !== startedAt) return;
        if (isScanningRef.current) return;

        const remaining =
          typeof json.data.remainingUploads === "number"
            ? json.data.remainingUploads
            : DAILY_SCAN_LIMIT;
        applyQuota(remaining, normalizeResetMs(json.data.reset), {
          bumpEpoch: false,
        });
      } catch (e) {
        if (!cancelled) console.warn("Failed to sync scan quota:", e);
      }
    }

    syncOnMount();
    return () => {
      cancelled = true;
    };
  }, [hasHydrated, applyQuota]);

  /* ── Re-peek when a scan session ends (Redis is source of truth) ── */
  useEffect(() => {
    isScanningRef.current = isScanning;
    if (wasScanningRef.current && !isScanning && hasHydrated) {
      void syncQuotaFromServer();
    }
    wasScanningRef.current = isScanning;
  }, [isScanning, hasHydrated, syncQuotaFromServer]);

  /* ── When countdown expires: clear local block and re-peek Redis ── */
  useEffect(() => {
    if (!rateLimitResetTime) return;
    const checkExpiry = () => {
      if (Date.now() >= rateLimitResetTime) {
        setRateLimitResetTime(null);
        clearStoredQuota();
        void syncQuotaFromServer();
      }
    };
    checkExpiry();
    const interval = setInterval(checkExpiry, 5000);
    return () => clearInterval(interval);
  }, [rateLimitResetTime, syncQuotaFromServer]);

  /* ── File handling ──────────────────────────────────────────── */
  // Compression is now delegated to OCRScanner before the API call
  const handleFileSelected = (file: File) => {
    setSelectedFile(file);
    setIsScanning(true);
  };

  const handleOCRCompleted = (
    text: string,
    remaining: number,
    resetMs?: number,
  ) => {
    setIsScanning(false);
    setSelectedFile(null);
    applyQuota(remaining, normalizeResetMs(resetMs), { bumpEpoch: true });
    const parsed = parseReceipt(text);
    setItems(parsed.items);
    setTax(parsed.tax);
    setServiceCharge(parsed.serviceCharge);
    // Poin 7: tunjukkan AlertModal jika parser tidak menemukan item apapun
    if (parsed.items.length === 0) {
      setParseError(true);
    }
    // Tetap pindah ke Assign tab agar user bisa menambah item manual
    setActiveTab("assign");
  };

  /** Called by OCRScanner when server returns HTTP 429 */
  const handleRateLimited = (resetTimeMs: number) => {
    applyQuota(0, resetTimeMs, { bumpEpoch: true });
  };

  /** Called when OCR fails after a token was already consumed */
  const handleQuotaUpdate = (remaining: number, resetMs: number) => {
    applyQuota(remaining, resetMs, { bumpEpoch: true });
  };

  const handleCancel = () => {
    setIsScanning(false);
    setSelectedFile(null);
    resetStore();
    setActiveTab("scan");
    // If the rate limit has already reset, clear local block and re-peek
    if (rateLimitResetTime && Date.now() >= rateLimitResetTime) {
      setRateLimitResetTime(null);
      clearStoredQuota();
      void syncQuotaFromServer();
    }
  };

  const handleReset = () => {
    resetStore();
    setActiveTab("scan");
  };

  /* ── Totals ─────────────────────────────────────────────────── */
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const total = subtotal + tax + serviceCharge;

  /* ── Loading guard ──────────────────────────────────────────── */
  if (!hasHydrated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background text-foreground">
        <div className="text-center">
          <Activity className="mx-auto h-8 w-8 animate-spin text-primary" />
          <p className="mt-2 text-sm text-muted">Loading store...</p>
        </div>
      </div>
    );
  }

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <>
      {/* ── Parse Error Modal (0 items dari OCR) ──────────────────── */}
      <AlertModal
        open={parseError}
        onClose={() => setParseError(false)}
        title="Struk Tidak Terbaca"
        message="Parser tidak menemukan item apapun dari teks OCR. Struk mungkin buram, terpotong, atau formatnya belum didukung. Kamu bisa menambah item secara manual di tab Assign."
        variant="warning"
        closeLabel="Tambah Manual"
      />

      <div className="flex min-h-screen flex-col bg-background text-foreground">
        {/* ── Scrollable content area ── */}
        <main className="flex-1 w-full max-w-md mx-auto px-5 pt-8 pb-nav space-y-6">
          {/* ── OCR Scanning ── */}
          {isScanning && selectedFile && (
            <OCRScanner
              imageBlob={selectedFile}
              onCompleted={handleOCRCompleted}
              onCancel={handleCancel}
              onRateLimited={handleRateLimited}
              onQuotaUpdate={handleQuotaUpdate}
            />
          )}

          {/* ────────────────────────────────────────────────────────
            SCAN TAB — Upload / Home screen
        ──────────────────────────────────────────────────────── */}
          {!isScanning && activeTab === "scan" && (
            <div className="space-y-6 animate-slide-up">
              {/* App header */}
              <div className="text-center space-y-2 pt-2">
                {/* Logo mark */}
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-high border border-border mb-3 shadow-md">
                  <Receipt className="w-7 h-7 text-primary" strokeWidth={1.5} />
                </div>

                <h1 className="text-3xl font-bold font-heading text-foreground tracking-tight">
                  Bagi Bill
                </h1>
                <p className="text-sm text-muted max-w-60uto leading-relaxed">
                  Scan your receipt & split the bill fairly — all in your
                  browser.
                </p>
              </div>

              {/* File Uploader */}
              <FileUploader
                onFileSelected={handleFileSelected}
                remainingUploads={remainingUploads}
              />
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
            ASSIGN TAB — Review & Assign
        ──────────────────────────────────────────────────────── */}
          {!isScanning && activeTab === "assign" && rawText && (
            <div className="space-y-6 animate-slide-up">
              {/* ── Section: Review & Adjust Items ── */}
              <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                {/* Section header bar */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
                  <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                    <FileText className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold font-heading text-foreground">
                      Review Item Struk
                    </h2>
                    <p className="text-[11px] text-muted">
                      Pastikan nama, qty, dan harga sesuai struk
                    </p>
                  </div>
                </div>

                {/* Summary chips */}
                <div className="flex items-center gap-2 px-5 py-3 border-b border-border/30 bg-surface-high/40 overflow-x-auto scrollbar-thin">
                  <span className="px-3 py-1 text-[11px] rounded-full bg-secondary border border-border text-foreground font-semibold whitespace-nowrap shrink-0">
                    {items.length} item{items.length !== 1 ? "s" : ""}
                  </span>
                  <span className="px-3 py-1 text-[11px] rounded-full bg-primary/10 border border-primary/20 text-primary font-semibold whitespace-nowrap shrink-0 font-heading">
                    Rp {subtotal.toLocaleString("id-ID")}
                  </span>
                  {tax > 0 && (
                    <span className="px-3 py-1 text-[11px] rounded-full bg-secondary border border-border text-muted font-semibold whitespace-nowrap shrink-0">
                      Pajak Rp {tax.toLocaleString("id-ID")}
                    </span>
                  )}
                  {serviceCharge > 0 && (
                    <span className="px-3 py-1 text-[11px] rounded-full bg-secondary border border-border text-muted font-semibold whitespace-nowrap shrink-0">
                      Svc Rp {serviceCharge.toLocaleString("id-ID")}
                    </span>
                  )}
                </div>

                <div className="p-5 space-y-4">
                  {/* Item list */}
                  <div className="space-y-2.5 max-h-75 overflow-y-auto pr-1 scrollbar-thin">
                    {items.length === 0 ? (
                      <p className="text-xs text-muted text-center py-6">
                        No items parsed. Click &ldquo;+ Add Item&rdquo; below to
                        add manually.
                      </p>
                    ) : (
                      items.map((item) => (
                        <div
                          key={item.id}
                          className="bg-surface-high border border-border rounded-xl p-3 space-y-2.5 transition-all hover:border-border-active/40"
                        >
                          <input
                            type="text"
                            value={item.name}
                            onChange={(e) =>
                              updateItem(item.id, { name: e.target.value })
                            }
                            className="w-full bg-transparent font-semibold text-foreground text-sm border-b border-transparent hover:border-border/40 focus:border-primary outline-none py-0.5 transition-all"
                            placeholder="Item Name"
                          />
                          <div className="flex items-center justify-between gap-4">
                            {/* Qty stepper */}
                            <div className="flex items-center gap-1.5">
                              <button
                                type="button"
                                onClick={() =>
                                  updateItem(item.id, {
                                    qty: Math.max(1, item.qty - 1),
                                  })
                                }
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary hover:brightness-110 text-foreground transition-all active:scale-90 font-bold select-none cursor-pointer border border-border"
                              >
                                -
                              </button>
                              <input
                                type="number"
                                value={item.qty}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value, 10);
                                  updateItem(item.id, {
                                    qty: isNaN(v) ? 1 : Math.max(1, v),
                                  });
                                }}
                                className="w-10 text-center bg-input border border-border/60 text-foreground text-xs rounded-lg py-1 outline-none font-semibold"
                                min="1"
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  updateItem(item.id, { qty: item.qty + 1 })
                                }
                                className="w-7 h-7 flex items-center justify-center rounded-lg bg-secondary hover:brightness-110 text-foreground transition-all active:scale-90 font-bold select-none cursor-pointer border border-border"
                              >
                                +
                              </button>
                            </div>
                            {/* Price */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              <span className="text-xs text-muted font-mono">
                                Rp
                              </span>
                              <input
                                type="number"
                                value={item.price}
                                onChange={(e) => {
                                  const v = parseInt(e.target.value, 10);
                                  updateItem(item.id, {
                                    price: isNaN(v) ? 0 : Math.max(0, v),
                                  });
                                }}
                                className="w-24 text-right bg-input border border-border/60 text-primary text-xs rounded-lg py-1 px-1.5 outline-none font-mono font-semibold"
                                min="0"
                                placeholder="0"
                              />
                              <button
                                type="button"
                                onClick={() => deleteItem(item.id)}
                                className="p-1.5 text-muted hover:text-destructive hover:bg-destructive/10 rounded-lg transition-all cursor-pointer active:scale-90"
                                title="Delete Item"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Add Item */}
                  <button
                    onClick={() =>
                      addItem({ name: "New Item", qty: 1, price: 0 })
                    }
                    className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-surface-high text-muted hover:text-foreground text-sm font-semibold transition-all active:scale-98 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    Add Item
                  </button>

                  {/* ── Biaya Tambahan separator ── */}
                  <div className="flex items-center gap-3 pt-1">
                    <div className="flex-1 h-px bg-border/40" />
                    <span className="text-[10px] font-semibold text-muted uppercase tracking-widest whitespace-nowrap">
                      Biaya Tambahan
                    </span>
                    <div className="flex-1 h-px bg-border/40" />
                  </div>

                  {/* Tax & Service Charge cards */}
                  <div className="grid grid-cols-2 gap-3">
                    {/* Pajak */}
                    <div className="bg-surface-high border border-border rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Percent className="w-3.5 h-3.5 text-warning" />
                        <label className="text-[11px] text-muted font-semibold">
                          Pajak / Tax
                        </label>
                      </div>
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-[11px] text-muted font-mono">
                          Rp
                        </span>
                        <input
                          type="number"
                          value={tax || ""}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            setTax(isNaN(v) ? 0 : Math.max(0, v));
                          }}
                          className="w-full pl-8 pr-2 py-1.5 bg-input border border-border/60 text-foreground text-xs rounded-lg outline-none font-mono focus:border-primary/60 transition-all"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>

                    {/* Service Charge */}
                    <div className="bg-surface-high border border-border rounded-xl p-3 space-y-2">
                      <div className="flex items-center gap-1.5">
                        <Utensils className="w-3.5 h-3.5 text-info" />
                        <label className="text-[11px] text-muted font-semibold">
                          Service
                        </label>
                      </div>
                      <div className="relative flex items-center">
                        <span className="absolute left-2.5 text-[11px] text-muted font-mono">
                          Rp
                        </span>
                        <input
                          type="number"
                          value={serviceCharge || ""}
                          onChange={(e) => {
                            const v = parseInt(e.target.value, 10);
                            setServiceCharge(isNaN(v) ? 0 : Math.max(0, v));
                          }}
                          className="w-full pl-8 pr-2 py-1.5 bg-input border border-border/60 text-foreground text-xs rounded-lg outline-none font-mono focus:border-primary/60 transition-all"
                          placeholder="0"
                          min="0"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Raw OCR text */}
                  <details className="group border border-border/40 rounded-xl overflow-hidden bg-surface-high/30">
                    <summary className="flex items-center justify-between p-3 text-xs font-semibold text-muted cursor-pointer hover:bg-surface-high select-none transition-all">
                      <span>View Raw OCR Text</span>
                      <span className="transition-transform group-open:rotate-180 text-muted text-[9px]">
                        ▼
                      </span>
                    </summary>
                    <div className="p-3 border-t border-border/30 bg-input/40">
                      <pre className="text-[10px] text-muted font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-35 overflow-y-auto scrollbar-thin select-all">
                        {rawText}
                      </pre>
                    </div>
                  </details>
                </div>
              </div>

              {/* ── Section: Diner Assignment ── */}
              <div className="bg-surface border border-border rounded-2xl overflow-hidden">
                {/* Header bar */}
                <div className="flex items-center gap-3 px-5 py-4 border-b border-border/40">
                  <div className="w-9 h-9 flex items-center justify-center rounded-xl bg-primary/10 border border-primary/20 text-primary shrink-0">
                    <Users className="w-4.5 h-4.5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h2 className="text-base font-bold font-heading text-foreground">
                      Bagi ke Siapa?
                    </h2>
                    <p className="text-[11px] text-muted">
                      Ketuk nama untuk fast-assign ke item
                    </p>
                  </div>
                  {/* Diner count badge */}
                  {diners.length > 0 && (
                    <span className="px-2.5 py-1 text-[11px] rounded-full bg-secondary border border-border text-foreground font-semibold shrink-0">
                      {diners.length} Orang
                    </span>
                  )}
                </div>
                <div className="p-5">
                  <DinerSelector
                    activeDinerName={activeDinerName}
                    setActiveDinerName={setActiveDinerName}
                  />
                </div>
              </div>

              {/* ── Section: Daftar Pesanan ── */}
              <div className="space-y-3">
                {/* Section label + split rata toggle */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-2">
                    <LayoutList className="w-4 h-4 text-muted" />
                    <h3 className="text-xs font-bold text-muted uppercase tracking-wider">
                      Daftar Pesanan
                    </h3>
                  </div>
                </div>
                <div className="space-y-3 max-h-105 overflow-y-auto pr-1 scrollbar-thin">
                  {items.map((item) => (
                    <ReceiptItemRow
                      key={item.id}
                      item={item}
                      assignments={assignments[item.id] || {}}
                      onAssign={assignItem}
                      diners={diners}
                      activeDinerName={activeDinerName}
                      isExpanded={expandedItemId === item.id}
                      onToggleExpand={() =>
                        setExpandedItemId(
                          expandedItemId === item.id ? null : item.id,
                        )
                      }
                    />
                  ))}
                </div>
              </div>

              {/* Bill Summary */}
              <BillSummaryCard
                items={items}
                diners={diners}
                assignments={assignments}
                tax={tax}
                serviceCharge={serviceCharge}
                activeDinerName={activeDinerName}
              />

              {/* Footer actions */}
              <div className="flex gap-3">
                <button
                  onClick={handleReset}
                  className="flex-1 flex items-center justify-center gap-2 h-12 px-4 rounded-xl bg-secondary hover:brightness-110 text-foreground border border-border font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  <RefreshCw className="w-4 h-4" />
                  Scan Baru
                </button>
                <button
                  onClick={() => setActiveTab("settle")}
                  disabled={diners.length === 0}
                  className={`flex-1 flex items-center justify-center gap-2 h-12 px-4 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 shadow-md ${
                    diners.length === 0
                      ? "bg-primary/30 text-primary-foreground/40 cursor-not-allowed"
                      : "bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer"
                  }`}
                >
                  Lihat Rekap
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}

          {/* ────────────────────────────────────────────────────────
            SETTLE TAB — Copy recap
        ──────────────────────────────────────────────────────── */}
          {!isScanning && activeTab === "settle" && rawText && (
            <div className="space-y-6 animate-slide-up">
              <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
                <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                  <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                    <Receipt className="w-5 h-5" />
                  </div>
                  <div className="space-y-0.5">
                    <h2 className="text-lg font-bold font-heading text-foreground">
                      Settle Up
                    </h2>
                    <p className="text-xs text-muted">
                      Copy the formatted recap to share with your group
                    </p>
                  </div>
                </div>

                {/* Per-diner breakdown preview — pakai calcDinerBreakdowns (poin 4) */}
                <div className="space-y-3">
                  {calcDinerBreakdowns(
                    diners,
                    items,
                    assignments,
                    tax,
                    serviceCharge,
                  ).map((d) => (
                    <div
                      key={d.name}
                      className="flex items-center justify-between bg-surface-high border border-border rounded-xl px-4 py-3"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs font-heading">
                          {d.name.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-foreground">
                          {d.name}
                        </span>
                      </div>
                      <span className="text-sm font-bold text-primary font-heading">
                        Rp {d.total.toLocaleString("id-ID")}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Grand Total */}
                <div className="flex justify-between items-center bg-surface-lowest border border-border rounded-xl px-4 py-3">
                  <span className="text-sm font-bold text-foreground">
                    Grand Total
                  </span>
                  <span className="text-lg font-bold text-primary font-heading">
                    Rp {total.toLocaleString("id-ID")}
                  </span>
                </div>
              </div>

              {/* Action buttons */}
              <div className="flex gap-3">
                <button
                  onClick={() => setActiveTab("assign")}
                  className="flex-1 flex items-center justify-center gap-2 h-12 px-4 rounded-xl bg-secondary hover:brightness-110 text-foreground border border-border font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer"
                >
                  Back
                </button>
                {/* ShareReportButton: menggantikan inline copy logic (poin 5) */}
                <ShareReportButton
                  diners={diners}
                  items={items}
                  assignments={assignments}
                  tax={tax}
                  serviceCharge={serviceCharge}
                  className="flex-1 h-12 px-4 rounded-xl"
                />
              </div>
            </div>
          )}

          {/* Fallback: assign/settle tab active but no data yet */}
          {!isScanning && activeTab !== "scan" && !rawText && (
            <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center animate-[fade-in_0.3s_ease-out]">
              <Receipt
                className="w-12 h-12 text-muted opacity-40"
                strokeWidth={1}
              />
              <p className="text-sm text-muted">
                Scan a receipt first to get started.
              </p>
              <button
                onClick={() => setActiveTab("scan")}
                className="h-10 px-5 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer"
              >
                Go to Scan
              </button>
            </div>
          )}
        </main>

        {/* ── Fixed Bottom Nav ── */}
        {/* <BottomNav
          activeTab={activeTab}
          onTabChange={handleTabChange}
          enabledTabs={enabledTabs}
        /> */}
      </div>
    </>
  );
}
