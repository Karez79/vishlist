"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Gift } from "lucide-react";
import { Button, Input, Textarea, Modal, DatePicker } from "@/components/ui";
import { useCreateWishlist, useUpdateWishlist } from "@/hooks/useWishlists";
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

interface WishlistFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  wishlist?: {
    id: string;
    title: string;
    description?: string | null;
    emoji: string;
    event_date?: string | null;
  };
}

export default function WishlistFormModal({
  open,
  onOpenChange,
  wishlist,
}: WishlistFormModalProps) {
  const router = useRouter();
  const isEdit = !!wishlist;

  const [emoji, setEmoji] = useState(wishlist?.emoji || "🎁");
  const [eventDate, setEventDate] = useState(wishlist?.event_date || "");

  const createWishlist = useCreateWishlist();
  const updateWishlist = useUpdateWishlist(wishlist?.id || "");

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      title: wishlist?.title || "",
      description: wishlist?.description || "",
    },
  });

  useEffect(() => {
    if (open) {
      reset({
        title: wishlist?.title || "",
        description: wishlist?.description || "",
      });
      setEmoji(wishlist?.emoji || "🎁");
      setEventDate(wishlist?.event_date || "");
    }
  }, [open, wishlist, reset]);

  const onSubmit = (data: FormData) => {
    const payload = {
      title: data.title,
      description: data.description || undefined,
      emoji,
      event_date: eventDate || (isEdit ? null : undefined),
    };

    if (isEdit) {
      updateWishlist.mutate(payload, {
        onSuccess: () => {
          toast.success("Вишлист обновлён");
          onOpenChange(false);
        },
      });
    } else {
      createWishlist.mutate(
        { ...payload, event_date: eventDate || undefined },
        {
          onSuccess: (result) => {
            onOpenChange(false);
            router.push(`/wishlists/${result.id}`);
          },
        }
      );
    }
  };

  const isPending = isEdit ? updateWishlist.isPending : createWishlist.isPending;

  return (
    <Modal
      open={open}
      onOpenChange={onOpenChange}
      title={isEdit ? "Редактировать вишлист" : "Новый вишлист"}
      description={isEdit ? undefined : "Создайте список желаний и поделитесь с друзьями"}
    >
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

        <Button type="submit" className="w-full" size="lg" loading={isPending}>
          {isEdit ? (
            "Сохранить"
          ) : (
            <>
              <Gift size={18} className="mr-1.5" />
              Создать вишлист
            </>
          )}
        </Button>
      </form>
    </Modal>
  );
}
