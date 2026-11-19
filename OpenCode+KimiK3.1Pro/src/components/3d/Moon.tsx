import { useEffect, useMemo, useRef, useState } from 'react'
import { Html } from './HtmlLabel'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import { Group, MathUtils, Mesh } from 'three'
import { MOON } from '../../data/planets'
import { createPlanetTexture } from '../../graphics/proceduralTextures'
import { useSimulationStore } from '../../store/simulationStore'
import { registerBody } from '../../utils/bodyRegistry'
import { getOrbitalAngle } from '../../utils/simulationClock'
import { Orbit } from './Orbit'

interface MoonProps {
  giantEarth: boolean
  twoMoons: boolean
}

export function Moons({ giantEarth, twoMoons }: MoonProps) {
  const moonOrbit = giantEarth ? 4.5 : 2.05
  const moon = useRef<Group>(null)
  const secondMoon = useRef<Group>(null)
  const moonMesh = useRef<Mesh>(null)
  const [hovered, setHovered] = useState(false)
  const texture = useMemo(() => createPlanetTexture('moon'), [])
  const selected = useSimulationStore((state) => state.selectedBody === 'moon')
  const showLabels = useSimulationStore((state) => state.showLabels)
  const selectBody = useSimulationStore((state) => state.selectBody)

  useEffect(() => {
    if (moon.current) return registerBody('moon', moon.current)
  }, [])
  useEffect(() => () => texture.dispose(), [texture])

  useFrame((_, delta) => {
    const angle = getOrbitalAngle(MOON.orbitalPeriodDays, MOON.phase)
    if (moon.current) {
      moon.current.position.set(Math.cos(angle) * moonOrbit, Math.sin(angle * 0.7) * 0.15, Math.sin(angle) * moonOrbit)
      const size = MathUtils.damp(moon.current.scale.x, giantEarth ? 0.34 : 0.24, 4, delta)
      moon.current.scale.setScalar(size)
    }
    if (secondMoon.current) {
      const secondAngle = -angle * 0.72 + 2.8
      secondMoon.current.position.set(Math.cos(secondAngle) * (moonOrbit + 1.4), 0.45, Math.sin(secondAngle) * (moonOrbit + 1.4))
    }
    if (moonMesh.current) moonMesh.current.rotation.y = angle + Math.PI
  })

  const click = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    selectBody('moon')
  }

  return (
    <>
      <Orbit body={MOON} radius={moonOrbit} opacity={0.16} color="#c5d6df" />
      <group ref={moon} scale={0.24}>
        <mesh
          ref={moonMesh}
          onClick={click}
          onDoubleClick={(event) => { event.stopPropagation(); selectBody('moon', true) }}
          onPointerOver={(event) => { event.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
        >
          <sphereGeometry args={[1, 32, 24]} />
          <meshStandardMaterial map={texture} bumpMap={texture} bumpScale={0.045} roughness={1} />
        </mesh>
        {selected && (
          <mesh rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
            <ringGeometry args={[1.5, 1.57, 48]} />
            <meshBasicMaterial color="#e8f3ff" transparent opacity={0.7} />
          </mesh>
        )}
        {(hovered || showLabels) && (
          <Html center position={[0, 1.8, 0]} zIndexRange={[20, 0]} style={{ pointerEvents: 'none' }}>
            {hovered
              ? <div className="planet-tooltip"><strong>The Moon</strong><span>Earth’s natural satellite</span></div>
              : <div className="planet-label planet-label--small">MOON</div>}
          </Html>
        )}
      </group>
      {twoMoons && (
        <group ref={secondMoon} scale={0.18}>
          <mesh>
            <sphereGeometry args={[1, 24, 18]} />
            <meshStandardMaterial color="#c8a8de" roughness={0.9} emissive="#412e52" emissiveIntensity={0.15} />
          </mesh>
          <Html center position={[0, 2.4, 0]} style={{ pointerEvents: 'none' }}><div className="planet-label planet-label--small">LUNA II · HYPOTHETICAL</div></Html>
        </group>
      )}
    </>
  )
}
