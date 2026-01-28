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