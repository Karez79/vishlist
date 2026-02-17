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
        <div className="text-6xl mb-4">😵</div>
        <h2 className="text-2xl font-heading font-bold mb-2">
          Что-то пошло не так
        </h2>
        <p className="text-text-muted mb-6">
          Произошла ошибка. Попробуйте обновить страницу.
        </p>
        <Button onClick={reset}>Попробовать снова</Button>
      </div>
    </div>
  );
}
