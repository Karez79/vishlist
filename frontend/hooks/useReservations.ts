import { useMutation, useQueryClient } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

function getGuestHeaders(slug: string): Record<string, string> {
  if (typeof window === "undefined") return {};
  const token = localStorage.getItem(`guest_token_${slug}`);
  return token ? { "X-Guest-Token": token } : {};
}

export function useReserveItem(slug: string) {
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-wishlist", slug] });
    },
  });
}

export function useCancelReservation(slug: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (itemId: string) => {
      const headers = getGuestHeaders(slug);
      const { data } = await apiClient.delete(`/items/${itemId}/reserve`, {
        headers,
      });
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-wishlist", slug] });
    },
  });
}

export function useContributeItem(slug: string) {
  const queryClient = useQueryClient();

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
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["public-wishlist", slug] });
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
