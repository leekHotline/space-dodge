"use client"

import { useEffect, useRef } from "react"
import Link from "next/link"
import { motion } from "framer-motion"
import { useGameStore } from "@/stores/gameStore"
import { t } from "@/lib/i18n"

// 星空粒子
interface Star {
  x: number
  y: number
  size: number
  speed: number
  alpha: number
  twinkle: number
  phase: number
}

// 流星
interface ShootingStar {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  length: number
}

export default function LandingPage() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const starsRef = useRef<Star[]>([])
  const shootingStarsRef = useRef<ShootingStar[]>([])
  const animIdRef = useRef<number>(0)
  const language = useGameStore((state) => state.language)
  const setLanguage = useGameStore((state) => state.setLanguage)
  const mountedRef = useRef(false)

  // 星空背景动画
  useEffect(() => {
    mountedRef.current = true
    const canvas = canvasRef.current
    if (!canvas) return

    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
      initStars()
    }

    const initStars = () => {
      const count = Math.floor((canvas.width * canvas.height) / 4000)
      starsRef.current = Array.from({ length: count }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        size: Math.random() * 2.5 + 0.5,
        speed: Math.random() * 0.3 + 0.05,
        alpha: Math.random() * 0.6 + 0.2,
        twinkle: Math.random() * 2 + 1,
        phase: Math.random() * Math.PI * 2
      }))
    }

    resize()
    window.addEventListener('resize', resize)

    let time = 0
    const animate = () => {
      time += 0.016

      // 深色太空背景
      ctx.fillStyle = '#05060b'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 星云效果
      const nebula1 = ctx.createRadialGradient(
        canvas.width * 0.2, canvas.height * 0.3, 0,
        canvas.width * 0.2, canvas.height * 0.3, canvas.width * 0.4
      )
      nebula1.addColorStop(0, 'rgba(94, 242, 255, 0.06)')
      nebula1.addColorStop(0.5, 'rgba(94, 242, 255, 0.02)')
      nebula1.addColorStop(1, 'transparent')
      ctx.fillStyle = nebula1
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      const nebula2 = ctx.createRadialGradient(
        canvas.width * 0.8, canvas.height * 0.7, 0,
        canvas.width * 0.8, canvas.height * 0.7, canvas.width * 0.35
      )
      nebula2.addColorStop(0, 'rgba(255, 100, 150, 0.04)')
      nebula2.addColorStop(0.5, 'rgba(255, 100, 150, 0.015)')
      nebula2.addColorStop(1, 'transparent')
      ctx.fillStyle = nebula2
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 银河带
      ctx.save()
      ctx.translate(canvas.width / 2, canvas.height / 2)
      ctx.rotate(-0.3)
      const bandGrad = ctx.createLinearGradient(0, -canvas.height * 0.15, 0, canvas.height * 0.15)
      bandGrad.addColorStop(0, 'transparent')
      bandGrad.addColorStop(0.3, 'rgba(150, 200, 255, 0.03)')
      bandGrad.addColorStop(0.5, 'rgba(180, 220, 255, 0.05)')
      bandGrad.addColorStop(0.7, 'rgba(150, 200, 255, 0.03)')
      bandGrad.addColorStop(1, 'transparent')
      ctx.fillStyle = bandGrad
      ctx.fillRect(-canvas.width, -canvas.height * 0.15, canvas.width * 2, canvas.height * 0.3)
      ctx.restore()

      // 绘制星点
      starsRef.current.forEach((star) => {
        const twinkleAlpha = star.alpha * (0.7 + 0.3 * Math.sin(time * star.twinkle + star.phase))
        
        ctx.beginPath()
        ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(200, 230, 255, ${twinkleAlpha})`
        ctx.fill()

        // 亮星发光
        if (star.size > 1.8) {
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.size * 3, 0, Math.PI * 2)
          const glow = ctx.createRadialGradient(star.x, star.y, 0, star.x, star.y, star.size * 3)
          glow.addColorStop(0, `rgba(200, 230, 255, ${twinkleAlpha * 0.3})`)
          glow.addColorStop(1, 'transparent')
          ctx.fillStyle = glow
          ctx.fill()
        }

        // 缓慢移动
        star.y += star.speed
        if (star.y > canvas.height + 5) {
          star.y = -5
          star.x = Math.random() * canvas.width
        }
      })

      // 随机生成流星
      if (Math.random() < 0.005) {
        shootingStarsRef.current.push({
          x: Math.random() * canvas.width * 0.8,
          y: Math.random() * canvas.height * 0.3,
          vx: 8 + Math.random() * 6,
          vy: 4 + Math.random() * 3,
          life: 1,
          maxLife: 1,
          length: 60 + Math.random() * 40
        })
      }

      // 绘制流星
      shootingStarsRef.current = shootingStarsRef.current.filter((s) => {
        s.x += s.vx
        s.y += s.vy
        s.life -= 0.02

        if (s.life <= 0) return false

        const alpha = s.life * 0.8
        const grad = ctx.createLinearGradient(
          s.x, s.y,
          s.x - s.vx * (s.length / 10), s.y - s.vy * (s.length / 10)
        )
        grad.addColorStop(0, `rgba(255, 255, 255, ${alpha})`)
        grad.addColorStop(0.3, `rgba(200, 230, 255, ${alpha * 0.5})`)
        grad.addColorStop(1, 'transparent')

        ctx.beginPath()
        ctx.moveTo(s.x, s.y)
        ctx.lineTo(s.x - s.vx * (s.length / 10), s.y - s.vy * (s.length / 10))
        ctx.strokeStyle = grad
        ctx.lineWidth = 2
        ctx.stroke()

        return true
      })

      animIdRef.current = requestAnimationFrame(animate)
    }

    animate()

    return () => {
      window.removeEventListener('resize', resize)
      cancelAnimationFrame(animIdRef.current)
    }
  }, [])

  // 使用 suppressHydrationWarning 避免服务端/客户端不匹配
  const features = [
    {
      icon: '🎲',
      title: t('landing.features.roguelike', language),
      desc: t('landing.features.roguelikeDesc', language)
    },
    {
      icon: '⚡',
      title: t('landing.features.combat', language),
      desc: t('landing.features.combatDesc', language)
    },
    {
      icon: '💎',
      title: t('landing.features.loot', language),
      desc: t('landing.features.lootDesc', language)
    }
  ]

  return (
    <div className="relative min-h-screen w-full overflow-hidden bg-[#05060b]">
      {/* 星空背景 */}
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

      {/* 主内容 */}
      <main className="relative z-10 flex flex-col items-center justify-center min-h-screen px-6 py-20">
        {/* Logo 区域 */}
        <motion.div
          initial={{ opacity: 0, y: -30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, ease: 'easeOut' }}
          className="text-center mb-8"
        >
          {/* 飞船图标 */}
          <motion.div
            animate={{ y: [0, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
            className="mb-6"
          >
            <svg width="100" height="100" viewBox="0 0 64 64" fill="none" className="mx-auto drop-shadow-[0_0_30px_rgba(94,242,255,0.5)]">
              <g stroke="#5ef2ff" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round">
                <polygon points="32 6 48 22 54 42 32 56 10 42 16 22" fill="#0b1220"/>
                <polygon points="32 12 40 26 32 38 24 26" fill="#ffd166"/>
                <path d="M20 30 L8 42"/>
                <path d="M44 30 L56 42"/>
                <path d="M26 48 L22 58"/>
                <path d="M38 48 L42 58"/>
              </g>
              <motion.ellipse
                cx="32" cy="58" rx="10" ry="5"
                fill="#5ef2ff"
                animate={{ opacity: [0.3, 0.7, 0.3], ry: [5, 8, 5] }}
                transition={{ duration: 0.8, repeat: Infinity }}
              />
            </svg>
          </motion.div>

          {/* 标题 */}
          <h1 className="text-6xl md:text-8xl font-bold tracking-wider mb-4" suppressHydrationWarning>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-cyan-200 to-cyan-500 drop-shadow-[0_0_30px_rgba(94,242,255,0.3)]">
              {t('landing.title', language)}
            </span>
          </h1>

          {/* 副标题 */}
          <p className="text-cyan-400/70 text-lg md:text-xl tracking-[0.3em] mb-2" suppressHydrationWarning>
            {t('landing.subtitle', language)}
          </p>
          <p className="text-cyan-500/50 text-sm max-w-md mx-auto" suppressHydrationWarning>
            {t('landing.tagline', language)}
          </p>
        </motion.div>

        {/* CTA 按钮 */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col sm:flex-row gap-4 mb-16"
        >
          <Link href="/game">
            <motion.button
              whileHover={{ scale: 1.05, boxShadow: '0 0 40px rgba(94,242,255,0.4)' }}
              whileTap={{ scale: 0.98 }}
              className="px-10 py-4 rounded-full bg-gradient-to-r from-cyan-500 to-cyan-400 text-black font-bold text-lg tracking-wider shadow-[0_0_30px_rgba(94,242,255,0.3)] hover:shadow-[0_0_50px_rgba(94,242,255,0.5)] transition-all"
              suppressHydrationWarning
            >
              {t('landing.playNow', language)}
            </motion.button>
          </Link>

          <Link href="/leaderboard">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.98 }}
              className="px-8 py-4 rounded-full border-2 border-cyan-500/50 text-cyan-400 font-semibold text-lg tracking-wider hover:bg-cyan-500/10 transition-all"
              suppressHydrationWarning
            >
              {t('landing.leaderboard', language)}
            </motion.button>
          </Link>
        </motion.div>

        {/* 特性卡片 */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl w-full mb-16"
        >
          {features.map((feature, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5, borderColor: 'rgba(94,242,255,0.5)' }}
              className="p-6 rounded-2xl border border-cyan-500/20 bg-black/30 backdrop-blur-sm text-center transition-all"
              suppressHydrationWarning
            >
              <div className="text-4xl mb-3">{feature.icon}</div>
              <h3 className="text-cyan-300 font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-cyan-500/60 text-sm">{feature.desc}</p>
            </motion.div>
          ))}
        </motion.div>

        {/* 操作提示 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ duration: 1, delay: 1 }}
          className="text-cyan-500/40 text-sm tracking-wider"
          suppressHydrationWarning
        >
          {t('landing.controls', language)}
        </motion.div>
      </main>

      {/* 底部装饰线 */}
      <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent" />
    </div>
  )
}
