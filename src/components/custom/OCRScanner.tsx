"use client";

import React, { useEffect, useRef, useState } from "react";
import { createWorker } from "tesseract.js";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  ScanLine,
  Cpu,
  X,
} from "lucide-react";
import { useReceiptStore } from "@/hooks/useReceiptStore";

interface OCRScannerProps {
  imageBlob: Blob;
  onCompleted: (rawText: string) => void;
  onCancel: () => void;
}

/* ─── Progress step labels ────────────────────────────── */
const STEPS = [
  { threshold: 0,  label: "Initializing engine" },
  { threshold: 10, label: "Loading OCR core"     },
  { threshold: 15, label: "Setting up language"  },
  { threshold: 20, label: "Reading text data"    },
  { threshold: 60, label: "Extracting items"     },
  { threshold: 90, label: "Finalizing"           },
];

function getStep(progress: number) {
  let current = STEPS[0];
  for (const step of STEPS) {
    if (progress >= step.threshold) current = step;
  }
  return current;
}

export default function OCRScanner({
  imageBlob,
  onCompleted,
  onCancel,
}: OCRScannerProps) {
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState("Initializing...");
  const [imageUrl, setImageUrl] = useState<string>("");
  const [error, setError] = useState<string | null>(null);
  const setRawText = useReceiptStore((state) => state.setRawText);
  const processingRef = useRef(false);

  /* ── Generate object URL for image preview ───────────── */
  useEffect(() => {
    const url = URL.createObjectURL(imageBlob);
    setImageUrl(url);
    return () => {
      URL.revokeObjectURL(url);
    };
  }, [imageBlob]);

  /* ── Run Tesseract OCR processing ────────────────────── */
  useEffect(() => {
    if (processingRef.current || !imageUrl) return;
    processingRef.current = true;
    setError(null);

    let worker: any = null;

    async function runOCR() {
      try {
        setStatus("Creating OCR worker...");
        setProgress(5);

        worker = await createWorker("ind+eng", 1, {
          logger: (m) => {
            if (m.status === "recognizing text") {
              setStatus("Extracting receipt items...");
              setProgress(Math.round(20 + m.progress * 80));
            } else if (m.status === "loading tesseract core") {
              setStatus("Loading OCR core engine...");
              setProgress(10);
            } else if (m.status === "initializing api") {
              setStatus("Initializing language pack...");
              setProgress(15);
            } else {
              setStatus(
                `${m.status.charAt(0).toUpperCase() + m.status.slice(1)}...`
              );
            }
          },
        });

        setStatus("Reading text data...");
        const {
          data: { text },
        } = await worker.recognize(imageUrl);

        if (!text || text.trim() === "") {
          throw new Error(
            "No readable text could be extracted from the receipt. Please try another photo."
          );
        }

        setRawText(text);
        onCompleted(text);
      } catch (err: any) {
        console.error("OCR Error:", err);
        setError(
          err.message || "An unexpected error occurred during receipt scanning."
        );
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

  /* ── Handle manual retry ─────────────────────────────── */
  const handleRetry = () => {
    setError(null);
    processingRef.current = false;
    setImageUrl(() => URL.createObjectURL(imageBlob));
  };

  const currentStep = getStep(progress);

  return (
    <div className="w-full max-w-md mx-auto space-y-4 animate-[fade-in_0.25s_ease-out]">

      {/* ── Header card ───────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
        {/* Icon container */}
        <div className="w-12 h-12 rounded-xl bg-surface-high border border-border flex items-center justify-center shrink-0">
          <ScanLine className="w-6 h-6 text-primary" />
        </div>

        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold font-heading text-foreground leading-tight">
            Scanning Receipt
          </h2>
          <p className="text-xs text-muted mt-0.5 truncate">
            Powered by on-device OCR · 100% Private
          </p>
        </div>

        {/* Cancel X button (top-right) */}
        <button
          onClick={onCancel}
          aria-label="Cancel scanning"
          className="w-9 h-9 flex items-center justify-center rounded-lg bg-surface-high border border-border text-muted hover:text-foreground hover:border-primary transition-all duration-200 cursor-pointer shrink-0"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* ── Receipt image preview + scan beam ────────────── */}
      {imageUrl && (
        <div className="relative overflow-hidden rounded-2xl border border-border bg-surface-lowest">
          {/* Receipt image */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Receipt preview"
            className="w-full max-h-[260px] object-contain opacity-60"
          />

          {/* Scan beam — only shown while scanning (no error) */}
          {!error && (
            <>
              {/* Subtle orange tint overlay */}
              <div className="absolute inset-0 bg-primary/5 pointer-events-none" />
              {/* Animated horizontal beam */}
              <div
                className="absolute left-0 w-full h-0.5 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to right, transparent 0%, var(--color-primary) 50%, transparent 100%)",
                  boxShadow: "0 0 12px 3px hsla(37 100% 73% / 0.5)",
                  animation: "scan 3s ease-in-out infinite",
                }}
              />
            </>
          )}

          {/* Corner badge */}
          <div className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-high border border-border">
            <Cpu className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold text-primary tracking-wide">
              OCR
            </span>
          </div>
        </div>
      )}

      {/* ── Progress / Error card ─────────────────────────── */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        {error ? (
          /* ── Error state ─────────────────────────────────── */
          <>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-destructive" />
              <div>
                <p className="font-bold text-sm text-destructive">
                  Extraction Failed
                </p>
                <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                  {error}
                </p>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={handleRetry}
                className="flex-1 flex items-center justify-center gap-2 h-12 px-4 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <RefreshCw className="w-4 h-4" />
                Try Again
              </button>
              <button
                onClick={onCancel}
                className="flex-1 flex items-center justify-center h-12 px-4 rounded-xl bg-secondary hover:brightness-110 text-foreground border border-border font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </>
        ) : (
          /* ── Scanning state ──────────────────────────────── */
          <>
            {/* Step label + percentage */}
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 min-w-0">
                <Loader2 className="w-4 h-4 shrink-0 animate-spin text-primary" />
                <span className="text-sm text-foreground/80 font-medium truncate">
                  {currentStep.label}
                </span>
              </div>
              <span className="text-sm font-bold font-heading text-primary shrink-0 tabular-nums">
                {progress}%
              </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-2 bg-surface-high rounded-full overflow-hidden border border-border/40">
              <div
                className="h-full rounded-full transition-all duration-300 ease-out"
                style={{
                  width: `${progress}%`,
                  background:
                    "linear-gradient(to right, var(--color-primary), var(--color-accent))",
                  boxShadow: "0 0 8px 1px hsla(37 100% 73% / 0.4)",
                }}
              />
            </div>

            {/* Status fine-print */}
            <p className="text-xs text-muted leading-relaxed">{status}</p>

            {/* Cancel button */}
            <button
              onClick={onCancel}
              className="w-full flex items-center justify-center h-12 px-4 rounded-xl bg-secondary hover:brightness-110 text-foreground border border-border font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Cancel
            </button>
          </>
        )}
      </div>
    </div>
  );
}
