"use client";

import { EmptyState } from "@/components/ui";
import { Gift } from "lucide-react";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const router = useRouter();

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-heading font-bold">Мои вишлисты</h1>
      </div>

      {/* Temporary empty state — will be replaced with real data in Stage 3 */}
      <EmptyState
        icon={<Gift size={48} />}
        title="У вас пока нет вишлистов"
        description="Создайте список желаний и поделитесь с друзьями"
        actionLabel="Создать первый вишлист"
        onAction={() => router.push("/wishlists/new")}
      />
    </div>
  );
}
