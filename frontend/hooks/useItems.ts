"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import type { PaginatedResponse, WishlistItem } from "@/types";

export function useItems(wishlistId: string, page: number = 1) {
  return useQuery({
    queryKey: ["items", wishlistId, page],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<WishlistItem>>(
        `/wishlists/${wishlistId}/items?page=${page}&per_page=50`
      );
      return data;
    },
    enabled: !!wishlistId,
  });
}

interface CreateItemData {
  title: string;
  url?: string;
  price?: number;
  image_url?: string;
  note?: string;
}

export function useCreateItem(wishlistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateItemData) => {
      const { data: result } = await apiClient.post<WishlistItem>(
        `/wishlists/${wishlistId}/items`,
        data
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", wishlistId] });
      queryClient.invalidateQueries({ queryKey: ["wishlist", wishlistId] });
      toast.success("Желание добавлено!");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Ошибка добавления");
    },
  });
}

interface UpdateItemData {
  title?: string;
  url?: string | null;
  price?: number | null;
  image_url?: string | null;
  note?: string | null;
}

export function useUpdateItem(wishlistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: UpdateItemData }) => {
      const { data: result } = await apiClient.put<WishlistItem>(
        `/items/${id}`,
        data
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", wishlistId] });
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.detail || "Ошибка обновления");
    },
  });
}

export function useDeleteItem(wishlistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/items/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", wishlistId] });
      queryClient.invalidateQueries({ queryKey: ["wishlist", wishlistId] });
    },
  });
}

export function useRestoreItem(wishlistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/items/${id}/restore`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["items", wishlistId] });
      queryClient.invalidateQueries({ queryKey: ["wishlist", wishlistId] });
    },
  });
}

export function useReorderItems(wishlistId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (items: { id: string; position: number }[]) => {
      await apiClient.patch(`/wishlists/${wishlistId}/items/reorder`, { items });
    },
    onMutate: async (newOrder) => {
      await queryClient.cancelQueries({ queryKey: ["items", wishlistId] });
      const previous = queryClient.getQueryData<PaginatedResponse<WishlistItem>>(
        ["items", wishlistId, 1]
      );
      if (previous) {
        const sorted = [...previous.items].sort((a, b) => {
          const posA = newOrder.find((o) => o.id === a.id)?.position ?? a.position;
          const posB = newOrder.find((o) => o.id === b.id)?.position ?? b.position;
          return posA - posB;
        });
        queryClient.setQueryData(["items", wishlistId, 1], {
          ...previous,
          items: sorted,
        });
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(["items", wishlistId, 1], context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ["items", wishlistId] });
    },
  });
}
