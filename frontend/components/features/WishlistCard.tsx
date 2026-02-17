"use client";

import { useRouter } from "next/navigation";
import { Calendar, Gift, Archive, Pencil, Trash2, ArchiveRestore } from "lucide-react";
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
  onEdit?: (id: string) => void;
  onDelete?: (id: string) => void;
  onArchiveToggle?: (id: string, archived: boolean) => void;
}

export default function WishlistCard({
  wishlist,
  onEdit,
  onDelete,
  onArchiveToggle,
}: WishlistCardProps) {
  const router = useRouter();

  return (
    <div
      className={`group bg-surface rounded-3xl border border-separator/60 cursor-pointer transition-all duration-200 hover:border-primary/20 hover:shadow-[0_8px_30px_rgba(0,122,255,0.08)] active:scale-[0.97] overflow-hidden ${wishlist.is_archived ? "opacity-50" : ""}`}
      onClick={() => router.push(`/wishlists/${wishlist.id}`)}
    >
      {/* Top section with emoji background */}
      <div className="relative bg-fill px-6 pt-8 pb-6 flex items-center justify-center">
        <div className="text-6xl group-hover:scale-110 transition-transform duration-300">
          {wishlist.emoji}
        </div>
        {/* Archived badge */}
        {wishlist.is_archived && (
          <div className="absolute top-3 right-3">
            <Badge variant="archived">Архив</Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-2">
          <h3 className="text-lg font-bold tracking-tight text-text truncate">
            {wishlist.title}
          </h3>
          {!wishlist.is_archived && (
            <div className="flex-shrink-0" onClick={(e) => e.stopPropagation()}>
              <ShareButton slug={wishlist.slug} title={wishlist.title} variant="ghost" size="sm" />
            </div>
          )}
        </div>

        {wishlist.description && (
          <p className="text-sm text-text-muted line-clamp-2 mt-1 leading-relaxed">
            {wishlist.description}
          </p>
        )}

        <div className="flex items-center gap-3 mt-3 text-sm text-text-muted">
          <span className="flex items-center gap-1.5">
            <Gift size={14} />
            {wishlist.items_count} {wishlist.items_count === 1 ? "желание" : wishlist.items_count < 5 ? "желания" : "желаний"}
          </span>
          {wishlist.event_date && (
            <span className="flex items-center gap-1.5">
              <Calendar size={14} />
              {new Date(wishlist.event_date).toLocaleDateString("ru-RU", {
                day: "numeric",
                month: "short",
              })}
            </span>
          )}
        </div>

        {/* Action buttons */}
        <div
          className="grid grid-cols-3 gap-1 mt-4 pt-3 border-t border-separator/60"
          onClick={(e) => e.stopPropagation()}
        >
          {onEdit && (
            <button
              className="text-xs text-text-muted hover:text-text flex items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-fill transition-all active:scale-95"
              onClick={() => onEdit(wishlist.id)}
            >
              <Pencil size={14} /> Редактировать
            </button>
          )}
          {onArchiveToggle && (
            <button
              className="text-xs text-text-muted hover:text-text flex items-center justify-center gap-1.5 py-2 rounded-xl hover:bg-fill transition-all active:scale-95"
              onClick={() => onArchiveToggle(wishlist.id, !wishlist.is_archived)}
            >
              {wishlist.is_archived ? (
                <>
                  <ArchiveRestore size={14} /> Разархивировать
                </>
              ) : (
                <>
                  <Archive size={14} /> В архив
                </>
              )}
            </button>
          )}
          {onDelete && (
            <button
              className="text-xs text-error/60 hover:text-error hover:bg-error/5 flex items-center justify-center gap-1.5 py-2 rounded-xl transition-all active:scale-95"
              onClick={() => onDelete(wishlist.id)}
            >
              <Trash2 size={14} /> Удалить
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
