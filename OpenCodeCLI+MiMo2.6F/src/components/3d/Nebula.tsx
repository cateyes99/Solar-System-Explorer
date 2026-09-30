import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimStore } from '../../store/simulationStore'
import { getSceneTextures } from '../../utils/sceneTextures'

/**
 * Distant nebula clouds: a handful of large additive billboards tinted purple,
 * blue and cyan. Deliberately subtle so the planets stay the focus.
 */

interface CloudDef {
  position: [number, number, number]
  scale: number
  color: string
  opacity: number
  rotation: number
}

const CLOUDS: CloudDef[] = [
  { position: [-1900, 520, -1400], scale: 2100, color: '#6c4bff', opacity: 0.16, rotation: 0.4 },
  { position: [1750, -380, -1750], scale: 1900, color: '#2f7bff', opacity: 0.14, rotation: 1.9 },
  { position: [240, 1180, -2300], scale: 2500, color: '#a05cff', opacity: 0.12, rotation: 3.1 },
  { position: [-1500, -900, 1600], scale: 1700, color: '#1fb6ff', opacity: 0.1, rotation: 5.2 },
  { position: [1250, 820, 1950], scale: 1600, color: '#7d5bff', opacity: 0.1, rotation: 2.4 },
  { position: [-2300, 260, 700], scale: 1800, color: '#ff7ad9', opacity: 0.07, rotation: 4.4 },
]

export function Nebula() {
  const groupRef = useRef<THREE.Group>(null)
  const reducedMotion = useSimStore((s) => s.reducedMotion)
  const textures = getSceneTextures()

  const sprites = useMemo(() => CLOUDS.map((cloud) => ({ ...cloud })), [])

  useFrame((state) => {
    if (!groupRef.current || reducedMotion) return
    const t = state.clock.elapsedTime * 0.02
    groupRef.current.children.forEach((child, index) => {
      child.position.y += Math.sin(t + index) * 0.03
      child.rotation.z = sprites[index].rotation + Math.sin(t * 0.6 + index) * 0.03
    })
  })

  return (
    <group ref={groupRef}>
      {sprites.map((cloud, index) => (
        <sprite key={index} position={cloud.position} scale={cloud.scale}>
          <spriteMaterial
            map={textures.nebula}
            color={cloud.color}
            transparent
            opacity={cloud.opacity}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            rotation={cloud.rotation}
          />
        </sprite>
      ))}
    </group>
  )
}
