"use client";

import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button, Input, Textarea, Modal, DatePicker } from "@/components/ui";
import { useUpdateWishlist } from "@/hooks/useWishlists";
import { toast } from "sonner";

const EMOJI_CATEGORIES = [
  {
    label: "Праздники",
    emojis: ["🎁", "🎂", "🎉", "🥂", "🎄", "🎃"],
  },
  {
    label: "Особый день",
    emojis: ["💍", "👶", "🎓", "💝", "🌹", "🏠"],
  },
  {
    label: "Увлечения",
    emojis: ["✈️", "🎮", "📚", "🎵", "👗", "⚽"],
  },
];

const schema = z.object({
  title: z.string().min(1, "Введите название").max(100),
  description: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

interface WishlistEditModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlist: {
    id: string;
    title: string;
    description?: string | null;
    emoji: string;
    event_date?: string | null;
  };
}

export default function WishlistEditModal({
  open,
  onOpenChange,
  wishlist,
}: WishlistEditModalProps) {
  const [emoji, setEmoji] = useState(wishlist.emoji);
  const [eventDate, setEventDate] = useState(wishlist.event_date || "");
  const updateWishlist = useUpdateWishlist(wishlist.id);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: wishlist.title,
      description: wishlist.description || "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: wishlist.title,
        description: wishlist.description || "",
      });
      setEmoji(wishlist.emoji);
      setEventDate(wishlist.event_date || "");
    }
  }, [open, wishlist, reset]);

  const onSubmit = (data: FormData) => {
    updateWishlist.mutate(
      {
        title: data.title,
        description: data.description || undefined,
        emoji,
        event_date: eventDate || null,
      },
      {
        onSuccess: () => {
          toast.success("Вишлист обновлён");
          onOpenChange(false);
        },
      }
    );
  };

  return (
    <Modal open={open} onOpenChange={onOpenChange} title="Редактировать вишлист">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-text mb-3">
            Иконка
          </label>
          <div className="space-y-4">
            {EMOJI_CATEGORIES.map((cat) => (
              <div key={cat.label}>
                <span className="text-xs text-text-muted font-medium uppercase tracking-wider">
                  {cat.label}
                </span>
                <div className="flex flex-wrap gap-2 mt-1.5">
                  {cat.emojis.map((e) => (
                    <button
                      key={e}
                      type="button"
                      onClick={() => setEmoji(e)}
                      className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl text-xl sm:text-2xl flex items-center justify-center transition-all duration-200 ${
                        emoji === e
                          ? "bg-primary/10 ring-2 ring-primary scale-110 shadow-md shadow-primary/10"
                          : "bg-fill hover:bg-separator/80 hover:scale-105 active:scale-95"
                      }`}
                    >
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-separator/60" />

        <Input
          label="Название"
          placeholder="День рождения, Новый год..."
          error={errors.title?.message}
          {...register("title")}
        />

        <Textarea
          label="Описание (необязательно)"
          rows={3}
          placeholder="Расскажите друзьям о событии..."
          {...register("description")}
        />

        <DatePicker
          label="Дата события"
          placeholder="Необязательно"
          value={eventDate}
          onChange={setEventDate}
        />

        <Button
          type="submit"
          className="w-full"
          size="lg"
          loading={updateWishlist.isPending}
        >
          Сохранить
        </Button>
      </form>
    </Modal>
  );
}
