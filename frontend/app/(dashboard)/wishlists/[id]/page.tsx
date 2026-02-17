"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus, Gift } from "lucide-react";
import { toast } from "sonner";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { Button, EmptyState, Skeleton } from "@/components/ui";
import SortableItemCard from "@/components/features/SortableItemCard";
import ItemForm from "@/components/features/ItemForm";
import ShareButton from "@/components/features/ShareButton";
import { useWishlist } from "@/hooks/useWishlists";
import {
  useItems,
  useCreateItem,
  useUpdateItem,
  useDeleteItem,
  useRestoreItem,
  useReorderItems,
} from "@/hooks/useItems";

export default function WishlistEditPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;

  const { data: wishlist, isLoading: wishlistLoading } = useWishlist(id);
  const { data: itemsData } = useItems(id);
  const createItem = useCreateItem(id);
  const updateItem = useUpdateItem(id);
  const deleteItem = useDeleteItem(id);
  const restoreItem = useRestoreItem(id);
  const reorderItems = useReorderItems(id);

  const [addFormOpen, setAddFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<string | null>(null);

  const items = itemsData?.items || [];
  const currentEditItem = items.find((i) => i.id === editingItem);

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = items.findIndex((i) => i.id === active.id);
    const newIndex = items.findIndex((i) => i.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;

    const reordered = arrayMove(items, oldIndex, newIndex);
    const reorderData = reordered.map((item, index) => ({
      id: item.id,
      position: index + 1,
    }));
    reorderItems.mutate(reorderData);
  };

  const handleDeleteItem = (itemId: string) => {
    deleteItem.mutate(itemId, {
      onSuccess: () => {
        toast("Подарок удалён", {
          action: {
            label: "Отменить",
            onClick: () => restoreItem.mutate(itemId),
          },
          duration: 5000,
        });
      },
    });
  };

  if (wishlistLoading) {
    return (
      <div className="max-w-2xl mx-auto pt-4">
        <Skeleton className="h-6 w-20 mb-8 rounded-xl" />
        <div className="flex items-center gap-4 mb-8">
          <Skeleton className="w-16 h-16 rounded-3xl" />
          <div>
            <Skeleton className="h-7 w-48 mb-2" />
            <Skeleton className="h-4 w-32" />
          </div>
        </div>
        <Skeleton className="h-28 mb-3 rounded-3xl" />
        <Skeleton className="h-28 mb-3 rounded-3xl" />
      </div>
    );
  }

  if (!wishlist) {
    return (
      <EmptyState
        title="Вишлист не найден"
        actionLabel="К вишлистам"
        onAction={() => router.push("/dashboard")}
      />
    );
  }

  return (
    <div className="max-w-2xl mx-auto pt-4">
      {/* Back button */}
      <button
        onClick={() => router.push("/dashboard")}
        className="flex items-center gap-1.5 text-text-muted hover:text-text transition-colors text-sm mb-8"
      >
        <ArrowLeft size={16} />
        Назад
      </button>

      {/* Wishlist header */}
      <div className="flex items-start justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-primary/8 flex items-center justify-center text-3xl flex-shrink-0">
            {wishlist.emoji}
          </div>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">{wishlist.title}</h1>
            {wishlist.description && (
              <p className="text-text-muted text-sm mt-0.5">
                {wishlist.description}
              </p>
            )}
          </div>
        </div>
        <ShareButton slug={wishlist.slug} />
      </div>

      {/* Items section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-text">
          Желания
          <span className="text-text-muted font-normal ml-1.5">
            {items.length}
          </span>
        </h2>
        <Button size="sm" onClick={() => setAddFormOpen(true)}>
          <Plus size={16} className="mr-1" />
          Добавить
        </Button>
      </div>

      {items.length === 0 ? (
        <div className="bg-surface rounded-3xl border border-separator/60 p-8">
          <EmptyState
            icon={<Gift size={40} />}
            title="Здесь пока пусто"
            description="Добавьте первое желание — вставьте ссылку, и название с картинкой подтянутся автоматически"
            actionLabel="Добавить первое желание"
            onAction={() => setAddFormOpen(true)}
          />
        </div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={items.map((i) => i.id)}
            strategy={verticalListSortingStrategy}
          >
            <div className="space-y-3">
              {items.map((item) => (
                <SortableItemCard
                  key={item.id}
                  item={item}
                  onEdit={() => setEditingItem(item.id)}
                  onDelete={() => handleDeleteItem(item.id)}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {/* Add item form */}
      <ItemForm
        open={addFormOpen}
        onOpenChange={setAddFormOpen}
        onSubmit={(data) => createItem.mutate(data)}
        loading={createItem.isPending}
      />

      {/* Edit item form */}
      {currentEditItem && (
        <ItemForm
          open={!!editingItem}
          onOpenChange={(open) => {
            if (!open) setEditingItem(null);
          }}
          title="Редактировать"
          defaultValues={{
            title: currentEditItem.title,
            url: currentEditItem.url || "",
            price: currentEditItem.price || undefined,
            image_url: currentEditItem.image_url || "",
            note: currentEditItem.note || "",
          }}
          onSubmit={(data) => {
            updateItem.mutate(
              { id: currentEditItem.id, data },
              { onSuccess: () => setEditingItem(null) }
            );
          }}
          loading={updateItem.isPending}
        />
      )}
    </div>
  );
}
