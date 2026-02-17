"use client";

import { useState, useRef, useCallback } from "react";
import Image from "next/image";
import { Upload, X, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/lib/store";

const MAX_SIZE = 5 * 1024 * 1024;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];

interface ImageUploadProps {
  value?: string;
  onChange: (url: string | undefined) => void;
  className?: string;
}

export default function ImageUpload({
  value,
  onChange,
  className,
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

  if (value) {
    return (
      <div className={cn("relative w-full", className)}>
        <div className="relative w-full h-32 rounded-2xl overflow-hidden border border-separator">
          <Image
            src={value}
            alt="Preview"
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 300px"
          />
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="absolute top-2 right-2 p-1 bg-black/50 rounded-full text-white hover:bg-black/70 transition-colors"
            aria-label="Удалить изображение"
          >
            <X size={14} />
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("w-full", className)}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={cn(
          "flex flex-col items-center justify-center gap-2 w-full h-28 rounded-2xl border-2 border-dashed cursor-pointer transition-all duration-200",
          dragOver
            ? "border-primary bg-primary/5"
            : "border-separator hover:border-primary/50 hover:bg-fill"
        )}
      >
        {uploading ? (
          <Loader2 size={24} className="animate-spin text-primary" />
        ) : (
          <>
            <Upload size={20} className="text-text-muted" />
            <span className="text-xs text-text-muted">
              Перетащите или нажмите для загрузки
            </span>
            <span className="text-xs text-text-muted/60">
              JPEG, PNG, WebP до 5 МБ
            </span>
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
