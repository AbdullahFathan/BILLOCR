"use client";

import React, { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import { Loader2, AlertCircle, RefreshCw } from "lucide-react";
import { useReceiptStore } from "@/hooks/useReceiptStore";

interface OCRScannerProps {
  imageBlob: Blob;
  onCompleted: (rawText: string) => void;
  onCancel: () => void;
}

export default function OCRScanner({ imageBlob, onCompleted, onCancel }: OCRScannerProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing...");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const setRawText = useReceiptStore((state) => state.setRawText);
  const processingRef = useRef(false);

  // Generate object URL for image preview
  useEffect(() => {
    const url = URL.createObjectURL(imageBlob);
    setImageUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageBlob]);

  // Run Tesseract OCR processing
  useEffect(() => {
    if (processingRef.current || !imageUrl) return;
    processingRef.current = true;
    setError(null);

    let worker: any = null;

    async function runOCR() {
      try {
        setStatus("Creating OCR worker...");
        setProgress(5);

        // Create the worker with ind (Indonesian) and eng (English)
        worker = await createWorker("ind+eng", 1, {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setStatus("Extracting receipt items...");
              // recognizes progress from 0 to 1 -> map to 20% to 100%
              setProgress(Math.round(20 + m.progress * 80));
            } else if (m.status === "loading tesseract core") {
              setStatus("Loading OCR core engine...");
              setProgress(10);
            } else if (m.status === "initializing api") {
              setStatus("Initializing language pack...");
              setProgress(15);
            } else {
              setStatus(`${m.status.charAt(0).toUpperCase() + m.status.slice(1)}...`);
            }
          },
        });

        setStatus("Reading text data...");
        const { data: { text } } = await worker.recognize(imageUrl);

        if (!text || text.trim() === "") {
          throw new Error("No readable text could be extracted from the receipt. Please try another photo.");
        }

        // Save raw text to Zustand store
        setRawText(text);
        
        // Notify parent completion
        onCompleted(text);
      } catch (err: any) {
        console.error("OCR Error:", err);
        setError(err.message || "An unexpected error occurred during receipt scanning.");
      } finally {
        if (worker) {
          try {
            await worker.terminate();
          } catch (termErr) {
            console.error("Failed to terminate worker:", termErr);
          }
        }
        processingRef.current = false;
      }
    }

    runOCR();
  }, [imageUrl, imageBlob, onCompleted, setRawText]);

  // Handle manual retry
  const handleRetry = () => {
    // Force re-run by toggling a small state if needed, or by resetting error and allowing useEffect to re-trigger
    // Since processingRef is false, and we reset the error state, we can re-invoke
    setError(null);
    processingRef.current = false;
    setImageUrl((prev) => {
      // Re-trigger useEffect by setting same or new URL
      const url = URL.createObjectURL(imageBlob);
      return url;
    });
  };

  return (
    <div className="w-full max-w-md mx-auto bg-card border border-border rounded-2xl p-6 backdrop-blur-md shadow-glass space-y-6">
      <div className="text-center space-y-1">
        <h2 className="text-xl font-bold font-heading text-foreground">
          Scanning Receipt
        </h2>
        <p className="text-xs text-foreground/50">
          Powered by client-side WebAssembly OCR
        </p>
      </div>

      {imageUrl && (
        <div className="relative overflow-hidden rounded-xl border border-border/50 max-h-[260px] flex items-center justify-center bg-black/40 p-2">
          {/* Receipt Image Preview */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Receipt preview"
            className="max-h-[240px] w-auto object-contain opacity-70 blur-[1px] transition-all"
          />

          {/* Glassmorphic overlay and animated scan beam (only if not in error state) */}
          {!error && (
            <>
              <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
              <div className="absolute left-0 w-full h-0.5 bg-primary shadow-[0_0_12px_var(--color-primary)] animate-scan pointer-events-none" />
            </>
          )}
        </div>
      )}

      {error ? (
        <div className="space-y-4">
          <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10 text-destructive text-sm leading-relaxed">
            <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold">Extraction Failed</p>
              <p className="text-xs text-destructive-foreground/90 mt-1">{error}</p>
            </div>
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleRetry}
              className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-all active:scale-98 cursor-pointer"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={onCancel}
              className="flex-1 flex items-center justify-center h-11 px-4 rounded-lg bg-secondary hover:brightness-110 text-foreground border border-border font-semibold text-sm transition-all active:scale-98 cursor-pointer"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center text-xs">
              <span className="text-foreground/70 font-medium flex items-center gap-2">
                <Loader2 className="w-3.5 h-3.5 animate-spin text-primary" />
                {status}
              </span>
              <span className="text-foreground/90 font-bold font-heading">{progress}%</span>
            </div>
            {/* Progress bar track */}
            <div className="w-full h-2.5 bg-secondary rounded-full overflow-hidden border border-border/30">
              <div
                className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <button
            onClick={onCancel}
            className="w-full flex items-center justify-center h-11 px-4 rounded-lg bg-secondary hover:brightness-110 text-foreground border border-border font-semibold text-sm transition-all active:scale-98 cursor-pointer"
          >
            Cancel
          </button>
        </div>
      )}
    </div>
  );
}
