import { useQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { PublicWishlist } from "@/types";

function getGuestToken(slug: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`guest_token_${slug}`);
}

async function fetchPublicWishlist(slug: string): Promise<PublicWishlist> {
  const guestToken = getGuestToken(slug);
  const { data } = await apiClient.get(`/wishlists/public/${slug}`, {
    headers: guestToken ? { "X-Guest-Token": guestToken } : {},
  });
  return data;
}

export function usePublicWishlist(
  slug: string,
  initialData: PublicWishlist,
) {
  return useQuery({
    queryKey: ["public-wishlist", slug],
    queryFn: () => fetchPublicWishlist(slug),
    initialData,
    staleTime: 0, // Always re-fetch to get is_mine flags
  });
}
