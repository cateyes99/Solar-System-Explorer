import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createGlowSpriteTexture } from '../../utils/textures'
import { useSimulationStore } from '../../store/simulationStore'

const NEBULA_CONFIG = [
  { color: '#4b2f8f', position: [-260, 70, -420] as const, scale: 460 },
  { color: '#1f4f8f', position: [300, -90, -480] as const, scale: 560 },
  { color: '#7a2f6f', position: [-160, -160, -340] as const, scale: 360 },
  { color: '#2f6f7a', position: [220, 140, -520] as const, scale: 420 },
]

/** Soft, distant colored glows for a subtle nebula backdrop. Purely decorative. */
export function Nebula() {
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)
  const groupRef = useRef<THREE.Group>(null)
  const textures = useMemo(() => NEBULA_CONFIG.map((cfg) => createGlowSpriteTexture(cfg.color)), [])

  useEffect(() => {
    return () => textures.forEach((tex) => tex.dispose())
  }, [textures])

  useFrame((_, delta) => {
    if (reducedMotion || !groupRef.current) return
    groupRef.current.rotation.y += delta * 0.002
  })

  return (
    <group ref={groupRef}>
      {NEBULA_CONFIG.map((cfg, i) => (
        <sprite key={cfg.color} position={cfg.position} scale={cfg.scale}>
          <spriteMaterial
            map={textures[i]}
            transparent
            opacity={0.3}
            depthWrite={false}
            blending={THREE.AdditiveBlending}
            fog={false}
          />
        </sprite>
      ))}
    </group>
  )
}
