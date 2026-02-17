"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Gift, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import WishlistCard from "@/components/features/WishlistCard";
import { useAuthStore } from "@/lib/store";
import {
  useWishlists,
  useDeleteWishlist,
  useRestoreWishlist,
  useArchiveWishlist,
} from "@/hooks/useWishlists";

function getGreeting(): string {
  const hour = new Date().getHours();
  if (hour < 6) return "Доброй ночи";
  if (hour < 12) return "Доброе утро";
  if (hour < 18) return "Добрый день";
  return "Добрый вечер";
}

function getFirstName(name: string | undefined): string {
  if (!name) return "";
  return name.split(" ")[0];
}

export default function DashboardPage() {
  const router = useRouter();
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const { data, isLoading } = useWishlists(page);
  const deleteMutation = useDeleteWishlist();
  const restoreMutation = useRestoreWishlist();
  const archiveMutation = useArchiveWishlist();

  const handleDelete = (id: string) => {
    deleteMutation.mutate(id, {
      onSuccess: () => {
        toast("Вишлист удалён", {
          action: {
            label: "Отменить",
            onClick: () => restoreMutation.mutate(id),
          },
          duration: 5000,
        });
      },
    });
  };

  const handleArchiveToggle = (id: string, archived: boolean) => {
    archiveMutation.mutate({ id, archived });
  };

  if (isLoading) {
    return (
      <div className="pt-4">
        <Skeleton className="h-24 w-full mb-8 rounded-3xl" />
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-7 w-40" />
          <Skeleton className="h-10 w-32" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2].map((i) => (
            <Skeleton key={i} className="h-40 rounded-3xl" />
          ))}
        </div>
      </div>
    );
  }

  const wishlists = data?.items || [];
  const firstName = getFirstName(user?.name);

  return (
    <div className="pt-4">
      {/* Welcome banner */}
      <div className="mb-8 p-6 rounded-3xl bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border border-primary/10">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-text">
              {getGreeting()}{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="text-text-muted text-sm mt-1">
              {wishlists.length > 0
                ? `У вас ${wishlists.length} ${wishlists.length === 1 ? "вишлист" : wishlists.length < 5 ? "вишлиста" : "вишлистов"}`
                : "Создайте первый вишлист и поделитесь с друзьями"}
            </p>
          </div>
          <Button onClick={() => router.push("/wishlists/new")} size="lg">
            <Plus size={18} className="mr-1.5" />
            Создать
          </Button>
        </div>
      </div>

      {wishlists.length === 0 ? (
        <EmptyState
          icon={<Gift size={48} />}
          title="У вас пока нет вишлистов"
          description="Создайте список желаний и поделитесь с друзьями — они смогут выбрать подарки без повторов"
          actionLabel="Создать первый вишлист"
          onAction={() => router.push("/wishlists/new")}
        />
      ) : (
        <>
          <div className="grid gap-4 sm:grid-cols-2">
            {wishlists.map((w) => (
              <WishlistCard
                key={w.id}
                wishlist={w}
                onDelete={handleDelete}
                onArchiveToggle={handleArchiveToggle}
              />
            ))}
          </div>

          {data && data.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: data.pages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`px-3.5 py-1.5 rounded-xl text-sm font-medium transition-all ${
                    page === i + 1
                      ? "bg-primary text-white shadow-sm"
                      : "bg-surface text-text-muted hover:bg-fill border border-separator/60"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}

          {/* Quick tip */}
          {wishlists.length < 3 && (
            <div className="mt-8 flex items-center gap-3 p-4 rounded-2xl bg-fill/70 text-sm text-text-muted">
              <Sparkles size={16} className="text-primary flex-shrink-0" />
              <p>Поделитесь ссылкой на вишлист в мессенджере — друзья смогут выбрать подарки без регистрации</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
