"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Gift, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient, type InfiniteData } from "@tanstack/react-query";
import { EmptyState } from "@/components/ui";
import PublicItemCard from "@/components/features/PublicItemCard";
import ShareButton from "@/components/features/ShareButton";
import Countdown from "@/components/features/Countdown";
import ReserveModal from "@/components/features/ReserveModal";
import ContributeModal from "@/components/features/ContributeModal";
import GuestRecovery from "@/components/features/GuestRecovery";
import { useRouter } from "next/navigation";
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
  const router = useRouter();
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

  const queryClient = useQueryClient();
  const reserveItem = useReserveItem(slug);
  const cancelReservation = useCancelReservation(slug);
  const contributeItem = useContributeItem(slug);
  const cancelContribution = useCancelContribution(slug);
  const updateReservationEmail = useUpdateReservationEmail(slug);
  const updateContributionEmail = useUpdateContributionEmail(slug);

  // Pending cancel timers for delayed DELETE pattern
  const pendingCancels = useRef<Map<string, { timer: NodeJS.Timeout; snapshot: InfiniteData<PublicWishlist, number> | undefined }>>(new Map());

  // Cleanup pending timers on unmount
  useEffect(() => {
    return () => {
      pendingCancels.current.forEach(({ timer }) => clearTimeout(timer));
    };
  }, []);

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

  const handleCancelReservation = useCallback((itemId: string) => {
    const queryKey = ["public-wishlist", slug];
    type InfiniteWishlist = InfiniteData<PublicWishlist, number>;
    const snapshot = queryClient.getQueryData<InfiniteWishlist>(queryKey);

    // Optimistically remove reservation from cache
    if (snapshot) {
      queryClient.setQueryData<InfiniteWishlist>(queryKey, {
        ...snapshot,
        pages: snapshot.pages.map((page) => ({
          ...page,
          items_data: {
            ...page.items_data,
            items: page.items_data.items.map((item) =>
              item.id === itemId
                ? { ...item, is_reserved: false, reservation: null }
                : item
            ),
          },
        })),
      });
    }

    // Delayed DELETE — send after 5s unless undone
    const timer = setTimeout(() => {
      pendingCancels.current.delete(itemId);
      cancelReservation.mutate(itemId, {
        onError: (error) => {
          // Restore on server error
          if (snapshot) queryClient.setQueryData(queryKey, snapshot);
          toast.error(getErrorMessage(error, "Не удалось отменить резервацию"));
        },
      });
    }, 5000);

    pendingCancels.current.set(itemId, { timer, snapshot });

    toast("Резервация отменена", {
      action: {
        label: "Отменить",
        onClick: () => {
          const pending = pendingCancels.current.get(itemId);
          if (pending) {
            clearTimeout(pending.timer);
            if (pending.snapshot) queryClient.setQueryData(queryKey, pending.snapshot);
            pendingCancels.current.delete(itemId);
          }
        },
      },
      duration: 5000,
    });
  }, [slug, queryClient, cancelReservation]);

  const handleCancelContribution = useCallback((contributionId: string) => {
    const queryKey = ["public-wishlist", slug];
    type InfiniteWishlist = InfiniteData<PublicWishlist, number>;
    const snapshot = queryClient.getQueryData<InfiniteWishlist>(queryKey);

    // Optimistically remove contribution from cache
    if (snapshot) {
      queryClient.setQueryData<InfiniteWishlist>(queryKey, {
        ...snapshot,
        pages: snapshot.pages.map((page) => ({
          ...page,
          items_data: {
            ...page.items_data,
            items: page.items_data.items.map((item) => {
              const contribution = item.contributions?.find(
                (c) => c.id === contributionId
              );
              if (!contribution) return item;
              return {
                ...item,
                total_contributed: item.total_contributed - contribution.amount,
                contributors_count: Math.max(0, item.contributors_count - 1),
                contributions: item.contributions?.filter(
                  (c) => c.id !== contributionId
                ),
              };
            }),
          },
        })),
      });
    }

    // Delayed DELETE
    const timer = setTimeout(() => {
      pendingCancels.current.delete(contributionId);
      cancelContribution.mutate(contributionId, {
        onError: (error) => {
          if (snapshot) queryClient.setQueryData(queryKey, snapshot);
          toast.error(getErrorMessage(error, "Не удалось отменить вклад"));
        },
      });
    }, 5000);

    pendingCancels.current.set(contributionId, { timer, snapshot });

    toast("Вклад отменён", {
      action: {
        label: "Отменить",
        onClick: () => {
          const pending = pendingCancels.current.get(contributionId);
          if (pending) {
            clearTimeout(pending.timer);
            if (pending.snapshot) queryClient.setQueryData(queryKey, pending.snapshot);
            pendingCancels.current.delete(contributionId);
          }
        },
      },
      duration: 5000,
    });
  }, [slug, queryClient, cancelContribution]);

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
          <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
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

      <div className="max-w-6xl mx-auto px-4 py-5 sm:py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-5 sm:mb-8">
          <Link
            href="/"
            className="text-text-muted hover:text-text transition-colors text-sm flex items-center gap-1"
          >
            <Gift size={16} className="text-primary" />
            <span className="font-medium">Vishlist</span>
          </Link>
          <div className="lg:hidden">
            <ShareButton slug={wishlist.slug} title={wishlist.title} />
          </div>
        </div>

        {/* Sidebar + Main layout */}
        <div className="lg:grid lg:grid-cols-[320px_1fr] lg:gap-10 lg:items-start">
          {/* Sidebar: wishlist info */}
          <div className="mb-8 lg:mb-0 lg:sticky lg:top-8">
            <div className="text-center bg-surface rounded-3xl border border-separator/60 p-6">
              <div className="w-20 h-20 mx-auto mb-4 rounded-3xl bg-primary/8 flex items-center justify-center text-4xl">
                {wishlist.emoji}
              </div>
              <h1 className="text-2xl font-bold tracking-tight mb-1">
                {wishlist.title}
              </h1>
              {wishlist.description && (
                <p className="text-text-muted mt-2 text-sm leading-relaxed">
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

              <div className="hidden lg:block mt-5 pt-5 border-t border-separator/60">
                <ShareButton slug={wishlist.slug} title={wishlist.title} />
              </div>
            </div>

            {/* Guest recovery — below sidebar */}
            {!wishlist.is_owner && (
              <div className="hidden lg:block mt-4 text-center">
                <GuestRecovery slug={slug} />
              </div>
            )}
          </div>

          {/* Main: items */}
          <div>
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
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {items.map((item, index) => (
                  <PublicItemCard
                    key={item.id}
                    item={item}
                    isOwner={wishlist.is_owner}
                    index={index}
                    onCardTap={
                      wishlist.is_owner
                        ? () => router.push(`/wishlists/${wishlist.id}`)
                        : item.url
                          ? () => window.open(item.url!, "_blank")
                          : undefined
                    }
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
          </div>
        </div>

        {/* Guest recovery — mobile only */}
        {!wishlist.is_owner && (
          <div className="lg:hidden mt-10 text-center">
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
