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
