'use client'
import dynamic from 'next/dynamic'
import { ErrorBoundary } from '@/components/game/ErrorBoundary'
import GameUI from '@/components/game/GameUI'
import { useGameStore } from '@/stores/gameStore'
import { useEffect } from 'react'

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

export default function GamePage() {
  const startGame = useGameStore((state) => state.startGame)

  useEffect(() => {
    startGame()
  }, [startGame])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <ErrorBoundary>
        <Game />
      </ErrorBoundary>
      <GameUI />
    </div>
  )
}
