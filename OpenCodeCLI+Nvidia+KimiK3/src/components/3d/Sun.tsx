import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { sunTexture } from '../../utils/textures'
import { SUN_RADIUS } from '../../utils/scale'
import { useSimulationStore } from '../../store/simulationStore'

export function Sun() {
  const meshRef = useRef<THREE.Mesh>(null)
  const coronaRef = useRef<THREE.Mesh>(null)
  const flareRef = useRef<THREE.Mesh>(null)
  const tex = useMemo(() => sunTexture(), [])
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)
  const flareActive = useSimulationStore((s) => s.flareActive)
  const clickSun = useSimulationStore((s) => s.clickSun)
  const clearFlare = useSimulationStore((s) => s.clearFlare)
  const hover = useSimulationStore((s) => s.hover)
  const flareTime = useRef(0)

  useFrame((_, delta) => {
    if (meshRef.current && !reducedMotion) meshRef.current.rotation.y += delta * 0.02
    if (coronaRef.current) {
      const s = 1.18 + Math.sin(Date.now() * 0.0012) * 0.02
      coronaRef.current.scale.setScalar(s)
    }
    if (flareRef.current) {
      if (flareActive) {
        flareTime.current += delta
        const t = flareTime.current
        const s = 1 + Math.min(t, 1) * 0.9 + Math.sin(t * 10) * 0.08
        flareRef.current.scale.setScalar(s)
        const mat = flareRef.current.material as THREE.MeshBasicMaterial
        mat.opacity = Math.max(0, 0.55 - t * 0.12)
        if (t > 4.5) { flareTime.current = 0; clearFlare() }
      } else {
        flareRef.current.scale.setScalar(1)
        ;(flareRef.current.material as THREE.MeshBasicMaterial).opacity = 0
      }
    }
  })

  return (
    <group>
      {/* main light source of the system */}
      <pointLight intensity={1400} distance={0} decay={2} color="#fff2d8" />
      <ambientLight intensity={0.12} />

      <mesh
        ref={meshRef}
        onClick={(e) => { e.stopPropagation(); clickSun() }}
        onPointerOver={(e) => { e.stopPropagation(); hover('sun'); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { hover(null); document.body.style.cursor = 'default' }}
      >
        <sphereGeometry args={[SUN_RADIUS, 48, 48]} />
        <meshBasicMaterial map={tex} color="#ffca6a" toneMapped={false} />
      </mesh>

      {/* corona glow */}
      <mesh ref={coronaRef}>
        <sphereGeometry args={[SUN_RADIUS * 1.15, 32, 32]} />
        <meshBasicMaterial color="#ff9a2e" transparent opacity={0.22} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
      <mesh>
        <sphereGeometry args={[SUN_RADIUS * 1.6, 32, 32]} />
        <meshBasicMaterial color="#ff7a00" transparent opacity={0.07} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>

      {/* easter-egg solar flare */}
      <mesh ref={flareRef}>
        <sphereGeometry args={[SUN_RADIUS * 1.35, 32, 32]} />
        <meshBasicMaterial color="#ffd27a" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}
