// app/page.tsx
import Link from 'next/link'

export default function Home() {
  return (
    <div className="min-h-screen w-screen bg-[#05060b] text-white">
      <div className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center gap-8 px-6 text-center">
        <div className="space-y-3">
          <div className="text-sm uppercase tracking-[0.4em] text-cyan-200">Space Rogue Prototype</div>
          <h1 className="text-6xl font-semibold text-cyan-300">星际裂隙</h1>
          <p className="text-base text-gray-300">
            写实科幻 × 像素融合 · Roguelike 太空射击
          </p>
        </div>
        <div className="flex flex-wrap items-center justify-center gap-3 text-sm text-gray-400">
          <span>WASD 移动</span>
          <span>鼠标瞄准</span>
          <span>自动开火</span>
        </div>
        <Link
          href="/game"
          className="rounded-full bg-cyan-400 px-8 py-3 text-sm font-semibold text-black shadow-lg shadow-cyan-500/40"
        >
          开始游戏 / Start
        </Link>
      </div>
    </div>
  )
}
