import { useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import * as THREE from 'three'
import type { Planet } from '../../data/planets'
import { planetTexture, cloudTexture, ringTexture } from '../../utils/textures'
import { orbitalPosition } from '../../utils/scale'
import { simClock } from '../../utils/clock'
import { useSimulationStore } from '../../store/simulationStore'

type Props = {
  planet: Planet
  radius: number
  orbitRadius: number
  phase: number
}

export function PlanetNode({ planet, radius, orbitRadius, phase }: Props) {
  const groupRef = useRef<THREE.Group>(null)
  const spinRef = useRef<THREE.Mesh>(null)
  const cloudRef = useRef<THREE.Mesh>(null)
  const highlightRef = useRef<THREE.Mesh>(null)

  const select = useSimulationStore((s) => s.select)
  const hover = useSimulationStore((s) => s.hover)
  const hoveredId = useSimulationStore((s) => s.hoveredId)
  const selectedId = useSimulationStore((s) => s.selectedPlanetId)
  const showLabels = useSimulationStore((s) => s.showLabels)
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)
  const setCameraMode = useSimulationStore((s) => s.setCameraMode)
  const cameraMode = useSimulationStore((s) => s.cameraMode)

  const isEarth = planet.id === 'earth'
  const isSaturn = planet.id === 'saturn'
  const isUranus = planet.id === 'uranus'

  const tex = useMemo(() => planetTexture(planet.id, planet.color), [planet.id, planet.color])
  const clouds = useMemo(() => (isEarth ? cloudTexture() : null), [isEarth])
  const rings = useMemo(() => (isSaturn ? ringTexture() : null), [isSaturn])

  const atmosphereColor = useMemo(() => {
    switch (planet.id) {
      case 'earth': return '#5aa0ff'
      case 'venus': return '#e8d9a0'
      case 'jupiter': case 'saturn': return '#e8c9a0'
      case 'uranus': return '#a8e8ee'
      case 'neptune': return '#5a7aff'
      case 'mars': return '#d4704a'
      default: return null
    }
  }, [planet.id])

  const hovered = hoveredId === planet.id
  const selected = selectedId === planet.id

  useFrame(() => {
    const g = groupRef.current
    if (!g) return
    const [x, y, z] = orbitalPosition(orbitRadius, planet.orbitalPeriodDays, simClock.days, phase)
    g.position.set(x, y, z)
    if (spinRef.current) {
      // rotation period in hours → visual spin (heavily compressed, purely illustrative)
      const spinSpeed = (Math.PI * 2) / Math.max(2, Math.abs(planet.rotationPeriodHours)) * 8
      const dir = planet.rotationPeriodHours < 0 ? -1 : 1
      spinRef.current.rotation.y = dir * simClock.days * spinSpeed
    }
    if (cloudRef.current) cloudRef.current.rotation.y = simClock.days * 0.35
    if (highlightRef.current) {
      const mat = highlightRef.current.material as THREE.MeshBasicMaterial
      const target = hovered || selected ? 0.35 : 0
      mat.opacity += (target - mat.opacity) * 0.15
      highlightRef.current.scale.setScalar(hovered ? 1.12 : 1.06)
    }
  })

  const onClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    select(planet.id)
    if (planet.id === 'earth') useSimulationStore.setState({}) // "Hello, Earth!" handled in UI
  }
  const onDoubleClick = (e: ThreeEvent<MouseEvent>) => {
    e.stopPropagation()
    select(planet.id)
    setCameraMode('follow')
    void cameraMode
  }

  return (
    <group ref={groupRef}>
      {/* axial tilt for Uranus is extreme */}
      <group rotation={[isUranus ? THREE.MathUtils.degToRad(97.8) : 0, 0, planet.id === 'venus' ? Math.PI : 0]}>
        <mesh
          ref={spinRef}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
          onPointerOver={(e) => { e.stopPropagation(); hover(planet.id); document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { hover(null); document.body.style.cursor = 'default' }}
        >
          <sphereGeometry args={[radius, 40, 40]} />
          <meshStandardMaterial map={tex} roughness={planet.type === 'Gas giant' || planet.type === 'Ice giant' ? 0.7 : 0.95} metalness={0.05} />
        </mesh>

        {/* hover / selection highlight */}
        <mesh ref={highlightRef}>
          <sphereGeometry args={[radius * 1.06, 24, 24]} />
          <meshBasicMaterial color="#7ad8ff" transparent opacity={0} blending={THREE.AdditiveBlending} depthWrite={false} />
        </mesh>

        {/* atmosphere glow */}
        {atmosphereColor && (
          <mesh>
            <sphereGeometry args={[radius * 1.045, 32, 32]} />
            <meshBasicMaterial color={atmosphereColor} transparent opacity={isEarth ? 0.16 : 0.1} blending={THREE.AdditiveBlending} depthWrite={false} side={THREE.BackSide} />
          </mesh>
        )}

        {/* Earth clouds */}
        {clouds && (
          <mesh ref={cloudRef}>
            <sphereGeometry args={[radius * 1.02, 32, 32]} />
            <meshStandardMaterial map={clouds} transparent opacity={0.55} depthWrite={false} />
          </mesh>
        )}

        {/* Saturn rings */}
        {rings && (
          <mesh rotation={[-Math.PI / 2.35, 0, 0]}>
            <ringGeometry args={[radius * 1.35, radius * 2.35, 96]} />
            <meshBasicMaterial map={rings} transparent side={THREE.DoubleSide} depthWrite={false} />
          </mesh>
        )}

        {/* Earth's Moon */}
        {isEarth && <Moon planetRadius={radius} reducedMotion={reducedMotion} />}
      </group>

      {showLabels && (
        <Html
          position={[0, radius + 1.6, 0]}
          center
          distanceFactor={180}
          occlude={false}
          style={{ pointerEvents: 'none', transition: 'opacity 0.3s' }}
          zIndexRange={[10, 0]}
        >
          <div className={`planet-label ${selected ? 'selected' : ''}`}>{planet.name}</div>
        </Html>
      )}
    </group>
  )
}

function Moon({ planetRadius, reducedMotion }: { planetRadius: number; reducedMotion: boolean }) {
  const ref = useRef<THREE.Group>(null)
  const moonDistance = planetRadius + 2.2
  useFrame(() => {
    if (!ref.current) return
    const angle = reducedMotion ? 0.8 : simClock.days * ((Math.PI * 2) / 27.3)
    ref.current.position.set(Math.cos(angle) * moonDistance, 0, Math.sin(angle) * moonDistance)
  })
  return (
    <group ref={ref}>
      <mesh>
        <sphereGeometry args={[planetRadius * 0.28, 20, 20]} />
        <meshStandardMaterial color="#b8b8b8" roughness={1} />
      </mesh>
    </group>
  )
}
