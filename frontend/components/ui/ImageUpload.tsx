"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Loader2, ImageOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  className?: string;
  compact?: boolean;
  fillHeight?: boolean;
}

export default function ImageUpload({
  value,
  onChange,
  className,
  compact,
  fillHeight,
}: ImageUploadProps) {
  const token = useAuthStore((s) => s.token);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const uploadFile = useCallback(
    async (file: File) => {
      setError(null);

      if (!ALLOWED_TYPES.includes(file.type)) {
        setError("Допустимые форматы: JPEG, PNG, WebP");
        return;
      }
      if (file.size > MAX_SIZE) {
        setError("Максимальный размер: 5 МБ");
        return;
      }

      setUploading(true);
      try {
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          headers: { Authorization: `Bearer ${token || ""}` },
          body: formData,
        });

        if (!res.ok) {
          const data = await res.json();
          throw new Error(data.error || "Ошибка загрузки");
        }

        const data = await res.json();
        onChange(data.url);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "Ошибка загрузки"
        );
      } finally {
        setUploading(false);
      }
    },
    [onChange, token]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragOver(false);
      const file = e.dataTransfer.files[0];
      if (file) uploadFile(file);
    },
    [uploadFile]
  );

  const handleFileChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) uploadFile(file);
      if (inputRef.current) inputRef.current.value = "";
    },
    [uploadFile]
  );

  const [imgError, setImgError] = useState(false);

  // Reset error when value changes
  const prevValue = useRef(value);
  if (value !== prevValue.current) {
    prevValue.current = value;
    if (imgError) setImgError(false);
  }

  if (value) {
    return (
      <div className={cn("relative", compact ? "w-[160px]" : "w-full", fillHeight && "h-full", className)}>
        <div className={cn(
          "relative rounded-2xl overflow-hidden border border-separator bg-fill",
          compact ? "w-[160px] h-[160px]" : fillHeight ? "w-full h-full min-h-[120px]" : "w-full aspect-[4/3]"
        )}>
          {imgError ? (
            <div className="flex flex-col items-center justify-center w-full h-full gap-1 text-text-muted">
              <ImageOff size={compact ? 20 : 28} />
              {!compact && <span className="text-xs">Не удалось загрузить</span>}
            </div>
          ) : (
            <Image
              src={value}
              alt="Preview"
              fill
              className="object-cover"
              sizes={compact ? "160px" : "(max-width: 768px) 100vw, 400px"}
              onError={() => setImgError(true)}
            />
          )}
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className={cn(
              "absolute p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors",
              compact ? "top-1 right-1" : "top-2 right-2"
            )}
            aria-label="Удалить изображение"
          >
            <X size={compact ? 12 : 14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn(compact ? "w-[160px]" : "w-full", fillHeight && "h-full", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200",
          compact ? "w-[160px] h-[160px] gap-1" : fillHeight ? "w-full h-full min-h-[120px] gap-2" : "w-full h-28 gap-2",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-separator hover:border-primary/50 hover:bg-fill"
        )}
      >
        {uploading ? (
          <Loader2 size={compact ? 20 : 24} className="animate-spin text-primary" />
        ) : (
          <>
            <Upload size={compact ? 16 : 20} className="text-text-muted" />
            <span className={cn("text-text-muted text-center px-1", compact ? "text-[10px] leading-tight" : "text-xs")}>
              {compact ? "Загрузить" : "Перетащите или нажмите для загрузки"}
            </span>
            {!compact && (
              <span className="text-xs text-text-muted/60">
                JPEG, PNG, WebP до 5 МБ
              </span>
            )}
          </>
        )}
      </div>
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        className="hidden"
        onChange={handleFileChange}
      />
      {error && <p className="text-xs text-error mt-1">{error}</p>}
    </div>
  );
}
