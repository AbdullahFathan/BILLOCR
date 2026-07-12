"use client";

import React, { useRef, useState } from "react";
import { Camera, Upload, ScanLine, Zap, ShieldCheck, Clock } from "lucide-react";
import { useReceiptStore } from "@/hooks/useReceiptStore";

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
}

const featureChips = [
  { icon: Zap,          label: "Instant OCR"      },
  { icon: ShieldCheck,  label: "100% Private"      },
  { icon: Clock,        label: "2-hr Auto Save"    },
];

export default function FileUploader({ onFileSelected }: FileUploaderProps) {
  const fileInputRef   = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const resetStore = useReceiptStore((state) => state.resetStore);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      resetStore();
      onFileSelected(e.target.files[0]);
    }
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
    if (e.dataTransfer.files?.[0]?.type.startsWith("image/")) {
      resetStore();
      onFileSelected(e.dataTransfer.files[0]);
    }
  };

  return (
    <div className="w-full space-y-5 animate-[fade-in_0.4s_ease-out]">
      {/* Hidden inputs */}
      <input ref={fileInputRef}   type="file" accept="image/*"                     onChange={handleFileChange} className="hidden" />
      <input ref={cameraInputRef} type="file" accept="image/*" capture="environment" onChange={handleFileChange} className="hidden" />

      {/* ── Drop Zone ───────────────────────────────────────────── */}
      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={[
          "relative flex flex-col items-center justify-center min-h-[260px] p-8",
          "border-2 border-dashed rounded-2xl cursor-pointer",
          "transition-all duration-300",
          isDragActive
            ? "border-primary bg-primary/8 shadow-[0_0_28px_rgba(255,199,122,0.18)]"
            : "border-border hover:border-primary/60 hover:bg-surface-high/40 bg-surface",
        ].join(" ")}
      >
        {/* Hero icon container */}
        <div
          className={[
            "mb-5 flex items-center justify-center w-20 h-20 rounded-2xl",
            "bg-surface-high border border-border",
            "transition-all duration-300",
            isDragActive ? "border-primary shadow-[0_0_0_1px_theme(colors.primary)] scale-105" : "",
          ].join(" ")}
        >
          <ScanLine
            className={`w-9 h-9 transition-all duration-300 ${isDragActive ? "text-primary" : "text-muted"}`}
            strokeWidth={1.5}
          />
        </div>

        {/* Copy */}
        <div className="text-center space-y-1.5 mb-6">
          <h3 className="text-base font-bold font-heading text-foreground">
            {isDragActive ? "Drop to scan your receipt" : "Upload your receipt"}
          </h3>
          <p className="text-xs text-muted max-w-[200px] mx-auto leading-relaxed">
            Drag & drop a photo here, or use the buttons below
          </p>
        </div>

        {/* CTA Buttons — stop propagation so they don't double-fire */}
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
            Gallery
          </button>

          <button
            id="file-uploader-camera"
            onClick={() => cameraInputRef.current?.click()}
            className="flex-1 flex items-center justify-center gap-2 h-12 px-4 rounded-xl bg-secondary hover:brightness-110 text-foreground border border-border font-semibold text-sm transition-all duration-200 active:scale-95 cursor-pointer"
          >
            <Camera className="w-4 h-4" />
            Camera
          </button>
        </div>
      </div>

      {/* ── Feature Chips row ───────────────────────────────────── */}
      <div className="flex items-center justify-center gap-2 flex-wrap">
        {featureChips.map(({ icon: Icon, label }) => (
          <span
            key={label}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface border border-border text-xs font-medium text-muted"
          >
            <Icon className="w-3 h-3 text-primary" strokeWidth={2} />
            {label}
          </span>
        ))}
      </div>
    </div>
  );
}
