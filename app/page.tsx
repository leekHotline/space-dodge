// app/page.tsx
'use client'
import dynamic from 'next/dynamic'

const Game = dynamic(() => import('@/components/game/Game'), {
  ssr: false,
  loading: () => (
    <div className="w-screen h-screen bg-black flex items-center justify-center">
      <div className="text-2xl text-cyan-400 animate-pulse">
        🚀 加载游戏中...
      </div>
    </div>
  )
})

export default function Home() {
  return <Game />
}
