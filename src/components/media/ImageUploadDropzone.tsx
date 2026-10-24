"use client";

import * as React from "react";
import { UploadCloud, Loader2, RefreshCw, Trash2, AlertCircle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { uploadMediaApi, getMediaUrl, MediaUploadResult } from "@/lib/business-client";

export interface ImageUploadDropzoneProps {
  folder: "business/logos" | "services/images" | "gallery/images";
  value?: string | null;
  onChange: (objectKey: string | null) => void;
  onUploadComplete?: (result: MediaUploadResult) => void;
  label?: string;
  description?: string;
  aspectRatio?: "square" | "thumbnail" | "banner";
  disabled?: boolean;
  className?: string;
}

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_FILE_SIZE_BYTES = 5 * 1024 * 1024; // 5 MB

export function ImageUploadDropzone({
  folder,
  value,
  onChange,
  onUploadComplete,
  label = "Unggah Gambar",
  description = "Format JPEG, PNG, atau WebP (maks. 5MB)",
  aspectRatio = "thumbnail",
  disabled = false,
  className,
}: ImageUploadDropzoneProps) {
  const [isDragging, setIsDragging] = React.useState(false);
  const [isUploading, setIsUploading] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const previewUrl = value ? getMediaUrl(value) : null;

  const validateFile = (file: File): string | null => {
    if (!ALLOWED_MIME_TYPES.includes(file.type.toLowerCase())) {
      return "Format berkas tidak didukung. Harap gunakan gambar JPEG, PNG, atau WebP.";
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      return "Ukuran berkas melebihi batas 5 MB.";
    }
    return null;
  };

  const handleUpload = async (file: File) => {
    setErrorMessage(null);
    const validationError = validateFile(file);
    if (validationError) {
      setErrorMessage(validationError);
      toast.error("Berkas Tidak Valid", { description: validationError });
      return;
    }

    setIsUploading(true);
    try {
      const res = await uploadMediaApi(file, folder);
      if (!res.success || !res.data) {
        const msg = res.error?.message || "Gagal mengunggah berkas ke server media.";
        setErrorMessage(msg);
        toast.error("Unggah Gagal", { description: msg });
        return;
      }

      toast.success("Gambar Berhasil Diunggah", {
        description: `Berkas ${res.data.originalName} berhasil disimpan.`,
      });

      onChange(res.data.objectKey);
      onUploadComplete?.(res.data);
    } catch {
      const msg = "Terjadi gangguan jaringan saat mengunggah media.";
      setErrorMessage(msg);
      toast.error("Kesalahan Jaringan", { description: msg });
    } finally {
      setIsUploading(false);
      if (inputRef.current) {
        inputRef.current.value = "";
      }
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (disabled || isUploading) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (disabled || isUploading) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleUpload(file);
    }
  };

  const handleRemove = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isUploading) return;
    onChange(null);
    setErrorMessage(null);
  };

  const triggerSelect = () => {
    if (disabled || isUploading) return;
    inputRef.current?.click();
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      triggerSelect();
    }
  };

  const aspectRatioClass = {
    square: "aspect-square max-w-[180px] mx-auto",
    thumbnail: "aspect-[4/3] max-w-[240px] mx-auto",
    banner: "aspect-[16/9] w-full max-h-[180px]",
  }[aspectRatio];

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <span className="text-sm font-medium text-foreground block">
          {label}
        </span>
      )}

      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={onFileChange}
        disabled={disabled || isUploading}
        aria-label={label}
      />

      {previewUrl ? (
        <div
          className={cn(
            "relative rounded-xl overflow-hidden border border-border bg-muted/20 group transition-all",
            aspectRatioClass
          )}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt={label}
            className="w-full h-full object-cover"
          />

          {/* Overlay Actions */}
          <div className="absolute inset-0 bg-slate-950/60 opacity-0 group-hover:opacity-100 group-focus-within:opacity-100 transition-opacity flex items-center justify-center gap-2 p-4">
            <Button
              type="button"
              size="sm"
              variant="secondary"
              className="bg-white/90 hover:bg-white text-slate-900 shadow-sm text-xs"
              onClick={triggerSelect}
              disabled={disabled || isUploading}
            >
              <RefreshCw className="h-3.5 w-3.5 mr-1" />
              Ganti
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              className="shadow-sm text-xs"
              onClick={handleRemove}
              disabled={disabled || isUploading}
            >
              <Trash2 className="h-3.5 w-3.5 mr-1" />
              Hapus
            </Button>
          </div>

          {isUploading && (
            <div className="absolute inset-0 bg-background/80 backdrop-blur-xs flex flex-col items-center justify-center gap-2 text-primary">
              <Loader2 className="h-6 w-6 animate-spin" />
              <span className="text-xs font-semibold">Mengunggah...</span>
            </div>
          )}
        </div>
      ) : (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={triggerSelect}
          onKeyDown={handleKeyDown}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          className={cn(
            "flex flex-col items-center justify-center text-center p-4 border-2 border-dashed rounded-xl cursor-pointer transition-all focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 select-none min-h-[120px] w-full",
            isDragging
              ? "border-accent bg-accent/10"
              : "border-slate-300 dark:border-slate-700 hover:border-accent hover:bg-muted/40 bg-muted/20",
            disabled && "cursor-not-allowed opacity-50"
          )}
        >
          {isUploading ? (
            <div className="flex flex-col items-center justify-center gap-2 py-3 text-accent">
              <Loader2 className="h-7 w-7 animate-spin" />
              <span className="text-xs font-medium">Sedang mengunggah berkas...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center gap-1.5 py-1">
              <div className="h-9 w-9 rounded-full bg-accent/10 text-accent flex items-center justify-center">
                <UploadCloud className="h-4.5 w-4.5" />
              </div>
              <div className="space-y-0.5">
                <p className="text-xs font-semibold text-foreground">
                  Klik untuk unggah atau seret berkas ke sini
                </p>
                <p className="text-[11px] text-muted-foreground">{description}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {errorMessage && (
        <div className="flex items-center gap-1.5 text-xs text-destructive font-medium pt-1">
          <AlertCircle className="h-3.5 w-3.5 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
}
