import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { MeshStandardMaterial, Sprite, Vector3, type Group, type Mesh } from 'three'
import { createGlowMaterial } from '../../graphics/materials'
import { layoutState } from '../../store/runtime'
import { useSimulationStore } from '../../store/simulationStore'
import { TAU } from '../../utils/astronomy'
import { getSphere, hitMaterial } from './shared'

const FLIGHT_SECONDS = 32
const from = new Vector3()
const to = new Vector3()

/** Every so often a tiny space probe drifts across the inner Solar System. */
export function PassingProbe() {
  const groupRef = useRef<Group>(null)
  const hitRef = useRef<Mesh>(null)
  const state = useRef({ active: false, start: 0, nextAt: performance.now() / 1000 + 35 })
  const bodyMaterial = useMemo(() => new MeshStandardMaterial({ color: '#d9dde4', metalness: 0.7, roughness: 0.35 }), [])
  const dishMaterial = useMemo(() => new MeshStandardMaterial({ color: '#f5f1e6', metalness: 0.2, roughness: 0.6 }), [])
  const beacon = useMemo(() => new Sprite(createGlowMaterial('#ff6b6b', 1)), [])

  useEffect(
    () => () => {
      bodyMaterial.dispose()
      dishMaterial.dispose()
      beacon.material.dispose()
    },
    [bodyMaterial, dishMaterial, beacon],
  )

  useFrame(({ camera }) => {
    const group = groupRef.current
    if (!group) return
    const now = performance.now() / 1000
    const st = state.current
    if (!st.active) {
      group.visible = false
      if (now < st.nextAt || useSimulationStore.getState().appMode === 'tour') return
      const radius = layoutState.current.orbit.jupiter
      const angle = Math.random() * TAU
      const height = (Math.random() - 0.3) * radius * 0.25
      from.set(Math.cos(angle) * radius, height, Math.sin(angle) * radius)
      const exitAngle = angle + Math.PI + (Math.random() - 0.5) * 1.2
      to.set(Math.cos(exitAngle) * radius, -height * 0.5 + 6, Math.sin(exitAngle) * radius)
      st.active = true
      st.start = now
    }
    const t = (now - st.start) / FLIGHT_SECONDS
    if (t >= 1) {
      st.active = false
      st.nextAt = now + 60 + Math.random() * 60
      group.visible = false
      return
    }
    group.visible = true
    group.position.lerpVectors(from, to, t)
    group.lookAt(to)
    const distance = camera.position.distanceTo(group.position)
    const blink = Math.sin(now * 5) > 0.55 ? 1 : 0.2
    beacon.material.opacity = blink
    beacon.scale.setScalar(Math.max(0.25, distance * 0.012))
    if (hitRef.current) hitRef.current.scale.setScalar(Math.max(0.6, distance * 0.025))
  })

  return (
    <group ref={groupRef} visible={false}>
      <mesh material={bodyMaterial} scale={[0.12, 0.08, 0.16]} geometry={getSphere(12)} />
      <mesh material={dishMaterial} position={[0, 0.1, 0]} rotation={[Math.PI / 2, 0, 0]} scale={[0.16, 0.16, 0.03]} geometry={getSphere(16)} />
      <mesh material={bodyMaterial} position={[0.25, 0, 0]} scale={[0.22, 0.01, 0.06]} geometry={getSphere(8)} />
      <primitive object={beacon} position={[0, 0.02, -0.12]} />
      <mesh
        ref={hitRef}
        geometry={getSphere(8)}
        material={hitMaterial}
        onClick={(e) => {
          e.stopPropagation()
          if (e.delta > 6) return
          useSimulationStore
            .getState()
            .discover(
              'probe',
              'You spotted a space probe!',
              'Real probes like Voyager 1 and 2 flew past the giant planets and are now travelling between the stars.',
            )
        }}
        onPointerOver={(e) => {
          e.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = ''
        }}
      />
    </group>
  )
}
