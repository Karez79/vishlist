import Link from "next/link";

export default function NotFound() {
  return (
    <main className="min-h-screen flex items-center justify-center px-4">
      <div className="text-center">
        <h1 className="text-7xl font-bold tracking-tight text-text mb-4">
          404
        </h1>
        <p className="text-lg text-text-muted mb-8">
          Страница не найдена
        </p>
        <Link
          href="/"
          className="inline-flex items-center px-6 py-3 bg-primary text-white rounded-2xl hover:bg-primary-light transition-colors"
        >
          На главную
        </Link>
      </div>
    </main>
  );
}
