"use client";

import Image from "next/image";
import { useState } from "react";
import { ExternalLink, GripVertical, Pencil, Trash2 } from "lucide-react";
import { formatPrice } from "@/lib/utils";
import { getStatusBadge } from "@/components/ui/item-utils";
import type { WishlistItem } from "@/types";

interface ItemCardProps {
  item: WishlistItem;
  isOwner?: boolean;
  onEdit?: () => void;
  onDelete?: () => void;
  dragHandleProps?: Record<string, unknown>;
}

export default function ItemCard({
  item,
  isOwner = false,
  onEdit,
  onDelete,
  dragHandleProps,
}: ItemCardProps) {
  const [imgError, setImgError] = useState(false);

  return (
    <div className="flex gap-4 bg-surface rounded-3xl border border-separator/60 p-4 transition-all duration-200 hover:border-primary/15 hover:shadow-[0_4px_20px_rgba(0,0,0,0.06)] group">
      {/* Drag handle (owner only) */}
      {isOwner && dragHandleProps && (
        <div
          {...dragHandleProps}
          className="flex items-center text-separator hover:text-text-muted cursor-grab active:cursor-grabbing transition-colors"
        >
          <GripVertical size={20} />
        </div>
      )}

      {/* Image — bigger for products */}
      <div className="relative w-24 h-28 rounded-2xl overflow-hidden flex-shrink-0 bg-fill">
        {item.image_url && !imgError ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-contain"
            sizes="96px"
            onError={() => setImgError(true)}
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-3xl opacity-30">
            🎁
          </div>
        )}
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 py-0.5">
        <div className="flex items-start gap-2">
          {getStatusBadge(item)}
        </div>
        <h4 className="font-medium text-text leading-snug mt-1" title={item.title}>
          {item.title}
        </h4>

        <div className="flex items-center gap-3 mt-2">
          {item.price != null && (
            <span className="text-sm font-bold text-text">
              {formatPrice(item.price)}
            </span>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-[13px] font-medium text-primary hover:text-primary-light transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={14} />
              Ссылка на товар
            </a>
          )}
        </div>

        {item.note && (
          <p className="text-xs text-text-muted mt-1.5 line-clamp-1">{item.note}</p>
        )}

        {/* Owner actions */}
        {isOwner && (
          <div className="flex items-center gap-1 mt-2.5">
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-xs text-text-muted hover:text-text hover:bg-fill flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all"
              >
                <Pencil size={12} /> Редактировать
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-xs text-error/60 hover:text-error hover:bg-error/5 flex items-center gap-1 px-2.5 py-1.5 rounded-xl transition-all"
              >
                <Trash2 size={12} /> Удалить
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
