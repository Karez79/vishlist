export function getGuestToken(slug: string): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(`guest_token_${slug}`);
}

export function getGuestHeaders(slug: string): Record<string, string> {
  const token = getGuestToken(slug);
  return token ? { "X-Guest-Token": token } : {};
}
