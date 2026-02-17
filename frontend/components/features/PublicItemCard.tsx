"use client";

import Image from "next/image";
import { useState } from "react";
import { ExternalLink } from "lucide-react";
import { motion } from "framer-motion";
import { Button, ProgressBar } from "@/components/ui";
import { formatPrice } from "@/lib/utils";
import { getStatusBadge } from "@/components/ui/item-utils";
import type { WishlistItem } from "@/types";

interface PublicItemCardProps {
  item: WishlistItem;
  isOwner: boolean;
  index?: number;
  onReserve?: () => void;
  onContribute?: () => void;
  onCancelReservation?: () => void;
  onCancelContribution?: (contributionId: string) => void;
}

export default function PublicItemCard({
  item,
  isOwner,
  index = 0,
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
      className="bg-surface rounded-3xl border border-separator/60 p-4 transition-all duration-200 hover:border-primary/15 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)]"
    >
      <div className="flex gap-4">
        {/* Image */}
        <div className="relative w-20 h-24 rounded-2xl overflow-hidden flex-shrink-0 bg-fill">
          {item.image_url && !imgError ? (
            <Image
              src={item.image_url}
              alt={item.title}
              fill
              className="object-contain"
              sizes="80px"
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl">
              🎁
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2">
            <h4 className="font-medium text-text line-clamp-2" title={item.title}>
              {item.title}
            </h4>
            {getStatusBadge(item)}
          </div>

          <div className="flex items-center gap-3 mt-1.5">
            {item.price != null && (
              <span className="text-sm font-semibold text-text">
                {formatPrice(item.price)}
              </span>
            )}
            {item.url && (
              <a
                href={item.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-xs text-primary hover:text-primary-light transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <ExternalLink size={12} />
                Ссылка
              </a>
            )}
          </div>

          {item.note && (
            <p className="text-xs text-text-muted mt-1.5 line-clamp-2">
              {item.note}
            </p>
          )}
        </div>
      </div>

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

      {/* Reservation info (for guests) */}
      {!isOwner && item.reservation && (
        <div className="mt-3 text-xs text-text-muted bg-reserved/5 border border-reserved/10 rounded-2xl px-3 py-2">
          Зарезервировал(а): <span className="font-medium">{item.reservation.guest_name}</span>
          {myReservation && (
            <span className="text-primary font-medium ml-1">(это вы)</span>
          )}
        </div>
      )}

      {/* Contribution details (for guests) */}
      {!isOwner && item.contributions && item.contributions.length > 0 && (
        <div className="mt-2 space-y-1">
          {item.contributions.map((c) => (
            <div
              key={c.id}
              className="text-xs text-text-muted flex items-center justify-between bg-fill rounded-2xl px-3 py-2"
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
        <div className="flex gap-2 mt-4">
          {!hasContributions && onReserve && (
            <Button size="lg" onClick={onReserve} className="flex-1">
              Зарезервировать
            </Button>
          )}
          {item.price && !item.is_reserved && onContribute && (
            <Button
              size="lg"
              variant={hasContributions ? "primary" : "secondary"}
              onClick={onContribute}
              className="flex-1"
            >
              Скинуться
            </Button>
          )}
        </div>
      )}

      {/* Cancel buttons for own actions */}
      {!isOwner && myReservation && onCancelReservation && (
        <div className="mt-3">
          <Button
            size="sm"
            variant="ghost"
            onClick={onCancelReservation}
            className="text-xs text-error/70 hover:text-error"
          >
            Отменить резервацию
          </Button>
        </div>
      )}

      {!isOwner && myContributions.length > 0 && onCancelContribution && (
        <div className="mt-2 space-y-1">
          {myContributions.map((c) => (
            <button
              key={c.id}
              onClick={() => onCancelContribution(c.id)}
              className="text-xs text-error/60 hover:text-error transition-colors px-2 py-1 rounded-xl hover:bg-error/5"
            >
              Отменить вклад ({formatPrice(c.amount)})
            </button>
          ))}
        </div>
      )}
    </motion.div>
  );
}
