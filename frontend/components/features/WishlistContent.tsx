"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { motion } from "framer-motion";
import { EmptyState } from "@/components/ui";
import PublicItemCard from "@/components/features/PublicItemCard";
import ShareButton from "@/components/features/ShareButton";
import Countdown from "@/components/features/Countdown";
import ReserveModal from "@/components/features/ReserveModal";
import ContributeModal from "@/components/features/ContributeModal";
import GuestRecovery from "@/components/features/GuestRecovery";
import { usePublicWishlist } from "@/hooks/usePublicWishlist";
import { useGuestToken } from "@/hooks/useGuestToken";
import {
  useReserveItem,
  useCancelReservation,
  useContributeItem,
  useCancelContribution,
  useUpdateReservationEmail,
  useUpdateContributionEmail,
} from "@/hooks/useReservations";
import { useRealtime } from "@/hooks/useRealtime";
import { useAuthStore } from "@/lib/store";
import apiClient from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";
import type { PublicWishlist, WishlistItem } from "@/types";

interface WishlistContentProps {
  initialData: PublicWishlist;
  slug: string;
}

export default function WishlistContent({
  initialData,
  slug,
}: WishlistContentProps) {
  const searchParams = useSearchParams();
  const {
    data,
    refetch,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = usePublicWishlist(slug, initialData);

  // Merge all pages into a single view
  const firstPage = data?.pages[0] || initialData;
  const wishlist = firstPage;
  const items = data?.pages.flatMap((page) => page.items_data.items) || initialData.items_data.items;
  const totalItems = firstPage.items_data.total;
  const user = useAuthStore((s) => s.user);

  // Realtime updates via WebSocket
  useRealtime(slug);

  const { setToken } = useGuestToken(slug);

  // Handle recovery link from email (?recovery=token)
  const recoveryHandled = useRef(false);
  useEffect(() => {
    const recoveryToken = searchParams.get("recovery");
    if (!recoveryToken || recoveryHandled.current) return;
    recoveryHandled.current = true;

    (async () => {
      try {
        const { data } = await apiClient.post("/guest/verify", {
          token: recoveryToken,
        });
        setToken(data.guest_token);
        window.history.replaceState({}, "", `/w/${slug}`);
        toast.success("Доступ восстановлен!");
        refetch();
      } catch (error) {
        console.error("Recovery verification failed:", error);
        toast.error(
          getErrorMessage(error, "Ссылка устарела. Запросите новую")
        );
        window.history.replaceState({}, "", `/w/${slug}`);
      }
    })();
  }, [searchParams, slug, setToken, refetch]);

  // Infinite scroll observer
  const loadMoreRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!hasNextPage || isFetchingNextPage) return;
    const el = loadMoreRef.current;
    if (!el) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          fetchNextPage();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const reserveItem = useReserveItem(slug);
  const cancelReservation = useCancelReservation(slug);
  const contributeItem = useContributeItem(slug);
  const cancelContribution = useCancelContribution(slug);
  const updateReservationEmail = useUpdateReservationEmail(slug);
  const updateContributionEmail = useUpdateContributionEmail(slug);

  const [reserveModalItem, setReserveModalItem] = useState<WishlistItem | null>(null);
  const [contributeModalItem, setContributeModalItem] = useState<WishlistItem | null>(null);

  const handleReserve = async (guestName: string) => {
    if (!reserveModalItem) throw new Error("No item selected");
    const result = await reserveItem.mutateAsync({
      itemId: reserveModalItem.id,
      guestName,
    });
    if (result.guest_token) {
      setToken(result.guest_token);
    }
    return result;
  };

  const handleCancelReservation = (itemId: string) => {
    cancelReservation.mutate(itemId, {
      onSuccess: () => {
        toast("Резервация отменена");
      },
      onError: (error) => {
        toast.error(getErrorMessage(error, "Не удалось отменить резервацию"));
      },
    });
  };

  const handleCancelContribution = (contributionId: string) => {
    cancelContribution.mutate(contributionId, {
      onSuccess: () => {
        toast("Вклад отменён");
      },
      onError: (error) => {
        toast.error(getErrorMessage(error, "Не удалось отменить вклад"));
      },
    });
  };

  const handleContribute = async (guestName: string, amount: number) => {
    if (!contributeModalItem) throw new Error("No item selected");
    const result = await contributeItem.mutateAsync({
      itemId: contributeModalItem.id,
      guestName,
      amount,
    });
    if (result.guest_token) {
      setToken(result.guest_token);
    }
    return result;
  };

  const handleSaveReservationEmail = async (
    reservationId: string,
    email: string
  ) => {
    await updateReservationEmail.mutateAsync({ reservationId, email });
    toast.success("Email сохранён");
  };

  const handleSaveContributionEmail = async (
    contributionId: string,
    email: string
  ) => {
    await updateContributionEmail.mutateAsync({ contributionId, email });
    toast.success("Email сохранён");
  };

  return (
    <div className="min-h-screen bg-bg">
      {/* Owner banner */}
      {wishlist.is_owner && (
        <div className="bg-primary/5 border-b border-primary/10">
          <div className="max-w-3xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-primary font-medium">
              Это ваш вишлист — друзья видят его так
            </span>
            <Link
              href={`/wishlists/${wishlist.id}`}
              className="text-sm text-primary font-semibold hover:text-primary-light transition-colors"
            >
              Редактировать
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-3xl mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <Link
            href="/"
            className="text-text-muted hover:text-text transition-colors text-sm flex items-center gap-1"
          >
            <Gift size={16} className="text-primary" />
            <span className="font-medium">Vishlist</span>
          </Link>
          <ShareButton slug={wishlist.slug} />
        </div>

        {/* Wishlist header card */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="text-center mb-10 bg-surface rounded-3xl border border-separator/60 p-8"
        >
          <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-primary/8 flex items-center justify-center text-4xl">
            {wishlist.emoji}
          </div>
          <h1 className="text-3xl font-bold tracking-tight mb-1">
            {wishlist.title}
          </h1>
          {wishlist.description && (
            <p className="text-text-muted mt-2 max-w-md mx-auto leading-relaxed">
              {wishlist.description}
            </p>
          )}

          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-text-muted">
            <span className="w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-semibold flex items-center justify-center">
              {wishlist.owner_name.charAt(0).toUpperCase()}
            </span>
            <span>{wishlist.owner_name}</span>
          </div>

          {wishlist.event_date && (
            <Countdown eventDate={wishlist.event_date} />
          )}
        </motion.div>

        {/* Items */}
        <div className="mb-5">
          <h2 className="font-semibold text-text">
            Желания
            <span className="text-text-muted font-normal ml-1.5">{totalItems}</span>
          </h2>
        </div>

        {items.length === 0 ? (
          <div className="bg-surface rounded-3xl border border-separator/60 p-8">
            <EmptyState
              title="Владелец ещё не добавил желания"
              description="Загляните позже!"
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-3">
            {items.map((item, index) => (
              <PublicItemCard
                key={item.id}
                item={item}
                isOwner={wishlist.is_owner}
                index={index}
                onReserve={() => setReserveModalItem(item)}
                onContribute={() => setContributeModalItem(item)}
                onCancelReservation={() => handleCancelReservation(item.id)}
                onCancelContribution={handleCancelContribution}
              />
            ))}
          </div>
        )}

        {/* Infinite scroll trigger */}
        {hasNextPage && (
          <div ref={loadMoreRef} className="flex justify-center py-6">
            {isFetchingNextPage && (
              <Loader2 size={24} className="animate-spin text-text-muted" />
            )}
          </div>
        )}

        {/* Guest recovery */}
        {!wishlist.is_owner && (
          <div className="mt-10 text-center">
            <GuestRecovery slug={slug} />
          </div>
        )}

        {/* Footer */}
        <div className="mt-12 pt-6 border-t border-separator/60 text-center">
          <Link
            href="/"
            className="text-xs text-text-muted hover:text-text transition-colors"
          >
            Создать свой вишлист на Vishlist
          </Link>
        </div>
      </div>

      {/* Reserve modal */}
      <ReserveModal
        open={!!reserveModalItem}
        onOpenChange={(open) => {
          if (!open) setReserveModalItem(null);
        }}
        itemTitle={reserveModalItem?.title || ""}
        onReserve={handleReserve}
        onSaveEmail={handleSaveReservationEmail}
        loading={reserveItem.isPending}
        userName={user?.name}
      />

      {/* Contribute modal */}
      {contributeModalItem && (
        <ContributeModal
          open={!!contributeModalItem}
          onOpenChange={(open) => {
            if (!open) setContributeModalItem(null);
          }}
          itemTitle={contributeModalItem.title}
          price={contributeModalItem.price || 0}
          totalContributed={contributeModalItem.total_contributed}
          onContribute={handleContribute}
          onSaveEmail={handleSaveContributionEmail}
          loading={contributeItem.isPending}
          userName={user?.name}
        />
      )}
    </div>
  );
}
