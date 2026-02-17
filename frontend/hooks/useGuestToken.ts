import { useCallback } from "react";

export function useGuestToken(slug: string) {
  const key = `guest_token_${slug}`;

  const getToken = useCallback((): string | null => {
    if (typeof window === "undefined") return null;
    return localStorage.getItem(key);
  }, [key]);

  const setToken = useCallback(
    (token: string) => {
      if (typeof window === "undefined") return;
      localStorage.setItem(key, token);
    },
    [key]
  );

  return { getToken, setToken };
}
