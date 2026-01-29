import type { Metadata } from "next"
import "./globals.css"

export const metadata: Metadata = {
  title: "星际闪避 - Space Dodge",
  description: "以游戏性为核心的太空肉鸽射击体验，让快乐持续、成长可感。",
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh-CN">
      <body className="min-h-screen bg-[#f7f7fb] text-slate-900">{children}</body>
    </html>
  )
}
