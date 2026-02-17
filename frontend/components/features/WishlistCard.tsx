"use client";

import { useRouter } from "next/navigation";
import { Calendar, Gift, Archive, Trash2, ArchiveRestore } from "lucide-react";
import { Card, Badge } from "@/components/ui";
import ShareButton from "./ShareButton";

interface WishlistCardProps {
  wishlist: {
    id: string;
    title: string;
    slug: string;
    emoji: string;
    description: string | null;
    event_date: string | null;
    is_archived: boolean;
    items_count: number;
  };
  onDelete?: (id: string) => void;
  onArchiveToggle?: (id: string, archived: boolean) => void;
}

export default function WishlistCard({
  wishlist,
  onDelete,
  onArchiveToggle,
}: WishlistCardProps) {
  const router = useRouter();

  return (
    <Card
      hoverable
      className={wishlist.is_archived ? "opacity-60" : ""}
      onClick={() => router.push(`/wishlists/${wishlist.id}`)}
    >
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-3 min-w-0">
          <span className="text-2xl flex-shrink-0">{wishlist.emoji}</span>
          <div className="min-w-0">
            <h3 className="font-semibold text-text truncate">{wishlist.title}</h3>
            {wishlist.description && (
              <p className="text-sm text-text-muted line-clamp-1 mt-0.5">
                {wishlist.description}
              </p>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 flex-shrink-0 ml-2">
          {wishlist.is_archived ? (
            <Badge variant="archived">Архив</Badge>
          ) : (
            <ShareButton slug={wishlist.slug} variant="ghost" size="sm" />
          )}
        </div>
      </div>

      <div className="flex items-center gap-3 mt-3 text-sm text-text-muted">
        <span className="flex items-center gap-1">
          <Gift size={14} />
          {wishlist.items_count}
        </span>
        {wishlist.event_date && (
          <span className="flex items-center gap-1">
            <Calendar size={14} />
            {new Date(wishlist.event_date).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
            })}
          </span>
        )}
      </div>

      {/* Action buttons row */}
      <div
        className="flex items-center gap-2 mt-3 pt-3 border-t border-separator"
        onClick={(e) => e.stopPropagation()}
      >
        {onArchiveToggle && (
          <button
            className="text-xs text-text-muted hover:text-text flex items-center gap-1 transition-colors"
            onClick={() => onArchiveToggle(wishlist.id, !wishlist.is_archived)}
          >
            {wishlist.is_archived ? (
              <>
                <ArchiveRestore size={14} /> Разархивировать
              </>
            ) : (
              <>
                <Archive size={14} /> Архивировать
              </>
            )}
          </button>
        )}
        {onDelete && (
          <button
            className="text-xs text-error/70 hover:text-error flex items-center gap-1 ml-auto transition-colors"
            onClick={() => onDelete(wishlist.id)}
          >
            <Trash2 size={14} /> Удалить
          </button>
        )}
      </div>
    </Card>
  );
}
