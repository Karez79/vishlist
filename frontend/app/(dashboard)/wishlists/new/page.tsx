"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ArrowLeft } from "lucide-react";
import { Button, Input } from "@/components/ui";
import { useCreateWishlist } from "@/hooks/useWishlists";

const EMOJIS = ["🎁", "🎂", "🎄", "💍", "🎓", "🏠", "✈️", "🎉", "💝", "🧸", "📱", "👟"];

const schema = z.object({
  title: z.string().min(1, "Введите название").max(100),
  description: z.string().max(500).optional(),
  event_date: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewWishlistPage() {
  const router = useRouter();
  const [emoji, setEmoji] = useState("🎁");
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
        event_date: data.event_date || undefined,
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
        className="flex items-center gap-1 text-text-muted hover:text-text mb-6 transition-colors"
      >
        <ArrowLeft size={18} />
        Назад
      </button>

      <h1 className="text-2xl font-bold tracking-tight mb-6">
        Новый вишлист
      </h1>

      <div className="bg-surface rounded-3xl shadow-[0_2px_8px_rgba(0,0,0,0.06),0_0_1px_rgba(0,0,0,0.1)] p-6">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* Emoji picker */}
          <div>
            <label className="block text-sm font-medium text-text mb-2">
              Иконка
            </label>
            <div className="flex flex-wrap gap-2">
              {EMOJIS.map((e) => (
                <button
                  key={e}
                  type="button"
                  onClick={() => setEmoji(e)}
                  className={`w-10 h-10 rounded-2xl text-xl flex items-center justify-center transition-all ${
                    emoji === e
                      ? "bg-primary/10 ring-2 ring-primary scale-110"
                      : "bg-fill hover:bg-separator"
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

          <Input
            label="Дата события"
            type="date"
            {...register("event_date")}
          />

          <Button
            type="submit"
            className="w-full"
            size="lg"
            loading={createMutation.isPending}
          >
            Создать вишлист
          </Button>
        </form>
      </div>
    </div>
  );
}
