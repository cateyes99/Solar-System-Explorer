import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Line } from '@react-three/drei'
import { Color, Group, MeshStandardMaterial, SphereGeometry, Vector3 } from 'three'
import type { MoonDef } from '../../types'
import { getMoonGreyTexture } from '../../utils/textures'
import { bodyPosition, setBodyRadius } from '../../store/registry'
import { simClock } from '../../store/clock'
import { useAppStore } from '../../store/useAppStore'
import { clamp, degToRad } from '../../utils/math'
import { moonRadiusUnits } from '../../utils/scale'

/** Moons are given a pleasant on-screen period instead of their true one. */
function visualOrbitSeconds(realPeriodDays: number): number {
  return clamp(realPeriodDays * 1.2, 7, 48)
}

/**
 * Moons sit inside their planet's tilted frame, so Earth's Moon really does
 * ride along with Earth's 23.4° axial tilt. Their periods are compressed for
 * the screen; the Moon Phases lesson shows the real thing.
 */
export function Moons({
  moons,
  parentRadius,
  parentDiameterKm,
}: {
  moons: MoonDef[]
  parentRadius: number
  parentDiameterKm: number
}) {
  const orbitRadius = parentRadius * 4.5

  return (
    <group>
      {moons.map((moon, index) => (
        <MoonOrbit
          key={moon.id}
          moon={moon}
          index={index}
          orbitRadius={orbitRadius}
          parentRadius={parentRadius}
          parentDiameterKm={parentDiameterKm}
        />
      ))}
    </group>
  )
}

function MoonOrbit({
  moon,
  index,
  orbitRadius,
  parentRadius,
  parentDiameterKm,
}: {
  moon: MoonDef
  index: number
  orbitRadius: number
  parentRadius: number
  parentDiameterKm: number
}) {
  const holderRef = useRef<Group>(null)
  const spinRef = useRef<Group>(null)
  const elapsed = useRef(0)

  const hoveredId = useAppStore((s) => s.hoveredId)
  const setHovered = useAppStore((s) => s.setHovered)
  const reducedMotion = useAppStore((s) => s.reducedMotion)

  const radius = useMemo(
    () => moonRadiusUnits(moon.diameterKm, parentDiameterKm, parentRadius),
    [moon.diameterKm, parentDiameterKm, parentRadius],
  )

  const geometry = useMemo(() => new SphereGeometry(radius, 28, 20), [radius])
  const texture = useMemo(() => getMoonGreyTexture(moon.id), [moon.id])
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        map: texture,
        roughness: 0.95,
        metalness: 0,
        color: new Color(moon.color).multiplyScalar(1.15),
      }),
    [texture, moon.color],
  )

  const orbitPoints = useMemo(() => {
    const points: [number, number, number][] = []
    for (let i = 0; i <= 96; i += 1) {
      const a = (i / 96) * Math.PI * 2
      points.push([Math.cos(a) * orbitRadius, 0, Math.sin(a) * orbitRadius])
    }
    return points
  }, [orbitRadius])

  useEffect(() => {
    setBodyRadius(moon.id, radius)
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [moon.id, radius, geometry, material])

  const local = useMemo(() => new Vector3(), [])
  const world = useMemo(() => new Vector3(), [])
  const period = useMemo(() => visualOrbitSeconds(moon.orbitalPeriodDays), [moon.orbitalPeriodDays])

  useFrame((_, delta) => {
    const holder = holderRef.current
    if (!holder) return
    if (simClock.running) elapsed.current += delta * (reducedMotion ? 0.4 : 1)

    const angle = ((elapsed.current / period + moon.phase / (Math.PI * 2)) % 1) * Math.PI * 2
    local.set(Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius)
    holder.position.copy(local)

    // Moons are tidally locked: they always show the same face to the parent.
    if (spinRef.current) spinRef.current.rotation.y = -angle + Math.PI

    holder.getWorldPosition(world)
    bodyPosition(moon.id).copy(world)
  })

  const hovered = hoveredId === moon.id

  return (
    <group rotation={[degToRad(5 + index * 4), 0, 0]}>
      <Line points={orbitPoints} color="#93b8ff" lineWidth={1} transparent opacity={0.2} depthWrite={false} />
      <group ref={holderRef}>
        <group ref={spinRef}>
          <mesh
            geometry={geometry}
            material={material}
            scale={hovered ? 1.3 : 1}
            onPointerOver={(event) => {
              event.stopPropagation()
              setHovered(moon.id, { x: event.clientX, y: event.clientY })
            }}
            onPointerOut={() => setHovered(null)}
          />
        </group>
      </group>
    </group>
  )
}