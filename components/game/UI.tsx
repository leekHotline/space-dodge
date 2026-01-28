// components/game/UI.tsx
'use client'
import { useGameStore } from '@/stores/gameStore'

export function GameUI() {
  const {
    isPlaying,
    isPaused,
    isGameOver,
    score,
    highScore,
    health,
    startGame,
    pauseGame,
    resumeGame,
    reset
  } = useGameStore()

  // 开始界面
  if (!isPlaying && !isGameOver) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <div className="text-center space-y-6 p-8">
          <h1 className="text-6xl font-bold bg-gradient-to-r from-cyan-400 to-blue-500 text-transparent bg-clip-text">
            🚀 太空躲避者
          </h1>
          <p className="text-xl text-gray-300">
            移动鼠标/手指控制飞船，躲避小行星！
          </p>
          <div className="text-gray-400">
            最高分: <span className="text-yellow-400 font-bold">{highScore}</span>
          </div>
          <button
            onClick={startGame}
            className="px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-600
                       rounded-full text-xl font-bold hover:scale-105 transition-transform
                       shadow-lg shadow-cyan-500/50"
          >
            开始游戏
          </button>
        </div>
      </div>
    )
  }

  // 游戏结束界面
  if (isGameOver) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black/70 backdrop-blur-sm">
        <div className="text-center space-y-6 p-8">
          <h2 className="text-5xl font-bold text-red-500">💥 游戏结束</h2>
          <div className="text-3xl">
            得分: <span className="text-cyan-400 font-bold">{score}</span>
          </div>
          {score >= highScore && score > 0 && (
            <div className="text-yellow-400 text-xl animate-pulse">
              🎉 新纪录！
            </div>
          )}
          <div className="text-gray-400">
            最高分: <span className="text-yellow-400">{highScore}</span>
          </div>
          <button
            onClick={() => { reset(); startGame(); }}
            className="px-8 py-4 bg-gradient-to-r from-green-500 to-emerald-600
                       rounded-full text-xl font-bold hover:scale-105 transition-transform"
          >
            再来一局
          </button>
        </div>
      </div>
    )
  }

  // 游戏中UI
  return (
    <>
      {/* 顶部信息栏 */}
      <div className="absolute top-4 left-4 right-4 flex justify-between items-center">
        <div className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg">
          <span className="text-gray-400">分数: </span>
          <span className="text-2xl font-bold text-cyan-400">{score}</span>
        </div>

        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <span
              key={i}
              className={`text-2xl ${i < health ? 'opacity-100' : 'opacity-30'}`}
            >
              ❤️
            </span>
          ))}
        </div>

        <button
          onClick={isPaused ? resumeGame : pauseGame}
          className="bg-black/50 backdrop-blur-sm px-4 py-2 rounded-lg hover:bg-black/70"
        >
          {isPaused ? '▶️ 继续' : '⏸️ 暂停'}
        </button>
      </div>

      {/* 暂停遮罩 */}
      {isPaused && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/50">
          <div className="text-4xl font-bold text-white">⏸️ 游戏暂停</div>
        </div>
      )}
    </>
  )
}