import { useRef, useState } from 'react'
import { Html } from './HtmlLabel'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Group } from 'three'
import { EASTER_EGG_FACTS } from '../../data/facts'
import { useSimulationStore } from '../../store/simulationStore'
import { simulationClock } from '../../utils/simulationClock'

export function Comet() {
  const comet = useRef<Group>(null)
  const probe = useRef<Group>(null)
  const [hovered, setHovered] = useState(false)
  const showToast = useSimulationStore((state) => state.showToast)

  useFrame(({ clock }) => {
    const angle = simulationClock.days / 1450 + 1.4
    if (comet.current) {
      comet.current.position.set(Math.cos(angle) * 74, Math.sin(angle * 0.7) * 14, Math.sin(angle) * 38)
      comet.current.lookAt(0, 0, 0)
    }
    if (probe.current) {
      const probeAngle = clock.elapsedTime * 0.018 + 3
      probe.current.position.set(Math.cos(probeAngle) * 35, 8 + Math.sin(probeAngle * 2) * 3, Math.sin(probeAngle) * 35)
      probe.current.rotation.y = -probeAngle
    }
  })

  return (
    <>
      <group ref={comet} scale={0.75}>
        <mesh
          onClick={(event) => { event.stopPropagation(); showToast(EASTER_EGG_FACTS[0]) }}
          onPointerOver={(event) => { event.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
          onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
        >
          <icosahedronGeometry args={[0.23, 1]} />
          <meshStandardMaterial color="#c8edf1" emissive="#69b7c9" emissiveIntensity={1.3} roughness={0.85} />
        </mesh>
        <mesh position={[0, 0, -2.2]} rotation={[-Math.PI / 2, 0, 0]} raycast={() => null}>
          <coneGeometry args={[0.24, 4.5, 12, 1, true]} />
          <meshBasicMaterial color="#80d8ee" transparent opacity={0.13} blending={AdditiveBlending} depthWrite={false} side={2} />
        </mesh>
        <pointLight color="#8bdef1" intensity={0.7} distance={3} />
        {hovered && <Html center position={[0, 1, 0]} style={{ pointerEvents: 'none' }}><div className="planet-tooltip"><strong>Nomad comet</strong><span>You found a hidden traveler!</span></div></Html>}
      </group>
      <group
        ref={probe}
        scale={0.12}
        onClick={(event) => { event.stopPropagation(); showToast(EASTER_EGG_FACTS[3], 'rocket') }}
      >
        <mesh><boxGeometry args={[1, 0.7, 1.4]} /><meshStandardMaterial color="#d8b76d" metalness={0.7} roughness={0.4} /></mesh>
        <mesh position={[1.5, 0, 0]}><boxGeometry args={[2, 0.06, 1]} /><meshStandardMaterial color="#315fa1" emissive="#153767" emissiveIntensity={0.4} /></mesh>
        <mesh position={[-1.5, 0, 0]}><boxGeometry args={[2, 0.06, 1]} /><meshStandardMaterial color="#315fa1" emissive="#153767" emissiveIntensity={0.4} /></mesh>
      </group>
    </>
  )
}
