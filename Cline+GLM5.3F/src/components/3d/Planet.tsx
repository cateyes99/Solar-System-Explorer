import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import type { PlanetData } from '../../types'
import { useSimulation } from '../../store/simulationStore'
import { useSceneLayout } from '../../hooks/useSceneLayout'
import { useClickWithoutDrag } from '../../hooks/usePointerDragGuard'
import { DEG, orbitalPosition, planetAngle, spinAngle } from '../../utils/astronomy'
import { getCloudTexture, getPlanetTexture, getRingTexture } from '../../utils/textures'
import { registerBody } from '../../utils/registry'
import { Atmosphere } from './Atmosphere'
import { Moon } from './Moon'

const ATMOSPHERES: Partial<
  Record<PlanetData['id'], { color: string; intensity: number; power: number }>
> = {
  venus: { color: '#e8d9a0', intensity: 0.55, power: 3.0 },
  earth: { color: '#5ab0ff', intensity: 0.95, power: 3.4 },
  mars: { color: '#ff8a5c', intensity: 0.3, power: 3.6 },
  jupiter: { color: '#d8a468', intensity: 0.35, power: 3.8 },
  saturn: { color: '#e0c894', intensity: 0.28, power: 3.8 },
  uranus: { color: '#9fe3e8', intensity: 0.35, power: 3.8 },
  neptune: { color: '#4a7bff', intensity: 0.45, power: 3.6 },
}

/** Maps the ring texture's u coordinate onto the radius of a RingGeometry. */
function makeRingGeometry(inner: number, outer: number): THREE.RingGeometry {
  const geom = new THREE.RingGeometry(inner, outer, 128, 1)
  const pos = geom.attributes.position
  const uv = geom.attributes.uv
  const v = new THREE.Vector3()
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i)
    const r = v.length()
    uv.setXY(i, (r - inner) / (outer - inner), 0.5)
  }
  return geom
}

interface PlanetProps {
  planet: PlanetData
}

export function Planet({ planet }: PlanetProps): JSX.Element {
  const layout = useSceneLayout()
  const guard = useClickWithoutDrag()
  const anchor = useRef<THREE.Group>(null)
  const surface = useRef<THREE.Mesh>(null)
  const clouds = useRef<THREE.Mesh>(null)
  const unregister = useRef<() => void>(() => {})

  const texture = useMemo(() => getPlanetTexture(planet.id), [planet.id])
  const cloudTexture = useMemo(() => (planet.id === 'earth' ? getCloudTexture() : null), [planet.id])
  const ringTexture = useMemo(
    () => (planet.id === 'saturn' || planet.id === 'uranus' ? getRingTexture() : null),
    [planet.id],
  )
  const ringGeometry = useMemo(() => {
    if (planet.id === 'saturn') return makeRingGeometry(1.38, 2.32)
    if (planet.id === 'uranus') return makeRingGeometry(1.55, 1.8)
    return null
  }, [planet.id])

  const hovered = useSimulation((s) => s.hoveredBody === planet.id)
  const selected = useSimulation((s) => s.selectedBody === planet.id)
  const bigEarth = useSimulation((s) => planet.id === 'earth' && s.whatIf.bigEarth)
  const stoppedSpin = useSimulation((s) => planet.id === 'earth' && s.whatIf.stoppedEarth)

  const baseRadius = layout.planetRadius(planet.id)
  const radius = bigEarth ? baseRadius * 3.05 : baseRadius
  const orbitR = layout.orbitRadius(planet.id)
  const atmosphere = ATMOSPHERES[planet.id]

  useEffect(() => {
    if (anchor.current) unregister.current = registerBody(planet.id, anchor.current)
    return () => {
      unregister.current()
      document.body.style.cursor = ''
    }
  }, [planet.id])

  // Scale-mode changes are rare; snap the emphasised scale immediately.
  useEffect(() => {
    surface.current?.scale.setScalar(radius)
    clouds.current?.scale.setScalar(radius * 1.025)
  }, [radius])

  useFrame((_, dt) => {
    const angle = planetAngle(planet.phase0Deg, planet.orbitalPeriodDays)
    if (anchor.current) orbitalPosition(orbitR, angle, anchor.current.position)
    if (surface.current) {
      if (!stoppedSpin) surface.current.rotation.y = spinAngle(planet.rotationPeriodHours)
      const emphasized = hovered || selected
      const target = radius * (emphasized ? 1.06 : 1)
      const s = THREE.MathUtils.damp(surface.current.scale.x, target, 8, dt)
      surface.current.scale.setScalar(s)
      if (clouds.current) clouds.current.scale.setScalar(s * 1.025)
    }
    // Clouds drift a little relative to the surface.
    if (clouds.current && !stoppedSpin) {
      clouds.current.rotation.y = spinAngle(planet.rotationPeriodHours * 0.92)
    }
  })

  const handleClick = (e: { clientX: number; clientY: number; stopPropagation: () => void }): void => {
    if (!guard.wasClick(e)) return
    e.stopPropagation()
    const store = useSimulation.getState()
    store.selectBody(planet.id)
    if (planet.id === 'earth') store.pushToast('Hello, Earth! 🌍 You live here!', '👋')
  }

  const handleDoubleClick = (e: { stopPropagation: () => void }): void => {
    e.stopPropagation()
    useSimulation.getState().focusBody(planet.id, { follow: true })
  }

  return (
    <group ref={anchor}>
      <group rotation={[0, 0, planet.axialTiltDeg * DEG]}>
        <mesh
          ref={surface}
          scale={radius}
          onPointerDown={guard.onPointerDown}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onPointerOver={(e) => {
            e.stopPropagation()
            useSimulation.getState().setHovered(planet.id)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            useSimulation.getState().setHovered(null)
            document.body.style.cursor = ''
          }}
        >
          <sphereGeometry args={[1, 48, 32]} />
          <meshStandardMaterial map={texture} roughness={0.92} metalness={0} />
        </mesh>
        {cloudTexture && (
          <mesh ref={clouds} scale={radius * 1.025}>
            <sphereGeometry args={[1, 48, 32]} />
            <meshStandardMaterial
              map={cloudTexture}
              transparent
              opacity={0.85}
              depthWrite={false}
              roughness={1}
            />
          </mesh>
        )}
        {ringGeometry && ringTexture && (
          <mesh
            geometry={ringGeometry}
            rotation={[Math.PI / 2, 0, 0]}
            onPointerDown={guard.onPointerDown}
            onClick={handleClick}
          >
            <meshStandardMaterial
              map={ringTexture}
              transparent
              side={THREE.DoubleSide}
              depthWrite={false}
              roughness={0.9}
              metalness={0}
              opacity={planet.id === 'uranus' ? 0.45 : 1}
            />
          </mesh>
        )}
        {atmosphere && (
          <Atmosphere
            radius={radius * 1.13}
            color={atmosphere.color}
            intensity={atmosphere.intensity}
            power={atmosphere.power}
          />
        )}
      </group>
      {planet.id === 'earth' && <Moon parentRadius={radius} />}
    </group>
  )
}
