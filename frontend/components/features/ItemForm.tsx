"use client";

import { useState, useRef } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, ChevronDown, ChevronUp, ImageIcon } from "lucide-react";
import { Button, Input, Textarea, Modal } from "@/components/ui";
import ImageUpload from "@/components/ui/ImageUpload";
import { useParseUrl } from "@/hooks/useParseUrl";

const schema = z.object({
  title: z.string().min(1, "Введите название").max(200),
  url: z.string().url("Некорректная ссылка").optional().or(z.literal("")),
  price: z.coerce.number().int().positive("Цена должна быть положительной").optional(),
  image_url: z.string().url("Некорректная ссылка").optional().or(z.literal("")),
  note: z.string().max(500).optional(),
});

type FormData = {
  title: string;
  url?: string;
  price?: number;
  image_url?: string;
  note?: string;
};

interface ItemFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (data: {
    title: string;
    url?: string;
    price?: number;
    image_url?: string;
    note?: string;
  }) => void;
  defaultValues?: Partial<FormData>;
  loading?: boolean;
  title?: string;
}

export default function ItemForm({
  open,
  onOpenChange,
  onSubmit,
  defaultValues,
  loading,
  title = "Добавить желание",
}: ItemFormProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);
  const parseUrl = useParseUrl();
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(undefined);
  const lastParsedUrl = useRef<string>("");

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    getValues,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: defaultValues || {},
  });

  // Auto-fill from URL — event-driven, no useEffect dependency loops
  const triggerAutofill = (url: string) => {
    if (!url || getValues("title") || lastParsedUrl.current === url) return;
    try { new URL(url); } catch { return; }

    clearTimeout(debounceTimer.current);
    debounceTimer.current = setTimeout(() => {
      lastParsedUrl.current = url;
      parseUrl.mutate(url, {
        onSuccess: (data) => {
          if (data.title && !getValues("title")) {
            setValue("title", data.title);
          }
          if (data.image_url) {
            setValue("image_url", data.image_url);
            setShowAdvanced(true);
          }
          if (data.price) {
            setValue("price", data.price);
          }
        },
      });
    }, 500);
  };

  const urlRegistration = register("url");

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      title: data.title,
      url: data.url || undefined,
      price: data.price || undefined,
      image_url: data.image_url || undefined,
      note: data.note || undefined,
    });
    reset();
    lastParsedUrl.current = "";
    onOpenChange(false);
  };

  const handleOpenChange = (isOpen: boolean) => {
    if (!isOpen) {
      reset(defaultValues || {});
      setShowAdvanced(false);
      lastParsedUrl.current = "";
      clearTimeout(debounceTimer.current);
    }
    onOpenChange(isOpen);
  };

  return (
    <Modal open={open} onOpenChange={handleOpenChange} title={title} className="sm:max-w-lg">
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-3">
        {/* URL */}
        <div className="relative">
          <Input
            label="Ссылка на товар"
            placeholder="https://..."
            error={errors.url?.message}
            {...urlRegistration}
            onChange={(e) => {
              urlRegistration.onChange(e);
              triggerAutofill(e.target.value);
            }}
          />
          {parseUrl.isPending && (
            <div className="absolute right-3 top-[34px]">
              <Loader2 size={16} className="animate-spin text-text-muted" />
            </div>
          )}
        </div>

        {/* Name + Price side by side on desktop */}
        <div className="grid grid-cols-1 sm:grid-cols-[1fr_140px] gap-3">
          <Input
            label="Название"
            placeholder="Наушники Sony WH-1000XM5"
            error={errors.title?.message}
            {...register("title")}
          />
          <Input
            label="Цена (₽)"
            type="number"
            min={1}
            step={1}
            placeholder="25 000"
            error={errors.price?.message}
            {...register("price")}
          />
        </div>

        {/* Advanced toggle */}
        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="flex items-center gap-1.5 text-sm text-primary hover:text-primary-light transition-colors font-medium"
        >
          {showAdvanced ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
          {showAdvanced ? "Скрыть дополнительно" : "Картинка и заметка"}
        </button>

        {showAdvanced && (
          <div className="space-y-3 pt-1">
            {/* Image: preview + URL side by side on desktop */}
            <div>
              <label className="flex items-center gap-1.5 text-sm font-medium text-text mb-1.5">
                <ImageIcon size={14} className="text-text-muted" />
                Картинка
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-3 items-center">
                <ImageUpload
                  value={watch("image_url") || undefined}
                  onChange={(url) => setValue("image_url", url || "")}
                  compact
                />
                <Input
                  placeholder="https://...image.jpg"
                  error={errors.image_url?.message}
                  {...register("image_url")}
                />
              </div>
            </div>

            <Textarea
              label="Заметка для друзей"
              rows={2}
              placeholder="Хочу именно синий цвет"
              {...register("note")}
            />
          </div>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {defaultValues?.title ? "Сохранить" : "Добавить"}
        </Button>
      </form>
    </Modal>
  );
}
