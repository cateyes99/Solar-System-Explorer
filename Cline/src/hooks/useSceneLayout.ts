import { useMemo } from 'react'
import { useSimulation } from '../store/simulationStore'
import { getLayout } from '../utils/scale'
import type { SceneLayout } from '../utils/scale'

/** Memoized scene layout for the current scale mode (recomputed only when it changes). */
export function useSceneLayout(): SceneLayout {
  const scaleMode = useSimulation((s) => s.scaleMode)
  const customScale = useSimulation((s) => s.customScale)
  return useMemo(() => getLayout(scaleMode, customScale), [scaleMode, customScale])
}
