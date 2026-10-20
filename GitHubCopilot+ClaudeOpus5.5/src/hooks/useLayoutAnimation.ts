import { useFrame } from '@react-three/fiber'
import { useEffect } from 'react'
import { PLANET_IDS } from '../data/planets'
import type { BodyId } from '../data/types'
import { layoutState } from '../store/runtime'
import { useSimulationStore } from '../store/simulationStore'
import { computeLayout } from '../utils/scale'

const BODY_KEYS: BodyId[] = ['sun', ...PLANET_IDS, 'moon']

/** Smoothly animates sizes and distances whenever the scale mode or a What-If changes the layout. */
export function useLayoutAnimation(): void {
  const scaleMode = useSimulationStore((s) => s.scaleMode)
  const customScale = useSimulationStore((s) => s.customScale)
  const whatIf = useSimulationStore((s) => s.whatIf)

  useEffect(() => {
    layoutState.target = computeLayout(scaleMode, customScale, { earthMatchesJupiter: whatIf === 'big-earth' })
  }, [scaleMode, customScale, whatIf])

  useFrame((_, delta) => {
    const { current, target } = layoutState
    const reduced = useSimulationStore.getState().reducedMotion
    const k = reduced ? 1 : 1 - Math.exp(-Math.min(delta, 0.1) * 2.6)
    const step = (a: number, b: number) => (Math.abs(b - a) < 1e-4 ? b : a + (b - a) * k)
    for (const id of BODY_KEYS) current.radius[id] = step(current.radius[id], target.radius[id])
    for (const id of PLANET_IDS) current.orbit[id] = step(current.orbit[id], target.orbit[id])
    current.moonOrbit = step(current.moonOrbit, target.moonOrbit)
    current.beltInner = step(current.beltInner, target.beltInner)
    current.beltOuter = step(current.beltOuter, target.beltOuter)
    current.outerEdge = step(current.outerEdge, target.outerEdge)
  }, -2)
}
