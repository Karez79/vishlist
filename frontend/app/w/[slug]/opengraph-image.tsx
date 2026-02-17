import { ImageResponse } from "next/og";

export const alt = "Vishlist";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;

  let emoji = "🎁";
  let title = "Вишлист";
  let ownerName = "";
  let itemsCount = 0;

  try {
    const res = await fetch(`${API_URL}/api/wishlists/public/${slug}`, {
      cache: "no-store",
    });
    if (res.ok) {
      const data = await res.json();
      emoji = data.emoji || "🎁";
      title = data.title || "Вишлист";
      ownerName = data.owner_name || "";
      itemsCount = data.items_data?.total || 0;
    }
  } catch {
    // Use defaults
  }

  const itemsLabel =
    itemsCount === 1
      ? "желание"
      : itemsCount < 5
        ? "желания"
        : "желаний";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "linear-gradient(135deg, #f5f7ff 0%, #ffffff 50%, #f0f5ff 100%)",
          fontFamily: "sans-serif",
        }}
      >
        {/* Emoji */}
        <div
          style={{
            fontSize: "96px",
            marginBottom: "24px",
          }}
        >
          {emoji}
        </div>

        {/* Title */}
        <div
          style={{
            fontSize: "48px",
            fontWeight: 800,
            color: "#1D1D1F",
            letterSpacing: "-1px",
            marginBottom: "16px",
            maxWidth: "900px",
            textAlign: "center",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {title}
        </div>

        {/* Info line */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "24px",
            fontSize: "24px",
            color: "#86868B",
            fontWeight: 500,
          }}
        >
          {ownerName && (
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              👤 {ownerName}
            </span>
          )}
          {itemsCount > 0 && (
            <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
              🎁 {itemsCount} {itemsLabel}
            </span>
          )}
        </div>

        {/* Branding */}
        <div
          style={{
            position: "absolute",
            bottom: "32px",
            display: "flex",
            alignItems: "center",
            gap: "8px",
            fontSize: "20px",
            color: "#AEAEB2",
            fontWeight: 600,
          }}
        >
          Vishlist
        </div>
      </div>
    ),
    { ...size }
  );
}
