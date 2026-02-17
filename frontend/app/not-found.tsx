import Link from "next/link";
import { Gift } from "lucide-react";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <div className="w-24 h-24 mx-auto mb-6 rounded-3xl bg-fill flex items-center justify-center">
          <span className="text-5xl">🔍</span>
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-text mb-2">
          404
        </h1>
        <p className="text-lg text-text-muted mb-8">
          Страница не найдена
        </p>
        <Link
          href="/"
          className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-2xl font-medium hover:bg-primary-light transition-colors"
        >
          <Gift size={18} />
          На главную
        </Link>
      </div>
    </main>
  );
}
