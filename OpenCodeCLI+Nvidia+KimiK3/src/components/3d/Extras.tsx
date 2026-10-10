import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { simClock } from '../../utils/clock'
import { useSimulationStore } from '../../store/simulationStore'

/** A tiny comet with a glowing tail that occasionally sweeps through the scene. */
export function Comet() {
  const ref = useRef<THREE.Group>(null)
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)
  const periodDays = 90

  useFrame(() => {
    if (!ref.current || reducedMotion) return
    const a = (simClock.days / periodDays) * Math.PI * 2
    // highly elliptical-looking path
    const r = 60 + 40 * Math.sin(a)
    ref.current.position.set(Math.cos(a) * r, 14 * Math.sin(a * 2), Math.sin(a) * r)
    ref.current.lookAt(0, 0, 0)
  })

  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[0.5, 12, 12]} />
        <meshBasicMaterial color="#dff3ff" />
      </mesh>
      <mesh position={[0, 0, 2.4]}>
        <coneGeometry args={[0.55, 5, 12, 1, true]} />
        <meshBasicMaterial color="#9fd0ff" transparent opacity={0.25} blending={THREE.AdditiveBlending} depthWrite={false} />
      </mesh>
    </group>
  )
}

/** Simple WASD/arrow-key flyable spacecraft. */
export function Spacecraft({ active }: { active: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const vel = useRef(new THREE.Vector3())
  const keys = useRef<Record<string, boolean>>({})

  useMemo(() => {
    const down = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = true }
    const up = (e: KeyboardEvent) => { keys.current[e.key.toLowerCase()] = false }
    window.addEventListener('keydown', down)
    window.addEventListener('keyup', up)
    return () => {
      window.removeEventListener('keydown', down)
      window.removeEventListener('keyup', up)
    }
  }, [])

  useFrame((state, delta) => {
    const g = ref.current
    if (!g || !active) return
    const d = Math.min(delta, 0.1)
    const accel = 60
    const forward = new THREE.Vector3()
    state.camera.getWorldDirection(forward)
    const right = new THREE.Vector3().crossVectors(forward, new THREE.Vector3(0, 1, 0)).normalize()

    if (keys.current['w'] || keys.current['arrowup']) vel.current.addScaledVector(forward, accel * d)
    if (keys.current['s'] || keys.current['arrowdown']) vel.current.addScaledVector(forward, -accel * d)
    if (keys.current['a'] || keys.current['arrowleft']) vel.current.addScaledVector(right, -accel * d)
    if (keys.current['d'] || keys.current['arrowright']) vel.current.addScaledVector(right, accel * d)
    if (keys.current[' ']) vel.current.multiplyScalar(0.9) // brake

    vel.current.multiplyScalar(0.985)
    if (vel.current.length() > 120) vel.current.setLength(120)
    g.position.addScaledVector(vel.current, d)
    if (vel.current.lengthSq() > 0.01) {
      const look = g.position.clone().add(vel.current)
      g.lookAt(look)
    }
    const speedEl = document.getElementById('ship-speed')
    if (speedEl) speedEl.textContent = `${vel.current.length().toFixed(0)} u/s`
    const distEl = document.getElementById('ship-dist')
    if (distEl) distEl.textContent = `${g.position.length().toFixed(0)} units`
  })

  if (!active) return null
  return (
    <group ref={ref} position={[30, 8, 30]}>
      <mesh>
        <coneGeometry args={[0.6, 2.2, 8]} />
        <meshStandardMaterial color="#cfd8e8" metalness={0.6} roughness={0.3} />
      </mesh>
      <pointLight intensity={4} distance={8} color="#7ad8ff" />
    </group>
  )
}
