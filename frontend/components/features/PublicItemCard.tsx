"use client";

import Image from "next/image";
import { useState } from "react";
import { ExternalLink, Pencil } from "lucide-react";
import { motion } from "framer-motion";
import { Button, ProgressBar } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import { getStatusBadge } from "@/components/ui/item-utils";
import type { WishlistItem } from "@/types";

interface PublicItemCardProps {
  item: WishlistItem;
  isOwner: boolean;
  index?: number;
  onCardTap?: () => void;
  onReserve?: () => void;
  onContribute?: () => void;
  onCancelReservation?: () => void;
  onCancelContribution?: (contributionId: string) => void;
}

export default function PublicItemCard({
  item,
  isOwner,
  index = 0,
  onCardTap,
  onReserve,
  onContribute,
  onCancelReservation,
  onCancelContribution,
}: PublicItemCardProps) {
  const [imgError, setImgError] = useState(false);

  const hasContributions = item.total_contributed > 0;
  const isFullyCollected =
    item.price && item.total_contributed >= item.price;
  const myReservation = item.reservation?.is_mine;
  const myContributions = item.contributions?.filter((c) => c.is_mine) || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay: Math.min(index * 0.06, 0.4) }}
      className={`bg-surface rounded-3xl border border-separator/60 overflow-hidden transition-all duration-200 active:scale-[0.98] hover:border-primary/15 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] ${onCardTap ? "cursor-pointer" : ""}`}
      onClick={onCardTap}
    >
      {/* Image */}
      {item.image_url && !imgError ? (
        <div className="relative w-full aspect-[4/3] bg-fill">
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 300px"
            onError={() => setImgError(true)}
          />
          <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3">
            {getStatusBadge(item)}
          </div>
        </div>
      ) : (
        <div className="relative w-full aspect-[4/3] bg-fill flex items-center justify-center">
          <span className="text-5xl opacity-30">🎁</span>
          <div className="absolute top-2.5 right-2.5 sm:top-3 sm:right-3">
            {getStatusBadge(item)}
          </div>
        </div>
      )}

      {/* Content */}
      <div className="p-3.5 sm:p-4">
        <h4 className="font-medium text-text line-clamp-2 leading-snug text-[15px] sm:text-base" title={item.title}>
          {item.title}
        </h4>

        <div className="flex items-center gap-2 sm:gap-3 mt-2">
          {item.price != null && (
            <span className="text-[15px] sm:text-base font-bold text-text">
              {formatPrice(item.price)}
            </span>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[15px] font-medium text-primary hover:text-primary-light active:opacity-70 transition-colors ml-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={16} />
              Ссылка на товар
            </a>
          )}
        </div>

        {item.note && (
          <p className="text-xs text-text-muted mt-2 line-clamp-2">
            {item.note}
          </p>
        )}

        {/* Progress bar for contributions */}
        {item.price && hasContributions && (
          <div className="mt-3">
            <ProgressBar
              current={item.total_contributed}
              total={item.price}
              contributorsCount={item.contributors_count}
            />
          </div>
        )}

        {/* Reservation info */}
        {!isOwner && item.reservation && (
          <div className="mt-3 text-xs text-text-muted bg-reserved/5 border border-reserved/10 rounded-xl px-3 py-2">
            Зарезервировал(а): <span className="font-medium">{item.reservation.guest_name}</span>
            {myReservation && (
              <span className="text-primary font-medium ml-1">(это вы)</span>
            )}
          </div>
        )}

        {/* Contribution details */}
        {!isOwner && item.contributions && item.contributions.length > 0 && (
          <div className="mt-2 space-y-1">
            {item.contributions.map((c) => (
              <div
                key={c.id}
                className="text-xs text-text-muted flex items-center justify-between bg-fill rounded-xl px-3 py-2"
              >
                <span>
                  {c.guest_name}{" "}
                  {c.is_mine && (
                    <span className="text-primary font-medium">(вы)</span>
                  )}
                </span>
                <span className="font-semibold text-text">{formatPrice(c.amount)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Action buttons */}
        {!isOwner && !item.is_reserved && !isFullyCollected && (
          <div className="flex flex-col sm:flex-row gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
            {!hasContributions && onReserve && (
              <Button size="md" onClick={onReserve} className="flex-1">
                Зарезервировать
              </Button>
            )}
            {item.price && !item.is_reserved && onContribute && (
              <Button
                size="md"
                variant={hasContributions ? "primary" : "secondary"}
                onClick={onContribute}
                className="flex-1"
              >
                Скинуться
              </Button>
            )}
          </div>
        )}

        {/* Cancel buttons */}
        {!isOwner && myReservation && onCancelReservation && (
          <div className="mt-3" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={onCancelReservation}
              className="text-xs text-error/60 hover:text-error active:opacity-70 transition-colors py-1"
            >
              Отменить резервацию
            </button>
          </div>
        )}

        {!isOwner && myContributions.length > 0 && onCancelContribution && (
          <div className="mt-2 space-y-1" onClick={(e) => e.stopPropagation()}>
            {myContributions.map((c) => (
              <button
                key={c.id}
                onClick={() => onCancelContribution(c.id)}
                className="text-xs text-error/60 hover:text-error active:opacity-70 transition-colors py-1"
              >
                Отменить вклад ({formatPrice(c.amount)})
              </button>
            ))}
          </div>
        )}

        {/* Owner: edit button */}
        {isOwner && onCardTap && (
          <button
            onClick={(e) => { e.stopPropagation(); onCardTap(); }}
            className="flex items-center justify-center gap-2 mt-3 w-full py-2.5 rounded-xl bg-primary/10 text-[15px] font-medium text-primary hover:bg-primary/15 active:opacity-70 transition-colors"
          >
            <Pencil size={16} />
            Редактировать
          </button>
        )}
      </div>
    </motion.div>
  );
}
