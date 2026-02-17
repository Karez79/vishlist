import { Badge } from "@/components/ui";
import type { WishlistItem } from "@/types";

export function getStatusBadge(item: WishlistItem) {
  if (item.is_reserved) return <Badge variant="reserved">Зарезервирован</Badge>;
  if (item.price && item.total_contributed > 0) {
    const pct = Math.min(
      Math.round((item.total_contributed / item.price) * 100),
      100
    );
    if (pct >= 100) return <Badge variant="collected">Собрано!</Badge>;
    return <Badge variant="collecting">Сбор {pct}%</Badge>;
  }
  return <Badge variant="available">Доступен</Badge>;
}
