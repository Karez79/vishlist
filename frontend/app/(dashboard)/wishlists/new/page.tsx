"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Gift } from "lucide-react";
import { Button, Input, Textarea, DatePicker } from "@/components/ui";
import { useCreateWishlist } from "@/hooks/useWishlists";

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

export default function NewWishlistPage() {
  const router = useRouter();
  const [emoji, setEmoji] = useState("🎁");
  const [eventDate, setEventDate] = useState("");
  const createMutation = useCreateWishlist();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = (data: FormData) => {
    createMutation.mutate(
      {
        title: data.title,
        description: data.description || undefined,
        emoji,
        event_date: eventDate || undefined,
      },
      {
        onSuccess: (wishlist) => {
          router.push(`/wishlists/${wishlist.id}`);
        },
      }
    );
  };

  return (
    <div className="max-w-lg mx-auto">
      <button
        onClick={() => router.back()}
        className="flex items-center gap-1.5 text-text-muted hover:text-text mb-8 transition-colors text-sm"
      >
        <ArrowLeft size={16} />
        Назад
      </button>

      {/* Header with live preview */}
      <div className="text-center mb-8">
        <div className="w-24 h-24 mx-auto mb-5 rounded-3xl bg-primary/8 flex items-center justify-center text-5xl transition-all duration-300">
          {emoji}
        </div>
        <h1 className="text-2xl font-bold tracking-tight">
          Новый вишлист
        </h1>
        <p className="text-text-muted text-sm mt-1">
          Создайте список желаний и поделитесь с друзьями
        </p>
      </div>

      <div className="bg-surface rounded-3xl border border-separator/60 p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Emoji picker by category */}
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
            loading={createMutation.isPending}
          >
            <Gift size={18} className="mr-1.5" />
            Создать вишлист
          </Button>
        </form>
      </div>
    </div>
  );
}
