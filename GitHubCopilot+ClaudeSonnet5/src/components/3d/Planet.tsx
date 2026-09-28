import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { Planet as PlanetData } from '../../data/planets'
import { useSimulationStore } from '../../store/simulationStore'
import type { OrbitLayout } from '../../utils/scale'
import { orbitalAngle, orbitPosition, rotationAngle } from '../../utils/astronomy'
import { registerBody } from '../../utils/bodyRegistry'
import { createCloudTexture, createPlanetTexture, createRingTexture, hashSeed } from '../../utils/textures'
import { Orbit } from './Orbit'
import { AtmosphereGlow } from './AtmosphereGlow'
import { PlanetLabel } from './PlanetLabel'

const ATMOSPHERE_CONFIG: Partial<Record<PlanetData['id'], { color: string; intensity: number }>> = {
  venus: { color: '#e8cf9a', intensity: 0.55 },
  earth: { color: '#5fb0ff', intensity: 0.9 },
  mars: { color: '#e0836a', intensity: 0.25 },
  jupiter: { color: '#e8cba8', intensity: 0.35 },
  saturn: { color: '#e3cf9d', intensity: 0.3 },
  uranus: { color: '#a6e3e0', intensity: 0.45 },
  neptune: { color: '#5f80ef', intensity: 0.5 },
}

function useRingGeometry(innerRadius: number, outerRadius: number) {
  return useMemo(() => {
    const geometry = new THREE.RingGeometry(innerRadius, outerRadius, 128, 1)
    const position = geometry.attributes.position
    const uv = geometry.attributes.uv
    const point = new THREE.Vector3()
    for (let i = 0; i < position.count; i++) {
      point.fromBufferAttribute(position, i)
      const radius = Math.sqrt(point.x * point.x + point.y * point.y)
      const t = (radius - innerRadius) / (outerRadius - innerRadius)
      const angle = Math.atan2(point.y, point.x)
      uv.setXY(i, (angle / (Math.PI * 2) + 0.5) * 8, t)
    }
    return geometry
  }, [innerRadius, outerRadius])
}

function PlanetRings({ radius, color }: { radius: number; color: string }) {
  const innerRadius = radius * 1.35
  const outerRadius = radius * 2.4
  const geometry = useRingGeometry(innerRadius, outerRadius)
  const texture = useMemo(() => createRingTexture(color, hashSeed(color)), [color])

  useEffect(
    () => () => {
      texture.dispose()
      geometry.dispose()
    },
    [texture, geometry],
  )

  return (
    <mesh geometry={geometry} rotation={[-Math.PI / 2, 0, 0]}>
      <meshStandardMaterial
        map={texture}
        transparent
        side={THREE.DoubleSide}
        roughness={0.9}
        metalness={0.05}
        alphaTest={0.02}
      />
    </mesh>
  )
}

function CloudLayer({ radius }: { radius: number }) {
  const meshRef = useRef<THREE.Mesh>(null)
  const texture = useMemo(() => createCloudTexture(hashSeed('earth-clouds')), [])
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)

  useEffect(() => () => texture.dispose(), [texture])

  useFrame((_, delta) => {
    if (meshRef.current) meshRef.current.rotation.y += delta * (reducedMotion ? 0.01 : 0.045)
  })

  return (
    <mesh ref={meshRef} scale={1.015}>
      <sphereGeometry args={[radius, 48, 48]} />
      <meshStandardMaterial map={texture} transparent depthWrite={false} roughness={1} />
    </mesh>
  )
}

interface PlanetProps {
  planet: PlanetData
  layout: OrbitLayout
}

/** A single orbiting, rotating, interactive planet with a procedurally textured surface. */
export function Planet({ planet, layout }: PlanetProps) {
  const orbitGroupRef = useRef<THREE.Group>(null)
  const meshRef = useRef<THREE.Mesh>(null)

  const hoveredId = useSimulationStore((s) => s.hoveredId)
  const selectedId = useSimulationStore((s) => s.selectedId)
  const showLabels = useSimulationStore((s) => s.showLabels)
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)
  const earthAsJupiter = useSimulationStore((s) => s.whatIf.earthAsJupiter)
  const stoppedRotation = useSimulationStore((s) => s.whatIf.stoppedRotation)
  const select = useSimulationStore((s) => s.select)
  const hover = useSimulationStore((s) => s.hover)
  const showToast = useSimulationStore((s) => s.showToast)

  const entry = layout.get(planet.id)
  const jupiterEntry = layout.get('jupiter')
  const baseRadius = entry?.radius ?? 1
  const orbitDistance = entry?.orbitDistance ?? 10
  const radius = planet.id === 'earth' && earthAsJupiter && jupiterEntry ? jupiterEntry.radius : baseRadius

  const texture = useMemo(() => createPlanetTexture(planet), [planet])
  useEffect(() => () => texture.dispose(), [texture])

  const phaseOffset = useMemo(() => ((hashSeed(planet.id) % 1000) / 1000) * Math.PI * 2, [planet.id])

  useEffect(() => {
    registerBody(planet.id, orbitGroupRef.current)
    return () => registerBody(planet.id, null)
  }, [planet.id])

  useFrame(() => {
    const simTimeDays = useSimulationStore.getState().simTimeDays
    const angle = orbitalAngle(simTimeDays, planet.orbitalPeriodDays, phaseOffset)
    const [x, y, z] = orbitPosition(orbitDistance, angle, 0)
    if (orbitGroupRef.current) orbitGroupRef.current.position.set(x, y, z)

    const isEarthStopped = planet.id === 'earth' && stoppedRotation
    if (meshRef.current && !isEarthStopped) {
      meshRef.current.rotation.y = rotationAngle(simTimeDays, planet.rotationPeriodHours, phaseOffset)
    }
  })

  const isHovered = hoveredId === planet.id
  const isSelected = selectedId === planet.id
  const hoverScale = reducedMotion ? 1 : isHovered || isSelected ? 1.07 : 1
  const atmosphere = ATMOSPHERE_CONFIG[planet.id]

  return (
    <group>
      <Orbit radius={orbitDistance} />
      <group ref={orbitGroupRef}>
        <group rotation={[0, 0, THREE.MathUtils.degToRad(planet.axialTiltDeg)]}>
          <mesh
            ref={meshRef}
            scale={hoverScale}
            onPointerOver={(event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation()
              hover(planet.id)
              document.body.style.cursor = 'pointer'
            }}
            onPointerOut={(event: ThreeEvent<PointerEvent>) => {
              event.stopPropagation()
              hover(null)
              document.body.style.cursor = 'auto'
            }}
            onClick={(event: ThreeEvent<MouseEvent>) => {
              event.stopPropagation()
              select(planet.id)
              if (planet.id === 'earth') showToast('Hello, Earth! \ud83c\udf0d')
            }}
          >
            <sphereGeometry args={[radius, 64, 64]} />
            <meshStandardMaterial map={texture} roughness={0.85} metalness={0.05} />
          </mesh>

          {planet.id === 'earth' && !earthAsJupiter && <CloudLayer radius={radius} />}
          {planet.hasRings && <PlanetRings radius={radius} color={planet.ringColor ?? planet.color} />}
        </group>

        {atmosphere && <AtmosphereGlow radius={radius} color={atmosphere.color} intensity={atmosphere.intensity} />}

        <PlanetLabel
          name={planet.name}
          targetRef={orbitGroupRef}
          visible={showLabels || isHovered}
          emphasize={isHovered || isSelected}
          offset={[0, radius * 1.5 + 0.4, 0]}
        />
      </group>
    </group>
  )
}
