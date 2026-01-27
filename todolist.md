# 🎮 黑客松游戏开发技术栈选择指南

## 快速决策树

```
你的情况是？
     │
     ├─ 需要3D酷炫效果 ──────────► React Three Fiber (R3F)
     │
     ├─ 2D像素/休闲游戏 ────────► Phaser.js 或 Kaboom.js
     │
     ├─ 已熟悉Godot ───────────► Godot + Web导出
     │
     └─ 想要多人联网 ─────────► Next.js + Socket.io
```

## 📊 技术栈对比

| 技术栈 | 开发速度 | 视觉效果 | 部署难度 | 评委体验 | 适合场景 |
|--------|---------|---------|---------|---------|---------|
| **Next.js + R3F** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 3D酷炫游戏 |
| **Next.js + Phaser** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 2D游戏 |
| **Godot** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ | 复杂游戏逻辑 |
| **Kaboom.js** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | 极简2D |

---

## 🏆 我的推荐：Next.js + React Three Fiber

**理由**：
1. **一键部署** - Vercel 秒级上线，评委点击即玩
2. **视觉震撼** - 3D 效果让你的项目脱颖而出
3. **全栈能力** - 可加排行榜、用户系统
4. **生态丰富** - 大量现成组件和模型

---

## 🚀 实战：制作一个太空躲避游戏

### 项目结构

```
space-dodge/
├── app/
│   ├── page.tsx              # 主页面
│   ├── layout.tsx
│   └── globals.css
├── components/
│   └── game/
│       ├── Game.tsx          # 游戏主组件
│       ├── Spaceship.tsx     # 玩家飞船
│       ├── Asteroid.tsx      # 小行星障碍
│       ├── Stars.tsx         # 星空背景
│       ├── Explosion.tsx     # 爆炸效果
│       └── UI.tsx            # 游戏UI
├── stores/
│   └── gameStore.ts          # Zustand状态管理
├── package.json
└── tailwind.config.js
```

### Step 1: 初始化项目

```bash
npx create-next-app@latest space-dodge --typescript --tailwind --app
cd space-dodge
npm install three @react-three/fiber @react-three/drei zustand
npm install @types/three --save-dev
```


# From now to do list:
### Step 2: 游戏状态管理

```typescript
// stores/gameStore.ts
import { create } from 'zustand'

interface GameState {
  // 游戏状态
  isPlaying: boolean
  isPaused: boolean
  isGameOver: boolean
  score: number
  highScore: number
  
  // 玩家状态
  playerPosition: { x: number; y: number }
  health: number
  
  // 操作方法
  startGame: () => void
  pauseGame: () => void
  resumeGame: () => void
  gameOver: () => void
  addScore: (points: number) => void
  movePlayer: (x: number, y: number) => void
  takeDamage: () => void
  reset: () => void
}

export const useGameStore = create<GameState>((set, get) => ({
  isPlaying: false,
  isPaused: false,
  isGameOver: false,
  score: 0,
  highScore: typeof window !== 'undefined' 
    ? parseInt(localStorage.getItem('highScore') || '0') 
    : 0,
  playerPosition: { x: 0, y: 0 },
  health: 3,
  
  startGame: () => set({ 
    isPlaying: true, 
    isGameOver: false, 
    score: 0,
    health: 3,
    playerPosition: { x: 0, y: 0 }
  }),
  
  pauseGame: () => set({ isPaused: true }),
  
  resumeGame: () => set({ isPaused: false }),
  
  gameOver: () => {
    const { score, highScore } = get()
    const newHighScore = Math.max(score, highScore)
    if (typeof window !== 'undefined') {
      localStorage.setItem('highScore', newHighScore.toString())
    }
    set({ 
      isPlaying: false, 
      isGameOver: true, 
      highScore: newHighScore 
    })
  },
  
  addScore: (points) => set((state) => ({ 
    score: state.score + points 
  })),
  
  movePlayer: (x, y) => set({ 
    playerPosition: { x, y } 
  }),
  
  takeDamage: () => {
    const { health, gameOver } = get()
    if (health <= 1) {
      gameOver()
    } else {
      set({ health: health - 1 })
    }
  },
  
  reset: () => set({
    isPlaying: false,
    isPaused: false,
    isGameOver: false,
    score: 0,
    health: 3,
    playerPosition: { x: 0, y: 0 }
  })
}))
```

### Step 3: 游戏组件

```tsx
// components/game/Stars.tsx
'use client'
import { useRef, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

export function Stars({ count = 2000 }) {
  const mesh = useRef<THREE.Points>(null)
  
  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    
    for (let i = 0; i < count; i++) {
      // 位置
      positions[i * 3] = (Math.random() - 0.5) * 100
      positions[i * 3 + 1] = (Math.random() - 0.5) * 100
      positions[i * 3 + 2] = (Math.random() - 0.5) * 100
      
      // 颜色 - 蓝白色调
      colors[i * 3] = 0.8 + Math.random() * 0.2
      colors[i * 3 + 1] = 0.8 + Math.random() * 0.2
      colors[i * 3 + 2] = 1
    }
    
    return { positions, colors }
  }, [count])
  
  useFrame((_, delta) => {
    if (mesh.current) {
      mesh.current.rotation.y += delta * 0.02
      mesh.current.rotation.x += delta * 0.01
    }
  })
  
  return (
    <points ref={mesh}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={count}
          array={particles.positions}
          itemSize={3}
        />
        <bufferAttribute
          attach="attributes-color"
          count={count}
          array={particles.colors}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.1}
        vertexColors
        transparent
        opacity={0.8}
        sizeAttenuation
      />
    </points>
  )
}
```

```tsx
// components/game/Spaceship.tsx
'use client'
import { useRef, useEffect } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { useGameStore } from '@/stores/gameStore'
import * as THREE from 'three'

export function Spaceship() {
  const meshRef = useRef<THREE.Group>(null)
  const { viewport } = useThree()
  const { movePlayer, isPlaying, isPaused } = useGameStore()
  
  const targetPosition = useRef({ x: 0, y: 0 })
  const engineGlow = useRef<THREE.PointLight>(null)
  
  // 鼠标/触摸控制
  useEffect(() => {
    const handleMove = (clientX: number, clientY: number) => {
      if (!isPlaying || isPaused) return
      
      // 转换为3D坐标
      const x = ((clientX / window.innerWidth) * 2 - 1) * (viewport.width / 2) * 0.8
      const y = -((clientY / window.innerHeight) * 2 - 1) * (viewport.height / 2) * 0.8
      
      targetPosition.current = { x, y }
    }
    
    const handleMouseMove = (e: MouseEvent) => handleMove(e.clientX, e.clientY)
    const handleTouchMove = (e: TouchEvent) => {
      e.preventDefault()
      handleMove(e.touches[0].clientX, e.touches[0].clientY)
    }
    
    window.addEventListener('mousemove', handleMouseMove)
    window.addEventListener('touchmove', handleTouchMove, { passive: false })
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove)
      window.removeEventListener('touchmove', handleTouchMove)
    }
  }, [viewport, isPlaying, isPaused])
  
  useFrame((state, delta) => {
    if (!meshRef.current || !isPlaying || isPaused) return
    
    // 平滑移动
    const currentPos = meshRef.current.position
    const lerpFactor = 1 - Math.pow(0.001, delta)
    
    currentPos.x += (targetPosition.current.x - currentPos.x) * lerpFactor * 8
    currentPos.y += (targetPosition.current.y - currentPos.y) * lerpFactor * 8
    
    // 根据移动方向倾斜
    const tiltX = (targetPosition.current.y - currentPos.y) * 0.5
    const tiltZ = (targetPosition.current.x - currentPos.x) * -0.3
    
    meshRef.current.rotation.x = THREE.MathUtils.lerp(meshRef.current.rotation.x, tiltX, lerpFactor * 5)
    meshRef.current.rotation.z = THREE.MathUtils.lerp(meshRef.current.rotation.z, tiltZ, lerpFactor * 5)
    
    // 引擎光效闪烁
    if (engineGlow.current) {
      engineGlow.current.intensity = 2 + Math.sin(state.clock.elapsedTime * 20) * 0.5
    }
    
    // 更新全局状态
    movePlayer(currentPos.x, currentPos.y)
  })
  
  return (
    <group ref={meshRef} position={[0, 0, 0]}>
      {/* 主体 */}
      <mesh>
        <coneGeometry args={[0.3, 1, 8]} />
        <meshStandardMaterial 
          color="#00d4ff" 
          metalness={0.8} 
          roughness={0.2}
          emissive="#004466"
          emissiveIntensity={0.3}
        />
      </mesh>
      
      {/* 机翼 */}
      <mesh position={[-0.4, -0.2, 0]} rotation={[0, 0, -0.3]}>
        <boxGeometry args={[0.5, 0.05, 0.3]} />
        <meshStandardMaterial color="#0088cc" metalness={0.9} roughness={0.1} />
      </mesh>
      <mesh position={[0.4, -0.2, 0]} rotation={[0, 0, 0.3]}>
        <boxGeometry args={[0.5, 0.05, 0.3]} />
        <meshStandardMaterial color="#0088cc" metalness={0.9} roughness={0.1} />
      </mesh>
      
      {/* 驾驶舱 */}
      <mesh position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.15, 16, 16]} />
        <meshStandardMaterial 
          color="#66ffff" 
          transparent 
          opacity={0.7}
          emissive="#00ffff"
          emissiveIntensity={0.5}
        />
      </mesh>
      
      {/* 引擎光效 */}
      <pointLight
        ref={engineGlow}
        position={[0, -0.6, 0]}
        color="#ff6600"
        intensity={2}
        distance={3}
      />
      
      {/* 引擎火焰 */}
      <mesh position={[0, -0.6, 0]}>
        <coneGeometry args={[0.15, 0.4, 8]} />
        <meshBasicMaterial color="#ff4400" transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, -0.7, 0]}>
        <coneGeometry args={[0.08, 0.3, 8]} />
        <meshBasicMaterial color="#ffaa00" transparent opacity={0.9} />
      </mesh>
    </group>
  )
}
```

```tsx
// components/game/Asteroid.tsx
'use client'
import { useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { useGameStore } from '@/stores/gameStore'
import * as THREE from 'three'

interface AsteroidProps {
  id: number
  initialPosition: [number, number, number]
  speed: number
  size: number
  onDestroy: (id: number) => void
}

export function Asteroid({ id, initialPosition, speed, size, onDestroy }: AsteroidProps) {
  const meshRef = useRef<THREE.Mesh>(null)
  const { playerPosition, isPlaying, isPaused, takeDamage, addScore } = useGameStore()
  const [isDestroyed, setIsDestroyed] = useState(false)
  
  // 随机旋转速度
  const rotationSpeed = useRef({
    x: (Math.random() - 0.5) * 2,
    y: (Math.random() - 0.5) * 2,
    z: (Math.random() - 0.5) * 2
  })
  
  useFrame((_, delta) => {
    if (!meshRef.current || !isPlaying || isPaused || isDestroyed) return
    
    // 向玩家方向移动
    meshRef.current.position.z += speed * delta
    
    // 旋转
    meshRef.current.rotation.x += rotationSpeed.current.x * delta
    meshRef.current.rotation.y += rotationSpeed.current.y * delta
    meshRef.current.rotation.z += rotationSpeed.current.z * delta
    
    // 检测碰撞
    const asteroidPos = meshRef.current.position
    const distance = Math.sqrt(
      Math.pow(asteroidPos.x - playerPosition.x, 2) +
      Math.pow(asteroidPos.y - playerPosition.y, 2) +
      Math.pow(asteroidPos.z, 2)
    )
    
    if (distance < size + 0.5) {
      takeDamage()
      setIsDestroyed(true)
      onDestroy(id)
    }
    
    // 飞出屏幕
    if (asteroidPos.z > 5) {
      addScore(10)
      onDestroy(id)
    }
  })
  
  if (isDestroyed) return null
  
  return (
    <mesh ref={meshRef} position={initialPosition}>
      <dodecahedronGeometry args={[size, 0]} />
      <meshStandardMaterial
        color="#8b7355"
        roughness={0.8}
        metalness={0.2}
        flatShading
      />
    </mesh>
  )
}
```

```tsx
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
```

### Step 4: 游戏主组件

```tsx
// components/game/Game.tsx
'use client'
import { Suspense, useState, useCallback, useEffect } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stars } from './Stars'
import { Spaceship } from './Spaceship'
import { Asteroid } from './Asteroid'
import { GameUI } from './UI'
import { useGameStore } from '@/stores/gameStore'

interface AsteroidData {
  id: number
  position: [number, number, number]
  speed: number
  size: number
}

function GameScene() {
  const { isPlaying, isPaused, score } = useGameStore()
  const [asteroids, setAsteroids] = useState<AsteroidData[]>([])
  const [nextId, setNextId] = useState(0)
  
  // 生成小行星
  useEffect(() => {
    if (!isPlaying || isPaused) return
    
    // 难度随分数增加
    const baseInterval = Math.max(300, 1000 - score * 5)
    
    const spawnAsteroid = () => {
      const newAsteroid: AsteroidData = {
        id: nextId,
        position: [
          (Math.random() - 0.5) * 10,
          (Math.random() - 0.5) * 6,
          -30
        ],
        speed: 8 + Math.random() * 4 + score * 0.05,
        size: 0.3 + Math.random() * 0.5
      }
      
      setAsteroids(prev => [...prev, newAsteroid])
      setNextId(prev => prev + 1)
    }
    
    const interval = setInterval(spawnAsteroid, baseInterval)
    return () => clearInterval(interval)
  }, [isPlaying, isPaused, score, nextId])
  
  // 清理小行星
  const handleDestroyAsteroid = useCallback((id: number) => {
    setAsteroids(prev => prev.filter(a => a.id !== id))
  }, [])
  
  // 重置
  useEffect(() => {
    if (!isPlaying) {
      setAsteroids([])
    }
  }, [isPlaying])
  
  return (
    <>
      {/* 环境光 */}
      <ambientLight intensity={0.3} />
      <directionalLight position={[5, 5, 5]} intensity={1} />
      <pointLight position={[0, 0, 10]} intensity={0.5} color="#4488ff" />
      
      {/* 星空背景 */}
      <Stars count={3000} />
      
      {/* 玩家飞船 */}
      {isPlaying && <Spaceship />}
      
      {/* 小行星 */}
      {asteroids.map(asteroid => (
        <Asteroid
          key={asteroid.id}
          id={asteroid.id}
          initialPosition={asteroid.position}
          speed={asteroid.speed}
          size={asteroid.size}
          onDestroy={handleDestroyAsteroid}
        />
      ))}
      
      {/* 雾效 */}
      <fog attach="fog" args={['#000011', 10, 50]} />
    </>
  )
}

export default function Game() {
  return (
    <div className="w-screen h-screen bg-black relative">
      <Canvas
        camera={{ position: [0, 0, 8], fov: 60 }}
        gl={{ antialias: true }}
      >
        <Suspense fallback={null}>
          <GameScene />
        </Suspense>
      </Canvas>
      <GameUI />
    </div>
  )
}
```

### Step 5: 页面入口

```tsx
// app/page.tsx
'use client'
import dynamic from 'next/dynamic'

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

export default function Home() {
  return <Game />
}
```

```tsx
// app/layout.tsx
import './globals.css'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: '太空躲避者 - Space Dodge',
  description: '一个酷炫的3D太空躲避游戏',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="zh">
      <body className="overflow-hidden">{children}</body>
    </html>
  )
}
```

```css
/* app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

* {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

body {
  background: #000;
  color: white;
  overflow: hidden;
  touch-action: none;
}
```

---

## 🎯 运行效果

```bash
npm run dev
# 打开 http://localhost:3000
```

## 🚢 一键部署到 Vercel

```bash
npm install -g vercel
vercel
# 按提示操作，2分钟内上线！
```

---

## 📦 扩展功能（黑客松加分项）

```
┌─────────────────────────────────────────────────────┐
│  可以快速添加的功能                                    │
├─────────────────────────────────────────────────────┤
│  ✅ 音效系统 - 使用 Howler.js                         │
│  ✅ 排行榜 - Vercel KV / Supabase                    │
│  ✅ 多人模式 - Socket.io / Liveblocks               │
│  ✅ 移动端手柄 - 虚拟摇杆                             │
│  ✅ 道具系统 - 护盾、加速、武器                        │
│  ✅ 关卡系统 - Boss战                                │
└─────────────────────────────────────────────────────┘
```

这个技术栈让你在黑客松中能够**快速开发**、**酷炫展示**、**一键部署**！🏆