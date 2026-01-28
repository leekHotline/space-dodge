import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "太空躲避者 - Space Dodge",
  description: "一个酷炫的3D太空躲避游戏",
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
