"use client";

import { useState } from "react";
import { Plus, Gift, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import WishlistCard from "@/components/features/WishlistCard";
import WishlistFormModal from "@/components/features/WishlistFormModal";
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
  const parts = name.trim().split(/\s+/);
  // Russian ФИО format (3 parts): take second word (имя)
  if (parts.length >= 3) return parts[1];
  // "Имя Фамилия" or single name
  return parts[0];
}

export default function DashboardPage() {
  const user = useAuthStore((s) => s.user);
  const [page, setPage] = useState(1);
  const [createOpen, setCreateOpen] = useState(false);
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
          <Skeleton className="h-10 w-32 rounded-2xl" />
        </div>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="rounded-3xl overflow-hidden border border-separator/60">
              <Skeleton className="h-28 rounded-none" />
              <div className="p-5 space-y-3">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <Skeleton className="h-8 w-full mt-2" />
              </div>
            </div>
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
      <div className="mb-6 sm:mb-8 p-4 sm:p-6 rounded-3xl bg-gradient-to-br from-primary/5 via-primary/3 to-transparent border border-primary/10">
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-text truncate">
              {getGreeting()}{firstName ? `, ${firstName}` : ""}
            </h1>
            <p className="text-text-muted text-sm mt-1">
              {wishlists.length > 0
                ? `У вас ${wishlists.length} ${wishlists.length === 1 ? "вишлист" : wishlists.length < 5 ? "вишлиста" : "вишлистов"}`
                : "Создайте первый вишлист и поделитесь с друзьями"}
            </p>
          </div>
          <Button onClick={() => setCreateOpen(true)} size="lg" className="flex-shrink-0">
            <Plus size={18} className="sm:mr-1.5" />
            <span className="hidden sm:inline">Создать</span>
          </Button>
        </div>
      </div>

      {wishlists.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-separator/60 p-8">
          <EmptyState
            icon={<Gift size={48} />}
            title="У вас пока нет вишлистов"
            description="Создайте список желаний и поделитесь с друзьями — они смогут выбрать подарки без повторов"
            actionLabel="Создать первый вишлист"
            onAction={() => setCreateOpen(true)}
          />
        </div>
      ) : (
        <>
          <h2 className="font-semibold text-text mb-4">
            Мои вишлисты
            <span className="text-text-muted font-normal ml-1.5">{wishlists.length}</span>
          </h2>
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {wishlists.map((w, i) => (
              <motion.div
                key={w.id}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: Math.min(i * 0.08, 0.4) }}
              >
                <WishlistCard
                  wishlist={w}
                  onDelete={handleDelete}
                  onArchiveToggle={handleArchiveToggle}
                />
              </motion.div>
            ))}
          </div>

          {data && data.pages > 1 && (
            <div className="flex justify-center gap-2 mt-8">
              {Array.from({ length: data.pages }, (_, i) => (
                <button
                  key={i + 1}
                  onClick={() => setPage(i + 1)}
                  className={`w-9 h-9 rounded-xl text-sm font-medium transition-all duration-200 active:scale-95 ${
                    page === i + 1
                      ? "bg-primary text-white"
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

      {/* Create wishlist modal */}
      <WishlistFormModal
        open={createOpen}
        onOpenChange={setCreateOpen}
      />
    </div>
  );
}
