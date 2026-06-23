"use client";

import { useState } from "react";
import { useReceiptStore } from "@/hooks/useReceiptStore";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { compressImage } from "@/lib/imageCompressor";
import FileUploader from "@/components/custom/FileUploader";
import OCRScanner from "@/components/custom/OCRScanner";
import { Activity, FileText, RefreshCw, ArrowRight, Loader2 } from "lucide-react";

export default function Home() {
  const hasHydrated = useHasHydrated();
  const { rawText, resetStore } = useReceiptStore();
  const [selectedFile, setSelectedFile] = useState<Blob | null>(null);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

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
  };

  const handleCancel = () => {
    setIsScanning(false);
    setSelectedFile(null);
    resetStore();
  };

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

        {/* Extracted Raw Output State */}
        {!isCompressing && !isScanning && rawText && (
          <div className="bg-card border border-border rounded-2xl p-6 backdrop-blur-md shadow-glass space-y-6">
            <div className="flex items-center gap-3 border-b border-border/40 pb-4">
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20 text-primary">
                <FileText className="w-5 h-5" />
              </div>
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold font-heading text-foreground">
                  OCR Text Extracted
                </h2>
                <p className="text-xs text-foreground/50">
                  Raw receipt text stored in device memory
                </p>
              </div>
            </div>

            <div className="relative">
              <pre className="w-full max-h-[220px] overflow-y-auto p-4 rounded-xl bg-input border border-border text-[11px] text-foreground/80 leading-relaxed font-mono whitespace-pre-wrap scrollbar-thin select-all">
                {rawText}
              </pre>
              <div className="absolute bottom-2 right-2 px-2 py-0.5 text-[9px] rounded bg-secondary/90 border border-border text-foreground/60 select-none">
                Scroll to view
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <button
                onClick={resetStore}
                className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-secondary hover:brightness-110 text-foreground border border-border font-semibold text-sm transition-all active:scale-98 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Scan New
              </button>
              
              <button
                onClick={() => alert("Milestone 3 parser engine will parse this text next!")}
                className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-all active:scale-98 cursor-pointer shadow-md"
              >
                Next: Parse Items
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

