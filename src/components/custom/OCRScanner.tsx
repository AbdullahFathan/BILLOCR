"use client";

import React, { useEffect, useRef, useState } from "react";
import {
  Loader2,
  AlertCircle,
  RefreshCw,
  ScanLine,
  Cpu,
  X,
  Clock,
} from "lucide-react";
import { useReceiptStore } from "@/hooks/useReceiptStore";
import { compressImage } from "@/lib/imageCompressor";
import type { OCRResponse, UploadStatus } from "@/types";

interface OCRScannerProps {
  imageBlob: Blob;
  onCompleted: (
    rawText: string,
    remainingUploads: number,
    resetMs?: number,
  ) => void;
  onCancel: () => void;
  /** Called when the API returns 429 — parent should set remainingUploads=0 */
  onRateLimited?: (resetTimeMs: number) => void;
}

/** Upstash reset is ms; some RateLimit headers use seconds. */
function normalizeResetMs(raw: number | null | undefined, header?: string | null): number {
  if (header) {
    const parsed = parseInt(header, 10);
    if (!isNaN(parsed)) {
      return parsed < 1e12 ? parsed * 1000 : parsed;
    }
  }
  if (raw != null && !isNaN(raw)) {
    return raw < 1e12 ? raw * 1000 : raw;
  }
  return Date.now() + 86_400_000;
}

/* ─── Scanning step labels (indeterminate — no % from Mistral) ──── */
const STEPS = [
  "Compressing image...",
  "Sending to OCR engine...",
  "Reading receipt structure...",
  "Extracting items & prices...",
  "Finalizing results...",
];

export default function OCRScanner({
  imageBlob,
  onCompleted,
  onCancel,
  onRateLimited,
}: OCRScannerProps) {
  const [status, setStatus] = useState<UploadStatus>("compressing");
  const [stepIndex, setStepIndex] = useState(0);
  const [imageUrl, setImageUrl] = useState<string>("");
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [resetTime, setResetTime] = useState<number | null>(null);
  const [countdown, setCountdown] = useState<string>("");
  const setRawText = useReceiptStore((state) => state.setRawText);
  const processingRef = useRef(false);
  const onRateLimitedRef = useRef(onRateLimited);

  useEffect(() => {
    onRateLimitedRef.current = onRateLimited;
  }, [onRateLimited]);

  /* ── Generate object URL for image preview ───────────── */
  useEffect(() => {
    const url = URL.createObjectURL(imageBlob);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setImageUrl(url);
    return () => URL.revokeObjectURL(url);
  }, [imageBlob]);

  /* ── Countdown timer for rate limit reset ────────────────── */
  useEffect(() => {
    if (status !== "rate_limited" || !resetTime) return;
    const tick = () => {
      const diffMs = resetTime - Date.now();
      if (diffMs <= 0) {
        setCountdown("sekarang");
        return;
      }
      const h = Math.floor(diffMs / 3_600_000);
      const m = Math.floor((diffMs % 3_600_000) / 60_000);
      const s = Math.floor((diffMs % 60_000) / 1_000);
      setCountdown(
        h > 0
          ? `${h} jam ${m} menit`
          : m > 0
            ? `${m} menit ${s} detik`
            : `${s} detik`,
      );
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [status, resetTime]);

  /* ── Cycle through step labels while scanning ─────────────── */
  useEffect(() => {
    if (status === "api_error" || status === "rate_limited") return;
    const interval = setInterval(() => {
      setStepIndex((i) => Math.min(i + 1, STEPS.length - 1));
    }, 1800);
    return () => clearInterval(interval);
  }, [status]);

  /* ── Run Mistral OCR via /api/ocr ──────────────────────── */
  useEffect(() => {
    if (processingRef.current || !imageUrl) return;
    processingRef.current = true;
    setErrorMsg(null);
    setStatus("compressing");

    async function runOCR() {
      try {
        // 1. Compress image (Canvas API — already a Blob here, compress again
        //    only if it came directly from camera without prior compression)
        const compressed =
          imageBlob.size > 500_000
            ? await compressImage(
                new File([imageBlob], "receipt.jpg", { type: imageBlob.type }),
              )
            : imageBlob;

        setStatus("scanning");

        // 2. Convert to base64
        const base64 = await new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            // Strip data URL prefix → keep only base64 payload
            const base64Payload = result.split(",")[1];
            if (!base64Payload) reject(new Error("Failed to encode image."));
            else resolve(base64Payload);
          };
          reader.onerror = () => reject(new Error("FileReader error."));
          reader.readAsDataURL(compressed);
        });

        // 3. POST to /api/ocr (rate-limited in the Route Handler)
        const res = await fetch("/api/ocr", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            imageBase64: base64,
            mimeType: compressed.type,
          }),
        });

        // 4. Handle 429 rate limit BEFORE parsing JSON
        //    (guards against plain-text body that would crash res.json())
        if (res.status === 429) {
          let bodyReset: number | undefined;
          try {
            const body = (await res.clone().json()) as { reset?: number };
            bodyReset = body.reset;
          } catch {
            // plain-text 429 body — fall back to header
          }
          const resetMs = normalizeResetMs(
            bodyReset,
            res.headers.get("X-RateLimit-Reset"),
          );
          setStatus("rate_limited");
          setResetTime(resetMs);
          // Notify parent so it can block the FileUploader immediately
          onRateLimitedRef.current?.(resetMs);
          return;
        }

        const json: OCRResponse = await res.json();

        // 5. Handle other API-level errors reported in body
        if (json.success === false && json.error === "RATE_LIMIT_EXCEEDED") {
          const resetMs = normalizeResetMs(json.reset);
          setStatus("rate_limited");
          setResetTime(resetMs);
          // Notify parent so it can block the FileUploader immediately
          onRateLimitedRef.current?.(resetMs);
          return;
        }

        // 6. Handle other errors
        if (!json.success) {
          throw new Error(json.message ?? "Unknown OCR error.");
        }

        // 7. Success path
        setStatus("done");
        const { text, remainingUploads, reset } = json.data;
        const resetMs = normalizeResetMs(
          reset,
          res.headers.get("X-RateLimit-Reset"),
        );
        setRawText(text);
        onCompleted(text, remainingUploads, resetMs);
      } catch (err: unknown) {
        const msg =
          err instanceof Error
            ? err.message
            : "Unexpected error during scanning.";
        console.error("[OCRScanner] Error:", msg);
        setErrorMsg(msg);
        setStatus("api_error");
      } finally {
        processingRef.current = false;
      }
    }

    runOCR();
  }, [imageUrl, imageBlob, onCompleted, setRawText]);

  /* ── Handle manual retry ───────────────────────────────── */
  const handleRetry = () => {
    setErrorMsg(null);
    setStatus("compressing");
    setResetTime(null);
    processingRef.current = false;
    setStepIndex(0);
    // Re-trigger by creating a new object URL
    const url = URL.createObjectURL(imageBlob);
    setImageUrl(url);
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-4 animate-fade-in">
      {/* ── Header card ───────────────────────────────────── */}
      <div className="bg-surface border border-border rounded-2xl p-5 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-surface-high border border-border flex items-center justify-center shrink-0">
          <ScanLine className="w-6 h-6 text-primary" />
        </div>
        <div className="flex-1 min-w-0">
          <h2 className="text-lg font-bold font-heading text-foreground leading-tight">
            Scanning Receipt
          </h2>
        </div>
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
            className="w-full max-h-65 object-contain opacity-60"
          />

          {/* Scan beam — only shown while scanning (poin 12: aria-hidden on decorative elements) */}
          {status === "scanning" || status === "compressing" ? (
            <>
              <div
                aria-hidden="true"
                className="absolute inset-0 bg-primary/5 pointer-events-none"
              />
              <div
                aria-hidden="true"
                className="absolute left-0 w-full h-0.5 pointer-events-none"
                style={{
                  background:
                    "linear-gradient(to right, transparent 0%, var(--color-primary) 50%, transparent 100%)",
                  boxShadow: "0 0 12px 3px hsla(37 100% 73% / 0.5)",
                  animation: "scan 3s ease-in-out infinite",
                }}
              />
            </>
          ) : null}

          {/* Corner badge — decorative */}
          <div
            aria-hidden="true"
            className="absolute top-2 right-2 flex items-center gap-1 px-2 py-0.5 rounded-full bg-surface-high border border-border"
          >
            <Cpu className="w-3 h-3 text-primary" />
            <span className="text-[10px] font-semibold text-primary tracking-wide">
              OCR
            </span>
          </div>
        </div>
      )}

      {/* ── Progress / Error / Rate-limit card ───────────── */}
      <div className="bg-surface border border-border rounded-2xl p-5 space-y-4">
        {status === "rate_limited" ? (
          /* ── Rate limit state ─────────────────────────────── */
          <>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-primary/30 bg-primary/8">
              <Clock className="w-5 h-5 shrink-0 mt-0.5 text-primary" />
              <div>
                <p className="font-bold text-sm text-foreground">
                  Batas Upload Harian Tercapai
                </p>
                <p className="text-xs text-muted mt-1 leading-relaxed">
                  Kamu sudah melakukan 5 scan hari ini. Batas akan direset
                  dalam:
                </p>
                <p className="text-sm font-bold text-primary mt-2 tabular-nums">
                  {countdown || "Menghitung..."}
                </p>
              </div>
            </div>
            <button
              onClick={onCancel}
              className="w-full flex items-center justify-center h-12 px-4 rounded-xl bg-secondary hover:brightness-110 text-foreground border border-border font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer"
            >
              Kembali
            </button>
          </>
        ) : status === "api_error" ? (
          /* ── Error state ───────────────────────────────────── */
          <>
            <div className="flex items-start gap-3 p-4 rounded-xl border border-destructive/30 bg-destructive/10">
              <AlertCircle className="w-5 h-5 shrink-0 mt-0.5 text-destructive" />
              <div>
                <p className="font-bold text-sm text-destructive">
                  Extraction Failed
                </p>
                <p className="text-xs text-foreground/70 mt-1 leading-relaxed">
                  {errorMsg}
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
          /* ── Scanning state (indeterminate) ──────────────── */
          <>
            {/* Step label */}
            <div className="flex items-center gap-2 min-w-0">
              <Loader2 className="w-4 h-4 shrink-0 animate-spin text-primary" />
              <span className="text-sm text-foreground/80 font-medium truncate">
                {STEPS[stepIndex]}
              </span>
            </div>

            {/* Indeterminate progress bar */}
            <div className="w-full h-2 bg-surface-high rounded-full overflow-hidden border border-border/40">
              <div
                className="h-full rounded-full"
                style={{
                  background:
                    "linear-gradient(to right, var(--color-primary), var(--color-accent))",
                  boxShadow: "0 0 8px 1px hsla(37 100% 73% / 0.4)",
                  animation: "indeterminate 1.8s ease-in-out infinite",
                }}
              />
            </div>

            <p className="text-xs text-muted leading-relaxed">
              Menggunakan teknologi OCR canggih untuk akurasi terbaik pada struk
              Indonesia...
            </p>

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
