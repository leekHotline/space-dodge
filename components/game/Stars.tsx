// components/game/Stars.tsx
'use client'
import type { ReactElement } from 'react'
import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

interface StarsProps {
  count?: number
}

const DEFAULT_STAR_COUNT = 2000
const POSITION_RANGE = 100
const COLOR_BASE = 0.8
const COLOR_RANGE = 0.2
const SEED_MULTIPLIER = 104729

const randomFromSeed = (seed: number): number => {
  const x = Math.sin(seed) * 10000
  return x - Math.floor(x)
}

export function Stars({ count = DEFAULT_STAR_COUNT }: StarsProps): ReactElement {
  const mesh = useRef<THREE.Points>(null)

  const particles = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const seedBase = count * SEED_MULTIPLIER

    for (let i = 0; i < count; i++) {
      const seed = seedBase + i * 3
      // 位置
      positions[i * 3] = (randomFromSeed(seed) - 0.5) * POSITION_RANGE
      positions[i * 3 + 1] = (randomFromSeed(seed + 1) - 0.5) * POSITION_RANGE
      positions[i * 3 + 2] = (randomFromSeed(seed + 2) - 0.5) * POSITION_RANGE

      // 颜色 - 蓝白色调
      colors[i * 3] = COLOR_BASE + randomFromSeed(seed + 3) * COLOR_RANGE
      colors[i * 3 + 1] = COLOR_BASE + randomFromSeed(seed + 4) * COLOR_RANGE
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
          args={[particles.positions, 3]}
        />
        <bufferAttribute
          attach="attributes-color"
          args={[particles.colors, 3]}
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
