"use client";

import { useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Plus } from "lucide-react";
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
      <div className="max-w-2xl mx-auto">
        <Skeleton className="h-8 w-48 mb-6" />
        <Skeleton className="h-24 mb-4" />
        <Skeleton className="h-24 mb-4" />
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
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <button
          onClick={() => router.push("/dashboard")}
          className="flex items-center gap-1 text-text-muted hover:text-text transition-colors"
        >
          <ArrowLeft size={18} />
          Назад
        </button>
        <ShareButton slug={wishlist.slug} />
      </div>

      <div className="flex items-center gap-3 mb-6">
        <span className="text-3xl">{wishlist.emoji}</span>
        <div>
          <h1 className="text-2xl font-bold tracking-tight">{wishlist.title}</h1>
          {wishlist.description && (
            <p className="text-text-muted text-sm mt-0.5">
              {wishlist.description}
            </p>
          )}
        </div>
      </div>

      {/* Items section */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-semibold text-text">
          Желания ({items.length})
        </h2>
        <Button size="sm" onClick={() => setAddFormOpen(true)}>
          <Plus size={16} className="mr-1" />
          Добавить
        </Button>
      </div>

      {items.length === 0 ? (
        <EmptyState
          title="Здесь пока пусто"
          description="Добавьте первое желание. Можно вставить ссылку — название и картинка подтянутся автоматически"
          actionLabel="Добавить первое желание"
          onAction={() => setAddFormOpen(true)}
        />
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
