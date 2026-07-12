"use client";

import { useState } from "react";
import { useReceiptStore } from "@/hooks/useReceiptStore";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { compressImage } from "@/lib/imageCompressor";
import FileUploader from "@/components/custom/FileUploader";
import OCRScanner from "@/components/custom/OCRScanner";
import DinerSelector from "@/components/custom/DinerSelector";
import ReceiptItemRow from "@/components/custom/ReceiptItemRow";
import BillSummaryCard from "@/components/custom/BillSummaryCard";
import BottomNav, { NavTab } from "@/components/custom/BottomNav";
import { parseReceipt } from "@/lib/parser";
import {
  Activity,
  FileText,
  RefreshCw,
  ArrowRight,
  Loader2,
  Trash2,
  Plus,
  Users,
  Copy,
  Check,
  Receipt,
} from "lucide-react";

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

  const [selectedFile, setSelectedFile]     = useState<Blob | null>(null);
  const [isCompressing, setIsCompressing]   = useState(false);
  const [isScanning, setIsScanning]         = useState(false);
  const [activeTab, setActiveTab]           = useState<NavTab>("scan");
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [activeDinerName, setActiveDinerName] = useState<string | null>(null);
  const [copySuccess, setCopySuccess]       = useState(false);

  /* ── Derived nav state ──────────────────────────────────────── */
  // Which tabs are reachable right now
  const hasItems = items.length > 0 && rawText;
  const enabledTabs: NavTab[] = hasItems
    ? ["scan", "assign", "settle"]
    : ["scan"];

  /* ── File handling ──────────────────────────────────────────── */
  const handleFileSelected = async (file: File) => {
    setIsCompressing(true);
    try {
      const compressedBlob = await compressImage(file);
      setSelectedFile(compressedBlob);
      setIsScanning(true);
    } catch (err) {
      console.error("Compression failed, falling back to raw file:", err);
      setSelectedFile(file);
      setIsScanning(true);
    } finally {
      setIsCompressing(false);
    }
  };

  const handleOCRCompleted = (text: string) => {
    setIsScanning(false);
    setSelectedFile(null);
    const parsed = parseReceipt(text);
    setItems(parsed.items);
    setTax(parsed.tax);
    setServiceCharge(parsed.serviceCharge);
    // Automatically move user to Assign tab after scan
    setActiveTab("assign");
  };

  const handleCancel = () => {
    setIsScanning(false);
    setSelectedFile(null);
    resetStore();
    setActiveTab("scan");
  };

  const handleReset = () => {
    resetStore();
    setActiveTab("scan");
  };

  /* ── Copy recap ─────────────────────────────────────────────── */
  const handleCopyRecap = () => {
    const overallSubtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
    const grandTotal = overallSubtotal + tax + serviceCharge;

    let text = `🧾 *Split Bill: Struk Belanja*\n`;
    text += `-------------------------\n`;

    diners.forEach((dinerName) => {
      let dinerSubtotal = 0;
      const dinerItems: string[] = [];

      items.forEach((item) => {
        const assignedQty = (assignments[item.id] || {})[dinerName] || 0;
        if (assignedQty > 0) {
          const shareCost = assignedQty * item.price;
          dinerSubtotal += shareCost;
          dinerItems.push(`- ${item.name} (x${assignedQty}): Rp ${shareCost.toLocaleString("id-ID")}`);
        }
      });

      const dinerTax           = overallSubtotal > 0 ? (dinerSubtotal / overallSubtotal) * tax : 0;
      const dinerServiceCharge = overallSubtotal > 0 ? (dinerSubtotal / overallSubtotal) * serviceCharge : 0;
      const dinerTotal         = Math.round(dinerSubtotal + dinerTax + dinerServiceCharge);

      if (dinerSubtotal > 0) {
        text += `👤 *${dinerName}*: Rp ${dinerTotal.toLocaleString("id-ID")}\n`;
        dinerItems.forEach((d) => { text += `${d}\n`; });
        if (dinerTax > 0 || dinerServiceCharge > 0) {
          text += `- Pajak & Layanan: Rp ${Math.round(dinerTax + dinerServiceCharge).toLocaleString("id-ID")}\n`;
        }
        text += `-------------------------\n`;
      }
    });

    text += `Total Tagihan: Rp ${grandTotal.toLocaleString("id-ID")}`;
    navigator.clipboard.writeText(text).then(() => {
      setCopySuccess(true);
      setTimeout(() => setCopySuccess(false), 2000);
    });
  };

  /* ── Totals ─────────────────────────────────────────────────── */
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const total    = subtotal + tax + serviceCharge;

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

  /* ── Tab: handle nav change ─────────────────────────────────── */
  const handleTabChange = (tab: NavTab) => {
    if (!enabledTabs.includes(tab)) return;
    setActiveTab(tab);
  };

  /* ============================================================
     RENDER
  ============================================================ */
  return (
    <div className="flex min-h-screen flex-col bg-background text-foreground">

      {/* ── Scrollable content area ── */}
      <main className="flex-1 w-full max-w-md mx-auto px-5 pt-8 pb-nav space-y-6">

        {/* ── Canvas pre-compression ── */}
        {isCompressing && (
          <div className="bg-surface border border-border rounded-2xl p-8 text-center space-y-3 animate-[fade-in_0.3s_ease-out]">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground font-heading">Optimizing Image...</p>
            <p className="text-xs text-muted">Compressing for high-speed client-side OCR.</p>
          </div>
        )}

        {/* ── OCR Scanning ── */}
        {!isCompressing && isScanning && selectedFile && (
          <OCRScanner
            imageBlob={selectedFile}
            onCompleted={handleOCRCompleted}
            onCancel={handleCancel}
          />
        )}

        {/* ────────────────────────────────────────────────────────
            SCAN TAB — Upload / Home screen
        ──────────────────────────────────────────────────────── */}
        {!isCompressing && !isScanning && activeTab === "scan" && (
          <div className="space-y-6 animate-[slide-up_0.3s_ease-out]">

            {/* App header */}
            <div className="text-center space-y-2 pt-2">
              {/* Logo mark */}
              <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-surface-high border border-border mb-3 shadow-md">
                <Receipt className="w-7 h-7 text-primary" strokeWidth={1.5} />
              </div>

              <h1 className="text-3xl font-bold font-heading text-foreground tracking-tight">
                Aura Split
              </h1>
              <p className="text-sm text-muted max-w-[240px] mx-auto leading-relaxed">
                Scan your receipt & split the bill fairly — all in your browser.
              </p>
            </div>

            {/* File Uploader */}
            <FileUploader onFileSelected={handleFileSelected} />

            {/* If items already exist (resumed from localStorage), show a quick-resume nudge */}
            {rawText && items.length > 0 && (
              <button
                onClick={() => setActiveTab("assign")}
                className="w-full flex items-center justify-center gap-2 h-12 px-4 rounded-xl border border-primary/40 bg-primary/5 hover:bg-primary/10 text-primary font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <ArrowRight className="w-4 h-4" />
                Resume last session ({items.length} items)
              </button>
            )}
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            ASSIGN TAB — Review & Assign
        ──────────────────────────────────────────────────────── */}
        {!isCompressing && !isScanning && activeTab === "assign" && rawText && (
          <div className="space-y-6 animate-[slide-up_0.3s_ease-out]">

            {/* ── Section: Review & Adjust Items ── */}
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                  <FileText className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-lg font-bold font-heading text-foreground">Review & Adjust Items</h2>
                  <p className="text-xs text-muted">Ensure names, quantities, and prices match your receipt</p>
                </div>
              </div>

              {/* Item list */}
              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
                {items.length === 0 ? (
                  <p className="text-xs text-muted text-center py-6">
                    No items parsed. Click &ldquo;+ Add Item&rdquo; below to add manually.
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
                        onChange={(e) => updateItem(item.id, { name: e.target.value })}
                        className="w-full bg-transparent font-medium text-foreground text-sm border-b border-transparent hover:border-border/30 focus:border-primary outline-none py-0.5 transition-all"
                        placeholder="Item Name"
                      />
                      <div className="flex items-center justify-between gap-4">
                        {/* Qty stepper */}
                        <div className="flex items-center gap-1.5">
                          <button type="button" onClick={() => updateItem(item.id, { qty: Math.max(1, item.qty - 1) })}
                            className="w-7 h-7 flex items-center justify-center rounded bg-secondary hover:brightness-110 text-foreground transition-all active:scale-90 font-bold select-none cursor-pointer">
                            -
                          </button>
                          <input type="number" value={item.qty}
                            onChange={(e) => { const v = parseInt(e.target.value, 10); updateItem(item.id, { qty: isNaN(v) ? 1 : Math.max(1, v) }); }}
                            className="w-10 text-center bg-input border border-border/60 text-foreground text-xs rounded py-1 outline-none font-semibold"
                            min="1"
                          />
                          <button type="button" onClick={() => updateItem(item.id, { qty: item.qty + 1 })}
                            className="w-7 h-7 flex items-center justify-center rounded bg-secondary hover:brightness-110 text-foreground transition-all active:scale-90 font-bold select-none cursor-pointer">
                            +
                          </button>
                        </div>
                        {/* Price */}
                        <div className="flex items-center gap-1.5 shrink-0">
                          <span className="text-xs text-muted font-medium">Rp</span>
                          <input type="number" value={item.price}
                            onChange={(e) => { const v = parseInt(e.target.value, 10); updateItem(item.id, { price: isNaN(v) ? 0 : Math.max(0, v) }); }}
                            className="w-20 text-right bg-input border border-border/60 text-foreground text-xs rounded py-1 px-1.5 outline-none font-mono"
                            min="0" placeholder="Price"
                          />
                          <button type="button" onClick={() => deleteItem(item.id)}
                            className="p-1.5 text-muted hover:text-destructive hover:bg-destructive/10 rounded transition-all cursor-pointer active:scale-90"
                            title="Delete Item">
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
                onClick={() => addItem({ name: "New Item", qty: 1, price: 0 })}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-border hover:border-primary/40 hover:bg-surface-high text-muted hover:text-foreground text-sm font-semibold transition-all active:scale-98 cursor-pointer"
              >
                <Plus className="w-4 h-4" />
                Add Item
              </button>

              {/* Tax & Service */}
              <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-4">
                <div className="space-y-1.5">
                  <label className="text-xs text-muted font-medium">Tax / Pajak (Rp)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs text-muted font-mono">Rp</span>
                    <input type="number" value={tax || ""}
                      onChange={(e) => { const v = parseInt(e.target.value, 10); setTax(isNaN(v) ? 0 : Math.max(0, v)); }}
                      className="w-full pl-8 pr-2 py-2 bg-input border border-border/60 text-foreground text-xs rounded-lg outline-none font-mono focus:border-primary/60"
                      placeholder="0" min="0"
                    />
                  </div>
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs text-muted font-medium">Service Charge (Rp)</label>
                  <div className="relative flex items-center">
                    <span className="absolute left-3 text-xs text-muted font-mono">Rp</span>
                    <input type="number" value={serviceCharge || ""}
                      onChange={(e) => { const v = parseInt(e.target.value, 10); setServiceCharge(isNaN(v) ? 0 : Math.max(0, v)); }}
                      className="w-full pl-8 pr-2 py-2 bg-input border border-border/60 text-foreground text-xs rounded-lg outline-none font-mono focus:border-primary/60"
                      placeholder="0" min="0"
                    />
                  </div>
                </div>
              </div>

              {/* Totals summary */}
              <div className="bg-surface-lowest border border-border/30 rounded-xl p-4 space-y-2 font-medium text-xs">
                <div className="flex justify-between text-muted"><span>Subtotal</span><span>Rp {subtotal.toLocaleString("id-ID")}</span></div>
                {tax > 0 && <div className="flex justify-between text-muted"><span>Tax (Pajak)</span><span>Rp {tax.toLocaleString("id-ID")}</span></div>}
                {serviceCharge > 0 && <div className="flex justify-between text-muted"><span>Service Charge</span><span>Rp {serviceCharge.toLocaleString("id-ID")}</span></div>}
                <div className="flex justify-between font-bold text-foreground border-t border-border/40 pt-2 mt-1">
                  <span>Total Tagihan</span>
                  <span className="text-primary">Rp {total.toLocaleString("id-ID")}</span>
                </div>
              </div>

              {/* Raw OCR text */}
              <details className="group border border-border/40 rounded-xl overflow-hidden bg-surface-high/30">
                <summary className="flex items-center justify-between p-3 text-xs font-semibold text-muted cursor-pointer hover:bg-surface-high select-none transition-all">
                  <span>View Raw OCR Text</span>
                  <span className="transition-transform group-open:rotate-180 text-muted text-[9px]">▼</span>
                </summary>
                <div className="p-3 border-t border-border/30 bg-input/40">
                  <pre className="text-[10px] text-muted font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[140px] overflow-y-auto scrollbar-thin select-all">{rawText}</pre>
                </div>
              </details>
            </div>

            {/* ── Section: Diner Assignment ── */}
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-4">
              <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                  <Users className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-lg font-bold font-heading text-foreground">Assign Diners</h2>
                  <p className="text-xs text-muted">Allocate items to diners to calculate shares</p>
                </div>
              </div>
              <DinerSelector
                activeDinerName={activeDinerName}
                setActiveDinerName={setActiveDinerName}
              />
            </div>

            {/* Receipt Items */}
            <div className="space-y-3">
              <h3 className="text-xs font-bold text-muted uppercase tracking-wider px-1">Receipt Items</h3>
              <div className="space-y-3 max-h-[380px] overflow-y-auto pr-1 scrollbar-thin">
                {items.map((item) => (
                  <ReceiptItemRow
                    key={item.id}
                    item={item}
                    assignments={assignments[item.id] || {}}
                    onAssign={assignItem}
                    diners={diners}
                    activeDinerName={activeDinerName}
                    isExpanded={expandedItemId === item.id}
                    onToggleExpand={() => setExpandedItemId(expandedItemId === item.id ? null : item.id)}
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
            />

            {/* Footer actions */}
            <div className="flex gap-3">
              <button
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-2 h-12 px-4 rounded-xl bg-secondary hover:brightness-110 text-foreground border border-border font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Scan New
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
                Settle Up
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* ────────────────────────────────────────────────────────
            SETTLE TAB — Copy recap
        ──────────────────────────────────────────────────────── */}
        {!isCompressing && !isScanning && activeTab === "settle" && rawText && (
          <div className="space-y-6 animate-[slide-up_0.3s_ease-out]">
            <div className="bg-surface border border-border rounded-2xl p-6 space-y-5">
              <div className="flex items-center gap-3 border-b border-border/40 pb-4">
                <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                  <Receipt className="w-5 h-5" />
                </div>
                <div className="space-y-0.5">
                  <h2 className="text-lg font-bold font-heading text-foreground">Settle Up</h2>
                  <p className="text-xs text-muted">Copy the formatted recap to share with your group</p>
                </div>
              </div>

              {/* Per-diner breakdown preview */}
              <div className="space-y-3">
                {diners.map((dinerName) => {
                  let dinerSubtotal = 0;
                  items.forEach((item) => {
                    const qty = (assignments[item.id] || {})[dinerName] || 0;
                    dinerSubtotal += qty * item.price;
                  });
                  const dinerTax   = subtotal > 0 ? (dinerSubtotal / subtotal) * tax : 0;
                  const dinerSvc   = subtotal > 0 ? (dinerSubtotal / subtotal) * serviceCharge : 0;
                  const dinerTotal = Math.round(dinerSubtotal + dinerTax + dinerSvc);

                  return (
                    <div key={dinerName} className="flex items-center justify-between bg-surface-high border border-border rounded-xl px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-full bg-primary/15 border border-primary/30 flex items-center justify-center text-primary font-bold text-xs font-heading">
                          {dinerName.charAt(0).toUpperCase()}
                        </div>
                        <span className="text-sm font-semibold text-foreground">{dinerName}</span>
                      </div>
                      <span className="text-sm font-bold text-primary font-heading">
                        Rp {dinerTotal.toLocaleString("id-ID")}
                      </span>
                    </div>
                  );
                })}
              </div>

              {/* Grand Total */}
              <div className="flex justify-between items-center bg-surface-lowest border border-border rounded-xl px-4 py-3">
                <span className="text-sm font-bold text-foreground">Grand Total</span>
                <span className="text-lg font-bold text-primary font-heading">Rp {total.toLocaleString("id-ID")}</span>
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
              <button
                onClick={handleCopyRecap}
                disabled={diners.length === 0}
                className={`flex-1 flex items-center justify-center gap-2 h-12 px-4 rounded-xl font-semibold text-sm transition-all duration-200 active:scale-95 shadow-md ${
                  diners.length === 0
                    ? "bg-primary/30 text-primary-foreground/40 cursor-not-allowed"
                    : "bg-primary hover:bg-primary-hover text-primary-foreground cursor-pointer"
                }`}
              >
                {copySuccess ? (
                  <><Check className="w-4 h-4 text-success" />Copied!</>
                ) : (
                  <><Copy className="w-4 h-4" />Copy Recap</>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Fallback: assign/settle tab active but no data yet */}
        {!isCompressing && !isScanning && activeTab !== "scan" && !rawText && (
          <div className="flex flex-col items-center justify-center py-20 space-y-4 text-center animate-[fade-in_0.3s_ease-out]">
            <Receipt className="w-12 h-12 text-muted opacity-40" strokeWidth={1} />
            <p className="text-sm text-muted">Scan a receipt first to get started.</p>
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
      <BottomNav
        activeTab={activeTab}
        onTabChange={handleTabChange}
        enabledTabs={enabledTabs}
      />
    </div>
  );
}
