import { useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimStore } from '../../store/simulationStore'
import { getSceneTextures } from '../../utils/sceneTextures'
import { simClock } from '../../utils/simClock'
import { playBlip } from '../../utils/audio'

/**
 * A hidden periodic comet on a strongly elliptical path.
 * The tail always points away from the Sun and grows as it approaches.
 */

// Orbit defined directly in world units so it fits the Educational scale.
const SEMI_MAJOR = 175
const ECCENTRICITY = 0.905 // perihelion ≈ 16.6, aphelion ≈ 333
const PERIOD_DAYS = 2100 // ~5.7 Earth years — frequent visits
const INCLINATION = 0.22

function cometPosition(days: number, out: THREE.Vector3): THREE.Vector3 {
  const meanAnomaly = ((days / PERIOD_DAYS) * Math.PI * 2 + 1.4) % (Math.PI * 2)
  let eccentricAnomaly = meanAnomaly
  for (let i = 0; i < 6; i++) {
    eccentricAnomaly -=
      (eccentricAnomaly - ECCENTRICITY * Math.sin(eccentricAnomaly) - meanAnomaly) /
      (1 - ECCENTRICITY * Math.cos(eccentricAnomaly))
  }
  const xp = SEMI_MAJOR * (Math.cos(eccentricAnomaly) - ECCENTRICITY)
  const zp = SEMI_MAJOR * Math.sqrt(1 - ECCENTRICITY * ECCENTRICITY) * Math.sin(eccentricAnomaly)
  // Rotate the ellipse and tip it slightly out of the ecliptic
  const x = xp * Math.cos(0.7) - zp * Math.sin(0.7)
  const z = xp * Math.sin(0.7) + zp * Math.cos(0.7)
  return out.set(x, z * Math.sin(INCLINATION), z * Math.cos(INCLINATION))
}

export function Comet() {
  const store = useSimStore
  const textures = getSceneTextures()
  const reducedMotion = useSimStore((s) => s.reducedMotion)

  const groupRef = useRef<THREE.Group>(null)
  const nucleusRef = useRef<THREE.Mesh>(null)
  const ionRef = useRef<THREE.Mesh>(null)
  const dustRef = useRef<THREE.Mesh>(null)

  const position = useMemo(() => new THREE.Vector3(), [])
  const away = useMemo(() => new THREE.Vector3(), [])
  const up = useMemo(() => new THREE.Vector3(0, 1, 0), [])
  const quaternion = useMemo(() => new THREE.Quaternion(), [])

  const ionGeometry = useMemo(() => new THREE.ConeGeometry(1.6, 10, 14, 1, true), [])
  const dustGeometry = useMemo(() => new THREE.ConeGeometry(3.4, 6.5, 14, 1, true), [])
  useMemo(() => void ionGeometry, [])

  useFrame(() => {
    if (!groupRef.current) return
    cometPosition(simClock.days, position)
    groupRef.current.position.copy(position)

    // Distance to the Sun decides how long the tail gets
    const distance = position.length()
    const activity = THREE.MathUtils.clamp(1 - (distance - 16) / 240, 0, 1)
    const pulse = reducedMotion ? 1 : 0.85 + Math.sin(simClock.days * 0.08) * 0.15

    // Tail points directly away from the Sun
    away.copy(position).normalize()
    quaternion.setFromUnitVectors(up, away)

    if (ionRef.current) {
      ionRef.current.quaternion.copy(quaternion)
      const length = (14 + activity * 46) * pulse
      ionRef.current.scale.set(0.6 + activity, length, 0.6 + activity)
      ionRef.current.position.copy(away).multiplyScalar(length * 0.5)
      const material = ionRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.05 + activity * 0.32
    }
    if (dustRef.current) {
      dustRef.current.quaternion.copy(quaternion)
      dustRef.current.rotateZ(0.5)
      const length = (8 + activity * 26) * pulse
      dustRef.current.scale.set(0.7 + activity, length, 0.7 + activity)
      dustRef.current.position.copy(away).multiplyScalar(length * 0.42)
      const material = dustRef.current.material as THREE.MeshBasicMaterial
      material.opacity = 0.04 + activity * 0.2
    }
    if (nucleusRef.current) {
      const glow = 1 + activity * 0.6
      nucleusRef.current.scale.setScalar(glow)
    }
  })

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    playBlip(1200, 0.16, 0.06)
    store
      .getState()
      .showToast('You found the comet! Its tail always points away from the Sun.', 'fun')
  }

  return (
    <group ref={groupRef}>
      <mesh
        ref={nucleusRef}
        onClick={handleClick}
        onPointerOver={(event) => {
          event.stopPropagation()
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          document.body.style.cursor = ''
        }}
      >
        <sphereGeometry args={[1.1, 20, 14]} />
        <meshStandardMaterial color="#dfefff" emissive="#9fd8ff" emissiveIntensity={0.9} roughness={0.8} />
      </mesh>

      <sprite scale={7}>
        <spriteMaterial
          map={textures.glow}
          transparent
          opacity={0.5}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      <mesh ref={ionRef} geometry={ionGeometry} raycast={() => {}}>
        <meshBasicMaterial
          color="#8fdcff"
          transparent
          opacity={0.3}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
      <mesh ref={dustRef} geometry={dustGeometry} raycast={() => {}}>
        <meshBasicMaterial
          color="#ffd9a8"
          transparent
          opacity={0.16}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          side={THREE.DoubleSide}
        />
      </mesh>
    </group>
  )
}
