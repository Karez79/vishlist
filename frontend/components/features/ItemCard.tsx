"use client";

import Image from "next/image";
import { useState } from "react";
import { ExternalLink, GripVertical, Pencil, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatPrice } from "@/lib/utils";
import { Badge } from "@/components/ui";
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

  const getStatusBadge = () => {
    if (item.is_reserved) return <Badge variant="reserved">Зарезервирован</Badge>;
    if (item.price && item.total_contributed > 0) {
      const pct = Math.min(Math.round((item.total_contributed / item.price) * 100), 100);
      if (pct >= 100) return <Badge variant="collected">Собрано!</Badge>;
      return <Badge variant="collecting">Сбор {pct}%</Badge>;
    }
    return <Badge variant="available">Доступен</Badge>;
  };

  return (
    <div className="flex gap-3 bg-surface rounded-2xl border border-gray-100 shadow-sm p-4 transition-all duration-200 hover:shadow-md group">
      {/* Drag handle (owner only) */}
      {isOwner && dragHandleProps && (
        <div
          {...dragHandleProps}
          className="flex items-center text-gray-300 hover:text-gray-400 cursor-grab active:cursor-grabbing"
        >
          <GripVertical size={20} />
        </div>
      )}

      {/* Image */}
      <div className="relative w-20 h-20 rounded-xl overflow-hidden flex-shrink-0 bg-gradient-to-br from-rose-50 to-orange-50">
        {item.image_url && !imgError ? (
          <Image
            src={item.image_url}
            alt={item.title}
            fill
            className="object-cover"
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
          {getStatusBadge()}
        </div>

        <div className="flex items-center gap-3 mt-1.5">
          {item.price && (
            <span className="text-sm font-semibold text-primary">
              {formatPrice(item.price)}
            </span>
          )}
          {item.url && (
            <a
              href={item.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-text-muted hover:text-primary transition-colors"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink size={14} />
            </a>
          )}
        </div>

        {item.note && (
          <p className="text-xs text-text-muted mt-1 line-clamp-1">{item.note}</p>
        )}

        {/* Owner actions */}
        {isOwner && (
          <div className="flex items-center gap-2 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
            {onEdit && (
              <button
                onClick={onEdit}
                className="text-xs text-text-muted hover:text-text flex items-center gap-1 transition-colors"
              >
                <Pencil size={12} /> Редактировать
              </button>
            )}
            {onDelete && (
              <button
                onClick={onDelete}
                className="text-xs text-error/70 hover:text-error flex items-center gap-1 transition-colors"
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
