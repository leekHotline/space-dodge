'use client'

import { useEffect, useState, useRef } from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { useGameStore } from '@/stores/gameStore'
import { t } from '@/lib/i18n'

interface LeaderboardEntry {
  player_name: string
  score: number
  level_reached: number
  kills: number
  duration_sec: number
  created_at: string
}

// 星空背景
interface Star {
  x: number
  y: number
  size: number
  alpha: number
  twinkle: number
  phase: number
}

export default function LeaderboardPage() {
  const language = useGameStore((state) => state.language)
  const setLanguage = useGameStore((state) => state.setLanguage)
  const highScore = useGameStore((state) => state.highScore)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const animIdRef = useRef<number>(0)
  
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 加载排行榜数据
  useEffect(() => {
    const fetchLeaderboard = async () => {
      try {
        setLoading(true)
        const res = await fetch('/api/leaderboard')
        const data = await res.json()
        setLeaderboard(data.leaderboard || [])
        setError(null)
      } catch (err) {
        setError('Failed to load leaderboard')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchLeaderboard()
  }, [])

  // 星空背景
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      
      const count = Math.floor((canvas.width * canvas.height) / 6000)
      starsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
        twinkle: Math.random() * 2 + 1,
        phase: Math.random() * Math.PI * 2
      }))
    }

    resize()
    window.addEventListener('resize', resize)

    let time = 0
    const animate = () => {
      time += 0.016
      ctx.fillStyle = '#05060b'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 星云
      const nebula = ctx.createRadialGradient(
        canvas.width * 0.7, canvas.height * 0.3, 0,
        canvas.width * 0.7, canvas.height * 0.3, canvas.width * 0.4
      )
      nebula.addColorStop(0, 'rgba(94, 242, 255, 0.04)')
      nebula.addColorStop(1, 'transparent')
      ctx.fillStyle = nebula
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 星点
      starsRef.current.forEach((star) => {
        const twinkleAlpha = star.alpha * (0.7 + 0.3 * Math.sin(time * star.twinkle + star.phase))
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 230, 255, ${twinkleAlpha})`
        ctx.fill()
      })

      animIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animIdRef.current)
    }
  }, [])

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getRankStyle = (rank: number) => {
    if (rank === 1) return 'text-yellow-400 bg-yellow-500/10 border-yellow-500/30'
    if (rank === 2) return 'text-gray-300 bg-gray-500/10 border-gray-500/30'
    if (rank === 3) return 'text-orange-400 bg-orange-500/10 border-orange-500/30'
    return 'text-cyan-400/70 bg-cyan-500/5 border-cyan-500/20'
  }

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05060b]">
      {/* 背景 */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* 语言切换 */}
      <div className="absolute top-6 right-6 z-20">
        <button
          onClick={() => setLanguage(language === 'zh' ? 'en' : 'zh')}
          className="px-4 py-2 rounded-full border border-cyan-500/30 bg-black/30 backdrop-blur-sm text-cyan-400 text-sm hover:bg-cyan-500/10 transition-colors"
        >
          {language === 'zh' ? 'EN' : '中文'}
        </button>
      </div>

      {/* 返回按钮 */}
      <div className="absolute top-6 left-6 z-20">
        <Link href="/">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            className="px-4 py-2 rounded-full border border-cyan-500/30 bg-black/30 backdrop-blur-sm text-cyan-400 text-sm hover:bg-cyan-500/10 transition-colors"
          >
            ← {t('common.back', language)}
          </motion.button>
        </Link>
      </div>

      {/* 主内容 */}
      <main className="relative z-10 flex flex-col items-center min-h-screen px-6 py-20">
        {/* 标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <h1 className="text-4xl md:text-5xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-cyan-200 mb-2">
            {t('leaderboard.title', language)}
          </h1>
          <p className="text-cyan-500/50 text-sm">
            {t('leaderboard.subtitle', language)}
          </p>
        </motion.div>

        {/* 个人最高分 */}
        {highScore > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
            className="mb-8 px-6 py-3 rounded-full border border-cyan-500/30 bg-cyan-500/10 backdrop-blur-sm"
          >
            <span className="text-cyan-400/70 text-sm mr-2">{t('leaderboard.yourBest', language)}:</span>
            <span className="text-cyan-300 font-bold text-lg">{highScore.toLocaleString()}</span>
          </motion.div>
        )}

        {/* 排行榜表格 */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="w-full max-w-3xl"
        >
          {/* 表头 */}
          <div className="grid grid-cols-12 gap-2 px-4 py-3 text-cyan-500/50 text-xs uppercase tracking-wider border-b border-cyan-500/20">
            <div className="col-span-1 text-center">{t('leaderboard.rank', language)}</div>
            <div className="col-span-3">{t('leaderboard.player', language)}</div>
            <div className="col-span-2 text-right">{t('leaderboard.score', language)}</div>
            <div className="col-span-2 text-center">{t('leaderboard.level', language)}</div>
            <div className="col-span-2 text-center">{t('leaderboard.kills', language)}</div>
            <div className="col-span-2 text-right">{t('leaderboard.time', language)}</div>
          </div>

          {/* 加载状态 */}
          {loading && (
            <div className="py-12 text-center text-cyan-500/50">
              {t('leaderboard.loading', language)}
            </div>
          )}

          {/* 错误状态 */}
          {error && (
            <div className="py-12 text-center text-red-400/70">
              {error}
            </div>
          )}

          {/* 空状态 */}
          {!loading && !error && leaderboard.length === 0 && (
            <div className="py-12 text-center text-cyan-500/50">
              {t('leaderboard.empty', language)}
            </div>
          )}

          {/* 排行榜列表 */}
          {!loading && leaderboard.map((entry, index) => (
            <motion.div
              key={`${entry.player_name}-${index}`}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 * Math.min(index, 10) }}
              className={`grid grid-cols-12 gap-2 px-4 py-3 border-b border-cyan-500/10 hover:bg-cyan-500/5 transition-colors ${index < 3 ? 'bg-cyan-500/5' : ''}`}
            >
              {/* 排名 */}
              <div className="col-span-1 flex justify-center">
                <span className={`w-8 h-8 flex items-center justify-center rounded-full border text-sm font-bold ${getRankStyle(index + 1)}`}>
                  {index + 1}
                </span>
              </div>

              {/* 玩家名 */}
              <div className="col-span-3 flex items-center text-cyan-200 font-medium truncate">
                {entry.player_name}
              </div>

              {/* 分数 */}
              <div className="col-span-2 flex items-center justify-end text-cyan-400 font-bold">
                {entry.score.toLocaleString()}
              </div>

              {/* 关卡 */}
              <div className="col-span-2 flex items-center justify-center text-cyan-400/70">
                {entry.level_reached}
              </div>

              {/* 击杀 */}
              <div className="col-span-2 flex items-center justify-center text-cyan-400/70">
                {entry.kills}
              </div>

              {/* 时间 */}
              <div className="col-span-2 flex items-center justify-end text-cyan-500/60 text-sm">
                {formatTime(entry.duration_sec)}
              </div>
            </motion.div>
          ))}
        </motion.div>

        {/* 刷新按钮 */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={() => window.location.reload()}
          className="mt-8 px-6 py-2 rounded-full border border-cyan-500/30 bg-black/30 backdrop-blur-sm text-cyan-400 text-sm hover:bg-cyan-500/10 transition-colors"
        >
          {t('leaderboard.refresh', language)}
        </motion.button>
      </main>
    </div>
  )
}
