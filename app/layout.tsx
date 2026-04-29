import type { Metadata } from "next";
import { Providers } from "@/components/providers";
import "./globals.css";

export const metadata: Metadata = {
  title: "RunLog — 러닝 기록",
  description: "거리·시간·메모와 주간 차트",
  icons: {
    icon: [{ url: "/logo.png", type: "image/png", sizes: "517x514" }],
    apple: [{ url: "/logo.png", type: "image/png", sizes: "517x514" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko">
      <body className="min-h-dvh">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
