"use client";

import { useState } from "react";
import { useReceiptStore } from "@/hooks/useReceiptStore";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { compressImage } from "@/lib/imageCompressor";
import FileUploader from "@/components/custom/FileUploader";
import OCRScanner from "@/components/custom/OCRScanner";
import { parseReceipt } from "@/lib/parser";
import {
  Activity,
  FileText,
  RefreshCw,
  ArrowRight,
  Loader2,
  Trash2,
  Plus,
  Receipt
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
    setServiceCharge
  } = useReceiptStore();
  const [selectedFile, setSelectedFile] = useState<Blob | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [step, setStep] = useState<"review" | "assign">("review");

  const handleFileSelected = async (file: File) => {
    setIsCompressing(true);
    try {
      // Compress image via offscreen Canvas
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
    
    // Parse receipt and update state
    const parsed = parseReceipt(text);
    setItems(parsed.items);
    setTax(parsed.tax);
    setServiceCharge(parsed.serviceCharge);
    setStep("review");
  };

  const handleCancel = () => {
    setIsScanning(false);
    setSelectedFile(null);
    resetStore();
    setStep("review");
  };

  const handleReset = () => {
    resetStore();
    setStep("review");
  };

  // Calculate totals
  const subtotal = items.reduce((sum, item) => sum + item.qty * item.price, 0);
  const total = subtotal + tax + serviceCharge;

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
    <div className="flex min-h-screen flex-col items-center justify-center p-4 bg-background text-foreground">
      <main className="w-full max-w-md space-y-6">
        {/* Header Title */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-extrabold font-heading text-foreground tracking-tight">
            Split Bill OCR
          </h1>
          <p className="text-sm text-foreground/60 max-w-xs mx-auto">
            Scan receipts instantly & split charges fairly using WebAssembly OCR.
          </p>
        </div>

        {/* Canvas Pre-compression Processing State */}
        {isCompressing && (
          <div className="bg-card border border-border rounded-2xl p-8 backdrop-blur-md shadow-glass text-center space-y-3">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium text-foreground font-heading">Optimizing Image...</p>
            <p className="text-xs text-foreground/50">Compressing dimensions for high-speed client-side OCR.</p>
          </div>
        )}

        {/* Upload State */}
        {!isCompressing && !isScanning && !rawText && (
          <FileUploader onFileSelected={handleFileSelected} />
        )}

        {/* OCR Processing State */}
        {!isCompressing && isScanning && selectedFile && (
          <OCRScanner
            imageBlob={selectedFile}
            onCompleted={handleOCRCompleted}
            onCancel={handleCancel}
          />
        )}

        {/* Extracted Review / Adjust Items State */}
        {!isCompressing && !isScanning && rawText && step === "review" && (
          <div className="bg-card border border-border rounded-2xl p-6 backdrop-blur-md shadow-glass space-y-6">
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold font-heading text-foreground">
                  Review & Adjust Items
                </h2>
                <p className="text-xs text-foreground/50">
                  Ensure names, quantities, and prices match your receipt
                </p>
              </div>
            </div>

            {/* List of Item Cards */}
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 scrollbar-thin">
              {items.length === 0 ? (
                <p className="text-xs text-foreground/50 text-center py-6">
                  No items parsed. Click "+ Add Item" below to add manually.
                </p>
              ) : (
                items.map((item) => (
                  <div
                    key={item.id}
                    className="bg-secondary/20 border border-border/50 rounded-xl p-3 space-y-2.5 transition-all hover:border-border/80"
                  >
                    {/* Item Name Input */}
                    <input
                      type="text"
                      value={item.name}
                      onChange={(e) => updateItem(item.id, { name: e.target.value })}
                      className="w-full bg-transparent font-medium text-foreground text-sm border-b border-transparent hover:border-border/30 focus:border-primary outline-none py-0.5 transition-all"
                      placeholder="Item Name"
                    />

                    <div className="flex items-center justify-between gap-4">
                      {/* Quantity Stepper */}
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { qty: Math.max(1, item.qty - 1) })}
                          className="w-7 h-7 flex items-center justify-center rounded bg-secondary hover:brightness-110 text-foreground transition-all active:scale-90 font-bold select-none cursor-pointer"
                        >
                          -
                        </button>
                        <input
                          type="number"
                          value={item.qty}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            updateItem(item.id, { qty: isNaN(val) ? 1 : Math.max(1, val) });
                          }}
                          className="w-10 text-center bg-input border border-border/60 text-foreground text-xs rounded py-1 outline-none font-semibold"
                          min="1"
                        />
                        <button
                          type="button"
                          onClick={() => updateItem(item.id, { qty: item.qty + 1 })}
                          className="w-7 h-7 flex items-center justify-center rounded bg-secondary hover:brightness-110 text-foreground transition-all active:scale-90 font-bold select-none cursor-pointer"
                        >
                          +
                        </button>
                      </div>

                      {/* Unit Price Input */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="text-xs text-foreground/40 font-medium">Rp</span>
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => {
                            const val = parseInt(e.target.value, 10);
                            updateItem(item.id, { price: isNaN(val) ? 0 : Math.max(0, val) });
                          }}
                          className="w-20 text-right bg-input border border-border/60 text-foreground text-xs rounded py-1 px-1.5 outline-none font-mono"
                          min="0"
                          placeholder="Price"
                        />
                        <button
                          type="button"
                          onClick={() => deleteItem(item.id)}
                          className="p-1.5 text-foreground/40 hover:text-destructive hover:bg-destructive/10 rounded transition-all cursor-pointer active:scale-90"
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

            {/* Add Item Button */}
            <button
              onClick={() => addItem({ name: "New Item", qty: 1, price: 0 })}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-dashed border-border hover:bg-secondary/40 text-foreground/70 hover:text-foreground text-sm font-semibold transition-all active:scale-98 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Add Item
            </button>

            {/* Tax & Service Row */}
            <div className="grid grid-cols-2 gap-4 border-t border-border/40 pt-4">
              <div className="space-y-1.5">
                <label className="text-xs text-foreground/60 font-medium">Tax / Pajak (Rp)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs text-foreground/40 font-mono">Rp</span>
                  <input
                    type="number"
                    value={tax || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setTax(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    className="w-full pl-8 pr-2 py-2 bg-input border border-border/60 text-foreground text-xs rounded-lg outline-none font-mono focus:border-primary/60"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <label className="text-xs text-foreground/60 font-medium">Service Charge (Rp)</label>
                <div className="relative flex items-center">
                  <span className="absolute left-3 text-xs text-foreground/40 font-mono">Rp</span>
                  <input
                    type="number"
                    value={serviceCharge || ""}
                    onChange={(e) => {
                      const val = parseInt(e.target.value, 10);
                      setServiceCharge(isNaN(val) ? 0 : Math.max(0, val));
                    }}
                    className="w-full pl-8 pr-2 py-2 bg-input border border-border/60 text-foreground text-xs rounded-lg outline-none font-mono focus:border-primary/60"
                    placeholder="0"
                    min="0"
                  />
                </div>
              </div>
            </div>

            {/* Dynamic Receipt Totals Calculation Summary */}
            <div className="bg-secondary/10 border border-border/30 rounded-xl p-4 space-y-2 font-medium text-xs">
              <div className="flex justify-between text-foreground/60">
                <span>Subtotal</span>
                <span>Rp {subtotal.toLocaleString("id-ID")}</span>
              </div>
              {tax > 0 && (
                <div className="flex justify-between text-foreground/60">
                  <span>Tax (Pajak)</span>
                  <span>Rp {tax.toLocaleString("id-ID")}</span>
                </div>
              )}
              {serviceCharge > 0 && (
                <div className="flex justify-between text-foreground/60">
                  <span>Service Charge</span>
                  <span>Rp {serviceCharge.toLocaleString("id-ID")}</span>
                </div>
              )}
              <div className="flex justify-between font-bold text-foreground border-t border-border/40 pt-2 mt-1">
                <span>Total Tagihan</span>
                <span className="text-primary">Rp {total.toLocaleString("id-ID")}</span>
              </div>
            </div>

            {/* Collapsible raw text helper */}
            <details className="group border border-border/40 rounded-xl overflow-hidden bg-secondary/10">
              <summary className="flex items-center justify-between p-3 text-xs font-semibold text-foreground/75 cursor-pointer hover:bg-secondary/20 select-none transition-all">
                <span>View Raw OCR Text</span>
                <span className="transition-transform group-open:rotate-180 text-foreground/40 text-[9px]">▼</span>
              </summary>
              <div className="p-3 border-t border-border/30 bg-input/40">
                <pre className="text-[10px] text-foreground/60 font-mono overflow-x-auto whitespace-pre-wrap leading-relaxed max-h-[140px] overflow-y-auto scrollbar-thin select-all">
                  {rawText}
                </pre>
              </div>
            </details>

            {/* Actions Footer */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleReset}
                className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-secondary hover:brightness-110 text-foreground border border-border font-semibold text-sm transition-all active:scale-98 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Scan New
              </button>

              <button
                onClick={() => setStep("assign")}
                className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-all active:scale-98 cursor-pointer shadow-md"
              >
                Next: Assign Diners
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* Placeholder for Milestone 4 (Diner Assignment & Splits) */}
        {!isCompressing && !isScanning && rawText && step === "assign" && (
          <div className="bg-card border border-border rounded-2xl p-6 backdrop-blur-md shadow-glass space-y-6">
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="p-2 rounded-lg bg-success/10 border border-success/20 text-success">
                <Receipt className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold font-heading text-foreground">
                  Receipt Items Locked
                </h2>
                <p className="text-xs text-foreground/50">
                  Ready to assign to diners in Milestone 4
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <p className="text-xs text-foreground/70">
                Here are the parsed and adjusted items that will be loaded into the Diner Assignment dashboard:
              </p>

              <div className="max-h-[220px] overflow-y-auto space-y-2 pr-1 scrollbar-thin">
                {items.map((item) => (
                  <div
                    key={item.id}
                    className="flex justify-between items-center text-xs p-2.5 rounded-lg bg-secondary/20 border border-border/30"
                  >
                    <div>
                      <span className="font-semibold text-foreground">{item.name}</span>
                      <span className="text-foreground/40 ml-1.5">x{item.qty}</span>
                    </div>
                    <span className="font-mono text-foreground/80">
                      Rp {(item.qty * item.price).toLocaleString("id-ID")}
                    </span>
                  </div>
                ))}
              </div>

              <div className="bg-secondary/10 border border-border/30 rounded-xl p-3 space-y-1.5 text-xs">
                <div className="flex justify-between text-foreground/60">
                  <span>Subtotal</span>
                  <span>Rp {subtotal.toLocaleString("id-ID")}</span>
                </div>
                {tax > 0 && (
                  <div className="flex justify-between text-foreground/60">
                    <span>Tax (Pajak)</span>
                    <span>Rp {tax.toLocaleString("id-ID")}</span>
                  </div>
                )}
                {serviceCharge > 0 && (
                  <div className="flex justify-between text-foreground/60">
                    <span>Service Charge</span>
                    <span>Rp {serviceCharge.toLocaleString("id-ID")}</span>
                  </div>
                )}
                <div className="flex justify-between font-bold text-foreground border-t border-border/40 pt-1.5 mt-1">
                  <span>Total Tagihan</span>
                  <span className="text-success">Rp {total.toLocaleString("id-ID")}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={() => setStep("review")}
                className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-secondary hover:brightness-110 text-foreground border border-border font-semibold text-sm transition-all active:scale-98 cursor-pointer"
              >
                Back to Review
              </button>

              <button
                onClick={() => alert("Milestone 4 (Diner Assignment & Splits UI) is pending implementation.")}
                className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-all active:scale-98 cursor-pointer shadow-md"
              >
                Start Splitting
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

