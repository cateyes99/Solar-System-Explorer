import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useSimulation } from '../../store/simulationStore'
import { useSceneLayout } from '../../hooks/useSceneLayout'
import { useClickWithoutDrag } from '../../hooks/usePointerDragGuard'
import { DEG, TAU, moonAngle, orbitalPosition, totalDaysSinceJ2000 } from '../../utils/astronomy'
import { getPlanetTexture } from '../../utils/textures'
import { registerBody } from '../../utils/registry'
import { Orbit } from './Orbit'

interface MoonProps {
  parentRadius: number
}

/** Earth's Moon (tidally locked) plus the optional "What If?" second moon. */
export function Moon({ parentRadius }: MoonProps): JSX.Element {
  const layout = useSceneLayout()
  const guard = useClickWithoutDrag()
  const pivot = useRef<THREE.Group>(null)
  const mesh = useRef<THREE.Mesh>(null)
  const secondPivot = useRef<THREE.Group>(null)
  const unregister = useRef<() => void>(() => {})

  const twoMoons = useSimulation((s) => s.whatIf.twoMoons)
  const orbitR = layout.moonOrbitRadius(parentRadius)
  const radius = layout.moonRadius()
  const texture = useMemo(() => getPlanetTexture('moon'), [])

  useEffect(() => {
    if (pivot.current) unregister.current = registerBody('moon', pivot.current)
    return () => unregister.current()
  }, [])

  useFrame(() => {
    const angle = moonAngle()
    if (pivot.current) orbitalPosition(orbitR, angle, pivot.current.position)
    if (mesh.current) mesh.current.rotation.y = angle + Math.PI // tidally locked
    const angle2 = 140 * DEG + (TAU * totalDaysSinceJ2000()) / 45.1
    if (secondPivot.current) orbitalPosition(orbitR * 1.7, angle2, secondPivot.current.position)
  })

  return (
    <>
      <Orbit radius={orbitR} inclinationDeg={5.1} opacity={0.16} segments={96} />
      {twoMoons && (
        <Orbit radius={orbitR * 1.7} inclinationDeg={12} color="#d99a6c" opacity={0.14} segments={96} />
      )}
      <group ref={pivot}>
        <mesh
          ref={mesh}
          scale={radius}
          onPointerDown={guard.onPointerDown}
          onClick={(e) => {
            if (!guard.wasClick(e)) return
            e.stopPropagation()
            useSimulation.getState().selectBody('moon')
          }}
          onDoubleClick={(e) => {
            e.stopPropagation()
            useSimulation.getState().focusBody('moon', { follow: true })
          }}
          onPointerOver={(e) => {
            e.stopPropagation()
            useSimulation.getState().setHovered('moon')
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            useSimulation.getState().setHovered(null)
            document.body.style.cursor = ''
          }}
        >
          <sphereGeometry args={[1, 32, 24]} />
          <meshStandardMaterial map={texture} roughness={1} metalness={0} />
        </mesh>
      </group>
      <group ref={secondPivot} visible={twoMoons}>
        <mesh
          scale={radius * 0.55}
          onPointerDown={guard.onPointerDown}
          onClick={(e) => {
            if (!guard.wasClick(e)) return
            e.stopPropagation()
            const store = useSimulation.getState()
            store.selectBody('moon')
            store.pushToast('Mini Moon says hi! (A pretend moon — Earth only has one real one.)', '🪨')
          }}
        >
          <sphereGeometry args={[1, 24, 18]} />
          <meshStandardMaterial map={texture} color="#c98a5f" roughness={1} metalness={0} />
        </mesh>
      </group>
    </>
  )
}
