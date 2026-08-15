"use client";

import React, { useRef, useState } from "react";
import { Camera, Upload, ScanLine, Cloud } from "lucide-react";
import { useReceiptStore } from "@/hooks/useReceiptStore";
import AlertModal from "@/components/custom/AlertModal";
import { MAX_UPLOAD_BYTES } from "@/lib/imageCompressor";

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
  /** How many OCR uploads the user has left today (max 5). Used for the counter badge. */
  remainingUploads?: number;
}

export default function FileUploader({
  onFileSelected,
  remainingUploads = 5,
}: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const resetStore = useReceiptStore((state) => state.resetStore);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setErrorMessage(
        `Ukuran file terlalu besar (${(file.size / 1024 / 1024).toFixed(1)} MB). Maksimum 10 MB.`,
      );
      // Reset input agar file yang sama bisa dipilih ulang setelah error
      e.target.value = "";
      return;
    }
    resetStore();
    onFileSelected(file);
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setIsDragActive(true);
    else if (e.type === "dragleave") setIsDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (!file?.type.startsWith("image/")) return;
    if (file.size > MAX_UPLOAD_BYTES) {
      setErrorMessage(
        `Ukuran file terlalu besar (${(file.size / 1024 / 1024).toFixed(1)} MB). Maksimum 10 MB.`,
      );
      return;
    }
    resetStore();
    onFileSelected(file);
  };

  const isLimitReached = remainingUploads === 0;

  return (
    <>
      {/* ── File Size Error Modal ────────────────────────────────── */}
      <AlertModal
        open={errorMessage !== null}
        onClose={() => setErrorMessage(null)}
        title="File Terlalu Besar"
        message={errorMessage ?? ""}
        variant="error"
      />

      <div className="w-full space-y-5 animate-[fade-in_0.4s_ease-out]">
        {/* Hidden inputs */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
        />
        <input
          ref={cameraInputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFileChange}
          className="hidden"
        />

        {/* ── Drop Zone ───────────────────────────────────────────── */}
        <div
          onDragEnter={!isLimitReached ? handleDrag : undefined}
          onDragOver={!isLimitReached ? handleDrag : undefined}
          onDragLeave={!isLimitReached ? handleDrag : undefined}
          onDrop={!isLimitReached ? handleDrop : undefined}
          onClick={
            !isLimitReached ? () => fileInputRef.current?.click() : undefined
          }
          className={[
            "relative flex flex-col items-center justify-center min-h-65 p-8",
            "border-2 border-dashed rounded-2xl",
            "transition-all duration-300",
            isLimitReached
              ? "border-border bg-surface opacity-60 cursor-not-allowed"
              : isDragActive
                ? "border-primary bg-primary/10 shadow-[0_0_28px_--theme(--color-primary/15)] cursor-pointer"
                : "border-border hover:border-primary/60 hover:bg-surface-high/40 bg-surface cursor-pointer",
          ].join(" ")}
          role={!isLimitReached ? "button" : undefined}
          tabIndex={!isLimitReached ? 0 : undefined}
          aria-label={
            !isLimitReached ? "Unggah foto struk" : "Batas scan harian tercapai"
          }
          onKeyDown={
            !isLimitReached
              ? (e) => {
                  if (e.key === "Enter" || e.key === " ")
                    fileInputRef.current?.click();
                }
              : undefined
          }
        >
          {/* Upload counter badge — top right */}
          <div
            className={[
              "absolute top-3 right-3 flex items-center gap-1 px-2.5 py-1 rounded-full",
              "text-[11px] font-semibold border",
              remainingUploads <= 1
                ? "bg-destructive/10 border-destructive/30 text-destructive"
                : "bg-surface-high border-border text-muted",
            ].join(" ")}
          >
            <Cloud className="w-3 h-3" />
            {isLimitReached
              ? "Limit tercapai"
              : `${remainingUploads}/5 scan hari ini`}
          </div>

          {/* Hero icon container */}
          <div
            className={[
              "mb-5 flex items-center justify-center w-20 h-20 rounded-2xl",
              "bg-surface-high border border-border",
              "transition-all duration-300",
              isDragActive && !isLimitReached
                ? "border-primary shadow-[0_0_0_1px_var(--color-primary)] scale-105"
                : "",
            ].join(" ")}
          >
            <ScanLine
              className={`w-9 h-9 transition-all duration-300 ${isDragActive && !isLimitReached ? "text-primary" : "text-muted"}`}
              strokeWidth={1.5}
            />
          </div>

          {/* Copy */}
          <div className="text-center space-y-1.5 mb-6">
            <h3 className="text-base font-bold font-heading text-foreground">
              {isLimitReached
                ? "Batas scan harian tercapai"
                : isDragActive
                  ? "Lepas untuk memindai struk"
                  : "Unggah struk kamu"}
            </h3>
            <p className="text-xs text-muted max-w-50 mx-auto leading-relaxed">
              {isLimitReached
                ? "Kamu sudah melakukan 5 scan hari ini. Kembali lagi besok."
                : "Seret & lepas foto di sini, atau gunakan tombol di bawah"}
            </p>
          </div>

          {/* CTA Buttons */}
          {!isLimitReached && (
            <div
              className="flex gap-3 w-full max-w-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                id="file-uploader-gallery"
                onClick={() => fileInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 h-12 px-4 rounded-xl bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer shadow-md"
              >
                <Upload className="w-4 h-4" />
                Galeri
              </button>

              <button
                id="file-uploader-camera"
                onClick={() => cameraInputRef.current?.click()}
                className="flex-1 flex items-center justify-center gap-2 h-12 px-4 rounded-xl bg-secondary hover:brightness-110 text-foreground border border-border font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer"
              >
                <Camera className="w-4 h-4" />
                Kamera
              </button>
            </div>
          )}
        </div>

      </div>
    </>
  );
}
