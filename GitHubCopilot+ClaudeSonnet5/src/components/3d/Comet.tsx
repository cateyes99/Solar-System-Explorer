import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimulationStore } from '../../store/simulationStore'
import { createGlowSpriteTexture } from '../../utils/textures'

interface CometConfig {
  id: string
  semiLatusRectum: number
  eccentricity: number
  inclination: number
  angularMomentum: number
  color: string
  phaseOffset: number
}

const COMETS: CometConfig[] = [
  {
    id: 'comet-aurelia',
    semiLatusRectum: 14,
    eccentricity: 0.78,
    inclination: 0.35,
    angularMomentum: 165,
    color: '#bcd9ff',
    phaseOffset: 0.6,
  },
  {
    id: 'comet-borealis',
    semiLatusRectum: 22,
    eccentricity: 0.7,
    inclination: -0.22,
    angularMomentum: 210,
    color: '#d8f7e8',
    phaseOffset: 3.4,
  },
]

function CometBody({ config }: { config: CometConfig }) {
  const { semiLatusRectum, eccentricity, inclination, angularMomentum, color, phaseOffset } = config
  const groupRef = useRef<THREE.Group>(null)
  const tailRef = useRef<THREE.Sprite>(null)
  const angleRef = useRef(phaseOffset)
  const prevSimDaysRef = useRef<number | null>(null)
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)

  const nucleusGeometry = useMemo(() => new THREE.IcosahedronGeometry(0.32, 1), [])
  const nucleusMaterial = useMemo(
    () => new THREE.MeshStandardMaterial({ color: '#dfe7f0', roughness: 0.6, emissive: '#5f7590', emissiveIntensity: 0.2 }),
    [],
  )
  const tailTexture = useMemo(() => createGlowSpriteTexture(color), [color])

  useEffect(
    () => () => {
      nucleusGeometry.dispose()
      nucleusMaterial.dispose()
      tailTexture.dispose()
    },
    [nucleusGeometry, nucleusMaterial, tailTexture],
  )

  useFrame(() => {
    const simTimeDays = useSimulationStore.getState().simTimeDays
    if (prevSimDaysRef.current === null) prevSimDaysRef.current = simTimeDays
    const deltaDays = simTimeDays - prevSimDaysRef.current
    prevSimDaysRef.current = simTimeDays

    const angle = angleRef.current
    const r = semiLatusRectum / (1 + eccentricity * Math.cos(angle))
    const angularRate = angularMomentum / (r * r)
    const deltaAngle = THREE.MathUtils.clamp(deltaDays * angularRate, -0.4, 0.4)
    angleRef.current += deltaAngle

    const newR = semiLatusRectum / (1 + eccentricity * Math.cos(angleRef.current))
    const x = Math.cos(angleRef.current) * newR
    const z = Math.sin(angleRef.current) * newR
    const y = Math.sin(angleRef.current) * newR * Math.sin(inclination)

    if (groupRef.current) {
      groupRef.current.position.set(x, y, z)
      groupRef.current.lookAt(0, 0, 0)
    }
    if (tailRef.current && !reducedMotion) {
      const distanceFromSun = newR
      const stretch = THREE.MathUtils.clamp(1.8 - distanceFromSun / semiLatusRectum, 0.6, 2.6)
      tailRef.current.scale.set(0.9, 3 * stretch, 1)
    }
  })

  return (
    <group ref={groupRef}>
      <mesh geometry={nucleusGeometry} material={nucleusMaterial} />
      <sprite ref={tailRef} position={[0, 0, 1.3]} scale={[0.9, 3, 1]}>
        <spriteMaterial map={tailTexture} transparent opacity={0.6} depthWrite={false} blending={THREE.AdditiveBlending} />
      </sprite>
    </group>
  )
}

/** A couple of icy wanderers on eccentric orbits, tails always streaming away from the Sun. */
export function Comets() {
  return (
    <>
      {COMETS.map((config) => (
        <CometBody key={config.id} config={config} />
      ))}
    </>
  )
}
