import { useInfiniteQuery } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";
import type { PublicWishlist } from "@/types";

function getGuestToken(slug: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`guest_token_${slug}`);
}

async function fetchPublicWishlist(
  slug: string,
  page: number
): Promise<PublicWishlist> {
  const guestToken = getGuestToken(slug);
  const { data } = await apiClient.get(
    `/wishlists/public/${slug}?page=${page}&per_page=20`,
    {
      headers: guestToken ? { "X-Guest-Token": guestToken } : {},
    }
  );
  return data;
}

export function usePublicWishlist(slug: string, initialData: PublicWishlist) {
  return useInfiniteQuery({
    queryKey: ["public-wishlist", slug],
    queryFn: ({ pageParam }) => fetchPublicWishlist(slug, pageParam),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => {
      const { page, pages } = lastPage.items_data;
      return page < pages ? page + 1 : undefined;
    },
    initialData: {
      pages: [initialData],
      pageParams: [1],
    },
    staleTime: 0,
  });
}
