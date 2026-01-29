"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import gsap from "gsap"
import { ScrollTrigger } from "gsap/ScrollTrigger"
import { useGSAP } from "@gsap/react"
import { motion } from "framer-motion"

gsap.registerPlugin(ScrollTrigger)

const heroStats = [
  { label: "Story Beats", value: "05" },
  { label: "Micro Interactions", value: "12" },
  { label: "Glass Layers", value: "08" },
]

const storySteps = [
  {
    title: "起点：一条信念",
    desc: "只做一件事，把游戏性做到极致。",
  },
  {
    title: "节奏：操作被回应",
    desc: "闪避、连击、升级都能被清晰感知。",
  },
  {
    title: "价值：快乐可持续",
    desc: "玩家越玩越强，也越玩越开心。",
  },
]

const features = [
  {
    title: "滚动即时间轴",
    desc: "ScrollTrigger 把页面变成叙事轨道，推动节奏与层级。",
  },
  {
    title: "玻璃留白",
    desc: "60% 留白 + 轻玻璃层，让内容更安静、更有呼吸感。",
  },
  {
    title: "轻量动效",
    desc: "仅用 HTML/CSS/GSAP 实现，不依赖重素材或 3D。",
  },
]

const interactionLabs = [
  {
    title: "Hover 反馈",
    desc: "轻微放大与高光，让操控感更明确。",
  },
  {
    title: "键盘脉冲",
    desc: "按键触发能量脉冲，强调输入响应。",
  },
  {
    title: "滚轮推进",
    desc: "滚动驱动进度线与层级变化。",
  },
]

export default function LandingPage() {
  const containerRef = useRef<HTMLDivElement>(null)
  const heroRef = useRef<HTMLDivElement>(null)
  const pointerRef = useRef<HTMLDivElement>(null)
  const keyPulseRef = useRef<HTMLDivElement>(null)
  const clickPulseRef = useRef<HTMLSpanElement>(null)
  const heroProgressRef = useRef<HTMLDivElement>(null)
  const scrollLineRef = useRef<HTMLDivElement>(null)
  const wheelGlowRef = useRef<HTMLDivElement>(null)
  const wheelCooldownRef = useRef(0)
  const [lastKey, setLastKey] = useState("W")
  const [status, setStatus] = useState("滚动驱动已就绪")

  const revealTargets = useCallback(() => {
    if (!containerRef.current) return []
    return Array.from(containerRef.current.querySelectorAll<HTMLElement>(".reveal"))
  }, [])

  const runReveal = useCallback(() => {
    const targets = revealTargets()
    if (!targets.length) return
    gsap.killTweensOf(targets)
    gsap.fromTo(
      targets,
      { opacity: 0, y: 24, scale: 0.98 },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.9,
        ease: "power3.out",
        stagger: 0.08,
      }
    )
  }, [revealTargets])

  useGSAP(
    () => {
      runReveal()

      const sections = gsap.utils.toArray<HTMLElement>(".scroll-in")
      sections.forEach((section) => {
        gsap.fromTo(
          section,
          { opacity: 0, y: 28 },
          {
            opacity: 1,
            y: 0,
            duration: 1,
            ease: "power3.out",
            scrollTrigger: {
              trigger: section,
              start: "top 82%",
              toggleActions: "play none none reverse",
            },
          }
        )
      })

      if (heroRef.current) {
        gsap.set(".story-step", { autoAlpha: 0.25, y: 20 })
        gsap.set(".hero-card", { y: 18, autoAlpha: 0.9 })
        gsap.set(".hero-stat", { y: 10, autoAlpha: 0.75 })
        gsap.set(".glass-layer", { y: 0 })
        gsap.set(".orbit-ring", { rotate: -12, scale: 0.96 })
        gsap.set(".hero-rail-line", { scaleY: 0 })
        gsap.set(".hero-rail-dot", { autoAlpha: 0.4, scale: 0.7, y: 12 })

        const heroTimeline = gsap.timeline({
          scrollTrigger: {
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            scrub: 0.8,
          },
        })

        heroTimeline
          .to(".orbit-ring", { rotate: 200, scale: 1.06, ease: "none" }, 0)
          .to(".glass-layer", { y: -22, stagger: 0.08, ease: "none" }, 0.05)
          .to(".hero-title", { y: -18, opacity: 0.95, ease: "none" }, 0)
          .to(".hero-card", { y: -6, autoAlpha: 1, ease: "none" }, 0.1)
          .to(".hero-stat", { y: 0, autoAlpha: 1, stagger: 0.08, ease: "none" }, 0.12)
          .to(".story-step", { autoAlpha: 1, y: 0, stagger: 0.18, ease: "none" }, 0.12)
          .to(".hero-rail-line", { scaleY: 1, ease: "none" }, 0)
          .to(".hero-rail-dot", { autoAlpha: 1, scale: 1, y: 0, ease: "none" }, 0.05)

        if (heroProgressRef.current) {
          heroTimeline.to(
            heroProgressRef.current,
            { scaleX: 1, transformOrigin: "left center", ease: "none" },
            0
          )
        }
      }

      if (scrollLineRef.current) {
        gsap.fromTo(
          scrollLineRef.current,
          { scaleX: 0 },
          {
            scaleX: 1,
            transformOrigin: "left center",
            ease: "none",
            scrollTrigger: {
              trigger: scrollLineRef.current,
              start: "top 90%",
              end: "bottom 40%",
              scrub: true,
            },
          }
        )
      }
    },
    { scope: containerRef }
  )

  useEffect(() => {
    const container = containerRef.current
    const pointer = pointerRef.current
    if (!container || !pointer) return

    const xTo = gsap.quickTo(pointer, "x", { duration: 0.6, ease: "power3.out" })
    const yTo = gsap.quickTo(pointer, "y", { duration: 0.6, ease: "power3.out" })

    const handleMove = (event: MouseEvent) => {
      const rect = container.getBoundingClientRect()
      const x = event.clientX - rect.left - rect.width / 2
      const y = event.clientY - rect.top - rect.height / 2
      xTo(x * 0.12)
      yTo(y * 0.12)
    }

    container.addEventListener("mousemove", handleMove)
    return () => container.removeEventListener("mousemove", handleMove)
  }, [])

  useEffect(() => {
    const handleKey = (event: KeyboardEvent) => {
      setLastKey(event.key.toUpperCase())
      setStatus("键盘触发：节奏被唤醒")
      if (keyPulseRef.current) {
        gsap.fromTo(
          keyPulseRef.current,
          { scale: 0.6, opacity: 0.2 },
          { scale: 1.1, opacity: 1, duration: 0.45, ease: "back.out(2)" }
        )
      }
    }
    window.addEventListener("keydown", handleKey)
    return () => window.removeEventListener("keydown", handleKey)
  }, [])

  useEffect(() => {
    const refreshId = window.setTimeout(() => {
      ScrollTrigger.refresh()
    }, 80)
    return () => window.clearTimeout(refreshId)
  }, [])

  useEffect(() => {
    const handleWheel = () => {
      const now = Date.now()
      if (now - wheelCooldownRef.current < 160) return
      wheelCooldownRef.current = now
      setStatus("滚轮推进：故事继续")
      if (wheelGlowRef.current) {
        gsap.fromTo(
          wheelGlowRef.current,
          { scale: 0.8, opacity: 0.4 },
          { scale: 1.4, opacity: 1, duration: 0.35, ease: "power2.out" }
        )
      }
    }
    window.addEventListener("wheel", handleWheel, { passive: true })
    return () => window.removeEventListener("wheel", handleWheel)
  }, [])

  const refreshMotion = () => {
    runReveal()
    setStatus("刷新完成：元素渐进出现")
  }

  const handleClick = () => {
    if (!clickPulseRef.current) return
    gsap.fromTo(
      clickPulseRef.current,
      { scale: 0.2, opacity: 0.8 },
      { scale: 1.4, opacity: 0, duration: 0.6, ease: "power2.out" }
    )
    setStatus("点击触发：能量扩散")
  }

  const glassPanel =
    "relative rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,rgba(255,255,255,0.94),rgba(255,255,255,0.7))] backdrop-blur-[22px] shadow-[0_32px_90px_rgba(10,20,40,0.18)] before:pointer-events-none before:absolute before:inset-0 before:rounded-[32px] before:bg-[linear-gradient(120deg,rgba(255,255,255,0.65),rgba(255,255,255,0))] before:opacity-80 before:content-['']"
  const glassCard =
    "relative rounded-2xl border border-white/70 bg-white/80 backdrop-blur-[16px] shadow-[0_18px_50px_rgba(10,20,40,0.12)] before:pointer-events-none before:absolute before:inset-0 before:rounded-2xl before:bg-[linear-gradient(130deg,rgba(255,255,255,0.72),rgba(255,255,255,0))] before:opacity-70 before:content-[''] transition-[transform,box-shadow] duration-300 hover:-translate-y-1 hover:shadow-[0_22px_60px_rgba(10,20,40,0.16)]"

  return (
    <div
      ref={containerRef}
      className="relative min-h-screen w-full overflow-x-hidden bg-[#f7f7fb] text-slate-900"
    >
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute inset-0 opacity-50 [background-image:linear-gradient(rgba(15,23,42,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(15,23,42,0.04)_1px,transparent_1px)] [background-size:72px_72px]" />
        <div className="absolute -top-40 right-0 h-[460px] w-[460px] rounded-full bg-[radial-gradient(circle_at_top,rgba(90,126,255,0.18),transparent_60%)]" />
        <div className="absolute bottom-0 left-0 h-[520px] w-[520px] rounded-full bg-[radial-gradient(circle_at_bottom,rgba(255,177,120,0.18),transparent_60%)]" />
        <div className="absolute left-1/3 top-1/4 h-64 w-64 rounded-full bg-[radial-gradient(circle,rgba(120,210,255,0.16),transparent_70%)]" />
      </div>

      <div
        ref={pointerRef}
        className="pointer-events-none absolute left-1/2 top-1/2 h-32 w-32 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.9),transparent_70%)] blur-3xl"
      />

      <main className="relative mx-auto flex w-full max-w-[1200px] flex-col gap-28 px-6 pb-32 pt-20 md:px-10 lg:px-12">
        <section
          ref={heroRef}
          className="relative min-h-[92vh] overflow-hidden pb-10 isolate lg:min-h-[100vh] lg:pb-16"
        >
          <div className="pointer-events-none absolute -left-6 top-12 hidden h-[72vh] w-10 flex-col items-center gap-6 text-[10px] uppercase tracking-[0.32em] text-slate-400 lg:flex">
            <span className="origin-left -rotate-90 text-slate-400">Scroll</span>
            <div className="relative flex h-full w-2 items-start justify-center">
              <span className="absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-slate-200/70" />
              <span className="hero-rail-line absolute left-1/2 top-0 h-full w-px -translate-x-1/2 origin-top bg-gradient-to-b from-slate-900/70 via-slate-500/40 to-transparent" />
              <span className="hero-rail-dot absolute left-1/2 top-0 h-2.5 w-2.5 -translate-x-1/2 rounded-full border border-slate-900/40 bg-white shadow-[0_0_22px_rgba(15,23,42,0.2)]" />
            </div>
          </div>
          <div className="lg:sticky lg:top-14 lg:pt-4">
            <div className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-10">
            <div className="space-y-8 lg:col-span-7">
              <div className="reveal flex flex-wrap items-center gap-3 text-[11px] uppercase tracking-[0.32em] text-slate-500">
                <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-slate-700">
                  GSAP Scroll Story
                </span>
                <span className="rounded-full border border-white/70 bg-white/70 px-3 py-1 text-slate-700">
                  Glass UI
                </span>
                <span className="font-[var(--font-display)] text-slate-700">Space Dodge</span>
              </div>

              <div className="reveal space-y-6">
                <h1 className="hero-title max-w-3xl text-4xl font-semibold leading-[1.05] text-slate-950 md:text-6xl md:leading-[1.02]">
                  <span className="block font-[var(--font-display)] tracking-tight">
                    让滚动成为时间轴
                  </span>
                  <span className="block text-slate-800">把游戏性讲成一段故事</span>
                </h1>
                <p className="max-w-2xl text-base leading-relaxed text-slate-600 md:text-lg">
                  我们只坚持一条信念：把游戏性做到极致。每一次闪避、每一次连击、每一次升级，都必须被玩家清晰
                  感知。快乐要能持续，成长要能被看见，这才是值得长期投入的游戏体验。
                </p>
              </div>

              <div className="reveal flex flex-wrap items-center gap-4">
                <motion.div whileHover={{ scale: 1.03 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href="/game"
                    className="inline-flex items-center justify-center rounded-full bg-slate-950 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20"
                  >
                    进入游戏
                  </Link>
                </motion.div>
                <motion.button
                  type="button"
                  onClick={refreshMotion}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="rounded-full border border-white/70 bg-white/75 px-7 py-3 text-sm font-semibold text-slate-700 shadow-sm"
                >
                  刷新动效
                </motion.button>
                <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1 text-xs text-slate-500">
                  {status}
                </span>
              </div>

              <div className="reveal grid gap-4 sm:grid-cols-3">
                {heroStats.map((item) => (
                  <div
                    key={item.label}
                    className={`${glassCard} hero-stat flex h-full flex-col items-center justify-center gap-1 px-4 py-4 text-center`}
                  >
                    <div className="text-2xl font-semibold text-slate-900">{item.value}</div>
                    <div className="text-xs uppercase tracking-[0.24em] text-slate-500">
                      {item.label}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="relative mx-auto w-full max-w-[460px] lg:col-span-5 lg:justify-self-end">
              <div className="orbit-ring pointer-events-none absolute -right-8 -top-10 h-44 w-44 rounded-full border border-slate-200/80 bg-[radial-gradient(circle,rgba(120,190,255,0.14),transparent_70%)]" />
              <div className="glass-layer pointer-events-none absolute -inset-4 rounded-[32px] border border-white/50 bg-white/50 backdrop-blur-3xl opacity-70" />
              <div className="glass-layer pointer-events-none absolute -inset-2 rounded-[32px] border border-white/40 bg-white/40 backdrop-blur-3xl opacity-60" />

              <div className={`${glassPanel} hero-card relative z-10 space-y-6 p-6`}>
                <div className="flex items-center justify-between text-[11px] uppercase tracking-[0.32em] text-slate-400">
                  <span>Mission Log</span>
                  <span className="text-slate-500">Scroll Driven</span>
                </div>

                <div className="space-y-4">
                  {storySteps.map((step) => (
                    <div key={step.title} className="story-step rounded-2xl border border-white/60 bg-white/70 p-4">
                      <div className="text-sm font-semibold text-slate-800">{step.title}</div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-500">{step.desc}</p>
                    </div>
                  ))}
                </div>

                <div className="space-y-3">
                  <div className="h-1.5 w-full overflow-hidden rounded-full bg-slate-200/70">
                    <div
                      ref={heroProgressRef}
                      className="h-full w-full origin-left scale-x-0 rounded-full bg-slate-900/70"
                    />
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span ref={wheelGlowRef} className="h-2 w-2 rounded-full bg-slate-900/70" />
                    <span>滚轮推动故事前进</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
          </div>
        </section>

        <section className="scroll-in relative z-10 space-y-10">
          <div className="flex flex-wrap items-end justify-between gap-6">
            <div className="space-y-3">
              <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">Core Focus</p>
              <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">核心设计</h2>
            </div>
            <span className="rounded-full border border-white/70 bg-white/70 px-4 py-2 text-[11px] uppercase tracking-[0.32em] text-slate-500">
              60% 留白布局
            </span>
          </div>
          <div className="grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <div
                key={feature.title}
                className={`${glassCard} group min-h-[180px] space-y-3 p-6`}
              >
                <div className="text-lg font-semibold text-slate-900 group-hover:text-slate-800">
                  {feature.title}
                </div>
                <p className="text-sm leading-relaxed text-slate-600">{feature.desc}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="scroll-in relative z-10 space-y-10">
          <div className="space-y-3">
            <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">Interaction Lab</p>
            <h2 className="text-3xl font-semibold text-slate-900 md:text-4xl">交互演示</h2>
          </div>

          <div className="grid gap-6 md:grid-cols-3">
            {interactionLabs.map((card, index) => (
              <div
                key={card.title}
                className={`${glassCard} group min-h-[200px] space-y-4 p-6`}
              >
                <div>
                  <div className="text-lg font-semibold text-slate-900">{card.title}</div>
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">{card.desc}</p>
                </div>
                {index === 0 && (
                  <div className="relative h-24 overflow-hidden rounded-2xl border border-white/50 bg-white/60">
                    <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(90,120,255,0.12),transparent_70%)]" />
                    <div className="absolute left-5 top-5 h-10 w-10 rounded-full bg-white/80 shadow-lg transition-transform duration-300 group-hover:translate-x-2" />
                  </div>
                )}
                {index === 1 && (
                  <div className="flex items-center gap-3">
                    <div
                      ref={keyPulseRef}
                      className="flex h-12 w-12 items-center justify-center rounded-2xl border border-white/60 bg-white/70 text-lg font-semibold text-slate-800"
                    >
                      {lastKey}
                    </div>
                    <p className="text-xs text-slate-500">按下任意键触发脉冲</p>
                  </div>
                )}
                {index === 2 && (
                  <div className="space-y-2">
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/60">
                      <div ref={scrollLineRef} className="h-full w-full rounded-full bg-slate-900/70" />
                    </div>
                    <p className="text-xs text-slate-500">滚动查看进度变化</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </section>

        <section className="scroll-in relative z-10">
          <div className={`${glassPanel} relative overflow-hidden`}>
            <div className="absolute -right-16 -top-16 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(120,190,255,0.2),transparent_65%)]" />
            <div className="flex flex-col gap-8 p-10 md:flex-row md:items-center md:justify-between">
              <div className="space-y-4">
                <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">About Us</p>
                <h3 className="text-3xl font-semibold text-slate-900 md:text-4xl">关于我们</h3>
                <p className="max-w-xl text-sm leading-relaxed text-slate-600">
                  我们相信真正的游戏性来自可感知的成长与持续的掌控感。Space Dodge 从一个很小的问题出发：
                  为什么好玩的游戏总是玩得不够久？于是我们只做一件事——让每一次操作都被回应，让每一次胜利都
                  证明“我变强了”。当快乐可以持续，信念就会留下来。
                </p>
              </div>
              <div className="relative">
                <motion.button
                  type="button"
                  onClick={handleClick}
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.97 }}
                  className="relative rounded-full bg-slate-950 px-8 py-3 text-sm font-semibold text-white shadow-lg shadow-slate-900/20"
                >
                  立即起航
                  <span
                    ref={clickPulseRef}
                    className="pointer-events-none absolute left-1/2 top-1/2 h-16 w-16 -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/70"
                  />
                </motion.button>
              </div>
            </div>
          </div>
        </section>
      </main>
      <footer className="relative mx-auto w-full max-w-[1200px] px-6 pb-16 md:px-10 lg:px-12">
        <div className={`${glassPanel} flex flex-col gap-4 px-8 py-6 md:flex-row md:items-center md:justify-between`}>
          <div className="space-y-2">
            <p className="text-[11px] uppercase tracking-[0.32em] text-slate-400">Space Dodge</p>
            <p className="text-sm text-slate-600">Scroll-driven glass UI for a lightweight cosmic arcade.</p>
          </div>
          <div className="flex flex-wrap items-center gap-3 text-xs uppercase tracking-[0.24em] text-slate-500">
            <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1">GSAP</span>
            <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1">Framer</span>
            <span className="rounded-full border border-white/70 bg-white/80 px-3 py-1">Tailwind</span>
          </div>
        </div>
      </footer>
    </div>
  )
}
