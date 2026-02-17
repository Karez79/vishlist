"use client";

import { Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui";

interface ShareButtonProps {
  slug: string;
  title?: string;
  variant?: "primary" | "secondary" | "ghost";
  size?: "sm" | "md";
}

export default function ShareButton({
  slug,
  title,
  variant = "secondary",
  size = "sm",
}: ShareButtonProps) {
  const url =
    typeof window !== "undefined"
      ? `${window.location.origin}/w/${slug}`
      : `/w/${slug}`;

  const handleShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: title || "Vishlist",
          text: title ? `Смотри мой вишлист «${title}»` : undefined,
          url,
        });
      } catch {
        // User cancelled share
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Ссылка скопирована!");
      } catch {
        toast.error("Не удалось скопировать ссылку");
      }
    }
  };

  return (
    <Button variant={variant} size={size} onClick={handleShare}>
      <Share2 size={16} className="mr-1.5" />
      Поделиться
    </Button>
  );
}
