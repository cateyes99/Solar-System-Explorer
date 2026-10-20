import { useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame, useThree } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { PLANETS } from '../../data/planets'
import { useSimulation } from '../../store/simulationStore'
import { useSceneLayout } from '../../hooks/useSceneLayout'
import { getBodyObject } from '../../utils/registry'
import type { BodyId } from '../../types'

interface LabelSpec {
  id: BodyId
  name: string
}

const SPECS: LabelSpec[] = [
  { id: 'sun', name: 'The Sun' },
  ...PLANETS.map((p) => ({ id: p.id as BodyId, name: p.name })),
  { id: 'moon', name: 'The Moon' },
]

const tmpVec = new THREE.Vector3()

function LabelItem({ spec }: { spec: LabelSpec }): JSX.Element {
  const group = useRef<THREE.Group>(null)
  const inner = useRef<HTMLDivElement>(null)
  const camera = useThree((s) => s.camera)
  const layout = useSceneLayout()
  const hovered = useSimulation((s) => s.hoveredBody === spec.id)
  const selected = useSimulation((s) => s.selectedBody === spec.id)

  const radius =
    spec.id === 'sun'
      ? layout.sunRadius
      : spec.id === 'moon'
        ? layout.moonRadius()
        : layout.planetRadius(spec.id as PlanetIdAlias)

  const style = useMemo(
    () => ({
      pointerEvents: 'auto' as const,
      transform: 'translateY(-190%)',
    }),
    [],
  )

  useFrame(() => {
    const obj = getBodyObject(spec.id)
    if (!group.current || !inner.current) return
    if (!obj) {
      inner.current.style.opacity = '0'
      return
    }
    obj.getWorldPosition(tmpVec)
    group.current.position.copy(tmpVec)
    const d = camera.position.distanceTo(tmpVec)
    const near = radius * 4 + 1.2
    let opacity = 1
    if (d < near) opacity = Math.max(0, (d - near * 0.55) / (near * 0.45))
    if (spec.id === 'moon' && d > 34) opacity = 0
    opacity *= 1 - THREE.MathUtils.smoothstep(d, 150, 210)
    inner.current.style.opacity = String(opacity)
  })

  return (
    <group ref={group}>
      <Html center style={style} zIndexRange={[30, 0]}>
        <div ref={inner} className="transition-opacity duration-300">
          <button
            type="button"
            onClick={() => useSimulation.getState().selectBody(spec.id)}
            className={`pointer-events-auto whitespace-nowrap rounded-full border px-2.5 py-0.5 font-display text-[10px] font-medium tracking-wider backdrop-blur-md transition-colors ${
              hovered || selected
                ? 'border-astro-cyan/60 bg-astro-cyan/15 text-astro-cyan'
                : 'border-white/15 bg-space-900/60 text-white/80 hover:border-white/40 hover:text-white'
            }`}
          >
            {spec.name}
          </button>
        </div>
      </Html>
    </group>
  )
}

type PlanetIdAlias = (typeof PLANETS)[number]['id']

/** Elegant floating labels that fade with camera distance. */
export function PlanetLabels(): JSX.Element {
  return (
    <group>
      {SPECS.map((spec) => (
        <LabelItem key={spec.id} spec={spec} />
      ))}
    </group>
  )
}
