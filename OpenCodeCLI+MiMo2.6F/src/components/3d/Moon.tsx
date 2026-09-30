import { useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimStore } from '../../store/simulationStore'
import { useScale } from '../../hooks/useScale'
import { getSceneTextures } from '../../utils/sceneTextures'
import { bodyPositions, simClock } from '../../utils/simClock'
import { playBlip } from '../../utils/audio'

/** Moon orbit phase offset (radians) at J2000. */
const PHASE_OFFSET = 0.8
const MOON_PERIOD_DAYS = 27.32

function moonAngle(days: number): number {
  return PHASE_OFFSET + (days / MOON_PERIOD_DAYS) * Math.PI * 2
}

/** Shared helper: world position of Earth's Moon at a moment in simulated time. */
export function computeMoonOffset(days: number, orbitRadius: number, out: THREE.Vector3): THREE.Vector3 {
  const angle = moonAngle(days)
  return out.set(Math.cos(angle) * orbitRadius, 0, Math.sin(angle) * orbitRadius)
}

export function Moon() {
  const scale = useScale()
  const textures = getSceneTextures()
  const store = useSimStore
  const reducedMotion = useSimStore((s) => s.reducedMotion)
  const secondMoon = useSimStore((s) => s.whatIf.secondMoon)

  const groupRef = useRef<THREE.Group>(null)
  const spinRef = useRef<THREE.Mesh>(null)
  const secondRef = useRef<THREE.Group>(null)

  const radius = Math.max(0.1, scale.planetRadius(3_475))
  const orbitRadius = Math.max(scale.moonOrbit, radius * 2.4)

  useFrame(() => {
    const earth = bodyPositions.earth
    const angle = moonAngle(simClock.days)

    if (groupRef.current) {
      groupRef.current.position.set(
        earth.x + Math.cos(angle) * orbitRadius,
        0,
        earth.z + Math.sin(angle) * orbitRadius,
      )
      // Tidally locked: keep the same face pointing at Earth
      if (spinRef.current) spinRef.current.rotation.y = reducedMotion ? 0 : Math.PI - angle
      bodyPositions.moon.copy(groupRef.current.position)
    }

    if (secondRef.current) {
      const a2 = -0.6 - (simClock.days / 9.4) * Math.PI * 2
      const r2 = orbitRadius * 1.85
      secondRef.current.position.set(
        earth.x + Math.cos(a2) * r2,
        Math.sin(a2 * 0.5) * orbitRadius * 0.35,
        earth.z + Math.sin(a2) * r2,
      )
      secondRef.current.scale.setScalar(radius * 0.7)
    }
  })

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    store.getState().focusBody('moon')
    playBlip(620, 0.09)
  }

  return (
    <>
      <group ref={groupRef}>
        <mesh
          ref={spinRef}
          scale={radius}
          onClick={handleClick}
          onDoubleClick={(event) => {
            event.stopPropagation()
            store.getState().followBody('moon')
          }}
          onPointerOver={(event) => {
            event.stopPropagation()
            store.getState().setHovered('moon')
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            store.getState().setHovered(null)
            document.body.style.cursor = ''
          }}
        >
          <sphereGeometry args={[1, 40, 28]} />
          <meshStandardMaterial map={textures.moon} roughness={1} metalness={0} />
        </mesh>
      </group>

      {/* "What if Earth had two moons?" simulation */}
      <group ref={secondRef} visible={secondMoon}>
        <mesh raycast={() => {}}>
          <sphereGeometry args={[1, 32, 24]} />
          <meshStandardMaterial map={textures.moon} color="#d8cfc4" roughness={1} />
        </mesh>
        <mesh scale={1.09} raycast={() => {}}>
          <sphereGeometry args={[1, 24, 18]} />
          <meshBasicMaterial color="#9ad7ff" transparent opacity={0.16} side={THREE.BackSide} />
        </mesh>
      </group>
    </>
  )
}
