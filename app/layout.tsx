import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "星际裂隙 - Space Dodge",
  description: "写实科幻像素融合的 roguelike 太空射击原型",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className="overflow-hidden">{children}</body>
    </html>
  );
}
