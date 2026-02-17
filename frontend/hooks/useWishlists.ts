"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import apiClient from "@/lib/api-client";
import { getErrorMessage } from "@/lib/utils";
import type { PaginatedResponse, Wishlist } from "@/types";

interface WishlistWithCount extends Wishlist {
  items_count: number;
}

export function useWishlists(page: number = 1) {
  return useQuery({
    queryKey: ["wishlists", page],
    queryFn: async () => {
      const { data } = await apiClient.get<PaginatedResponse<WishlistWithCount>>(
        `/wishlists?page=${page}&per_page=20`
      );
      return data;
    },
  });
}

export function useWishlist(id: string) {
  return useQuery({
    queryKey: ["wishlist", id],
    queryFn: async () => {
      const { data } = await apiClient.get<WishlistWithCount>(`/wishlists/${id}`);
      return data;
    },
    enabled: !!id,
  });
}

interface CreateWishlistData {
  title: string;
  description?: string;
  emoji?: string;
  event_date?: string;
}

export function useCreateWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: CreateWishlistData) => {
      const { data: result } = await apiClient.post<WishlistWithCount>("/wishlists", data);
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
      toast.success("Вишлист создан!");
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, "Ошибка создания вишлиста"));
    },
  });
}

interface UpdateWishlistData {
  title?: string;
  description?: string;
  emoji?: string;
  event_date?: string | null;
  is_archived?: boolean;
}

export function useUpdateWishlist(id: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: UpdateWishlistData) => {
      const { data: result } = await apiClient.put<WishlistWithCount>(
        `/wishlists/${id}`,
        data
      );
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
      queryClient.invalidateQueries({ queryKey: ["wishlist", id] });
    },
    onError: (error: Error) => {
      toast.error(getErrorMessage(error, "Ошибка обновления"));
    },
  });
}

export function useDeleteWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`/wishlists/${id}`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
    },
  });
}

export function useRestoreWishlist() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/wishlists/${id}/restore`);
      return id;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["wishlists"] });
    },
  });
}
