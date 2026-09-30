import { useMemo } from 'react'
import { useSimStore } from '../store/simulationStore'
import { getScaleConfig, type ScaleConfig } from '../utils/scale'

/** Memoised scale configuration driven by the user's selected scale mode. */
export function useScale(): ScaleConfig {
  const mode = useSimStore((s) => s.scaleMode)
  const custom = useSimStore((s) => s.customScale)
  return useMemo(() => getScaleConfig(mode, custom), [mode, custom])
}
