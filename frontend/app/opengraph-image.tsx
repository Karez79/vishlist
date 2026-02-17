import { ImageResponse } from "next/og";

export const alt = "Vishlist — Социальный вишлист";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default async function Image() {
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
        {/* Logo */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "16px",
            marginBottom: "32px",
          }}
        >
          <div
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "20px",
              background: "linear-gradient(135deg, #007AFF, #5856D6)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "36px",
              color: "white",
            }}
          >
            🎁
          </div>
          <span
            style={{
              fontSize: "56px",
              fontWeight: 800,
              color: "#1D1D1F",
              letterSpacing: "-1px",
            }}
          >
            Vishlist
          </span>
        </div>

        {/* Tagline */}
        <div
          style={{
            fontSize: "28px",
            color: "#86868B",
            fontWeight: 500,
          }}
        >
          Создавайте списки желаний и делитесь с друзьями
        </div>
      </div>
    ),
    { ...size }
  );
}
