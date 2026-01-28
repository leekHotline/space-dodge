'use client'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'
import { dropConfig, enemies as enemyPool, items as itemPool, levelConfig } from '@/lib/game-data'

type Vector2 = { x: number; y: number }

interface Bullet {
  x: number
  y: number
  vx: number
  vy: number
  damage: number
  radius: number
  from: 'player' | 'enemy'
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

const CANVAS_PADDING = 32
const PLAYER_RADIUS = 16
const BULLET_RADIUS = 4
const ENEMY_BULLET_RADIUS = 5

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

const getItemById = (id: string) => itemPool.find((item) => item.id === id)

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
  })

  if (tags.has('energy') && tags.has('crit')) {
    critChance += 5
  }
  if (tags.has('clone') && tags.has('echo')) {
    cloneChance += 5
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
    overheatActive
  }
}

export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [canvasSize, setCanvasSize] = useState({ width: 960, height: 600 })
  const [runtimeError, setRuntimeError] = useState<string | null>(null)
  const [tick, setTick] = useState(0)

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
  } = useGameStore()

  const playerRef = useRef({
    x: 480,
    y: 320,
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
  const spawnTimerRef = useRef(0)
  const fireTimerRef = useRef(0)
  const runSavedRef = useRef(false)
  const timeRef = useRef(0)
  const levelRef = useRef(1)
  const overheatUntilRef = useRef(0)
  const overloadActiveRef = useRef(false)

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
    if (phase !== 'playing') return
    const interval = setInterval(() => {
      setTick((prev) => prev + 1)
      setTimeSec(timeRef.current)
    }, 250)
    return () => clearInterval(interval)
  }, [phase, setTimeSec])

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      keysRef.current.add(event.key.toLowerCase())
    }
    const handleKeyUp = (event: KeyboardEvent) => keysRef.current.delete(event.key.toLowerCase())
    const handleMouseMove = (event: MouseEvent) => {
      mouseRef.current = { x: event.clientX, y: event.clientY }
    }

    window.addEventListener('keydown', handleKeyDown)
    window.addEventListener('keyup', handleKeyUp)
    window.addEventListener('mousemove', handleMouseMove)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      window.removeEventListener('keyup', handleKeyUp)
      window.removeEventListener('mousemove', handleMouseMove)
    }
  }, [phase])

  useEffect(() => {
    if (phase !== 'playing') return
    runSavedRef.current = false
    timeRef.current = 0
    levelRef.current = 1
    overheatUntilRef.current = 0
    overloadActiveRef.current = false
    playerRef.current = {
      x: canvasSize.width / 2,
      y: canvasSize.height * 0.7,
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
  }, [phase, canvasSize])

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
      const currentLevel = levelRef.current
      const isMoving =
        keysRef.current.has('w') ||
        keysRef.current.has('a') ||
        keysRef.current.has('s') ||
        keysRef.current.has('d')

      if (phase !== 'playing') return

      timeRef.current += delta
      removeExpiredItems(timeRef.current)

      const targetLevel = Math.floor(timeRef.current / levelConfig.waveDurationSec) + 1
      if (targetLevel !== levelRef.current) {
        levelRef.current = targetLevel
        setLevel(targetLevel)
      }

      const moveSpeed = stats.moveSpeed * 60 * delta
      if (keysRef.current.has('w')) player.y -= moveSpeed
      if (keysRef.current.has('s')) player.y += moveSpeed
      if (keysRef.current.has('a')) player.x -= moveSpeed
      if (keysRef.current.has('d')) player.x += moveSpeed

      player.x = clamp(player.x, CANVAS_PADDING, canvasSize.width - CANVAS_PADDING)
      player.y = clamp(player.y, CANVAS_PADDING, canvasSize.height - CANVAS_PADDING)

      fireTimerRef.current -= delta
      if (fireTimerRef.current <= 0) {
        const aim = mouseRef.current
        const angle = Math.atan2(aim.y - player.y, aim.x - player.x)
        const spread = rand(-0.12, 0.12) * (1 - stats.accuracyBonus / 100)
        const bulletSpeed = 520

        const shoot = (offsetAngle = 0) => {
          const theta = angle + offsetAngle + spread
          const isCrit = Math.random() * 100 < stats.critChance
          const damage = stats.damage * (isCrit ? stats.critDamage / 100 : 1)
          bulletsRef.current.push({
            x: player.x,
            y: player.y,
            vx: Math.cos(theta) * bulletSpeed,
            vy: Math.sin(theta) * bulletSpeed,
            damage,
            radius: BULLET_RADIUS,
            from: 'player'
          })
          if (Math.random() * 100 < stats.cloneChance) {
            bulletsRef.current.push({
              x: player.x + rand(-8, 8),
              y: player.y + rand(-8, 8),
              vx: Math.cos(theta + rand(-0.2, 0.2)) * bulletSpeed * 0.95,
              vy: Math.sin(theta + rand(-0.2, 0.2)) * bulletSpeed * 0.95,
              damage: damage * 0.85,
              radius: BULLET_RADIUS,
              from: 'player'
            })
          }
        }

        shoot()
        fireTimerRef.current = stats.fireRate
      }

      spawnTimerRef.current -= delta
      if (spawnTimerRef.current <= 0) {
        const spawnRate = Math.max(0.4, 1.3 - currentLevel * 0.05)
        spawnTimerRef.current = spawnRate
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
        const size = enemyDef.family === 'old-testament' ? 28 : 22
        const angle = Math.atan2(player.y - y, player.x - x)
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
          buffed: false
        })
      }

      const hasBuffer = enemiesRef.current.some((enemy) => enemy.behavior === 'buffer')

      enemiesRef.current.forEach((enemy) => {
        const def = enemyPool.find((entry) => entry.id === enemy.defId)
        const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x)
        const speedBoost = hasBuffer && enemy.behavior !== 'buffer' ? 1.15 : 1

        if (enemy.behavior === 'dash') {
          enemy.dashTimer -= delta
          const dashSpeed = enemy.dashTimer < 0 ? 2.4 : 1
          if (enemy.dashTimer < -0.5) enemy.dashTimer = rand(1.2, 2.6)
          enemy.vx = Math.cos(angle) * (def?.baseSpeed ?? 1.6) * 60 * dashSpeed * speedBoost
          enemy.vy = Math.sin(angle) * (def?.baseSpeed ?? 1.6) * 60 * dashSpeed * speedBoost
        } else if (enemy.behavior === 'blink') {
          enemy.blinkTimer -= delta
          if (enemy.blinkTimer <= 0) {
            enemy.x = clamp(player.x + rand(-220, 220), 40, canvasSize.width - 40)
            enemy.y = clamp(player.y + rand(-220, 220), 40, canvasSize.height - 40)
            enemy.blinkTimer = rand(2.0, 4.0)
          }
          enemy.vx = Math.cos(angle) * (def?.baseSpeed ?? 1.6) * 60 * speedBoost
          enemy.vy = Math.sin(angle) * (def?.baseSpeed ?? 1.6) * 60 * speedBoost
        } else if (enemy.behavior === 'summon') {
          enemy.vx = Math.cos(angle) * (def?.baseSpeed ?? 1.2) * 60 * speedBoost
          enemy.vy = Math.sin(angle) * (def?.baseSpeed ?? 1.2) * 60 * speedBoost
          if (Math.random() < 0.0025) {
            const swarm = enemyPool.find((entry) => entry.id === 'E02')
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
                buffed: false
              })
            }
          }
        } else {
          enemy.vx = Math.cos(angle) * (def?.baseSpeed ?? 1.4) * 60 * speedBoost
          enemy.vy = Math.sin(angle) * (def?.baseSpeed ?? 1.4) * 60 * speedBoost
        }

        enemy.x += enemy.vx * delta
        enemy.y += enemy.vy * delta

        enemy.shootTimer -= delta
        if (enemy.behavior === 'shooter' && enemy.shootTimer <= 0) {
          enemy.shootTimer = rand(1.0, 1.6)
          const bulletSpeed = 220
          bulletsRef.current.push({
            x: enemy.x,
            y: enemy.y,
            vx: Math.cos(angle) * bulletSpeed,
            vy: Math.sin(angle) * bulletSpeed,
            damage: (def?.baseDamage ?? 12) * (1 + (currentLevel - 1) * 0.05),
            radius: ENEMY_BULLET_RADIUS,
            from: 'enemy'
          })
        }

        if (enemy.dotUntil > nowSec) {
          enemy.hp -= enemy.dotDps * delta
        }
      })

      bulletsRef.current = bulletsRef.current.filter((bullet) => {
        bullet.x += bullet.vx * delta
        bullet.y += bullet.vy * delta
        const inBounds =
          bullet.x > -40 &&
          bullet.x < canvasSize.width + 40 &&
          bullet.y > -40 &&
          bullet.y < canvasSize.height + 40
        return inBounds
      })

      bulletsRef.current.forEach((bullet) => {
        if (bullet.from === 'player') {
          enemiesRef.current.forEach((enemy) => {
            if (enemy.hp <= 0) return
            if (distance(bullet, enemy) < enemy.size) {
              enemy.hp -= bullet.damage
              if (stats.dotDamagePct > 0) {
                enemy.dotUntil = nowSec + 3
                enemy.dotDps = stats.dotDamagePct * 0.6
              }
              bullet.x = -9999
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
          const def = enemyPool.find((entry) => entry.id === enemy.defId)
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

      echoShotsRef.current = echoShotsRef.current.filter((shot) => {
        if (shot.fireAt <= nowSec) {
          const angle = Math.atan2(mouseRef.current.y - shot.origin.y, mouseRef.current.x - shot.origin.x)
          bulletsRef.current.push({
            x: shot.origin.x,
            y: shot.origin.y,
            vx: Math.cos(angle) * 460,
            vy: Math.sin(angle) * 460,
            damage: stats.damage * 0.7,
            radius: BULLET_RADIUS,
            from: 'player'
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
          }
          return false
        }
        return pickup.y < canvasSize.height + 40
      })
    }

    const draw = () => {
      const canvas = canvasRef.current
      if (!canvas) return
      const ctx = canvas.getContext('2d')
      if (!ctx) return

      ctx.clearRect(0, 0, canvasSize.width, canvasSize.height)
      ctx.fillStyle = colors.bg
      ctx.fillRect(0, 0, canvasSize.width, canvasSize.height)

      const time = timeRef.current
      for (let i = 0; i < 120; i++) {
        const x = (i * 73 + time * 12) % canvasSize.width
        const y = (i * 137 + time * 18) % canvasSize.height
        ctx.fillStyle = i % 3 === 0 ? '#93d6ff' : '#ffffff'
        ctx.globalAlpha = 0.5
        ctx.fillRect(x, y, 2, 2)
      }
      ctx.globalAlpha = 1

      const player = playerRef.current
      ctx.save()
      ctx.translate(player.x, player.y)
      const angle = Math.atan2(mouseRef.current.y - player.y, mouseRef.current.x - player.x)
      ctx.rotate(angle + Math.PI / 2)
      ctx.beginPath()
      ctx.moveTo(0, -PLAYER_RADIUS)
      ctx.lineTo(PLAYER_RADIUS * 0.7, PLAYER_RADIUS)
      ctx.lineTo(-PLAYER_RADIUS * 0.7, PLAYER_RADIUS)
      ctx.closePath()
      ctx.fillStyle = colors.accent
      ctx.shadowColor = colors.accentSoft
      ctx.shadowBlur = 12
      ctx.fill()
      ctx.shadowBlur = 0
      ctx.restore()

      bulletsRef.current.forEach((bullet) => {
        ctx.beginPath()
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2)
        ctx.fillStyle = bullet.from === 'player' ? colors.accent : colors.danger
        ctx.fill()
      })

      enemiesRef.current.forEach((enemy) => {
        ctx.save()
        ctx.translate(enemy.x, enemy.y)
        ctx.strokeStyle = enemy.family === 'old-testament' ? '#f5d07d' : '#8df7ff'
        ctx.lineWidth = 2
        ctx.fillStyle = enemy.family === 'old-testament' ? '#3a2a1d' : '#1b2436'
        ctx.beginPath()
        ctx.arc(0, 0, enemy.size, 0, Math.PI * 2)
        ctx.fill()
        ctx.stroke()
        if (enemy.family === 'old-testament') {
          ctx.beginPath()
          ctx.arc(0, 0, enemy.size * 0.3, 0, Math.PI * 2)
          ctx.fillStyle = '#f89f5b'
          ctx.fill()
        }
        ctx.restore()

        ctx.fillStyle = '#0f1118'
        ctx.fillRect(enemy.x - enemy.size, enemy.y - enemy.size - 10, enemy.size * 2, 4)
        ctx.fillStyle = '#6bff9a'
        ctx.fillRect(
          enemy.x - enemy.size,
          enemy.y - enemy.size - 10,
          enemy.size * 2 * (enemy.hp / enemy.maxHp),
          4
        )
      })

      pickupsRef.current.forEach((pickup) => {
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

      ctx.fillStyle = colors.accentSoft
      ctx.fillRect(32, canvasSize.height - 40, (player.hp / player.maxHp) * 220, 10)
      ctx.fillStyle = colors.accent
      ctx.fillRect(32, canvasSize.height - 28, (player.shield / player.maxShield) * 220, 6)
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
    level,
    tick
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
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,#0b1220,transparent_60%),radial-gradient(circle_at_bottom,#0a0f1e,transparent_55%)]" />
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


    </div>
  )
}
