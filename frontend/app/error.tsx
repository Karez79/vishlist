"use client";

import { Button } from "@/components/ui";

export default function Error({
  error: _error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-bg">
      <div className="text-center max-w-md mx-auto px-4">
        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-error/8 flex items-center justify-center">
          <span className="text-5xl">😵</span>
        </div>
        <h2 className="text-2xl font-bold tracking-tight mb-2">
          Что-то пошло не так
        </h2>
        <p className="text-text-muted mb-8">
          Произошла ошибка. Попробуйте обновить страницу.
        </p>
        <Button onClick={reset} size="lg">
          Попробовать снова
        </Button>
      </div>
    </div>
  );
}
