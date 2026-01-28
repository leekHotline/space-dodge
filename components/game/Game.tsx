// components/game/Game.tsx
'use client'
import { useEffect, useRef, useCallback, useState } from 'react'
import { useGameStore } from '@/stores/gameStore'

// ==================== 常量配置 ====================
const SHIP_SIZE = 30
const BULLET_SIZE = 8
const BULLET_SPEED = 12
const ENEMY_MIN_SIZE = 25
const ENEMY_MAX_SIZE = 60
const POWERUP_SIZE = 30
const BOSS_SIZE = 120
const COIN_SIZE = 20

const COLORS = {
  ship: { body: '#00d4ff', cockpit: '#0066ff', engine: '#ff6600', flame: '#ffff00' },
  bullet: { basic: '#00ffff', double: '#00ff00', triple: '#ff00ff', laser: '#ff0000', missile: '#ffaa00' },
  enemy: ['#8b4513', '#a0522d', '#cd853f', '#daa520', '#b8860b'],
  powerup: { health: '#ff4444', shield: '#4fc3f7', weapon: '#ffd700', speed: '#81c784', magnet: '#ba68c8', bomb: '#ff6b6b', score: '#ffd54f' },
  particle: ['#ff6b6b', '#ffd93d', '#6bcb77', '#4d96ff', '#ff6eb4', '#a78bfa', '#fb923c'],
  star: ['#ffffff', '#aaaaff', '#ffaaaa', '#aaffaa', '#ffffaa'],
  boss: { body: '#8b0000', eye: '#ff0000', armor: '#4a0000' }
}

// ==================== 类型定义 ====================
interface Vector2D { x: number; y: number }
interface GameObject extends Vector2D { size: number; rotation?: number; velocity?: Vector2D }

interface Ship extends GameObject {
  health: number
  maxHealth: number
  shield: number
  maxShield: number
  weaponType: string
  fireTimer: number
}

interface Bullet extends GameObject {
  velocity: Vector2D
  damage: number
  type: string
}

interface Enemy extends GameObject {
  velocity: Vector2D
  rotationSpeed: number
  vertices: number[]
  color: string
  health: number
  maxHealth: number
  type: 'normal' | 'fast' | 'tank' | 'shooter'
}

interface Boss extends GameObject {
  velocity: Vector2D
  health: number
  maxHealth: number
  phase: number
  attackTimer: number
  pattern: number
}

interface Powerup extends GameObject {
  type: 'health' | 'shield' | 'weapon' | 'speed' | 'magnet' | 'bomb' | 'score'
  velocity: Vector2D
  pulse: number
}

interface Coin extends GameObject {
  velocity: Vector2D
  value: number
  magnetized: boolean
}

interface Particle extends Vector2D {
  velocity: Vector2D
  size: number
  color: string
  life: number
  maxLife: number
  alpha: number
}

interface Star extends Vector2D {
  size: number
  brightness: number
  twinkleSpeed: number
  twinkleOffset: number
  color: string
  layer: number
}

interface Explosion {
  x: number
  y: number
  radius: number
  maxRadius: number
  alpha: number
}

// ==================== 辅助函数 ====================
const randomRange = (min: number, max: number) => Math.random() * (max - min) + min
const distance = (a: Vector2D, b: Vector2D) => Math.sqrt((a.x - b.x) ** 2 + (a.y - b.y) ** 2)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

const createVertices = (count: number = 8) => {
  const vertices: number[] = []
  for (let i = 0; i < count; i++) {
    vertices.push(randomRange(0.7, 1.3))
  }
  return vertices
}

const getEnemyColor = () => COLORS.enemy[Math.floor(Math.random() * COLORS.enemy.length)]

const getPowerupColor = (type: string) => COLORS.powerup[type as keyof typeof COLORS.powerup] || '#ffffff'

const getPowerupEmoji = (type: string) => {
  const emojis: Record<string, string> = {
    health: '❤️', shield: '🛡️', weapon: '⚔️', speed: '⚡',
    magnet: '🧲', bomb: '💣', score: '⭐'
  }
  return emojis[type] || '❓'
}

// ==================== 绘制函数 ====================
const drawShip = (ctx: CanvasRenderingContext2D, ship: Ship) => {
  ctx.save()
  ctx.translate(ship.x, ship.y)
  ctx.rotate(ship.rotation || 0)

  // 护盾
  if (ship.shield > 0) {
    const shieldAlpha = 0.3 + Math.sin(Date.now() * 0.01) * 0.2
    ctx.beginPath()
    ctx.arc(0, 0, SHIP_SIZE * 1.8, 0, Math.PI * 2)
    ctx.strokeStyle = `rgba(79, 195, 247, ${shieldAlpha})`
    ctx.lineWidth = 4
    ctx.stroke()
    ctx.fillStyle = `rgba(79, 195, 247, ${shieldAlpha * 0.3})`
    ctx.fill()
  }

  // 引擎火焰
  const flameLength = 20 + Math.random() * 15
  ctx.beginPath()
  ctx.moveTo(-12, SHIP_SIZE / 2)
  ctx.lineTo(0, SHIP_SIZE / 2 + flameLength)
  ctx.lineTo(12, SHIP_SIZE / 2)
  ctx.closePath()
  const flameGradient = ctx.createLinearGradient(0, SHIP_SIZE / 2, 0, SHIP_SIZE / 2 + flameLength)
  flameGradient.addColorStop(0, COLORS.ship.engine)
  flameGradient.addColorStop(0.5, COLORS.ship.flame)
  flameGradient.addColorStop(1, 'transparent')
  ctx.fillStyle = flameGradient
  ctx.fill()

  // 飞船主体
  ctx.beginPath()
  ctx.moveTo(0, -SHIP_SIZE / 2)
  ctx.lineTo(-SHIP_SIZE / 2, SHIP_SIZE / 2)
  ctx.lineTo(-SHIP_SIZE / 4, SHIP_SIZE / 3)
  ctx.lineTo(SHIP_SIZE / 4, SHIP_SIZE / 3)
  ctx.lineTo(SHIP_SIZE / 2, SHIP_SIZE / 2)
  ctx.closePath()
  
  const bodyGradient = ctx.createLinearGradient(-SHIP_SIZE / 2, 0, SHIP_SIZE / 2, 0)
  bodyGradient.addColorStop(0, '#006699')
  bodyGradient.addColorStop(0.5, COLORS.ship.body)
  bodyGradient.addColorStop(1, '#006699')
  ctx.fillStyle = bodyGradient
  ctx.fill()
  ctx.strokeStyle = '#00aaff'
  ctx.lineWidth = 2
  ctx.stroke()

  // 驾驶舱
  ctx.beginPath()
  ctx.arc(0, -SHIP_SIZE / 6, SHIP_SIZE / 5, 0, Math.PI * 2)
  const cockpitGradient = ctx.createRadialGradient(0, -SHIP_SIZE / 6, 0, 0, -SHIP_SIZE / 6, SHIP_SIZE / 5)
  cockpitGradient.addColorStop(0, '#00aaff')
  cockpitGradient.addColorStop(1, COLORS.ship.cockpit)
  ctx.fillStyle = cockpitGradient
  ctx.fill()

  // 武器指示器
  ctx.fillStyle = '#00ff00'
  ctx.font = '10px Arial'
  ctx.textAlign = 'center'
  ctx.fillText(ship.weaponType.charAt(0).toUpperCase(), 0, SHIP_SIZE / 2 - 5)

  ctx.restore()
}

const drawBullet = (ctx: CanvasRenderingContext2D, bullet: Bullet) => {
  ctx.save()
  ctx.translate(bullet.x, bullet.y)
  
  const color = COLORS.bullet[bullet.type as keyof typeof COLORS.bullet] || COLORS.bullet.basic
  
  if (bullet.type === 'laser') {
    ctx.beginPath()
    ctx.rect(-2, -20, 4, 40)
    ctx.fillStyle = color
    ctx.fill()
    ctx.shadowBlur = 10
    ctx.shadowColor = color
  } else if (bullet.type === 'missile') {
    ctx.beginPath()
    ctx.moveTo(0, -BULLET_SIZE)
    ctx.lineTo(-BULLET_SIZE / 2, BULLET_SIZE)
    ctx.lineTo(BULLET_SIZE / 2, BULLET_SIZE)
    ctx.closePath()
    ctx.fillStyle = color
    ctx.fill()
    ctx.strokeStyle = '#fff'
    ctx.lineWidth = 1
    ctx.stroke()
  } else {
    ctx.beginPath()
    ctx.arc(0, 0, BULLET_SIZE, 0, Math.PI * 2)
    const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, BULLET_SIZE)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.5, color)
    gradient.addColorStop(1, color)
    ctx.fillStyle = gradient
    ctx.fill()
    ctx.shadowBlur = 15
    ctx.shadowColor = color
  }
  
  ctx.restore()
}

const drawEnemy = (ctx: CanvasRenderingContext2D, enemy: Enemy) => {
  ctx.save()
  ctx.translate(enemy.x, enemy.y)
  ctx.rotate(enemy.rotation || 0)

  // 血条
  if (enemy.health < enemy.maxHealth) {
    const barWidth = enemy.size * 1.5
    const barHeight = 4
    ctx.fillStyle = '#ff0000'
    ctx.fillRect(-barWidth / 2, -enemy.size - 10, barWidth, barHeight)
    ctx.fillStyle = '#00ff00'
    ctx.fillRect(-barWidth / 2, -enemy.size - 10, barWidth * (enemy.health / enemy.maxHealth), barHeight)
  }

  // 敌人主体
  ctx.beginPath()
  const numVertices = enemy.vertices.length
  for (let i = 0; i < numVertices; i++) {
    const angle = (i / numVertices) * Math.PI * 2
    const radius = enemy.size * enemy.vertices[i]
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  }
  ctx.closePath()

  const gradient = ctx.createRadialGradient(-enemy.size / 4, -enemy.size / 4, 0, 0, 0, enemy.size)
  gradient.addColorStop(0, enemy.color)
  gradient.addColorStop(1, '#1a1a1a')
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.strokeStyle = '#5a4a3a'
  ctx.lineWidth = 2
  ctx.stroke()

  // 类型标识
  if (enemy.type === 'fast') {
    ctx.fillStyle = '#ffff00'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('⚡', 0, 5)
  } else if (enemy.type === 'tank') {
    ctx.fillStyle = '#ff0000'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('🛡', 0, 5)
  } else if (enemy.type === 'shooter') {
    ctx.fillStyle = '#ff00ff'
    ctx.font = '16px Arial'
    ctx.textAlign = 'center'
    ctx.fillText('🔫', 0, 5)
  }

  ctx.restore()
}

const drawBoss = (ctx: CanvasRenderingContext2D, boss: Boss) => {
  ctx.save()
  ctx.translate(boss.x, boss.y)

  // Boss 血条
  const barWidth = BOSS_SIZE * 2
  const barHeight = 10
  ctx.fillStyle = '#330000'
  ctx.fillRect(-barWidth / 2, -BOSS_SIZE - 30, barWidth, barHeight)
  ctx.fillStyle = '#ff0000'
  ctx.fillRect(-barWidth / 2, -BOSS_SIZE - 30, barWidth * (boss.health / boss.maxHealth), barHeight)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.strokeRect(-barWidth / 2, -BOSS_SIZE - 30, barWidth, barHeight)

  // Boss 主体
  ctx.beginPath()
  ctx.arc(0, 0, BOSS_SIZE, 0, Math.PI * 2)
  const gradient = ctx.createRadialGradient(-BOSS_SIZE / 3, -BOSS_SIZE / 3, 0, 0, 0, BOSS_SIZE)
  gradient.addColorStop(0, COLORS.boss.body)
  gradient.addColorStop(0.7, '#4a0000')
  gradient.addColorStop(1, '#000000')
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.strokeStyle = '#ff0000'
  ctx.lineWidth = 4
  ctx.stroke()

  // Boss 眼睛
  const eyeOffset = BOSS_SIZE / 3
  for (let i = -1; i <= 1; i += 2) {
    ctx.beginPath()
    ctx.arc(i * eyeOffset, -BOSS_SIZE / 4, BOSS_SIZE / 6, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.boss.eye
    ctx.fill()
    ctx.beginPath()
    ctx.arc(i * eyeOffset, -BOSS_SIZE / 4, BOSS_SIZE / 12, 0, Math.PI * 2)
    ctx.fillStyle = '#000000'
    ctx.fill()
  }

  // Boss 装甲
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2
    const x = Math.cos(angle) * BOSS_SIZE * 0.8
    const y = Math.sin(angle) * BOSS_SIZE * 0.8
    ctx.beginPath()
    ctx.arc(x, y, BOSS_SIZE / 8, 0, Math.PI * 2)
    ctx.fillStyle = COLORS.boss.armor
    ctx.fill()
    ctx.strokeStyle = '#ff0000'
    ctx.lineWidth = 2
    ctx.stroke()
  }

  ctx.restore()
}

const drawPowerup = (ctx: CanvasRenderingContext2D, powerup: Powerup) => {
  ctx.save()
  ctx.translate(powerup.x, powerup.y)

  const pulse = 1 + Math.sin(powerup.pulse) * 0.3
  ctx.scale(pulse, pulse)

  const color = getPowerupColor(powerup.type)
  
  // 光晕
  ctx.beginPath()
  ctx.arc(0, 0, POWERUP_SIZE * 2, 0, Math.PI * 2)
  const glowGradient = ctx.createRadialGradient(0, 0, 0, 0, 0, POWERUP_SIZE * 2)
  glowGradient.addColorStop(0, color)
  glowGradient.addColorStop(1, 'transparent')
  ctx.fillStyle = glowGradient
  ctx.globalAlpha = 0.4
  ctx.fill()
  ctx.globalAlpha = 1

  // 主体
  ctx.beginPath()
  ctx.arc(0, 0, POWERUP_SIZE, 0, Math.PI * 2)
  ctx.fillStyle = color
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 3
  ctx.stroke()

  // 图标
  ctx.font = `${POWERUP_SIZE * 1.2}px Arial`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillStyle = '#ffffff'
  ctx.fillText(getPowerupEmoji(powerup.type), 0, 2)

  ctx.restore()
}

const drawCoin = (ctx: CanvasRenderingContext2D, coin: Coin) => {
  ctx.save()
  ctx.translate(coin.x, coin.y)
  ctx.rotate(Date.now() * 0.005)

  const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, COIN_SIZE)
  gradient.addColorStop(0, '#ffff00')
  gradient.addColorStop(0.5, '#ffd700')
  gradient.addColorStop(1, '#ff8c00')
  
  ctx.beginPath()
  ctx.arc(0, 0, COIN_SIZE, 0, Math.PI * 2)
  ctx.fillStyle = gradient
  ctx.fill()
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  ctx.stroke()

  ctx.fillStyle = '#000000'
  ctx.font = 'bold 16px Arial'
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('$', 0, 0)

  ctx.restore()
}

const drawParticle = (ctx: CanvasRenderingContext2D, particle: Particle) => {
  ctx.save()
  ctx.globalAlpha = particle.alpha
  ctx.beginPath()
  ctx.arc(particle.x, particle.y, particle.size * (particle.life / particle.maxLife), 0, Math.PI * 2)
  ctx.fillStyle = particle.color
  ctx.fill()
  ctx.restore()
}

const drawStar = (ctx: CanvasRenderingContext2D, star: Star, time: number) => {
  const twinkle = 0.5 + 0.5 * Math.sin(time * star.twinkleSpeed + star.twinkleOffset)
  ctx.save()
  ctx.globalAlpha = star.brightness * twinkle
  ctx.beginPath()
  ctx.arc(star.x, star.y, star.size, 0, Math.PI * 2)
  ctx.fillStyle = star.color
  ctx.fill()
  ctx.restore()
}

const drawExplosion = (ctx: CanvasRenderingContext2D, explosion: Explosion) => {
  ctx.save()
  ctx.globalAlpha = explosion.alpha
  
  for (let i = 0; i < 3; i++) {
    ctx.beginPath()
    ctx.arc(explosion.x, explosion.y, explosion.radius - i * 10, 0, Math.PI * 2)
    const gradient = ctx.createRadialGradient(explosion.x, explosion.y, 0, explosion.x, explosion.y, explosion.radius - i * 10)
    gradient.addColorStop(0, '#ffffff')
    gradient.addColorStop(0.3, '#ffaa00')
    gradient.addColorStop(0.6, '#ff4400')
    gradient.addColorStop(1, 'transparent')
    ctx.fillStyle = gradient
    ctx.fill()
  }
  
  ctx.restore()
}

// ==================== 主游戏组件 ====================
export default function Game() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const gameLoopRef = useRef<number | null>(null)
  const lastTimeRef = useRef<number>(0)
  const [canvasSize, setCanvasSize] = useState({ width: 800, height: 600 })
  
  const { 
    phase, level, score, health, maxHealth, shield, maxShield, weaponType, 
    startGame: storeStartGame, pauseGame, resumeGame, endGame, nextLevel,
    addScore, addKill, takeDamage, collectPowerup, addCoins, incrementPlayTime
  } = useGameStore()
  
  // 游戏对象引用
  const shipRef = useRef<Ship>({
    x: 400, y: 500, size: SHIP_SIZE, rotation: -Math.PI / 2,
    health: 100, maxHealth: 100, shield: 0, maxShield: 100,
    weaponType: 'basic', fireTimer: 0
  })
  
  const bulletsRef = useRef<Bullet[]>([])
  const enemiesRef = useRef<Enemy[]>([])
  const bossRef = useRef<Boss | null>(null)
  const powerupsRef = useRef<Powerup[]>([])
  const coinsRef = useRef<Coin[]>([])
  const particlesRef = useRef<Particle[]>([])
  const explosionsRef = useRef<Explosion[]>([])
  const starsRef = useRef<Star[]>([])
  const keysRef = useRef<Set<string>>(new Set())
  const touchRef = useRef<Vector2D | null>(null)
  const spawnTimerRef = useRef(0)
  const powerupTimerRef = useRef(0)
  const levelProgressRef = useRef(0)
  const playTimeIntervalRef = useRef<NodeJS.Timeout | null>(null)
  const magnetActiveRef = useRef(false)
  const magnetTimerRef = useRef(0)

  // 初始化星星背景
  const initStars = useCallback((width: number, height: number) => {
    const stars: Star[] = []
    for (let i = 0; i < 200; i++) {
      stars.push({
        x: Math.random() * width,
        y: Math.random() * height,
        size: Math.random() * 2.5 + 0.5,
        brightness: Math.random() * 0.8 + 0.2,
        twinkleSpeed: Math.random() * 0.003 + 0.001,
        twinkleOffset: Math.random() * Math.PI * 2,
        color: COLORS.star[Math.floor(Math.random() * COLORS.star.length)],
        layer: Math.floor(Math.random() * 3)
      })
    }
    starsRef.current = stars
  }, [])

  // 创建粒子效果
  const createParticles = useCallback((x: number, y: number, count: number = 20, size: number = 4) => {
    for (let i = 0; i < count; i++) {
      const angle = (i / count) * Math.PI * 2
      const speed = randomRange(2, 6)
      particlesRef.current.push({
        x, y,
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        size: randomRange(size * 0.5, size),
        color: COLORS.particle[Math.floor(Math.random() * COLORS.particle.length)],
        life: 1,
        maxLife: 1,
        alpha: 1
      })
    }
  }, [])

  // 创建爆炸效果
  const createExplosion = useCallback((x: number, y: number, size: number = 50) => {
    explosionsRef.current.push({
      x, y,
      radius: 0,
      maxRadius: size,
      alpha: 1
    })
    createParticles(x, y, 30, 6)
  }, [createParticles])

  // 生成敌人
  const spawnEnemy = useCallback(() => {
    const { width, height } = canvasSize
    const side = Math.floor(Math.random() * 4)
    let x: number, y: number
    
    switch (side) {
      case 0: x = Math.random() * width; y = -ENEMY_MAX_SIZE; break
      case 1: x = width + ENEMY_MAX_SIZE; y = Math.random() * height; break
      case 2: x = Math.random() * width; y = height + ENEMY_MAX_SIZE; break
      default: x = -ENEMY_MAX_SIZE; y = Math.random() * height
    }
    
    const types: Array<'normal' | 'fast' | 'tank' | 'shooter'> = ['normal', 'normal', 'normal', 'fast', 'tank', 'shooter']
    const type = types[Math.floor(Math.random() * types.length)]
    
    let size = randomRange(ENEMY_MIN_SIZE, ENEMY_MAX_SIZE)
    let health = 100
    let speed = 1 + level * 0.1
    
    if (type === 'fast') {
      size *= 0.7
      health = 50
      speed *= 2
    } else if (type === 'tank') {
      size *= 1.3
      health = 200
      speed *= 0.6
    } else if (type === 'shooter') {
      health = 80
    }
    
    const angle = Math.atan2(height / 2 - y, width / 2 - x)
    
    enemiesRef.current.push({
      x, y, size,
      rotation: Math.random() * Math.PI * 2,
      velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
      rotationSpeed: randomRange(-0.03, 0.03),
      vertices: createVertices(),
      color: getEnemyColor(),
      health, maxHealth: health,
      type
    })
  }, [canvasSize, level])

  // 生成 Boss
  const spawnBoss = useCallback(() => {
    const { width } = canvasSize
    bossRef.current = {
      x: width / 2,
      y: -BOSS_SIZE,
      size: BOSS_SIZE,
      velocity: { x: 0, y: 1 },
      health: 5000 + level * 1000,
      maxHealth: 5000 + level * 1000,
      phase: 1,
      attackTimer: 0,
      pattern: 0
    }
  }, [canvasSize, level])

  // 生成道具
  const spawnPowerup = useCallback(() => {
    const { width, height } = canvasSize
    const types: Array<'health' | 'shield' | 'weapon' | 'speed' | 'magnet' | 'bomb' | 'score'> = 
      ['health', 'shield', 'weapon', 'speed', 'magnet', 'bomb', 'score']
    const type = types[Math.floor(Math.random() * types.length)]
    
    powerupsRef.current.push({
      x: Math.random() * (width - 100) + 50,
      y: -POWERUP_SIZE,
      size: POWERUP_SIZE,
      type,
      velocity: { x: 0, y: randomRange(1.5, 2.5) },
      pulse: 0
    })
  }, [canvasSize])

  // 生成金币
  const spawnCoin = useCallback((x: number, y: number, count: number = 1) => {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2
      const speed = randomRange(1, 3)
      coinsRef.current.push({
        x, y,
        size: COIN_SIZE,
        velocity: { x: Math.cos(angle) * speed, y: Math.sin(angle) * speed },
        value: 10,
        magnetized: false
      })
    }
  }, [])

  // 射击
  const fireBullet = useCallback(() => {
    const ship = shipRef.current
    const fireRate = weaponType === 'laser' ? 0.05 : weaponType === 'missile' ? 0.3 : 0.15
    
    if (ship.fireTimer > 0) return
    ship.fireTimer = fireRate
    
    const bulletSpeed = BULLET_SPEED
    const damage = weaponType === 'missile' ? 150 : weaponType === 'laser' ? 50 : 100
    
    if (weaponType === 'double') {
      for (let i = -1; i <= 1; i += 2) {
        bulletsRef.current.push({
          x: ship.x + i * 15, y: ship.y - 20, size: BULLET_SIZE,
          velocity: { x: 0, y: -bulletSpeed },
          damage, type: weaponType
        })
      }
    } else if (weaponType === 'triple') {
      for (let i = -1; i <= 1; i++) {
        bulletsRef.current.push({
          x: ship.x + i * 15, y: ship.y - 20, size: BULLET_SIZE,
          velocity: { x: i * 2, y: -bulletSpeed },
          damage, type: weaponType
        })
      }
    } else {
      bulletsRef.current.push({
        x: ship.x, y: ship.y - 20, size: BULLET_SIZE,
        velocity: { x: 0, y: -bulletSpeed },
        damage, type: weaponType
      })
    }
  }, [weaponType])
