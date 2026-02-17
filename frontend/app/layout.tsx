import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Toaster } from "sonner";
import Providers from "@/lib/providers";
import "./globals.css";

const inter = Inter({
  variable: "--font-inter",
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
        className={`${inter.variable} font-body antialiased`}
      >
        <Providers>
          {children}
        </Providers>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: "#FFFFFF",
              border: "1px solid #E5E5EA",
              borderRadius: "16px",
              color: "#1D1D1F",
            },
          }}
        />
      </body>
    </html>
  );
}
