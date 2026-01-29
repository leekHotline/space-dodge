'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { dropConfig, enemies as enemyPool, items as itemPool, levelConfig } from '@/lib/game-data'

type Vector2 = { x: number; y: number }

type BulletKind = 'normal' | 'rapid' | 'charged' | 'echo' | 'enemy' | 'sniper' | 'spray' | 'orb' | 'shrapnel' | 'boss' | 'bomb'

interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  radius: number
  from: 'player' | 'enemy'
  kind?: BulletKind
  pierce?: number
  explodeAt?: number
  fragments?: number
}

interface EnemyEntity {
  id: string
  defId: string
  x: number
  y: number
  vx: number
  vy: number
  hp: number
  maxHp: number
  size: number
  behavior: string
  family: 'space' | 'old-testament'
  shootTimer: number
  dashTimer: number
  blinkTimer: number
  dotUntil: number
  dotDps: number
  buffed: boolean
  variant?: number
  isBoss?: boolean
  phase?: 1 | 2 | 3
  orbitAngle?: number
  orbitRadius?: number
  shield?: number
  shieldMax?: number
  shieldRegenAt?: number
}

interface Pickup {
  id: string
  itemId: string
  x: number
  y: number
  vy: number
  radius: number
}

interface EchoShot {
  fireAt: number
  origin: Vector2
}

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  size: number
  color: string
  glow?: number
}

interface RingFx {
  x: number
  y: number
  radius: number
  width: number
  life: number
  color: string
}

interface FlashFx {
  x: number
  y: number
  angle: number
  life: number
  size: number
  color: string
}

interface FloatText {
  x: number
  y: number
  text: string
  life: number
  color: string
}

interface StarPoint {
  x: number
  y: number
  size: number
  alpha: number
  twinkle: number
  phase: number
  bright: boolean
}

interface StarLayer {
  speed: number
  tint: [number, number, number]
  stars: StarPoint[]
}

interface StarField {
  width: number
  height: number
  layers: StarLayer[]
  dust: StarPoint[]
  bandAngle: number
}

interface ShootingStar {
  x: number
  y: number
  vx: number
  vy: number
  life: number
  maxLife: number
  width: number
}

const CANVAS_PADDING = 32
const PLAYER_RADIUS = 16
const BULLET_RADIUS = 4
const ENEMY_BULLET_RADIUS = 5
const CHARGE_MAX_SEC = 1.2
const CHARGE_MIN_SEC = 0.12
const AUTO_FIRE_MIN_SEC = 0.08
const AUTO_FIRE_MAX_SEC = 0.1
const AUTO_FIRE_DELAY_SEC = 0.14
const DODGE_DURATION_SEC = 0.22
const DODGE_SPEED_MULT = 3.2
const DODGE_COST = 35
const DODGE_COOLDOWN_SEC = 0.35
const STAMINA_MAX = 100
const STAMINA_REGEN_PER_SEC = 45
const MAX_BULLETS = 480
const MAX_ENEMIES = 90
const MAX_PARTICLES = 220
const MAX_RINGS = 48
const MAX_FLASHES = 40
const STAR_LAYER_PRESETS = [
  { count: 110, speed: 5, size: [0.6, 1.2], alpha: [0.15, 0.45], tint: [120, 190, 225] },
  { count: 85, speed: 9, size: [0.8, 1.5], alpha: [0.25, 0.6], tint: [150, 215, 245] },
  { count: 50, speed: 14, size: [1.0, 2.0], alpha: [0.35, 0.75], tint: [180, 230, 250] }
]
const STAR_DUST_COUNT = 130

const colors = {
  bg: '#05060b',
  accent: '#5ef2ff',
  accentSoft: 'rgba(94,242,255,0.35)',
  danger: '#ff5b5b',
  warning: '#ffd166',
  good: '#7dff8b'
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value))
const distance = (a: Vector2, b: Vector2) => Math.hypot(a.x - b.x, a.y - b.y)
const rand = (min: number, max: number) => Math.random() * (max - min) + min
const trimArray = <T,>(items: T[], max: number) => {
  if (items.length > max) items.splice(0, items.length - max)
}

const getItemById = (id: string) => itemPool.find((item) => item.id === id)
const enemyMap = new Map(enemyPool.map((enemy) => [enemy.id, enemy]))

const bossDef = {
  id: 'B01',
  name: { zh: '裂隙主宰', en: 'Rift Sovereign' },
  family: 'old-testament' as const,
  baseHp: 95,
  baseSpeed: 1.05,
  baseDamage: 18,
  size: 48
}

const weightedPick = (entries: Array<{ id: string; weight: number }>) => {
  const total = entries.reduce((sum, entry) => sum + entry.weight, 0)
  const roll = Math.random() * total
  let acc = 0
  for (const entry of entries) {
    acc += entry.weight
    if (roll <= acc) return entry.id
  }
  return entries[0]?.id ?? ''
}

const buildStarField = (width: number, height: number): StarField => {
  const layers: StarLayer[] = STAR_LAYER_PRESETS.map((preset) => ({
    speed: preset.speed,
    tint: preset.tint as [number, number, number],
    stars: Array.from({ length: preset.count }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      size: rand(preset.size[0], preset.size[1]),
      alpha: rand(preset.alpha[0], preset.alpha[1]),
      twinkle: rand(0.6, 1.6),
      phase: rand(0, Math.PI * 2),
      bright: Math.random() < 0.04
    }))
  }))

  const dust: StarPoint[] = Array.from({ length: STAR_DUST_COUNT }, () => ({
    x: rand(-width * 0.7, width * 0.7),
    y: rand(-height * 0.16, height * 0.16),
    size: rand(0.3, 1.1),
    alpha: rand(0.08, 0.3),
    twinkle: rand(0.35, 0.9),
    phase: rand(0, Math.PI * 2),
    bright: Math.random() < 0.03
  }))

  return {
    width,
    height,
    layers,
    dust,
    bandAngle: -0.35
  }
}

const computeStats = (activeItemIds: string[], timeSec: number) => {
  const activeItems = activeItemIds.map(getItemById).filter(Boolean)
  let fireRate = levelConfig.baseFireRate
  let moveSpeed = levelConfig.baseMoveSpeed
  let damage = 18
  let critChance = 6
  let critDamage = 150
  let cloneChance = 0
  let lifeSteal = 0
  let dotDamagePct = 0
  let movingDamageReduce = 0
  let accuracyBonus = 0
  let eliteDamageBonus = 0
  let shieldCapBonus = 0
  let overheatActive = false
  let dodgeWindowMs = 0
  let bulletSpeedMul = 1
  let bulletSizeMul = 1
  let shipScale = 1
  let shipGlow = 0
  let trailStrength = 0

  const tags = new Set<string>()

  activeItems.forEach((item) => {
    if (!item) return
    item.tags.forEach((tag) => tags.add(tag))
    if (item.stats.fireRatePct) fireRate *= 1 - item.stats.fireRatePct / 100
    if (item.stats.moveSpeedPct) moveSpeed *= 1 + item.stats.moveSpeedPct / 100
    if (item.stats.energyDamagePct) damage *= 1 + item.stats.energyDamagePct / 100
    if (item.stats.critPct) critChance += item.stats.critPct
    if (item.stats.critDamagePct) critDamage += item.stats.critDamagePct
    if (item.stats.cloneChancePct) cloneChance += item.stats.cloneChancePct
    if (item.stats.lifeStealPct) lifeSteal += item.stats.lifeStealPct
    if (item.stats.dotDamagePct) dotDamagePct += item.stats.dotDamagePct
    if (item.stats.movingDamageReducePct) movingDamageReduce += item.stats.movingDamageReducePct
    if (item.stats.accuracyPct) accuracyBonus += item.stats.accuracyPct
    if (item.stats.eliteBossDamagePct) eliteDamageBonus += item.stats.eliteBossDamagePct
    if (item.stats.shieldCapPct) shieldCapBonus += item.stats.shieldCapPct
    if (item.id === 'I11') overheatActive = true
    if (item.stats.dodgeWindowMs) dodgeWindowMs += item.stats.dodgeWindowMs
    if (item.stats.bulletSpeedPct) bulletSpeedMul *= 1 + item.stats.bulletSpeedPct / 100
    if (item.stats.bulletSizePct) bulletSizeMul *= 1 + item.stats.bulletSizePct / 100
    if (item.stats.shipScalePct) shipScale *= 1 + item.stats.shipScalePct / 100
    if (item.stats.shipGlowPct) shipGlow += item.stats.shipGlowPct
    if (item.stats.trailPct) trailStrength += item.stats.trailPct
  })

  if (tags.has('energy') && tags.has('crit')) {
    critChance += 5
  }
  if (tags.has('clone') && tags.has('echo')) {
    cloneChance += 5
  }

  let shipAccent = colors.accent
  let shotColor = colors.accent
  if (tags.has('crit')) {
    shipAccent = '#ff6fa1'
    shotColor = '#ff8cf0'
  } else if (tags.has('mobility')) {
    shipAccent = '#7dff8b'
    shotColor = '#9dffb8'
  } else if (tags.has('defense')) {
    shipAccent = '#86c6ff'
    shotColor = '#a6d8ff'
  }

  return {
    fireRate,
    moveSpeed,
    damage,
    critChance,
    critDamage,
    cloneChance,
    lifeSteal,
    dotDamagePct,
    movingDamageReduce,
    accuracyBonus,
    eliteDamageBonus,
    shieldCapBonus,
    overheatActive,
    bulletSpeedMul,
    bulletSizeMul,
    shipScale,
    shipGlow,
    trailStrength,
    dodgeWindowMs,
    shipAccent,
    shotColor
  }
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 960, height: 600 })
  const [runtimeError, setRuntimeError] = useState<string | null>(null)

  const {
    phase,
    level,
    score,
    highScore,
    kills,
    timeSec,
    language,
    playerName,
    seed,
    activeItems,
    endGame,
    setLevel,
    setTimeSec,
    addScore,
    addKill,
    addItem,
    removeExpiredItems,
    setBossPhase,
  } = useGameStore()

  const playerRef = useRef({
    x: 480,
    y: 320,
    vx: 0,
    vy: 0,
    hp: levelConfig.baseHp,
    shield: levelConfig.baseShield,
    maxHp: levelConfig.baseHp,
    maxShield: levelConfig.baseShield,
    invulnUntil: 0
  })

  const bulletsRef = useRef<Bullet[]>([])
  const enemiesRef = useRef<EnemyEntity[]>([])
  const pickupsRef = useRef<Pickup[]>([])
  const echoShotsRef = useRef<EchoShot[]>([])
  const keysRef = useRef(new Set<string>())
  const mouseRef = useRef<Vector2>({ x: 480, y: 0 })
  const leftDownRef = useRef(false)
  const leftDownAtRef = useRef(0)
  const leftHasFiredRef = useRef(false)
  const leftTapPendingRef = useRef(false)
  const rightDownRef = useRef(false)
  const pendingChargeRef = useRef<number | null>(null)
  const chargeRef = useRef(0)
  const staminaRef = useRef(STAMINA_MAX)
  const dodgeUntilRef = useRef(0)
  const dodgeCooldownRef = useRef(0)
  const dodgeVectorRef = useRef<Vector2>({ x: 0, y: 0 })
  const spacePressedRef = useRef(false)
  const trailRef = useRef<Array<{ x: number; y: number; ttl: number }>>([])
  const motionTrailRef = useRef<Array<{ x: number; y: number; ttl: number; size: number }>>([])
  const particlesRef = useRef<Particle[]>([])
  const ringsRef = useRef<RingFx[]>([])
  const flashesRef = useRef<FlashFx[]>([])
  const floatTextsRef = useRef<FloatText[]>([])
  const starFieldRef = useRef<StarField>({ width: 0, height: 0, layers: [], dust: [], bandAngle: -0.35 })
  const shootingStarsRef = useRef<ShootingStar[]>([])
  const lastUiUpdateRef = useRef(0)
  const lastBossPhaseRef = useRef<number | null>(null)
  const statsRef = useRef<ReturnType<typeof computeStats> | null>(null)
  const comboRef = useRef(0)
  const comboTimerRef = useRef(0)
  const bossSpawnLevelRef = useRef<number | null>(null)
  const spawnTimerRef = useRef(0)
  const fireTimerRef = useRef(0)
  const runSavedRef = useRef(false)
  const timeRef = useRef(0)
  const levelRef = useRef(1)
  const overheatUntilRef = useRef(0)
  const overloadActiveRef = useRef(false)
  const guaranteedDropRef = useRef(0)

  useEffect(() => {
    const handleError = (event: ErrorEvent) => {
      setRuntimeError(event.message || 'Unknown runtime error')
      console.error('Runtime error:', event.error || event.message)
    }
    const handleRejection = (event: PromiseRejectionEvent) => {
      setRuntimeError('Unhandled rejection')
      console.error('Unhandled rejection:', event.reason)
    }

    const resize = () => {
      setCanvasSize({
        width: window.innerWidth,
        height: window.innerHeight
      })
    }
    resize()
    window.addEventListener('error', handleError)
    window.addEventListener('unhandledrejection', handleRejection)
    window.addEventListener('resize', resize)
    return () => {
      window.removeEventListener('resize', resize)
      window.removeEventListener('error', handleError)
      window.removeEventListener('unhandledrejection', handleRejection)
    }
  }, [])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.code === 'Space') {
        event.preventDefault()
        if (!spacePressedRef.current) {
          spacePressedRef.current = true
        }
        return
      }
      keysRef.current.add(event.key.toLowerCase())
    }
    const handleKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.key.toLowerCase())
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current = { x: event.clientX, y: event.clientY }
    }
    const handleMouseDown = (event: MouseEvent) => {
      if (event.button === 0) {
        leftDownRef.current = true
        leftDownAtRef.current = performance.now() / 1000
        leftHasFiredRef.current = false
      } else if (event.button === 2) {
        rightDownRef.current = true
      }
    }
    const handleMouseUp = (event: MouseEvent) => {
      if (event.button === 0) {
        leftDownRef.current = false
        if (!leftHasFiredRef.current) {
          leftTapPendingRef.current = true
        }
      } else if (event.button === 2) {
        rightDownRef.current = false
        pendingChargeRef.current = chargeRef.current
        chargeRef.current = 0
      }
    }
    const handleContextMenu = (event: MouseEvent) => {
      event.preventDefault()
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('mousedown', handleMouseDown)
    window.addEventListener('mouseup', handleMouseUp)
    window.addEventListener('contextmenu', handleContextMenu)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('mousedown', handleMouseDown)
      window.removeEventListener('mouseup', handleMouseUp)
      window.removeEventListener('contextmenu', handleContextMenu)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'playing') return
    runSavedRef.current = false
    timeRef.current = 0
    levelRef.current = 1
    overheatUntilRef.current = 0
    overloadActiveRef.current = false
    guaranteedDropRef.current = 0
    leftDownRef.current = false
    leftDownAtRef.current = 0
    leftHasFiredRef.current = false
    leftTapPendingRef.current = false
    rightDownRef.current = false
    pendingChargeRef.current = null
    chargeRef.current = 0
    staminaRef.current = STAMINA_MAX
    dodgeUntilRef.current = 0
    dodgeCooldownRef.current = 0
    dodgeVectorRef.current = { x: 0, y: 0 }
    spacePressedRef.current = false
    trailRef.current = []
    motionTrailRef.current = []
    particlesRef.current = []
    ringsRef.current = []
    flashesRef.current = []
    floatTextsRef.current = []
    shootingStarsRef.current = []
    lastUiUpdateRef.current = 0
    lastBossPhaseRef.current = null
    statsRef.current = null
    comboRef.current = 0
    comboTimerRef.current = 0
    bossSpawnLevelRef.current = null
    playerRef.current = {
      x: canvasSize.width / 2,
      y: canvasSize.height * 0.7,
      vx: 0,
      vy: 0,
      hp: levelConfig.baseHp,
      shield: levelConfig.baseShield,
      maxHp: levelConfig.baseHp,
      maxShield: levelConfig.baseShield,
      invulnUntil: 0
    }
    bulletsRef.current = []
    enemiesRef.current = []
    pickupsRef.current = []
    echoShotsRef.current = []
    spawnTimerRef.current = 0
    fireTimerRef.current = 0

    const initialItem = itemPool[Math.floor(Math.random() * itemPool.length)]
    if (initialItem) {
      const expiresAt = initialItem.type === 'buff' ? timeRef.current + (initialItem.durationSec ?? 10) : undefined
      addItem({
        id: initialItem.id,
        name: initialItem.name,
        type: initialItem.type,
        expiresAt
      })
    }
  }, [phase, canvasSize])

  useEffect(() => {
    if (phase !== 'playing') {
      setBossPhase(null)
    }
  }, [phase, setBossPhase])

  const activeItemIds = useMemo(() => activeItems.map((item) => item.id), [activeItems])

  useEffect(() => {
    let frameId = 0
    let last = performance.now()

    const loop = (now: number) => {
      const delta = Math.min(0.033, (now - last) / 1000)
      last = now

      if (phase === 'playing') {
        update(delta, now / 1000)
      }
      draw()

      frameId = requestAnimationFrame(loop)
    }

    const update = (delta: number, nowSec: number) => {
      const player = playerRef.current
      const stats = computeStats(activeItemIds, nowSec)
      const overloadActive = activeItemIds.includes('I11')
      if (!overloadActive && overloadActiveRef.current) {
        overheatUntilRef.current = timeRef.current + 3
      }
      overloadActiveRef.current = overloadActive
      if (overheatUntilRef.current > timeRef.current) {
        stats.fireRate *= 1.15
      }
      player.maxShield = levelConfig.baseShield * (1 + stats.shieldCapBonus / 100)
      player.shield = clamp(player.shield, 0, player.maxShield)
      const currentLevel = levelRef.current
      const moveInput = {
        x: (keysRef.current.has('d') ? 1 : 0) - (keysRef.current.has('a') ? 1 : 0),
        y: (keysRef.current.has('s') ? 1 : 0) - (keysRef.current.has('w') ? 1 : 0)
      }
      const inputActive = moveInput.x !== 0 || moveInput.y !== 0
      const isDodging = nowSec < dodgeUntilRef.current

      if (phase !== 'playing') return

      timeRef.current += delta
      removeExpiredItems(timeRef.current)
      staminaRef.current = Math.min(STAMINA_MAX, staminaRef.current + STAMINA_REGEN_PER_SEC * delta)
      comboTimerRef.current = Math.max(0, comboTimerRef.current - delta)
      if (comboTimerRef.current === 0) {
        comboRef.current = 0
      }
      statsRef.current = stats
      if (timeRef.current - lastUiUpdateRef.current >= 0.2) {
        lastUiUpdateRef.current = timeRef.current
        setTimeSec(timeRef.current)
      }

      if (rightDownRef.current) {
        chargeRef.current = Math.min(CHARGE_MAX_SEC, chargeRef.current + delta)
      } else if (chargeRef.current > 0) {
        chargeRef.current = Math.max(0, chargeRef.current - delta * 0.6)
      }

      if (spacePressedRef.current) {
        spacePressedRef.current = false
        if (nowSec >= dodgeCooldownRef.current && staminaRef.current >= DODGE_COST) {
          const dodgeDuration = DODGE_DURATION_SEC + stats.dodgeWindowMs / 1000
          let dx = moveInput.x
          let dy = moveInput.y
          if (dx === 0 && dy === 0) {
            const aim = mouseRef.current
            const angle = Math.atan2(aim.y - player.y, aim.x - player.x)
            dx = Math.cos(angle)
            dy = Math.sin(angle)
          }
          const length = Math.hypot(dx, dy) || 1
          dodgeVectorRef.current = { x: dx / length, y: dy / length }
          dodgeUntilRef.current = nowSec + dodgeDuration
          dodgeCooldownRef.current = nowSec + DODGE_COOLDOWN_SEC
          staminaRef.current = Math.max(0, staminaRef.current - DODGE_COST)
          player.invulnUntil = Math.max(player.invulnUntil, nowSec + dodgeDuration)
        }
      }

      if (isDodging) {
        trailRef.current.push({ x: player.x, y: player.y, ttl: 0.25 })
      }
      trailRef.current = trailRef.current.filter((trail) => {
        trail.ttl -= delta
        return trail.ttl > 0
      })
      if (!isDodging && (inputActive || Math.hypot(player.vx, player.vy) > 12)) {
        motionTrailRef.current.push({
          x: player.x - player.vx * 0.02,
          y: player.y - player.vy * 0.02,
          ttl: 0.18,
          size: 6 + stats.trailStrength * 0.08
        })
        trimArray(motionTrailRef.current, 80)
      }
      motionTrailRef.current = motionTrailRef.current.filter((trail) => {
        trail.ttl -= delta
        return trail.ttl > 0
      })

      const targetLevel = Math.floor(timeRef.current / levelConfig.waveDurationSec) + 1
      if (targetLevel !== levelRef.current) {
        levelRef.current = targetLevel
        setLevel(targetLevel)
        const levelReward = itemPool[Math.floor(Math.random() * itemPool.length)]
        if (levelReward) {
          pickupsRef.current.push({
            id: `level-drop-${Math.random().toString(36).slice(2, 7)}`,
            itemId: levelReward.id,
            x: clamp(player.x + rand(-120, 120), 40, canvasSize.width - 40),
            y: clamp(player.y + rand(-120, 120), 40, canvasSize.height - 40),
            vy: rand(20, 60),
            radius: 12
          })
        }
      }

      if (timeRef.current - guaranteedDropRef.current >= 30) {
        guaranteedDropRef.current = timeRef.current
        const guaranteedItem = itemPool[Math.floor(Math.random() * itemPool.length)]
        if (guaranteedItem) {
          pickupsRef.current.push({
            id: `timed-drop-${Math.random().toString(36).slice(2, 7)}`,
            itemId: guaranteedItem.id,
            x: clamp(player.x + rand(-140, 140), 40, canvasSize.width - 40),
            y: clamp(player.y + rand(-140, 140), 40, canvasSize.height - 40),
            vy: rand(20, 60),
            radius: 12
          })
        }
      }

      if (isDodging) {
        const dodgeSpeed = stats.moveSpeed * 60 * delta * DODGE_SPEED_MULT
        player.x += dodgeVectorRef.current.x * dodgeSpeed
        player.y += dodgeVectorRef.current.y * dodgeSpeed
        player.vx = 0
        player.vy = 0
      } else {
        const targetSpeed = stats.moveSpeed * 60
        let targetVx = 0
        let targetVy = 0
        if (inputActive) {
          const length = Math.hypot(moveInput.x, moveInput.y) || 1
          targetVx = (moveInput.x / length) * targetSpeed
          targetVy = (moveInput.y / length) * targetSpeed
        }
        const accel = inputActive ? 12 : 10
        const blend = Math.min(1, accel * delta)
        player.vx += (targetVx - player.vx) * blend
        player.vy += (targetVy - player.vy) * blend
        player.x += player.vx * delta
        player.y += player.vy * delta
      }

      player.x = clamp(player.x, CANVAS_PADDING, canvasSize.width - CANVAS_PADDING)
      player.y = clamp(player.y, CANVAS_PADDING, canvasSize.height - CANVAS_PADDING)
      const isMoving = Math.hypot(player.vx, player.vy) > 8

      fireTimerRef.current = Math.max(0, fireTimerRef.current - delta)
      const autoFireRate = Math.min(AUTO_FIRE_MAX_SEC, Math.max(AUTO_FIRE_MIN_SEC, stats.fireRate))
      const aim = mouseRef.current
      const angle = Math.atan2(aim.y - player.y, aim.x - player.x)

      const spawnMuzzleFlash = (size: number, color: string) => {
        flashesRef.current.push({ x: player.x, y: player.y, angle, life: 0.12, size, color })
        trimArray(flashesRef.current, MAX_FLASHES)
      }
      const spawnBurst = (x: number, y: number, color: string, count: number, speed: number) => {
        for (let i = 0; i < count; i += 1) {
          const theta = Math.random() * Math.PI * 2
          particlesRef.current.push({
            x,
            y,
            vx: Math.cos(theta) * speed * rand(0.4, 1),
            vy: Math.sin(theta) * speed * rand(0.4, 1),
            life: rand(0.3, 0.7),
            size: rand(2, 4),
            color,
            glow: 10
          })
        }
        trimArray(particlesRef.current, MAX_PARTICLES)
      }
      const spawnRing = (x: number, y: number, color: string, size = PLAYER_RADIUS + 6) => {
        ringsRef.current.push({ x, y, radius: size, width: 2, life: 0.4, color })
        trimArray(ringsRef.current, MAX_RINGS)
      }
      const spawnFloatText = (x: number, y: number, text: string, color: string) => {
        floatTextsRef.current.push({ x, y, text, life: 0.9, color })
        trimArray(floatTextsRef.current, 18)
      }

      const shootPlayer = (
        kind: BulletKind,
        damageValue: number,
        radiusValue: number,
        speedValue: number,
        pierceCount = 0,
        spreadScale = 1
      ) => {
        const spread = rand(-0.12, 0.12) * (1 - stats.accuracyBonus / 100) * spreadScale
        const theta = angle + spread
        bulletsRef.current.push({
          x: player.x,
          y: player.y,
          vx: Math.cos(theta) * speedValue,
          vy: Math.sin(theta) * speedValue,
          damage: damageValue,
          radius: radiusValue,
          from: 'player',
          kind,
          pierce: pierceCount
        })
        trimArray(bulletsRef.current, MAX_BULLETS)
      }
      const spawnCloneShot = (
        kind: BulletKind,
        damageValue: number,
        radiusValue: number,
        speedValue: number,
        pierceCount: number,
        spreadScale: number,
        chanceScale = 1
      ) => {
        if (Math.random() * 100 >= stats.cloneChance * chanceScale) return
        const spread = rand(-0.18, 0.18) * spreadScale
        const theta = angle + spread
        bulletsRef.current.push({
          x: player.x + rand(-10, 10),
          y: player.y + rand(-10, 10),
          vx: Math.cos(theta) * speedValue * 0.95,
          vy: Math.sin(theta) * speedValue * 0.95,
          damage: damageValue * 0.85,
          radius: radiusValue * 0.85,
          from: 'player',
          kind,
          pierce: Math.max(0, pierceCount - 1)
        })
        trimArray(bulletsRef.current, MAX_BULLETS)
      }

      if (leftDownRef.current) {
        const heldTime = nowSec - leftDownAtRef.current
        if (heldTime >= AUTO_FIRE_DELAY_SEC && fireTimerRef.current <= 0) {
          const speedValue = 560 * stats.bulletSpeedMul
          const radiusValue = BULLET_RADIUS * stats.bulletSizeMul * 0.95
          const isCrit = Math.random() * 100 < stats.critChance
          const damageValue = stats.damage * (isCrit ? stats.critDamage / 100 : 1) * 0.9
          shootPlayer('rapid', damageValue, radiusValue, speedValue, 0, 1.2)
          spawnCloneShot('rapid', damageValue, radiusValue, speedValue, 0, 1.2, 0.9)
          spawnMuzzleFlash(14, stats.shotColor)
          leftHasFiredRef.current = true
          fireTimerRef.current = autoFireRate
        }
      }

      if (leftTapPendingRef.current && fireTimerRef.current <= 0) {
        const speedValue = 600 * stats.bulletSpeedMul
        const radiusValue = BULLET_RADIUS * stats.bulletSizeMul
        const isCrit = Math.random() * 100 < stats.critChance
        const damageValue = stats.damage * (isCrit ? stats.critDamage / 100 : 1)
        shootPlayer('normal', damageValue, radiusValue, speedValue, 0, 0.9)
        spawnCloneShot('normal', damageValue, radiusValue, speedValue, 0, 0.9, 1)
        spawnMuzzleFlash(16, stats.shotColor)
        leftTapPendingRef.current = false
        fireTimerRef.current = stats.fireRate
      }

      if (pendingChargeRef.current !== null) {
        const chargeTime = pendingChargeRef.current
        pendingChargeRef.current = null
        if (chargeTime >= CHARGE_MIN_SEC) {
          const chargeRatio = Math.min(1, chargeTime / CHARGE_MAX_SEC)
          const speedValue = 440 * stats.bulletSpeedMul
          const baseDamage = stats.damage * (1 + chargeRatio * 2.1)
          const isCrit = Math.random() * 100 < stats.critChance
          const damageValue = baseDamage * (isCrit ? stats.critDamage / 100 : 1)
          const radiusValue = BULLET_RADIUS * (1.6 + chargeRatio * 0.9) * stats.bulletSizeMul
          const pierce = Math.round(1 + chargeRatio * 2)
          shootPlayer('charged', damageValue, radiusValue, speedValue, pierce, 0.6)
          spawnCloneShot('charged', damageValue, radiusValue, speedValue, pierce, 0.9, 0.6)
          if (chargeRatio > 0.75) {
            shootPlayer('charged', damageValue * 0.7, radiusValue * 0.8, speedValue * 0.95, Math.max(1, pierce - 1), 0.9)
          }
          ringsRef.current.push({
            x: player.x,
            y: player.y,
            radius: PLAYER_RADIUS + 10,
            width: 3,
            life: 0.35,
            color: '#6cf6ff'
          })
          trimArray(ringsRef.current, MAX_RINGS)
          spawnMuzzleFlash(22, '#6cf6ff')
          fireTimerRef.current = Math.max(fireTimerRef.current, 0.18)
        }
      }

      const bossActive = enemiesRef.current.some((enemy) => enemy.isBoss)
      if (
        levelRef.current % levelConfig.bossEvery === 0 &&
        levelRef.current > 0 &&
        !bossActive &&
        bossSpawnLevelRef.current !== levelRef.current
      ) {
        bossSpawnLevelRef.current = levelRef.current
        const difficultyFactor = 1 + (levelRef.current - 1) * (levelConfig.difficultyGrowthPct / 100)
        const bossHp = bossDef.baseHp * levelConfig.bossMultiplier * difficultyFactor
        enemiesRef.current.push({
          id: `${bossDef.id}-${Math.random().toString(36).slice(2, 7)}`,
          defId: bossDef.id,
          x: canvasSize.width / 2,
          y: 120,
          vx: 0,
          vy: 0,
          hp: bossHp,
          maxHp: bossHp,
          size: bossDef.size ?? 48,
          behavior: 'boss',
          family: bossDef.family,
          shootTimer: 1.2,
          dashTimer: 2.6,
          blinkTimer: 2.0,
          dotUntil: 0,
          dotDps: 0,
          buffed: false,
          variant: 0,
          isBoss: true,
          phase: 1
        })
      }

      spawnTimerRef.current -= delta
      if (spawnTimerRef.current <= 0) {
        const spawnRate = Math.max(0.4, 1.3 - currentLevel * 0.05)
        spawnTimerRef.current = spawnRate
        if (enemiesRef.current.length >= MAX_ENEMIES) {
          return
        }
        if (bossActive && enemiesRef.current.length > 10) {
          return
        }
        const enemyDef = enemyPool[Math.floor(Math.random() * enemyPool.length)]
        const spawnEdge = Math.floor(Math.random() * 4)
        let x = 0
        let y = 0
        if (spawnEdge === 0) {
          x = rand(0, canvasSize.width)
          y = -40
        } else if (spawnEdge === 1) {
          x = canvasSize.width + 40
          y = rand(0, canvasSize.height)
        } else if (spawnEdge === 2) {
          x = rand(0, canvasSize.width)
          y = canvasSize.height + 40
        } else {
          x = -40
          y = rand(0, canvasSize.height)
        }

        const difficultyFactor = 1 + (currentLevel - 1) * (levelConfig.difficultyGrowthPct / 100)
        const size = enemyDef.size ?? (enemyDef.family === 'old-testament' ? 28 : 22)
        const angle = Math.atan2(player.y - y, player.x - x)
        const orbitAngle = Math.random() * Math.PI * 2
        const orbitRadius = rand(160, 240)
        const shieldMax = enemyDef.behavior === 'shielded' ? enemyDef.baseHp * difficultyFactor * 0.35 : 0
        enemiesRef.current.push({
          id: `${enemyDef.id}-${Math.random().toString(36).slice(2, 7)}`,
          defId: enemyDef.id,
          x,
          y,
          vx: Math.cos(angle) * enemyDef.baseSpeed * 60,
          vy: Math.sin(angle) * enemyDef.baseSpeed * 60,
          hp: enemyDef.baseHp * difficultyFactor,
          maxHp: enemyDef.baseHp * difficultyFactor,
          size,
          behavior: enemyDef.behavior,
          family: enemyDef.family,
          shootTimer: rand(0.6, 1.4),
          dashTimer: rand(1.5, 3.2),
          blinkTimer: rand(2.2, 4.5),
          dotUntil: 0,
          dotDps: 0,
          buffed: false,
          variant: Math.floor(Math.random() * 3),
          orbitAngle,
          orbitRadius,
          shield: shieldMax,
          shieldMax,
          shieldRegenAt: 0
        })
      }

      const levelDamageScale = 1 + (currentLevel - 1) * 0.05
      const spawnEnemyBullet = (
        origin: Vector2,
        angle: number,
        speed: number,
        damage: number,
        radius: number,
        kind: BulletKind = 'enemy',
        extra?: Partial<Bullet>
      ) => {
        bulletsRef.current.push({
          x: origin.x,
          y: origin.y,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          damage,
          radius,
          from: 'enemy',
          kind,
          ...extra
        })
        trimArray(bulletsRef.current, MAX_BULLETS)
      }
      const spawnRadialBullets = (origin: Vector2, count: number, speed: number, damage: number, kind: BulletKind) => {
        for (let i = 0; i < count; i += 1) {
          const theta = (Math.PI * 2 * i) / count
          spawnEnemyBullet(origin, theta, speed, damage, ENEMY_BULLET_RADIUS, kind)
        }
      }

      const hasBuffer = enemiesRef.current.some((enemy) => enemy.behavior === 'buffer')

      enemiesRef.current.forEach((enemy) => {
        const def = enemy.isBoss ? bossDef : enemyMap.get(enemy.defId)
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x)
        const distanceToPlayer = distance(enemy, player)
        const speedBoost = hasBuffer && enemy.behavior !== 'buffer' ? 1.15 : 1
        const baseSpeed = (def?.baseSpeed ?? 1.4) * 60 * speedBoost
        const baseDamage = (def?.baseDamage ?? 10) * levelDamageScale

        if (
          enemy.shieldMax &&
          enemy.shield !== undefined &&
          enemy.shield <= 0 &&
          enemy.shieldRegenAt &&
          nowSec >= enemy.shieldRegenAt
        ) {
          enemy.shield = enemy.shieldMax
          enemy.shieldRegenAt = 0
        }

        if (enemy.isBoss) {
          const hpRatio = enemy.maxHp > 0 ? enemy.hp / enemy.maxHp : 0
          const nextPhase: 1 | 2 | 3 = hpRatio <= 0.33 ? 3 : hpRatio <= 0.66 ? 2 : 1
          if (enemy.phase !== nextPhase) {
            enemy.phase = nextPhase
            enemy.blinkTimer = 0
            enemy.dashTimer = 0
          }
          const phase = enemy.phase ?? 1
          const phaseSpeed = baseSpeed * (1 + (phase - 1) * 0.25)
          const strafe = phase >= 2 ? Math.cos(nowSec * 1.4) * 0.35 : 0

          enemy.vx = Math.cos(angle) * phaseSpeed + Math.cos(angle + Math.PI / 2) * phaseSpeed * strafe
          enemy.vy = Math.sin(angle) * phaseSpeed + Math.sin(angle + Math.PI / 2) * phaseSpeed * strafe

          enemy.blinkTimer -= delta
          if (enemy.blinkTimer <= 0) {
            enemy.x = clamp(player.x + rand(-260, 260), 60, canvasSize.width - 60)
            enemy.y = clamp(player.y + rand(-200, 200), 60, canvasSize.height - 60)
            enemy.blinkTimer = rand(1.8, 2.6) - phase * 0.2
            spawnRadialBullets({ x: enemy.x, y: enemy.y }, 6 + phase * 2, 180 + phase * 20, baseDamage * 0.4, 'boss')
          }

          enemy.shootTimer -= delta
          if (enemy.shootTimer <= 0) {
            const spreadCount = phase === 1 ? 1 : phase === 2 ? 3 : 5
            const spreadStep = phase === 1 ? 0 : phase === 2 ? 0.18 : 0.22
            for (let i = 0; i < spreadCount; i += 1) {
              const offset = (i - (spreadCount - 1) / 2) * spreadStep
              spawnEnemyBullet(
                { x: enemy.x, y: enemy.y },
                angle + offset,
                260 + phase * 30,
                baseDamage * (phase === 3 ? 1.1 : 0.95),
                ENEMY_BULLET_RADIUS + 1,
                'boss'
              )
            }
            enemy.shootTimer = phase === 1 ? rand(1.1, 1.6) : phase === 2 ? rand(0.8, 1.2) : rand(0.6, 0.9)
          }

          enemy.dashTimer -= delta
          if (enemy.dashTimer <= 0) {
            spawnRadialBullets(
              { x: enemy.x, y: enemy.y },
              8 + phase * 2,
              210 + phase * 35,
              baseDamage * 0.55,
              'boss'
            )
            enemy.dashTimer = rand(3.0, 4.0) - phase * 0.4
          }
        } else if (enemy.behavior === 'charge') {
          enemy.dashTimer -= delta
          const burst = enemy.dashTimer < 0
          if (burst && enemy.dashTimer < -0.4) enemy.dashTimer = rand(1.0, 2.0)
          const chargeSpeed = burst ? 2.8 : 1.1
          enemy.vx = Math.cos(angle) * baseSpeed * chargeSpeed
          enemy.vy = Math.sin(angle) * baseSpeed * chargeSpeed
        } else if (enemy.behavior === 'dash') {
          enemy.dashTimer -= delta
          const dashSpeed = enemy.dashTimer < 0 ? 2.4 : 1
          if (enemy.dashTimer < -0.5) enemy.dashTimer = rand(1.2, 2.6)
          enemy.vx = Math.cos(angle) * baseSpeed * dashSpeed
          enemy.vy = Math.sin(angle) * baseSpeed * dashSpeed
        } else if (enemy.behavior === 'blink') {
          enemy.blinkTimer -= delta
          if (enemy.blinkTimer <= 0) {
            enemy.x = clamp(player.x + rand(-220, 220), 40, canvasSize.width - 40)
            enemy.y = clamp(player.y + rand(-220, 220), 40, canvasSize.height - 40)
            enemy.blinkTimer = rand(2.0, 4.0)
          }
          enemy.vx = Math.cos(angle) * baseSpeed
          enemy.vy = Math.sin(angle) * baseSpeed
        } else if (enemy.behavior === 'summon') {
          enemy.vx = Math.cos(angle) * baseSpeed
          enemy.vy = Math.sin(angle) * baseSpeed
          if (Math.random() < 0.0025) {
            const swarm = enemyMap.get('E10')
            if (swarm) {
              enemiesRef.current.push({
                id: `${swarm.id}-${Math.random().toString(36).slice(2, 7)}`,
                defId: swarm.id,
                x: enemy.x + rand(-20, 20),
                y: enemy.y + rand(-20, 20),
                vx: Math.cos(angle) * swarm.baseSpeed * 60,
                vy: Math.sin(angle) * swarm.baseSpeed * 60,
                hp: swarm.baseHp,
                maxHp: swarm.baseHp,
                size: 16,
                behavior: swarm.behavior,
                family: swarm.family,
                shootTimer: rand(0.6, 1.4),
                dashTimer: rand(1.5, 3.2),
                blinkTimer: rand(2.2, 4.5),
                dotUntil: 0,
                dotDps: 0,
                buffed: false,
                variant: Math.floor(Math.random() * 3),
                orbitAngle: Math.random() * Math.PI * 2,
                orbitRadius: rand(140, 220),
                shield: 0,
                shieldMax: 0,
                shieldRegenAt: 0
              })
            }
          }
        } else if (enemy.behavior === 'sniper') {
          if (distanceToPlayer < 260) {
            enemy.vx = Math.cos(angle + Math.PI) * baseSpeed * 1.2
            enemy.vy = Math.sin(angle + Math.PI) * baseSpeed * 1.2
          } else if (distanceToPlayer > 420) {
            enemy.vx = Math.cos(angle) * baseSpeed * 0.9
            enemy.vy = Math.sin(angle) * baseSpeed * 0.9
          } else {
            enemy.vx = Math.cos(angle + Math.PI / 2) * baseSpeed * 0.5
            enemy.vy = Math.sin(angle + Math.PI / 2) * baseSpeed * 0.5
          }
          enemy.shootTimer -= delta
          if (enemy.shootTimer <= 0) {
            enemy.shootTimer = rand(1.8, 2.6)
            spawnEnemyBullet({ x: enemy.x, y: enemy.y }, angle, 420, baseDamage * 1.2, ENEMY_BULLET_RADIUS + 1, 'sniper')
          }
        } else if (enemy.behavior === 'sprayer') {
          enemy.vx = Math.cos(angle) * baseSpeed * 1.1
          enemy.vy = Math.sin(angle) * baseSpeed * 1.1
          enemy.shootTimer -= delta
          if (enemy.shootTimer <= 0) {
            enemy.shootTimer = rand(1.2, 1.6)
            for (let i = -2; i <= 2; i += 1) {
              spawnEnemyBullet(
                { x: enemy.x, y: enemy.y },
                angle + i * 0.18,
                260,
                baseDamage * 0.65,
                ENEMY_BULLET_RADIUS,
                'spray'
              )
            }
          }
        } else if (enemy.behavior === 'orbit') {
          const orbitRadius = enemy.orbitRadius ?? 200
          enemy.orbitAngle = (enemy.orbitAngle ?? 0) + delta * 0.9
          const targetX = player.x + Math.cos(enemy.orbitAngle) * orbitRadius
          const targetY = player.y + Math.sin(enemy.orbitAngle) * orbitRadius
          enemy.vx = (targetX - enemy.x) * 2
          enemy.vy = (targetY - enemy.y) * 2
          enemy.shootTimer -= delta
          if (enemy.shootTimer <= 0) {
            enemy.shootTimer = rand(1.0, 1.6)
            spawnEnemyBullet({ x: enemy.x, y: enemy.y }, angle, 240, baseDamage * 0.8, ENEMY_BULLET_RADIUS, 'orb')
          }
        } else if (enemy.behavior === 'bomber') {
          if (distanceToPlayer < 220) {
            enemy.vx = Math.cos(angle + Math.PI) * baseSpeed * 1.1
            enemy.vy = Math.sin(angle + Math.PI) * baseSpeed * 1.1
          } else if (distanceToPlayer > 360) {
            enemy.vx = Math.cos(angle) * baseSpeed * 0.8
            enemy.vy = Math.sin(angle) * baseSpeed * 0.8
          } else {
            enemy.vx = Math.cos(angle + Math.PI / 2) * baseSpeed * 0.4
            enemy.vy = Math.sin(angle + Math.PI / 2) * baseSpeed * 0.4
          }
          enemy.shootTimer -= delta
          if (enemy.shootTimer <= 0) {
            enemy.shootTimer = rand(2.0, 2.6)
            spawnEnemyBullet(
              { x: enemy.x, y: enemy.y },
              angle,
              160,
              baseDamage * 1.05,
              ENEMY_BULLET_RADIUS + 4,
              'bomb',
              {
                explodeAt: nowSec + 0.75,
                fragments: 6
              }
            )
          }
        } else if (enemy.behavior === 'leap') {
          enemy.blinkTimer -= delta
          if (enemy.blinkTimer <= 0) {
            enemy.x = clamp(player.x + rand(-240, 240), 40, canvasSize.width - 40)
            enemy.y = clamp(player.y + rand(-240, 240), 40, canvasSize.height - 40)
            enemy.blinkTimer = rand(2.0, 3.4)
            enemy.dashTimer = 0.45
            spawnRadialBullets({ x: enemy.x, y: enemy.y }, 6, 220, baseDamage * 0.5, 'shrapnel')
          }
          const dashSpeed = enemy.dashTimer > 0 ? 2.4 : 1
          enemy.dashTimer -= delta
          enemy.vx = Math.cos(angle) * baseSpeed * dashSpeed
          enemy.vy = Math.sin(angle) * baseSpeed * dashSpeed
        } else if (enemy.behavior === 'shielded') {
          enemy.vx = Math.cos(angle) * baseSpeed * 0.9
          enemy.vy = Math.sin(angle) * baseSpeed * 0.9
          enemy.shootTimer -= delta
          if (enemy.shootTimer <= 0) {
            enemy.shootTimer = rand(1.4, 1.9)
            spawnEnemyBullet({ x: enemy.x, y: enemy.y }, angle, 210, baseDamage * 0.85, ENEMY_BULLET_RADIUS, 'enemy')
          }
        } else {
          enemy.vx = Math.cos(angle) * baseSpeed
          enemy.vy = Math.sin(angle) * baseSpeed
          if (enemy.behavior === 'shooter') {
            enemy.shootTimer -= delta
            if (enemy.shootTimer <= 0) {
              enemy.shootTimer = rand(1.0, 1.6)
              spawnEnemyBullet({ x: enemy.x, y: enemy.y }, angle, 220, baseDamage, ENEMY_BULLET_RADIUS, 'enemy')
            }
          }
        }

        enemy.x += enemy.vx * delta
        enemy.y += enemy.vy * delta

        if (enemy.dotUntil > nowSec) {
          enemy.hp -= enemy.dotDps * delta
        }
      })

      const spawnedBullets: Bullet[] = []
      bulletsRef.current = bulletsRef.current.filter((bullet) => {
        bullet.x += bullet.vx * delta
        bullet.y += bullet.vy * delta
        if (bullet.explodeAt && nowSec >= bullet.explodeAt) {
          const fragments = bullet.fragments ?? 4
          for (let i = 0; i < fragments; i += 1) {
            const theta = (Math.PI * 2 * i) / fragments + rand(-0.1, 0.1)
            spawnedBullets.push({
              x: bullet.x,
              y: bullet.y,
              vx: Math.cos(theta) * 220,
              vy: Math.sin(theta) * 220,
              damage: bullet.damage * 0.45,
              radius: ENEMY_BULLET_RADIUS - 1,
              from: 'enemy',
              kind: 'shrapnel'
            })
          }
          return false
        }
        const inBounds =
          bullet.x > -40 &&
          bullet.x < canvasSize.width + 40 &&
          bullet.y > -40 &&
          bullet.y < canvasSize.height + 40
        return inBounds
      })
      if (spawnedBullets.length > 0) {
        bulletsRef.current.push(...spawnedBullets)
        trimArray(bulletsRef.current, MAX_BULLETS)
      }

      bulletsRef.current.forEach((bullet) => {
        if (bullet.from === 'player') {
          enemiesRef.current.forEach((enemy) => {
            if (enemy.hp <= 0) return
            if (bullet.x < -9000) return
            if (distance(bullet, enemy) < enemy.size) {
              let damage = bullet.damage
              if ((enemy.isBoss || enemy.family === 'old-testament') && stats.eliteDamageBonus > 0) {
                damage *= 1 + stats.eliteDamageBonus / 100
              }
              if (enemy.shield !== undefined && enemy.shield > 0) {
                const shieldHit = damage * 0.7
                enemy.shield -= shieldHit
                damage *= 0.3
                if (enemy.shield <= 0) {
                  enemy.shieldRegenAt = nowSec + 4
                  enemy.shield = 0
                }
              }
              enemy.hp -= damage
              if (stats.dotDamagePct > 0) {
                enemy.dotUntil = nowSec + 3
                enemy.dotDps = stats.dotDamagePct * 0.6
              }
              if (bullet.kind === 'charged' || Math.random() < 0.25) {
                spawnBurst(enemy.x, enemy.y, stats.shotColor, 4, 90)
              }
              if (bullet.pierce && bullet.pierce > 0) {
                bullet.pierce -= 1
                if (bullet.pierce <= 0) {
                  bullet.x = -9999
                }
              } else {
                bullet.x = -9999
              }
            }
          })
        } else {
          const hitDistance = distance(bullet, player)
          if (hitDistance < PLAYER_RADIUS && nowSec > player.invulnUntil) {
            const damage = bullet.damage * (isMoving ? 1 - stats.movingDamageReduce / 100 : 1)
            player.shield -= damage
            if (player.shield < 0) {
              player.hp += player.shield
              player.shield = 0
            }
            player.invulnUntil = nowSec + 0.5
            if (player.hp <= 0) endGame()
            bullet.x = -9999
          }
        }
      })

      enemiesRef.current = enemiesRef.current.filter((enemy) => enemy.hp > 0)

      enemiesRef.current.forEach((enemy) => {
        if (distance(enemy, player) < enemy.size + PLAYER_RADIUS && nowSec > player.invulnUntil) {
          const def = enemyMap.get(enemy.defId)
          const baseDamage = def?.baseDamage ?? 10
          const damage =
            baseDamage * (1 + (currentLevel - 1) * 0.05) * (isMoving ? 1 - stats.movingDamageReduce / 100 : 1)
          player.shield -= damage
          if (player.shield < 0) {
            player.hp += player.shield
            player.shield = 0
          }
          player.invulnUntil = nowSec + 0.5
          if (player.hp <= 0) endGame()
        }
      })

      const deadEnemies: EnemyEntity[] = []
      enemiesRef.current = enemiesRef.current.filter((enemy) => {
        if (enemy.hp <= 0) {
          deadEnemies.push(enemy)
          return false
        }
        return true
      })

      deadEnemies.forEach((enemy) => {
        addKill()
        addScore(80 + currentLevel * 10)
        comboRef.current = comboTimerRef.current > 0 ? comboRef.current + 1 : 1
        comboTimerRef.current = 2.4
        if (comboRef.current >= 2) {
          spawnFloatText(enemy.x, enemy.y - 12, `COMBO x${comboRef.current}`, '#ffd166')
        }

        const burstColor = enemy.family === 'old-testament' ? '#f6b36f' : '#6cf6ff'
        spawnBurst(enemy.x, enemy.y, burstColor, 12, 140)
        spawnRing(enemy.x, enemy.y, burstColor, enemy.size + 6)

        if (stats.lifeSteal > 0) {
          player.hp = clamp(player.hp + stats.damage * (stats.lifeSteal / 100), 0, player.maxHp)
        }

        if (activeItemIds.includes('I08')) {
          echoShotsRef.current.push({ fireAt: nowSec + 1.2, origin: { x: enemy.x, y: enemy.y } })
        }

        const dropChance = Math.random() < (dropConfig.normalDropChance + currentLevel * 0.002)
        if (dropChance) {
          const weights = [
            { id: 'permanent', weight: dropConfig.itemWeights.permanent },
            { id: 'buff', weight: dropConfig.itemWeights.buff }
          ]
          const poolType = weightedPick(weights)
          const candidates = itemPool.filter((item) => item.type === poolType)
          const item = candidates[Math.floor(Math.random() * candidates.length)]
          if (item) {
            pickupsRef.current.push({
              id: `pickup-${Math.random().toString(36).slice(2, 7)}`,
              itemId: item.id,
              x: enemy.x,
              y: enemy.y,
              vy: rand(20, 60),
              radius: 12
            })
          }
        }
      })

      const activeBoss = enemiesRef.current.find((enemy) => enemy.isBoss)
      const bossPhase = activeBoss ? activeBoss.phase ?? 1 : null
      if (bossPhase !== lastBossPhaseRef.current) {
        lastBossPhaseRef.current = bossPhase
        setBossPhase(bossPhase)
      }

      echoShotsRef.current = echoShotsRef.current.filter((shot) => {
        if (shot.fireAt <= nowSec) {
          const angle = Math.atan2(mouseRef.current.y - shot.origin.y, mouseRef.current.x - shot.origin.x)
          bulletsRef.current.push({
            x: shot.origin.x,
            y: shot.origin.y,
            vx: Math.cos(angle) * 460 * stats.bulletSpeedMul,
            vy: Math.sin(angle) * 460 * stats.bulletSpeedMul,
            damage: stats.damage * 0.7,
            radius: BULLET_RADIUS * stats.bulletSizeMul,
            from: 'player',
            kind: 'echo'
          })
          return false
        }
        return true
      })

      pickupsRef.current = pickupsRef.current.filter((pickup) => {
        pickup.y += pickup.vy * delta
        if (distance(pickup, player) < pickup.radius + PLAYER_RADIUS) {
          const item = getItemById(pickup.itemId)
          if (item) {
            const expiresAt = item.type === 'buff' ? timeRef.current + item.durationSec! : undefined
            addItem({
              id: item.id,
              name: item.name,
              type: item.type,
              expiresAt
            })
            spawnBurst(player.x, player.y, '#ffd166', 10, 120)
            spawnRing(player.x, player.y, '#ffd166', PLAYER_RADIUS + 10)
          }
          return false
        }
        return pickup.y < canvasSize.height + 40
      })

      const particles = particlesRef.current
      let writeIndex = 0
      for (let i = 0; i < particles.length; i += 1) {
        const particle = particles[i]
        particle.x += particle.vx * delta
        particle.y += particle.vy * delta
        particle.life -= delta
        if (particle.life > 0) {
          particles[writeIndex++] = particle
        }
      }
      particles.length = writeIndex

      const rings = ringsRef.current
      writeIndex = 0
      for (let i = 0; i < rings.length; i += 1) {
        const ring = rings[i]
        ring.life -= delta
        ring.radius += delta * 40
        if (ring.life > 0) {
          rings[writeIndex++] = ring
        }
      }
      rings.length = writeIndex

      const flashes = flashesRef.current
      writeIndex = 0
      for (let i = 0; i < flashes.length; i += 1) {
        const flash = flashes[i]
        flash.life -= delta
        if (flash.life > 0) {
          flashes[writeIndex++] = flash
        }
      }
      flashes.length = writeIndex

      const floatTexts = floatTextsRef.current
      writeIndex = 0
      for (let i = 0; i < floatTexts.length; i += 1) {
        const text = floatTexts[i]
        text.life -= delta
        text.y -= delta * 22
        if (text.life > 0) {
          floatTexts[writeIndex++] = text
        }
      }
      floatTexts.length = writeIndex

      const shootingStars = shootingStarsRef.current
      if (shootingStars.length < 2 && Math.random() < delta * 0.035) {
        const fromLeft = Math.random() < 0.6
        const startX = fromLeft
          ? rand(-canvasSize.width * 0.2, canvasSize.width * 0.2)
          : rand(canvasSize.width * 0.8, canvasSize.width + canvasSize.width * 0.2)
        const startY = rand(-40, canvasSize.height * 0.35)
        const angle = fromLeft ? rand(0.22, 0.46) : Math.PI - rand(0.22, 0.46)
        const speed = rand(520, 760)
        const life = rand(0.5, 0.9)
        shootingStars.push({
          x: startX,
          y: startY,
          vx: Math.cos(angle) * speed,
          vy: Math.sin(angle) * speed,
          life,
          maxLife: life,
          width: rand(1.1, 2.1)
        })
      }

      writeIndex = 0
      for (let i = 0; i < shootingStars.length; i += 1) {
        const star = shootingStars[i]
        star.life -= delta
        star.x += star.vx * delta
        star.y += star.vy * delta
        const inBounds =
          star.x > -240 &&
          star.x < canvasSize.width + 240 &&
          star.y > -240 &&
          star.y < canvasSize.height + 240
        if (star.life > 0 && inBounds) {
          shootingStars[writeIndex++] = star
        }
      }
      shootingStars.length = writeIndex
    }

    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height)
      ctx.fillStyle = 'rgba(3,5,12,0.55)'
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)

      const time = timeRef.current
      if (
        starFieldRef.current.width !== canvasSize.width ||
        starFieldRef.current.height !== canvasSize.height ||
        starFieldRef.current.layers.length === 0
      ) {
        starFieldRef.current = buildStarField(canvasSize.width, canvasSize.height)
      }
      const starField = starFieldRef.current

      ctx.save()
      ctx.globalCompositeOperation = 'screen'
      ctx.translate(canvasSize.width * 0.5, canvasSize.height * 0.45)
      ctx.rotate(starField.bandAngle)
      const bandWidth = canvasSize.width * 1.5
      const bandHeight = canvasSize.height * 0.26
      const bandGradient = ctx.createLinearGradient(-bandWidth / 2, 0, bandWidth / 2, 0)
      bandGradient.addColorStop(0, 'rgba(40,110,170,0)')
      bandGradient.addColorStop(0.4, 'rgba(80,160,205,0.06)')
      bandGradient.addColorStop(0.5, 'rgba(120,200,230,0.12)')
      bandGradient.addColorStop(0.6, 'rgba(80,160,205,0.06)')
      bandGradient.addColorStop(1, 'rgba(40,110,170,0)')
      ctx.fillStyle = bandGradient
      ctx.fillRect(-bandWidth / 2, -bandHeight / 2, bandWidth, bandHeight)

      const coreHeight = bandHeight * 0.35
      const coreGradient = ctx.createLinearGradient(-bandWidth / 2, 0, bandWidth / 2, 0)
      coreGradient.addColorStop(0, 'rgba(60,140,190,0)')
      coreGradient.addColorStop(0.45, 'rgba(110,190,220,0.08)')
      coreGradient.addColorStop(0.5, 'rgba(140,215,235,0.14)')
      coreGradient.addColorStop(0.55, 'rgba(110,190,220,0.08)')
      coreGradient.addColorStop(1, 'rgba(60,140,190,0)')
      ctx.fillStyle = coreGradient
      ctx.fillRect(-bandWidth / 2, -coreHeight / 2, bandWidth, coreHeight)

      const dustDrift = Math.sin(time * 0.05) * 12
      starField.dust.forEach((dust) => {
        const pulse = 0.7 + 0.3 * Math.sin(time * dust.twinkle + dust.phase)
        const alpha = dust.alpha * pulse * 0.7
        if (alpha <= 0) return
        const x = dust.x + Math.sin(time * 0.04 + dust.phase) * 8
        const y = dust.y + dustDrift
        ctx.fillStyle = `rgba(140,210,240,${alpha})`
        ctx.fillRect(x, y, dust.size, dust.size)
        if (dust.bright) {
          ctx.fillRect(x + dust.size * 1.2, y - dust.size * 0.2, dust.size * 0.8, dust.size * 0.8)
        }
      })
      ctx.restore()

      starField.layers.forEach((layer) => {
        const driftX = time * layer.speed
        const driftY = time * layer.speed * 0.35
        const [r, g, b] = layer.tint
        for (let i = 0; i < layer.stars.length; i += 1) {
          const star = layer.stars[i]
          let x = star.x + driftX
          let y = star.y + driftY
          x = x % canvasSize.width
          y = y % canvasSize.height
          if (x < 0) x += canvasSize.width
          if (y < 0) y += canvasSize.height
          const pulse = 0.6 + 0.4 * Math.sin(time * star.twinkle + star.phase)
          const alpha = star.alpha * pulse
          if (alpha <= 0) continue
          ctx.fillStyle = `rgba(${r},${g},${b},${alpha})`
          if (star.bright) {
            ctx.shadowColor = `rgba(${r},${g},${b},${Math.min(1, alpha + 0.2)})`
            ctx.shadowBlur = 8
          }
          ctx.fillRect(x, y, star.size, star.size)
          if (star.bright) {
            ctx.shadowBlur = 0
          }
        }
      })

      if (shootingStarsRef.current.length > 0) {
        ctx.save()
        ctx.globalCompositeOperation = 'lighter'
        shootingStarsRef.current.forEach((star) => {
          const alpha = Math.min(1, star.life / star.maxLife)
          const angle = Math.atan2(star.vy, star.vx)
          const tail = 120 + star.width * 60
          const tailX = star.x - Math.cos(angle) * tail
          const tailY = star.y - Math.sin(angle) * tail
          const gradient = ctx.createLinearGradient(star.x, star.y, tailX, tailY)
          gradient.addColorStop(0, `rgba(200,245,255,${alpha})`)
          gradient.addColorStop(1, 'rgba(120,200,230,0)')
          ctx.strokeStyle = gradient
          ctx.lineWidth = star.width
          ctx.beginPath()
          ctx.moveTo(star.x, star.y)
          ctx.lineTo(tailX, tailY)
          ctx.stroke()

          ctx.fillStyle = `rgba(210,245,255,${alpha})`
          ctx.shadowColor = 'rgba(120,210,245,0.8)'
          ctx.shadowBlur = 10
          ctx.beginPath()
          ctx.arc(star.x, star.y, star.width * 1.2, 0, Math.PI * 2)
          ctx.fill()
          ctx.shadowBlur = 0
        })
        ctx.restore()
      }

      const statsSnapshot = statsRef.current ?? computeStats(activeItemIds, timeRef.current)

      ringsRef.current.forEach((ring) => {
        ctx.save()
        ctx.globalAlpha = Math.max(0, ring.life)
        ctx.beginPath()
        ctx.arc(ring.x, ring.y, ring.radius, 0, Math.PI * 2)
        ctx.strokeStyle = ring.color
        ctx.lineWidth = ring.width
        ctx.shadowColor = ring.color
        ctx.shadowBlur = 12
        ctx.stroke()
        ctx.restore()
      })

      particlesRef.current.forEach((particle) => {
        ctx.save()
        ctx.globalAlpha = Math.max(0, particle.life)
        ctx.beginPath()
        ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2)
        ctx.fillStyle = particle.color
        if (particle.glow) {
          ctx.shadowColor = particle.color
          ctx.shadowBlur = particle.glow
        }
        ctx.fill()
        ctx.restore()
      })

      const player = playerRef.current
      const aimAngle = Math.atan2(mouseRef.current.y - player.y, mouseRef.current.x - player.x)
      const chargeRatio = Math.min(1, chargeRef.current / CHARGE_MAX_SEC)
      const dodgeActive = timeRef.current < dodgeUntilRef.current
      const movingNow = Math.hypot(player.vx, player.vy) > 8

      const drawShip = (x: number, y: number, alpha: number, scale = 1) => {
        ctx.save()
        ctx.globalAlpha = alpha
        ctx.translate(x, y)
        ctx.rotate(aimAngle + Math.PI / 2)
        ctx.scale(scale * statsSnapshot.shipScale, scale * statsSnapshot.shipScale)
        ctx.beginPath()
        ctx.moveTo(0, -PLAYER_RADIUS)
        ctx.lineTo(PLAYER_RADIUS * 0.75, PLAYER_RADIUS)
        ctx.lineTo(-PLAYER_RADIUS * 0.75, PLAYER_RADIUS)
        ctx.closePath()
        ctx.fillStyle = statsSnapshot.shipAccent
        ctx.shadowColor = statsSnapshot.shipAccent
        ctx.shadowBlur = 10 + statsSnapshot.shipGlow * 0.2
        ctx.fill()
        ctx.shadowBlur = 0
        ctx.fillStyle = '#e6f9ff'
        ctx.fillRect(-2, -6, 4, 10)
        if (movingNow) {
          ctx.beginPath()
          ctx.moveTo(0, PLAYER_RADIUS)
          ctx.lineTo(4, PLAYER_RADIUS + 10)
          ctx.lineTo(-4, PLAYER_RADIUS + 10)
          ctx.closePath()
          ctx.fillStyle = colors.warning
          ctx.globalAlpha = 0.7
          ctx.fill()
        }
        ctx.restore()
      }

      trailRef.current.forEach((trail) => {
        drawShip(trail.x, trail.y, (trail.ttl / 0.25) * 0.35)
      })
      motionTrailRef.current.forEach((trail) => {
        ctx.save()
        ctx.globalAlpha = (trail.ttl / 0.18) * 0.35
        ctx.beginPath()
        ctx.arc(trail.x, trail.y, trail.size, 0, Math.PI * 2)
        ctx.fillStyle = statsSnapshot.shipAccent
        ctx.shadowColor = statsSnapshot.shipAccent
        ctx.shadowBlur = 10
        ctx.fill()
        ctx.restore()
      })

      if (chargeRatio > 0) {
        ctx.save()
        ctx.globalAlpha = 0.6 * chargeRatio
        ctx.beginPath()
        ctx.arc(player.x, player.y, PLAYER_RADIUS + 8 + chargeRatio * 10, 0, Math.PI * 2)
        ctx.strokeStyle = statsSnapshot.shipAccent
        ctx.lineWidth = 2
        ctx.shadowColor = statsSnapshot.shipAccent
        ctx.shadowBlur = 12
        ctx.stroke()
        ctx.restore()
      }

      if (dodgeActive) {
        ctx.save()
        ctx.globalAlpha = 0.4
        ctx.beginPath()
        ctx.arc(player.x, player.y, PLAYER_RADIUS + 6, 0, Math.PI * 2)
        ctx.strokeStyle = colors.good
        ctx.lineWidth = 2
        ctx.stroke()
        ctx.restore()
      }

      if (statsSnapshot.shipGlow > 0) {
        ctx.save()
        ctx.globalAlpha = Math.min(0.45, statsSnapshot.shipGlow / 100)
        ctx.beginPath()
        ctx.arc(player.x, player.y, PLAYER_RADIUS + 10, 0, Math.PI * 2)
        ctx.strokeStyle = statsSnapshot.shipAccent
        ctx.lineWidth = 2
        ctx.shadowColor = statsSnapshot.shipAccent
        ctx.shadowBlur = 14
        ctx.stroke()
        ctx.restore()
      }

      drawShip(player.x, player.y, 1)

      flashesRef.current.forEach((flash) => {
        const strength = flash.life / 0.12
        ctx.save()
        ctx.translate(flash.x, flash.y)
        ctx.rotate(flash.angle)
        ctx.globalAlpha = strength
        ctx.fillStyle = flash.color
        ctx.shadowColor = flash.color
        ctx.shadowBlur = 12
        ctx.beginPath()
        ctx.moveTo(PLAYER_RADIUS * 0.5, -flash.size * 0.4)
        ctx.lineTo(PLAYER_RADIUS + flash.size * 1.2, 0)
        ctx.lineTo(PLAYER_RADIUS * 0.5, flash.size * 0.4)
        ctx.closePath()
        ctx.fill()
        ctx.restore()
      })

      bulletsRef.current.forEach((bullet) => {
        const angle = Math.atan2(bullet.vy, bullet.vx)
        if (bullet.from === 'player') {
          const isCharged = bullet.kind === 'charged'
          const color =
            bullet.kind === 'echo' ? colors.good : bullet.kind === 'rapid' ? '#7df4ff' : statsSnapshot.shotColor
          ctx.save()
          ctx.translate(bullet.x, bullet.y)
          ctx.rotate(angle)
          ctx.shadowColor = color
          ctx.shadowBlur = isCharged ? 16 : 8
          ctx.fillStyle = color
          if (isCharged) {
            ctx.beginPath()
            ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2)
            ctx.fill()
            ctx.globalAlpha = 0.8
            ctx.fillRect(-bullet.radius * 2.2, -bullet.radius * 0.4, bullet.radius * 3.6, bullet.radius * 0.8)
          } else if (bullet.kind === 'rapid') {
            ctx.fillRect(-bullet.radius * 1.8, -bullet.radius * 0.35, bullet.radius * 3.2, bullet.radius * 0.7)
            ctx.globalAlpha = 0.6
            ctx.fillRect(-bullet.radius * 0.6, -bullet.radius * 0.8, bullet.radius * 1.2, bullet.radius * 1.6)
          } else {
            ctx.fillRect(-bullet.radius * 1.4, -bullet.radius * 0.5, bullet.radius * 2.8, bullet.radius)
          }
          ctx.restore()
        } else {
          const enemyColor =
            bullet.kind === 'boss'
              ? '#ff9f5a'
              : bullet.kind === 'sniper'
                ? '#ff6b6b'
                : bullet.kind === 'spray'
                  ? '#ffd166'
                  : bullet.kind === 'orb'
                    ? '#9af6ff'
                    : bullet.kind === 'shrapnel'
                ? '#ffb347'
                : bullet.kind === 'bomb'
                  ? '#ff7a59'
                  : colors.danger
          ctx.save()
          ctx.translate(bullet.x, bullet.y)
          ctx.rotate(angle)
          ctx.shadowColor = enemyColor
          ctx.shadowBlur = 8
          ctx.fillStyle = enemyColor
          if (bullet.kind === 'bomb') {
            ctx.beginPath()
            ctx.arc(0, 0, bullet.radius, 0, Math.PI * 2)
            ctx.fill()
            ctx.fillStyle = '#2b0f0f'
            ctx.fillRect(-2, -bullet.radius - 2, 4, 6)
          } else if (bullet.kind === 'sniper') {
            ctx.fillRect(-bullet.radius * 2.4, -bullet.radius * 0.3, bullet.radius * 4.8, bullet.radius * 0.6)
          } else if (bullet.kind === 'spray') {
            ctx.beginPath()
            ctx.moveTo(0, -bullet.radius)
            ctx.lineTo(bullet.radius, 0)
            ctx.lineTo(0, bullet.radius)
            ctx.lineTo(-bullet.radius, 0)
            ctx.closePath()
            ctx.fill()
          } else if (bullet.kind === 'orb') {
            ctx.beginPath()
            ctx.arc(0, 0, bullet.radius * 1.1, 0, Math.PI * 2)
            ctx.fill()
          } else {
            ctx.fillRect(-bullet.radius * 1.2, -bullet.radius * 0.5, bullet.radius * 2.4, bullet.radius)
          }
          ctx.restore()
        }
      })

      enemiesRef.current.forEach((enemy) => {
        const variant = enemy.variant ?? 0
        const spacePalette = [
          { stroke: '#8df7ff', fill: '#162032' },
          { stroke: '#6cf6ff', fill: '#112a36' },
          { stroke: '#9dc6ff', fill: '#19243a' }
        ]
        const oldPalette = [
          { stroke: '#f5d07d', fill: '#2a1d16' },
          { stroke: '#ffb347', fill: '#2b1a25' },
          { stroke: '#f1a3b2', fill: '#2a2016' }
        ]
        const palette = enemy.family === 'old-testament' ? oldPalette : spacePalette
        const baseStroke = palette[variant % palette.length].stroke
        const baseFill = palette[variant % palette.length].fill
        const phaseColor = enemy.isBoss
          ? enemy.phase === 3
            ? '#ff5b5b'
            : enemy.phase === 2
              ? '#ffb347'
              : '#5ef2ff'
          : baseStroke

        ctx.save()
        ctx.translate(enemy.x, enemy.y)
        ctx.strokeStyle = phaseColor
        ctx.fillStyle = baseFill
        ctx.lineWidth = enemy.isBoss ? 3 : 2
        ctx.beginPath()
        ctx.arc(0, 0, enemy.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()

        if (enemy.behavior === 'sniper') {
          ctx.strokeStyle = phaseColor
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(-enemy.size * 0.7, 0)
          ctx.lineTo(enemy.size * 0.7, 0)
          ctx.moveTo(0, -enemy.size * 0.7)
          ctx.lineTo(0, enemy.size * 0.7)
          ctx.stroke()
        } else if (enemy.behavior === 'sprayer') {
          ctx.fillStyle = phaseColor
          ctx.beginPath()
          ctx.moveTo(0, -enemy.size * 0.8)
          ctx.lineTo(enemy.size * 0.4, -enemy.size * 0.1)
          ctx.lineTo(-enemy.size * 0.4, -enemy.size * 0.1)
          ctx.closePath()
          ctx.fill()
        } else if (enemy.behavior === 'orbit') {
          ctx.strokeStyle = phaseColor
          ctx.globalAlpha = 0.6
          ctx.beginPath()
          ctx.arc(0, 0, enemy.size * 0.7, 0, Math.PI * 2)
          ctx.stroke()
          ctx.globalAlpha = 1
          const orbitTheta = timeRef.current * 1.4
          ctx.beginPath()
          ctx.arc(Math.cos(orbitTheta) * enemy.size * 0.7, Math.sin(orbitTheta) * enemy.size * 0.7, 3, 0, Math.PI * 2)
          ctx.fillStyle = phaseColor
          ctx.fill()
        } else if (enemy.behavior === 'bomber') {
          ctx.strokeStyle = phaseColor
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.moveTo(0, -enemy.size * 0.6)
          ctx.lineTo(enemy.size * 0.6, 0)
          ctx.lineTo(0, enemy.size * 0.6)
          ctx.lineTo(-enemy.size * 0.6, 0)
          ctx.closePath()
          ctx.stroke()
        } else if (enemy.behavior === 'leap') {
          ctx.strokeStyle = phaseColor
          ctx.lineWidth = 2
          ctx.beginPath()
          ctx.arc(0, 0, enemy.size * 0.6, -0.8, 0.8)
          ctx.stroke()
        } else if (enemy.behavior === 'buffer') {
          ctx.globalAlpha = 0.4
          ctx.beginPath()
          ctx.arc(0, 0, enemy.size * 1.4 + Math.sin(timeRef.current * 2) * 2, 0, Math.PI * 2)
          ctx.strokeStyle = '#9df2ff'
          ctx.stroke()
          ctx.globalAlpha = 1
        } else if (enemy.isBoss) {
          ctx.shadowColor = phaseColor
          ctx.shadowBlur = 14
          ctx.beginPath()
          ctx.arc(0, 0, enemy.size * 0.6, 0, Math.PI * 2)
          ctx.fillStyle = phaseColor
          ctx.fill()
          ctx.shadowBlur = 0
        }

        if (enemy.behavior === 'shielded' && (enemy.shield ?? 0) > 0) {
          ctx.globalAlpha = 0.65
          ctx.beginPath()
          ctx.arc(0, 0, enemy.size + 5, 0, Math.PI * 2)
          ctx.strokeStyle = '#7dd6ff'
          ctx.lineWidth = 2
          ctx.stroke()
          ctx.globalAlpha = 1
        }

        ctx.restore()

        ctx.fillStyle = '#0f1118'
        ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 12, enemy.size * 2, 4)
        ctx.fillStyle = '#6bff9a'
        ctx.fillRect(
          enemy.x - enemy.size,
          enemy.y - enemy.size - 12,
          enemy.size * 2 * (enemy.hp / enemy.maxHp),
          4
        )
        if (enemy.shieldMax && enemy.shieldMax > 0) {
          ctx.fillStyle = '#162733'
          ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 18, enemy.size * 2, 3)
          ctx.fillStyle = '#7dd6ff'
          ctx.fillRect(
            enemy.x - enemy.size,
            enemy.y - enemy.size - 18,
            enemy.size * 2 * ((enemy.shield ?? 0) / enemy.shieldMax),
            3
          )
        }
      })

      pickupsRef.current.forEach((pickup) => {
        ctx.save()
        ctx.globalAlpha = 0.4
        ctx.strokeStyle = colors.warning
        ctx.lineWidth = 2
        ctx.beginPath()
        ctx.moveTo(pickup.x, 0)
        ctx.lineTo(pickup.x, pickup.y - pickup.radius)
        ctx.stroke()
        ctx.restore()
        ctx.beginPath()
        ctx.arc(pickup.x, pickup.y, pickup.radius, 0, Math.PI * 2)
        ctx.fillStyle = colors.warning
        ctx.fill()
        ctx.fillStyle = '#0b0f17'
        ctx.font = '10px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'middle'
        ctx.fillText('⚙', pickup.x, pickup.y + 1)
      })

      floatTextsRef.current.forEach((text) => {
        ctx.save()
        ctx.globalAlpha = Math.min(1, text.life)
        ctx.fillStyle = text.color
        ctx.font = '12px sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(text.text, text.x, text.y)
        ctx.restore()
      })

      ctx.fillStyle = colors.accentSoft
      ctx.fillRect(32, canvasSize.height - 40, (player.hp / player.maxHp) * 220, 10)
      ctx.fillStyle = colors.accent
      ctx.fillRect(32, canvasSize.height - 28, (player.shield / player.maxShield) * 220, 6)
      const staminaRatio = staminaRef.current / STAMINA_MAX
      ctx.fillStyle = '#112218'
      ctx.fillRect(32, canvasSize.height - 18, 220, 6)
      ctx.fillStyle = colors.good
      ctx.fillRect(32, canvasSize.height - 18, 220 * staminaRatio, 6)
      ctx.fillStyle = '#10202a'
      ctx.fillRect(32, canvasSize.height - 52, 220, 6)
      ctx.fillStyle = colors.accent
      ctx.fillRect(32, canvasSize.height - 52, 220 * chargeRatio, 6)

      const boss = enemiesRef.current.find((enemy) => enemy.isBoss)
      if (boss) {
        const bossWidth = 360
        const bossX = canvasSize.width / 2 - bossWidth / 2
        const bossY = 24
        const phaseColor = boss.phase === 3 ? '#ff5b5b' : boss.phase === 2 ? '#ffb347' : '#5ef2ff'
        ctx.fillStyle = 'rgba(0,0,0,0.6)'
        ctx.fillRect(bossX, bossY, bossWidth, 12)
        ctx.fillStyle = phaseColor
        ctx.fillRect(bossX, bossY, bossWidth * (boss.hp / boss.maxHp), 12)
        ctx.fillStyle = '#e8f6ff'
        ctx.font = '11px sans-serif'
        ctx.textAlign = 'center'
        ctx.textBaseline = 'bottom'
        ctx.fillText(`BOSS PHASE ${boss.phase ?? 1}`, canvasSize.width / 2, bossY - 4)
      }
    }

    frameId = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frameId)
  }, [
    activeItemIds,
    addItem,
    addKill,
    addScore,
    canvasSize,
    endGame,
    phase,
    removeExpiredItems,
    setLevel,
    setTimeSec,
    setBossPhase
  ])

  useEffect(() => {
    if (phase !== 'gameover' || runSavedRef.current) return
    runSavedRef.current = true
    fetch('/api/run', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        playerName,
        score,
        levelReached: level,
        kills,
        durationSec: Math.floor(timeSec),
        seed,
        items: activeItems.map((item) => ({ id: item.id, name: item.name[language] }))
      })
    })
      .catch(() => undefined)
  }, [phase, playerName, score, level, kills, timeSec, seed, activeItems, language])

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-black">
      <div className="absolute inset-0 space-base" />
      <div className="absolute space-nebula" />
      <div className="absolute inset-0 space-band" />
      <div className="absolute inset-0 space-vignette" />
      <canvas
        ref={canvasRef}
        width={canvasSize.width}
        height={canvasSize.height}
        className="relative z-10 block"
      />
      {runtimeError && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/80 text-white">
          <div className="max-w-xl text-center space-y-3">
            <div className="text-xl text-red-300">运行时错误</div>
            <div className="text-xs text-gray-300">{runtimeError}</div>
          </div>
        </div>
      )}
      <style jsx>{`
        .space-base {
          background:
            radial-gradient(120% 80% at 50% -20%, rgba(18, 58, 110, 0.4), rgba(2, 4, 10, 0) 58%),
            radial-gradient(120% 90% at 50% 120%, rgba(6, 24, 55, 0.55), rgba(2, 4, 10, 0) 60%),
            linear-gradient(180deg, #01020a 0%, #040712 45%, #010209 100%);
        }
        .space-nebula {
          position: absolute;
          inset: -18%;
          background:
            radial-gradient(circle at 20% 30%, rgba(50, 130, 190, 0.18), rgba(5, 10, 20, 0) 60%),
            radial-gradient(circle at 75% 40%, rgba(30, 90, 170, 0.16), rgba(5, 10, 20, 0) 65%),
            radial-gradient(circle at 60% 75%, rgba(22, 70, 140, 0.14), rgba(5, 10, 20, 0) 65%);
          opacity: 0.6;
          filter: blur(70px);
          mix-blend-mode: screen;
          animation: nebulaDrift 90s linear infinite;
          transform: translateZ(0);
        }
        .space-band {
          background:
            linear-gradient(
              120deg,
              rgba(8, 18, 32, 0) 0%,
              rgba(40, 90, 130, 0.05) 34%,
              rgba(90, 160, 190, 0.12) 50%,
              rgba(40, 90, 130, 0.05) 66%,
              rgba(8, 18, 32, 0) 100%
            ),
            linear-gradient(
              120deg,
              rgba(5, 12, 26, 0) 0%,
              rgba(70, 130, 170, 0.06) 46%,
              rgba(120, 190, 220, 0.1) 50%,
              rgba(70, 130, 170, 0.06) 54%,
              rgba(5, 12, 26, 0) 100%
            );
          mix-blend-mode: screen;
          opacity: 0.28;
          animation: bandDrift 120s ease-in-out infinite;
        }
        .space-vignette {
          background: radial-gradient(
            ellipse at center,
            rgba(0, 0, 0, 0) 0%,
            rgba(0, 0, 0, 0.4) 55%,
            rgba(0, 0, 0, 0.92) 100%
          );
        }
        @keyframes nebulaDrift {
          0% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
          50% {
            transform: translate3d(-6%, 3%, 0) rotate(1deg);
          }
          100% {
            transform: translate3d(0, 0, 0) rotate(0deg);
          }
        }
        @keyframes bandDrift {
          0% {
            transform: translate3d(0, 0, 0) rotate(-8deg) scale(1.05);
          }
          50% {
            transform: translate3d(2%, -1%, 0) rotate(-9deg) scale(1.08);
          }
          100% {
            transform: translate3d(0, 0, 0) rotate(-8deg) scale(1.05);
          }
        }
      `}</style>
    </div>
  )
}
