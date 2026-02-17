"use client";

import { useRouter } from "next/navigation";
import { Calendar, Gift, Archive, Trash2, ArchiveRestore } from "lucide-react";
import { Badge } from "@/components/ui";
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
    <div
      className={`group bg-surface rounded-3xl border border-separator/60 p-5 cursor-pointer transition-all duration-200 hover:border-primary/20 hover:shadow-[0_8px_30px_rgba(0,122,255,0.08)] ${wishlist.is_archived ? "opacity-50" : ""}`}
      onClick={() => router.push(`/wishlists/${wishlist.id}`)}
    >
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-fill flex items-center justify-center text-2xl flex-shrink-0 group-hover:scale-105 transition-transform duration-200">
          {wishlist.emoji}
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-semibold text-text truncate">{wishlist.title}</h3>
            <div className="flex items-center gap-1 flex-shrink-0">
              {wishlist.is_archived ? (
                <Badge variant="archived">Архив</Badge>
              ) : (
                <ShareButton slug={wishlist.slug} variant="ghost" size="sm" />
              )}
            </div>
          </div>
          {wishlist.description && (
            <p className="text-sm text-text-muted line-clamp-1 mt-0.5">
              {wishlist.description}
            </p>
          )}
          <div className="flex items-center gap-3 mt-2 text-xs text-text-muted">
            <span className="flex items-center gap-1">
              <Gift size={13} />
              {wishlist.items_count} {wishlist.items_count === 1 ? "желание" : wishlist.items_count < 5 ? "желания" : "желаний"}
            </span>
            {wishlist.event_date && (
              <span className="flex items-center gap-1">
                <Calendar size={13} />
                {new Date(wishlist.event_date).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "short",
                })}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Action buttons row */}
      <div
        className="flex items-center gap-2 mt-4 pt-3 border-t border-separator/60"
        onClick={(e) => e.stopPropagation()}
      >
        {onArchiveToggle && (
          <button
            className="text-xs text-text-muted hover:text-text flex items-center gap-1 px-2 py-1 rounded-xl hover:bg-fill transition-all"
            onClick={() => onArchiveToggle(wishlist.id, !wishlist.is_archived)}
          >
            {wishlist.is_archived ? (
              <>
                <ArchiveRestore size={13} /> Разархивировать
              </>
            ) : (
              <>
                <Archive size={13} /> В архив
              </>
            )}
          </button>
        )}
        {onDelete && (
          <button
            className="text-xs text-error/60 hover:text-error hover:bg-error/5 flex items-center gap-1 px-2 py-1 rounded-lg ml-auto transition-all"
            onClick={() => onDelete(wishlist.id)}
          >
            <Trash2 size={13} /> Удалить
          </button>
        )}
      </div>
    </div>
  );
}
