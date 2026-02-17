"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Gift, Share2 } from "lucide-react";
import { Badge, EmptyState } from "@/components/ui";
import ItemCard from "@/components/features/ItemCard";
import ShareButton from "@/components/features/ShareButton";
import Countdown from "@/components/features/Countdown";
import { usePublicWishlist } from "@/hooks/usePublicWishlist";
import type { PublicWishlist } from "@/types";

interface WishlistContentProps {
  initialData: PublicWishlist;
  slug: string;
}

export default function WishlistContent({
  initialData,
  slug,
}: WishlistContentProps) {
  const { data } = usePublicWishlist(slug, initialData);
  const wishlist = data || initialData;
  const items = wishlist.items_data?.items || [];

  return (
    <div className="min-h-screen bg-bg">
      {/* Owner banner */}
      {wishlist.is_owner && (
        <div className="bg-primary/10 border-b border-primary/20">
          <div className="max-w-2xl mx-auto px-4 py-3 flex items-center justify-between">
            <span className="text-sm text-primary font-medium">
              Это ваш вишлист
            </span>
            <Link
              href={`/wishlists/${wishlist.id}`}
              className="text-sm text-primary font-semibold hover:text-primary/80 transition-colors"
            >
              Редактировать →
            </Link>
          </div>
        </div>
      )}

      <div className="max-w-2xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <a
            href="/"
            className="text-text-muted hover:text-text transition-colors text-sm"
          >
            ← Vishlist
          </a>
          <ShareButton slug={wishlist.slug} />
        </div>

        {/* Wishlist info */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">{wishlist.emoji}</div>
          <h1 className="text-3xl font-heading font-bold mb-1">
            {wishlist.title}
          </h1>
          {wishlist.description && (
            <p className="text-text-muted mt-2 max-w-md mx-auto">
              {wishlist.description}
            </p>
          )}

          {/* Owner info */}
          <div className="flex items-center justify-center gap-2 mt-4 text-sm text-text-muted">
            <Gift size={14} />
            <span>Вишлист от {wishlist.owner_name}</span>
          </div>

          {/* Countdown */}
          {wishlist.event_date && (
            <Countdown eventDate={wishlist.event_date} />
          )}
        </div>

        {/* Items */}
        <div className="mb-4">
          <h2 className="font-semibold text-text">
            Желания ({items.length})
          </h2>
        </div>

        {items.length === 0 ? (
          <EmptyState
            title="Владелец ещё не добавил желания"
            description="Загляните позже!"
          />
        ) : (
          <div className="space-y-3">
            {items.map((item) => (
              <ItemCard
                key={item.id}
                item={item}
                isOwner={false}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
