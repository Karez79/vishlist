import { useMutation } from "@tanstack/react-query";
import apiClient from "@/lib/api-client";

interface ParsedUrl {
  title: string | null;
  image_url: string | null;
  description: string | null;
  price: number | null;
}

export function useParseUrl() {
  return useMutation({
    mutationFn: async (url: string): Promise<ParsedUrl> => {
      const { data } = await apiClient.post("/parse-url", { url });
      return data;
    },
  });
}
