'use client'
import dynamic from 'next/dynamic'
import { useState, useEffect, useCallback } from 'react'
import { ErrorBoundary } from '@/components/game/ErrorBoundary'
import GameUI from '@/components/game/GameUI'
import LoadingScreen from '@/components/game/LoadingScreen'
import { useGameStore } from '@/stores/gameStore'
import { preloadAllAssets, type LoadProgress } from '@/lib/asset-loader'
import { audioManager } from '@/lib/audio'

const Game = dynamic(() => import('@/components/game/Game'), {
  ssr: false,
})

export default function GamePage() {
  const startGame = useGameStore((state) => state.startGame)
  const [loadProgress, setLoadProgress] = useState<LoadProgress>({
    loaded: 0,
    total: 1,
    percent: 0,
    phase: 'loading'
  })
  const [isReady, setIsReady] = useState(false)
  const [showGame, setShowGame] = useState(false)

  // 预加载资源
  useEffect(() => {
    let mounted = true

    const loadAssets = async () => {
      try {
        await preloadAllAssets((progress) => {
          if (mounted) {
            setLoadProgress(progress)
          }
        })
        
        if (mounted) {
          // 短暂延迟显示"准备就绪"
          setTimeout(() => {
            setIsReady(true)
          }, 300)
        }
      } catch (error) {
        console.error('Failed to load assets:', error)
        // 即使加载失败也允许进入游戏
        if (mounted) {
          setIsReady(true)
        }
      }
    }

    loadAssets()

    return () => {
      mounted = false
    }
  }, [])

  // 加载完成后启动游戏
  const handleLoadComplete = useCallback(() => {
    // 初始化音频（需要用户交互）
    audioManager.init()
    
    // 显示游戏
    setShowGame(true)
    
    // 启动游戏
    setTimeout(() => {
      startGame()
    }, 100)
  }, [startGame])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      {/* 加载屏幕 */}
      {!showGame && (
        <LoadingScreen
          progress={loadProgress}
          onComplete={isReady ? handleLoadComplete : undefined}
        />
      )}

      {/* 游戏内容 */}
      {showGame && (
        <>
          <ErrorBoundary>
            <Game />
          </ErrorBoundary>
          <GameUI />
        </>
      )}
    </div>
  )
}
