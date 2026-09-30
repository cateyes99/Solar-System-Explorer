import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimStore } from '../../store/simulationStore'
import { getSceneTextures } from '../../utils/sceneTextures'

/**
 * A tiny spacecraft that occasionally drifts across the scene —
 * one of the app's quiet easter eggs.
 */

const START = new THREE.Vector3(-520, 60, 420)
const END = new THREE.Vector3(520, -30, -460)

export function PassingCraft() {
  const groupRef = useRef<THREE.Group>(null)
  const trailRef = useRef<THREE.Mesh>(null)
  const textures = getSceneTextures()
  const reducedMotion = useSimStore((s) => s.reducedMotion)

  const state = useRef({ wait: 22, progress: 0, active: false, side: 1 })

  useFrame((_, delta) => {
    if (reducedMotion || !groupRef.current) return
    const dt = Math.min(delta, 0.1)
    const s = state.current

    if (!s.active) {
      s.wait -= dt
      if (s.wait <= 0) {
        s.active = true
        s.progress = 0
        s.side *= -1
        groupRef.current.visible = true
      }
      return
    }

    s.progress += dt / 16 // ~16 seconds to cross
    const t = s.progress
    groupRef.current.position.lerpVectors(START, END, t)
    groupRef.current.position.y += Math.sin(t * Math.PI * 3) * 26
    if (s.side < 0) groupRef.current.position.x = -groupRef.current.position.x

    // Face the direction of travel
    groupRef.current.lookAt(END.x * s.side, END.y, END.z)

    if (trailRef.current) {
      const material = trailRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.5 * Math.sin(t * Math.PI)
      const pulse = 1 + Math.sin(performance.now() * 0.02) * 0.15
      trailRef.current.scale.set(pulse, 1, pulse)
    }

    if (s.progress >= 1) {
      s.active = false
      s.wait = 35 + Math.random() * 60
      groupRef.current.visible = false
    }
  })

  return (
    <group ref={groupRef} visible={false} raycast={() => {}}>
      <mesh rotation={[Math.PI / 2, 0, 0]}>
        <capsuleGeometry args={[0.35, 1.6, 4, 10]} />
        <meshStandardMaterial color="#e8eefc" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh ref={trailRef} position={[0, 0, 1.6]}>
        <sphereGeometry args={[0.5, 12, 10]} />
        <meshBasicMaterial color="#7cc4ff" transparent opacity={0.5} depthWrite={false} />
      </mesh>
      <sprite scale={9}>
        <spriteMaterial
          map={textures.glow}
          transparent
          opacity={0.35}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
    </group>
  )
}
