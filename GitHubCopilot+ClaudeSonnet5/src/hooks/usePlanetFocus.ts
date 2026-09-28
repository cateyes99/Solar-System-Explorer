import { useMemo } from 'react'
import { useSimulationStore } from '../store/simulationStore'
import { getPlanet } from '../data/planets'
import { planetSceneRadius, sunSceneRadius, moonSceneRadius } from '../utils/scale'
import { getBody } from '../utils/bodyRegistry'

/**
 * Bridges the store's `selectedId` to the live 3D object the camera should
 * track, plus a radius-appropriate viewing distance for the focus animation.
 */
export function usePlanetFocus() {
  const selectedId = useSimulationStore((s) => s.selectedId)
  const scaleMode = useSimulationStore((s) => s.scaleMode)
  const customScale = useSimulationStore((s) => s.customScale)

  const focusRadius = useMemo(() => {
    if (!selectedId) return 0
    if (selectedId === 'sun') return sunSceneRadius(scaleMode, customScale)
    if (selectedId === 'moon') return moonSceneRadius(planetSceneRadius(getPlanet('earth'), scaleMode, customScale))
    return planetSceneRadius(getPlanet(selectedId), scaleMode, customScale)
  }, [selectedId, scaleMode, customScale])

  return {
    selectedId,
    focusRadius,
    getFocusObject: () => getBody(selectedId),
  }
}
