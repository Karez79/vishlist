"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft, Gift } from "lucide-react";
import { Button, Input, DatePicker } from "@/components/ui";
import { useCreateWishlist } from "@/hooks/useWishlists";

const EMOJIS = ["🎁", "🎂", "🎄", "💍", "🎓", "🏠", "✈️", "🎉", "💝", "🧸", "📱", "👟"];

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

      {/* Header with preview */}
      <div className="text-center mb-8">
        <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-primary/8 flex items-center justify-center text-4xl">
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
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Emoji picker */}
          <div>
            <label className="block text-sm font-medium text-text mb-2.5">
              Иконка
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-11 h-11 rounded-2xl text-xl flex items-center justify-center transition-all duration-200 ${
                    emoji === e
                      ? "bg-primary/10 ring-2 ring-primary scale-110 shadow-sm"
                      : "bg-fill hover:bg-separator hover:scale-105"
                  }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          <Input
            label="Название"
            placeholder="День рождения, Новый год..."
            error={errors.title?.message}
            {...register("title")}
          />

          <div>
            <label
              htmlFor="description"
              className="block text-sm font-medium text-text mb-1.5"
            >
              Описание
              <span className="text-text-muted font-normal"> (необязательно)</span>
            </label>
            <textarea
              id="description"
              rows={3}
              placeholder="Расскажите друзьям о событии..."
              className="w-full px-4 py-2.5 rounded-2xl bg-surface text-text border border-separator placeholder:text-text-muted/50 focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200 resize-none"
              {...register("description")}
            />
          </div>

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
