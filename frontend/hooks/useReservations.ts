import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { PublicWishlist } from "@/types";

type InfiniteWishlist = InfiniteData<PublicWishlist, number>;

function getGuestHeaders(slug: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem(`guest_token_${slug}`);
  return token ? { "X-Guest-Token": token } : {};
}

function updateItemsInPages(
  old: InfiniteWishlist,
  itemId: string,
  updater: (item: PublicWishlist["items_data"]["items"][0]) => PublicWishlist["items_data"]["items"][0]
): InfiniteWishlist {
  return {
    ...old,
    pages: old.pages.map((page) => ({
      ...page,
      items_data: {
        ...page.items_data,
        items: page.items_data.items.map((item) =>
          item.id === itemId ? updater(item) : item
        ),
      },
    })),
  };
}

export function useReserveItem(slug: string) {
  const queryClient = useQueryClient();
  const queryKey = ["public-wishlist", slug];

  return useMutation({
    mutationFn: async ({
      itemId,
      guestName,
    }: {
      itemId: string;
      guestName: string;
    }) => {
      const headers = getGuestHeaders(slug);
      const { data } = await apiClient.post(
        `/items/${itemId}/reserve`,
        { guest_name: guestName },
        { headers }
      );
      return data;
    },
    onMutate: async ({ itemId }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<InfiniteWishlist>(queryKey);
      if (previous) {
        queryClient.setQueryData<InfiniteWishlist>(
          queryKey,
          updateItemsInPages(previous, itemId, (item) => ({
            ...item,
            is_reserved: true,
          }))
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useCancelReservation(slug: string) {
  const queryClient = useQueryClient();
  const queryKey = ["public-wishlist", slug];

  return useMutation({
    mutationFn: async (itemId: string) => {
      const headers = getGuestHeaders(slug);
      const { data } = await apiClient.delete(`/items/${itemId}/reserve`, {
        headers,
      });
      return data;
    },
    onMutate: async (itemId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<InfiniteWishlist>(queryKey);
      if (previous) {
        queryClient.setQueryData<InfiniteWishlist>(
          queryKey,
          updateItemsInPages(previous, itemId, (item) => ({
            ...item,
            is_reserved: false,
            reservation: null,
          }))
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useContributeItem(slug: string) {
  const queryClient = useQueryClient();
  const queryKey = ["public-wishlist", slug];

  return useMutation({
    mutationFn: async ({
      itemId,
      guestName,
      amount,
    }: {
      itemId: string;
      guestName: string;
      amount: number;
    }) => {
      const headers = getGuestHeaders(slug);
      const { data } = await apiClient.post(
        `/items/${itemId}/contribute`,
        { guest_name: guestName, amount },
        { headers }
      );
      return data;
    },
    onMutate: async ({ itemId, amount }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<InfiniteWishlist>(queryKey);
      if (previous) {
        queryClient.setQueryData<InfiniteWishlist>(
          queryKey,
          updateItemsInPages(previous, itemId, (item) => ({
            ...item,
            total_contributed: item.total_contributed + amount,
            contributors_count: item.contributors_count + 1,
          }))
        );
      }
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useCancelContribution(slug: string) {
  const queryClient = useQueryClient();
  const queryKey = ["public-wishlist", slug];

  return useMutation({
    mutationFn: async (contributionId: string) => {
      const headers = getGuestHeaders(slug);
      const { data } = await apiClient.delete(
        `/contributions/${contributionId}`,
        { headers }
      );
      return data;
    },
    onMutate: async () => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData<InfiniteWishlist>(queryKey);
      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey });
    },
  });
}

export function useUpdateReservationEmail(slug: string) {
  return useMutation({
    mutationFn: async ({
      reservationId,
      email,
    }: {
      reservationId: string;
      email: string;
    }) => {
      const headers = getGuestHeaders(slug);
      const { data } = await apiClient.patch(
        `/reservations/${reservationId}/email`,
        { email },
        { headers }
      );
      return data;
    },
  });
}

export function useUpdateContributionEmail(slug: string) {
  return useMutation({
    mutationFn: async ({
      contributionId,
      email,
    }: {
      contributionId: string;
      email: string;
    }) => {
      const headers = getGuestHeaders(slug);
      const { data } = await apiClient.patch(
        `/contributions/${contributionId}/email`,
        { email },
        { headers }
      );
      return data;
    },
  });
}
