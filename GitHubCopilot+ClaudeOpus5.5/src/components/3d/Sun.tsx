import { Billboard } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useCallback, useEffect, useMemo, useRef } from 'react'
import {
  AdditiveBlending,
  Color,
  MeshBasicMaterial,
  PlaneGeometry,
  Quaternion,
  TorusGeometry,
  Vector3,
  type Group,
  type Mesh,
  type PointLight,
} from 'three'
import { createCoronaMaterial, createSunMaterial } from '../../graphics/materials'
import { mulberry32 } from '../../graphics/noise'
import { bodyObjects, layoutState, sunGoneState } from '../../store/runtime'
import { useSimulationStore } from '../../store/simulationStore'
import { UP, getSphere, hitMaterial } from './shared'
import { useBodyInteraction } from './useBodyInteraction'

const CLICKS_FOR_FLARE = 5
const CLICK_WINDOW_MS = 3000
const FLARE_SECONDS = 4.5
const PROMINENCE_COUNT = 4

interface Prominence {
  quaternion: Quaternion
  position: Vector3
  period: number
  offset: number
  size: number
}

function createProminences(): Prominence[] {
  const random = mulberry32(7)
  return Array.from({ length: PROMINENCE_COUNT }, () => {
    const dir = new Vector3(random() * 2 - 1, (random() * 2 - 1) * 0.6, random() * 2 - 1).normalize()
    const q = new Quaternion().setFromUnitVectors(UP, dir)
    q.multiply(new Quaternion().setFromAxisAngle(UP, random() * Math.PI))
    return { quaternion: q, position: dir.multiplyScalar(0.97), period: 7 + random() * 6, offset: random() * 10, size: 0.09 + random() * 0.08 }
  })
}

export function Sun() {
  const groupRef = useRef<Group>(null)
  const bodyRef = useRef<Group>(null)
  const coronaRef = useRef<Mesh>(null)
  const lightRef = useRef<PointLight>(null)
  const hitRef = useRef<Mesh>(null)
  const flareRef = useRef<Group>(null)
  const shockRef = useRef<Mesh>(null)
  const prominenceRefs = useRef<(Mesh | null)[]>([])
  const fade = useRef(1)
  const highlight = useRef(0)
  const flareStart = useRef(-100)
  const clicks = useRef<number[]>([])
  const flareNonce = useSimulationStore((s) => s.solarFlareNonce)

  const sunMaterial = useMemo(() => createSunMaterial(), [])
  const coronaMaterial = useMemo(() => createCoronaMaterial(), [])
  const coronaGeometry = useMemo(() => new PlaneGeometry(1, 1), [])
  const prominences = useMemo(() => createProminences(), [])
  const arcGeometry = useMemo(() => new TorusGeometry(1, 0.11, 8, 40, Math.PI), [])
  const arcMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color(1.7, 0.38, 0.06),
        transparent: true,
        opacity: 0.8,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )
  const shockMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color(2.5, 1.4, 0.6),
        transparent: true,
        opacity: 0,
        blending: AdditiveBlending,
        depthWrite: false,
        toneMapped: false,
      }),
    [],
  )
  const shockGeometry = useMemo(() => new TorusGeometry(1, 0.015, 6, 96), [])

  useEffect(
    () => () => {
      sunMaterial.dispose()
      coronaMaterial.dispose()
      coronaGeometry.dispose()
      arcGeometry.dispose()
      arcMaterial.dispose()
      shockMaterial.dispose()
      shockGeometry.dispose()
    },
    [sunMaterial, coronaMaterial, coronaGeometry, arcGeometry, arcMaterial, shockMaterial, shockGeometry],
  )

  useEffect(() => {
    const group = groupRef.current
    if (group) bodyObjects.set('sun', group)
    return () => {
      bodyObjects.delete('sun')
    }
  }, [])

  useEffect(() => {
    if (flareNonce > 0) flareStart.current = performance.now() / 1000
  }, [flareNonce])

  const handleSunClick = useCallback(() => {
    const now = performance.now()
    clicks.current = [...clicks.current.filter((t) => now - t < CLICK_WINDOW_MS), now]
    if (clicks.current.length >= CLICKS_FOR_FLARE) {
      clicks.current = []
      useSimulationStore.getState().triggerSolarFlare()
      return true
    }
    return false
  }, [])
  const interaction = useBodyInteraction('sun', handleSunClick)

  useFrame((state, delta) => {
    const s = useSimulationStore.getState()
    const dt = Math.min(delta, 0.1)
    const r = layoutState.current.radius.sun
    const now = performance.now() / 1000
    const motion = s.reducedMotion ? 0.25 : 1

    fade.current += ((sunGoneState.active ? 0 : 1) - fade.current) * Math.min(1, dt * 3)
    const flareT = (now - flareStart.current) / FLARE_SECONDS
    const flare = flareT >= 0 && flareT < 1 ? Math.sin(flareT * Math.PI) : 0
    highlight.current += ((s.hoveredId === 'sun' ? 1 : 0) - highlight.current) * Math.min(1, dt * 8)

    sunMaterial.uniforms.uTime.value += dt * motion
    sunMaterial.uniforms.uFade.value = fade.current
    sunMaterial.uniforms.uFlare.value = flare
    sunMaterial.uniforms.uHighlight.value = highlight.current
    coronaMaterial.uniforms.uTime.value += dt * motion
    coronaMaterial.uniforms.uIntensity.value = fade.current * (1 + flare * 1.4 + highlight.current * 0.2)

    if (bodyRef.current) bodyRef.current.scale.setScalar(r * Math.max(fade.current, 0.001))
    if (coronaRef.current) coronaRef.current.scale.setScalar(r * 8 * (1 + flare * 0.25))
    if (lightRef.current) lightRef.current.intensity = 3.6 * fade.current
    if (hitRef.current) hitRef.current.scale.setScalar(Math.max(r, state.camera.position.length() * 0.02))

    prominences.forEach((p, i) => {
      const mesh = prominenceRefs.current[i]
      if (!mesh) return
      const phase = ((now * motion + p.offset) % p.period) / p.period
      const life = Math.sin(Math.min(phase / 0.7, 1) * Math.PI)
      mesh.scale.setScalar(p.size * (0.35 + 0.85 * life))
      mesh.visible = life > 0.02 && fade.current > 0.05
    })
    arcMaterial.opacity = 0.6 * fade.current

    if (flareRef.current) {
      flareRef.current.visible = flare > 0
      flareRef.current.scale.setScalar(0.3 + Math.min(flareT, 1) * 0.5)
    }
    if (shockRef.current) {
      shockRef.current.visible = flare > 0
      shockRef.current.scale.setScalar(r * (1.1 + Math.max(flareT, 0) * 3.5))
      shockMaterial.opacity = flare > 0 ? (1 - flareT) * 0.6 : 0
      shockRef.current.quaternion.copy(state.camera.quaternion)
    }
  })

  return (
    <group ref={groupRef}>
      <group ref={bodyRef}>
        <mesh geometry={getSphere(64)} material={sunMaterial} />
        {prominences.map((p, i) => (
          <mesh
            key={i}
            ref={(m) => {
              prominenceRefs.current[i] = m
            }}
            geometry={arcGeometry}
            material={arcMaterial}
            position={p.position}
            quaternion={p.quaternion}
          />
        ))}
        <group ref={flareRef} position={[0.55, 0.75, 0.3]} visible={false}>
          <mesh geometry={arcGeometry} material={arcMaterial} rotation={[0.3, 0.2, -0.6]} />
          <mesh geometry={arcGeometry} material={arcMaterial} rotation={[0.1, 0.9, -0.4]} scale={0.7} />
        </group>
      </group>
      <Billboard>
        <mesh ref={coronaRef} geometry={coronaGeometry} material={coronaMaterial} renderOrder={-1} />
      </Billboard>
      <mesh ref={shockRef} geometry={shockGeometry} material={shockMaterial} visible={false} />
      <pointLight ref={lightRef} intensity={3.6} decay={0} distance={0} color="#fff3e0" />
      <ambientLight intensity={0.06} />
      <mesh ref={hitRef} geometry={getSphere(16)} material={hitMaterial} {...interaction} />
    </group>
  )
}
