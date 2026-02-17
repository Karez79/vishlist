import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin", "cyrillic"],
});

const playfairDisplay = Playfair_Display({
  variable: "--font-playfair-display",
  subsets: ["latin", "cyrillic"],
});

export const metadata: Metadata = {
  title: {
    default: "Vishlist — Социальный вишлист",
    template: "%s | Vishlist",
  },
  description:
    "Создавайте списки желаний и делитесь ими с друзьями. Друзья смогут зарезервировать подарки и скинуться на дорогие.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${inter.variable} ${playfairDisplay.variable} font-body antialiased`}
      >
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#FFFFFF",
              border: "1px solid #F0E6DC",
              borderRadius: "12px",
              color: "#2D3436",
            },
          }}
        />
      </body>
    </html>
  );
}
