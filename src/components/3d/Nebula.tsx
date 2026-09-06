import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { getNebulaTexture } from '../../utils/textures'
import { useSimulation } from '../../store/simulationStore'

interface NebulaSpec {
  position: [number, number, number]
  scale: number
  rotation: number
  seed: number
  colorA: string
  colorB: string
}

const NEBULAE: NebulaSpec[] = [
  {
    position: [-320, 90, -260],
    scale: 470,
    rotation: 0.4,
    seed: 11,
    colorA: 'rgba(64,52,160,ALPHA)',
    colorB: 'rgba(38,90,190,ALPHA)',
  },
  {
    position: [300, -60, -340],
    scale: 530,
    rotation: 2.1,
    seed: 22,
    colorA: 'rgba(120,44,150,ALPHA)',
    colorB: 'rgba(40,120,150,ALPHA)',
  },
  {
    position: [-180, -120, 380],
    scale: 430,
    rotation: 4.0,
    seed: 33,
    colorA: 'rgba(30,110,140,ALPHA)',
    colorB: 'rgba(90,50,160,ALPHA)',
  },
  {
    position: [260, 140, 300],
    scale: 390,
    rotation: 5.2,
    seed: 44,
    colorA: 'rgba(70,40,150,ALPHA)',
    colorB: 'rgba(20,80,170,ALPHA)',
  },
]

/** Very subtle, slow-drifting nebula clouds in the far background. */
export function Nebula(): JSX.Element {
  const group = useRef<THREE.Group>(null)
  const materials = useMemo(
    () =>
      NEBULAE.map(
        (n) =>
          new THREE.SpriteMaterial({
            map: getNebulaTexture(n.seed, n.colorA, n.colorB),
            transparent: true,
            opacity: 0.55,
            depthWrite: false,
            blending: THREE.AdditiveBlending,
            rotation: n.rotation,
          }),
      ),
    [],
  )

  useFrame(() => {
    if (useSimulation.getState().reduceMotion) return
    if (group.current) group.current.rotation.y += 0.00012
  })

  return (
    <group ref={group}>
      {NEBULAE.map((n, i) => (
        <sprite key={n.seed} position={n.position} scale={n.scale} material={materials[i]} />
      ))}
    </group>
  )
}
