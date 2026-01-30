'use client'

import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import type { LoadProgress } from '@/lib/asset-loader'
import { useGameStore } from '@/stores/gameStore'

interface LoadingScreenProps {
  progress: LoadProgress
  onComplete?: () => void
}

const PHASE_LABELS: Record<string, Record<string, string>> = {
  zh: {
    loading: '加载素材',
    parsing: '初始化引擎',
    ready: '准备就绪'
  },
  en: {
    loading: 'Loading Assets',
    parsing: 'Initializing Engine',
    ready: 'Ready'
  }
}

export default function LoadingScreen({ progress, onComplete }: LoadingScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [showReady, setShowReady] = useState(false)
  const language = useGameStore((state) => state.language)

  // 星空背景动画
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    // 创建星点
    const stars: Array<{ x: number; y: number; size: number; speed: number; alpha: number }> = []
    for (let i = 0; i < 150; i++) {
      stars.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2 + 0.5,
        speed: Math.random() * 0.5 + 0.1,
        alpha: Math.random() * 0.5 + 0.3
      })
    }

    let animId: number
    const animate = () => {
      ctx.fillStyle = '#05060b'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 绘制星云效果
      const gradient = ctx.createRadialGradient(
        canvas.width * 0.3, canvas.height * 0.4, 0,
        canvas.width * 0.3, canvas.height * 0.4, canvas.width * 0.5
      )
      gradient.addColorStop(0, 'rgba(94, 242, 255, 0.05)')
      gradient.addColorStop(0.5, 'rgba(94, 242, 255, 0.02)')
      gradient.addColorStop(1, 'transparent')
      ctx.fillStyle = gradient
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 绘制星点
      stars.forEach((star) => {
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 230, 255, ${star.alpha})`
        ctx.fill()

        // 移动星点
        star.y += star.speed
        if (star.y > canvas.height) {
          star.y = 0
          star.x = Math.random() * canvas.width
        }
      })

      animId = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animId)
    }
  }, [])

  // 完成后显示就绪状态
  useEffect(() => {
    if (progress.phase === 'ready' && progress.percent === 100) {
      const timer = setTimeout(() => {
        setShowReady(true)
        setTimeout(() => onComplete?.(), 800)
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [progress, onComplete])

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* 星空背景 */}
      <canvas ref={canvasRef} className="absolute inset-0" />

      {/* 内容 */}
      <div className="relative z-10 flex flex-col items-center justify-center h-full">
        {/* Logo/标题 */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          className="mb-12"
        >
          <h1 className="text-5xl md:text-7xl font-bold tracking-wider text-transparent bg-clip-text bg-gradient-to-b from-cyan-300 via-cyan-400 to-cyan-600">
            SPACE DODGE
          </h1>
          <p className="text-center text-cyan-400/60 text-sm tracking-[0.3em] mt-2">
            太空闪避者
          </p>
        </motion.div>

        {/* 飞船动画 */}
        <motion.div
          animate={{
            y: [0, -8, 0],
            rotate: [0, 2, -2, 0]
          }}
          transition={{
            duration: 3,
            repeat: Infinity,
            ease: 'easeInOut'
          }}
          className="mb-10"
        >
          <svg width="80" height="80" viewBox="0 0 64 64" fill="none">
            <g stroke="#5ef2ff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
              <polygon points="32 6 48 22 54 42 32 56 10 42 16 22" fill="#0b1220"/>
              <polygon points="32 12 40 26 32 38 24 26" fill="#ffd166"/>
              <path d="M20 30 L8 42"/>
              <path d="M44 30 L56 42"/>
              <path d="M26 48 L22 58"/>
              <path d="M38 48 L42 58"/>
            </g>
            {/* 引擎光效 */}
            <motion.ellipse
              cx="32"
              cy="58"
              rx="8"
              ry="4"
              fill="#5ef2ff"
              animate={{ opacity: [0.3, 0.8, 0.3], ry: [4, 6, 4] }}
              transition={{ duration: 0.5, repeat: Infinity }}
            />
          </svg>
        </motion.div>

        {/* 进度条容器 */}
        <div className="w-80 max-w-[80vw]">
          {/* 阶段标签 */}
          <div className="flex justify-between items-center mb-2">
            <span className="text-cyan-400/80 text-sm">
              {PHASE_LABELS[language]?.[progress.phase] ?? progress.phase}
            </span>
            <span className="text-cyan-400 font-mono text-sm">
              {progress.percent}%
            </span>
          </div>

          {/* 进度条 */}
          <div className="relative h-2 bg-cyan-900/30 rounded-full overflow-hidden border border-cyan-500/20">
            <motion.div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-cyan-500 to-cyan-300 rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${progress.percent}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
            {/* 光效扫描 */}
            <motion.div
              className="absolute inset-y-0 w-20 bg-gradient-to-r from-transparent via-white/30 to-transparent"
              animate={{ x: [-80, 320] }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
            />
          </div>

          {/* 当前加载项 */}
          {progress.currentAsset && progress.phase === 'loading' && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-cyan-500/50 text-xs mt-2 font-mono truncate"
            >
              {progress.currentAsset}
            </motion.p>
          )}

          {/* 就绪提示 */}
          {showReady && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="mt-6 text-center"
            >
              <p className="text-cyan-400 animate-pulse">正在启动...</p>
            </motion.div>
          )}
        </div>

        {/* 底部提示 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 1 }}
          className="absolute bottom-8 text-cyan-500/40 text-xs tracking-wider"
        >
          WASD 移动 · 鼠标射击 · 空格闪避
        </motion.div>
      </div>
    </div>
  )
}
