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
    "Создавайте списки желаний и делитесь ими с друзьями.",
  openGraph: {
    title: "Vishlist — Социальный вишлист",
    description: "Создавайте списки желаний и делитесь ими с друзьями.",
    siteName: "Vishlist",
    type: "website",
  },
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
          position="top-center"
          gap={8}
          toastOptions={{
            style: {
              background: "#FFFFFF",
              border: "1px solid #E5E5EA",
              borderRadius: "20px",
              color: "#1D1D1F",
              boxShadow: "0 8px 30px rgba(0,0,0,0.08), 0 2px 8px rgba(0,0,0,0.04)",
              fontSize: "15px",
              padding: "14px 20px",
              fontWeight: "500",
            },
          }}
        />
      </body>
    </html>
  );
}
