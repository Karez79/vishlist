"use client";

import { useState } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Link2, Image as ImageIcon, X } from "lucide-react";
import { Button, Input, Modal } from "@/components/ui";

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

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema) as Resolver<FormData>,
    defaultValues: defaultValues || {},
  });

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
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={title}
    >
      <form onSubmit={handleSubmit(handleFormSubmit)} className="space-y-4">
        <Input
          label="Название"
          placeholder="Наушники Sony WH-1000XM5"
          error={errors.title?.message}
          {...register("title")}
        />

        <Input
          label="Ссылка на товар"
          placeholder="https://..."
          error={errors.url?.message}
          {...register("url")}
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
            <Input
              label="Ссылка на картинку"
              placeholder="https://...image.jpg"
              error={errors.image_url?.message}
              {...register("image_url")}
            />

            <div>
              <label className="block text-sm font-medium text-text mb-1.5">
                Заметка для друзей
              </label>
              <textarea
                rows={2}
                placeholder="Хочу именно синий цвет"
                className="w-full px-3 py-2 rounded-xl border border-gray-200 bg-surface text-text placeholder:text-text-muted/60 focus:outline-none focus:ring-2 focus:ring-primary/30 focus:border-primary transition-all duration-200 resize-none"
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
