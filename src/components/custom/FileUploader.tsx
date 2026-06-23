"use client";

import React, { useRef, useState } from "react";
import { Upload, Camera, FileImage } from "lucide-react";
import { useReceiptStore } from "@/hooks/useReceiptStore";

interface FileUploaderProps {
  onFileSelected: (file: File) => void;
}

export default function FileUploader({ onFileSelected }: FileUploaderProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const [isDragActive, setIsDragActive] = useState(false);
  const resetStore = useReceiptStore((state) => state.resetStore);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      // Rule: Uploading a new image clears all existing local storage data
      resetStore();
      onFileSelected(file);
    }
  };

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith("image/")) {
        // Rule: Uploading a new image clears all existing local storage data
        resetStore();
        onFileSelected(file);
      }
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  const triggerCameraSelect = () => {
    cameraInputRef.current?.click();
  };

  return (
    <div className="w-full max-w-md mx-auto space-y-6">
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

      <div
        onDragEnter={handleDrag}
        onDragOver={handleDrag}
        onDragLeave={handleDrag}
        onDrop={handleDrop}
        onClick={triggerFileSelect}
        className={`relative flex flex-col items-center justify-center min-h-[280px] p-8 border-2 border-dashed rounded-2xl cursor-pointer transition-all duration-300 ${
          isDragActive
            ? "border-primary bg-primary/5 shadow-[0_0_20px_rgba(250,95,68,0.15)]"
            : "border-border hover:border-primary/50 hover:bg-card/30"
        } bg-card backdrop-blur-md shadow-glass`}
      >
        <div className="flex flex-col items-center text-center space-y-4">
          <div className={`p-4 rounded-full bg-secondary border border-border text-foreground/80 transition-all ${isDragActive ? "scale-110 text-primary" : ""}`}>
            <FileImage className="w-10 h-10" />
          </div>

          <div className="space-y-1">
            <h3 className="text-lg font-bold font-heading text-foreground">
              Upload Receipt Image
            </h3>
            <p className="text-xs text-foreground/50 max-w-[240px]">
              Drag and drop your receipt here, or select a file to upload.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 pt-2 w-full max-w-xs" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={triggerFileSelect}
              className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-primary hover:bg-primary-hover text-primary-foreground font-semibold text-sm transition-all active:scale-98 cursor-pointer shadow-md"
            >
              <Upload className="w-4 h-4" />
              Choose File
            </button>

            <button
              onClick={triggerCameraSelect}
              className="flex-1 flex items-center justify-center gap-2 h-11 px-4 rounded-lg bg-secondary hover:brightness-110 text-foreground border border-border font-semibold text-sm transition-all active:scale-98 cursor-pointer"
            >
              <Camera className="w-4 h-4" />
              Take Photo
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
