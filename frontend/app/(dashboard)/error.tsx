"use client";

import { Button } from "@/components/ui";

export default function DashboardError({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="max-w-2xl mx-auto text-center py-16">
      <div className="text-5xl mb-4">😵</div>
      <h2 className="text-xl font-bold tracking-tight mb-2">
        Что-то пошло не так
      </h2>
      <p className="text-text-muted mb-6">Попробуйте обновить страницу</p>
      <Button onClick={reset}>Попробовать снова</Button>
    </div>
  );
}
