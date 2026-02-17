"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2 } from "lucide-react";
import { Button, Input, Modal } from "@/components/ui";
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

  // eslint-disable-next-line react-hooks/incompatible-library -- RHF watch() is intentionally non-memoizable
  const urlValue = watch("url");
  const titleValue = watch("title");

  // Auto-fill from URL with debounce
  const handleUrlAutofill = useCallback(
    (url: string) => {
      if (!url || getValues("title")) return; // Don't overwrite existing title

      try {
        new URL(url);
      } catch {
        return; // Not a valid URL yet
      }

      clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
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
    },
    [parseUrl, setValue, getValues]
  );

  useEffect(() => {
    if (urlValue && !defaultValues?.title) {
      handleUrlAutofill(urlValue);
    }
  }, [urlValue, handleUrlAutofill, defaultValues?.title]);

  const handleFormSubmit = (data: FormData) => {
    onSubmit({
      title: data.title,
      url: data.url || undefined,
      price: data.price || undefined,
      image_url: data.image_url || undefined,
      note: data.note || undefined,
    });
    reset();
    onOpenChange(false);
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title={title}>
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <div className="relative">
          <Input
            label="Ссылка на товар"
            placeholder="https://... (название подтянется автоматически)"
            error={errors.url?.message}
            {...register("url")}
          />
          {parseUrl.isPending && (
            <div className="absolute right-3 top-8 text-text-muted">
              <Loader2 size={16} className="animate-spin" />
            </div>
          )}
        </div>

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
          placeholder="25000"
          error={errors.price?.message}
          {...register("price")}
        />

        <button
          type="button"
          onClick={() => setShowAdvanced(!showAdvanced)}
          className="text-sm text-text-muted hover:text-text transition-colors"
        >
          {showAdvanced ? "Скрыть" : "Дополнительно"} (картинка, заметка)
        </button>

        {showAdvanced && (
          <>
            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Картинка
              </label>
              <ImageUpload
                value={watch("image_url") || undefined}
                onChange={(url) => setValue("image_url", url || "")}
              />
              <div className="mt-2">
                <Input
                  label="Или ссылка на картинку"
                  placeholder="https://...image.jpg"
                  error={errors.image_url?.message}
                  {...register("image_url")}
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Заметка для друзей
              </label>
              <textarea
                rows={2}
                placeholder="Хочу именно синий цвет"
                className="w-full px-4 py-2.5 rounded-2xl bg-surface text-text border border-separator placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none"
                {...register("note")}
              />
            </div>
          </>
        )}

        <Button type="submit" className="w-full" size="lg" loading={loading}>
          {defaultValues?.title ? "Сохранить" : "Добавить"}
        </Button>
      </form>
    </Modal>
  );
}
