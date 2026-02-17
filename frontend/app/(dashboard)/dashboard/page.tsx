"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Plus, Gift } from "lucide-react";
import { toast } from "sonner";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import WishlistCard from "@/components/features/WishlistCard";
import {
  useWishlists,
  useDeleteWishlist,
  useRestoreWishlist,
  useArchiveWishlist,
} from "@/hooks/useWishlists";

export default function DashboardPage() {
  const router = useRouter();
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
      <div>
        <div className="flex items-center justify-between mb-6">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-10 w-40" />
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-36" />
          ))}
        </div>
      </div>
    );
  }

  const wishlists = data?.items || [];

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Мои вишлисты</h1>
          <p className="text-text-muted text-sm mt-1">
            {wishlists.length > 0
              ? `${wishlists.length} ${wishlists.length === 1 ? "вишлист" : wishlists.length < 5 ? "вишлиста" : "вишлистов"}`
              : "Создайте первый вишлист"}
          </p>
        </div>
        <Button onClick={() => router.push("/wishlists/new")}>
          <Plus size={18} className="mr-1.5" />
          Создать
        </Button>
      </div>

      {wishlists.length === 0 ? (
        <EmptyState
          icon={<Gift size={48} />}
          title="У вас пока нет вишлистов"
          description="Создайте список желаний и поделитесь с друзьями"
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
                  className={`px-3 py-1.5 rounded-xl text-sm transition-colors ${
                    page === i + 1
                      ? "bg-primary text-white"
                      : "bg-surface text-text-muted hover:bg-fill"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
