import { Metadata } from "next";
import { notFound } from "next/navigation";
import WishlistContent from "@/components/features/WishlistContent";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

async function getPublicWishlist(slug: string) {
  const res = await fetch(`${API_URL}/api/wishlists/public/${slug}`, {
    cache: "no-store",
  });

  if (res.status === 404) return null;
  if (res.status === 410) return { deleted: true };
  if (!res.ok) throw new Error("Failed to fetch wishlist");

  return res.json();
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const data = await getPublicWishlist(slug);

  if (!data || data.deleted) {
    return { title: "Вишлист не найден" };
  }

  const firstImage = data.items_data?.items?.find(
    (i: { image_url: string | null }) => i.image_url
  )?.image_url;

  return {
    title: `${data.emoji} ${data.title} — Vishlist`,
    description:
      data.description || `Вишлист от ${data.owner_name}. ${data.items_data.total} желаний`,
    openGraph: {
      title: `${data.emoji} ${data.title}`,
      description:
        data.description || `Вишлист от ${data.owner_name}`,
      ...(firstImage && { images: [{ url: firstImage }] }),
    },
  };
}

export default async function PublicWishlistPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const data = await getPublicWishlist(slug);

  if (!data) notFound();

  if (data.deleted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-bg">
        <div className="text-center max-w-md mx-auto px-4">
          <div className="text-6xl mb-4">😔</div>
          <h1 className="text-2xl font-heading font-bold mb-2">
            Этот вишлист был удалён
          </h1>
          <p className="text-text-muted mb-6">
            Владелец удалил этот список желаний
          </p>
          <a
            href="/"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
          >
            На главную
          </a>
        </div>
      </div>
    );
  }

  return <WishlistContent initialData={data} slug={slug} />;
}
