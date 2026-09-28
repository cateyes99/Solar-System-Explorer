import { useEffect, useState } from 'react'
import { spacecraft } from '../utils/spacecraftSim'
import type { MissionReadout } from '../utils/spacecraftSim'
import { kmPerUnit } from '../utils/scale'
import { useSimulationStore } from '../store/simulationStore'

/**
 * Live Mission Control telemetry.
 *
 * The flight model updates every frame, but the HUD only needs a few updates a
 * second, so we sample it on a timer instead of re-rendering React 60 times.
 */
export function useMissionReadout(intervalMs = 200): MissionReadout {
  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const customScale = useSimulationStore((state) => state.customScale)
  const [readout, setReadout] = useState<MissionReadout>(() => spacecraft.readout(kmPerUnit(scaleMode, customScale)))

  useEffect(() => {
    const id = window.setInterval(() => {
      setReadout(spacecraft.readout(kmPerUnit(scaleMode, customScale)))
    }, intervalMs)
    return () => window.clearInterval(id)
  }, [intervalMs, scaleMode, customScale])

  return readout
}