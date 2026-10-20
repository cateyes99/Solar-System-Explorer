import { useCallback } from 'react'
import type { BodyId } from '../data/types'
import { useSimulationStore, type CameraMode } from '../store/simulationStore'

/** Camera helpers shared by the planet list, info panel and view buttons. */
export function usePlanetFocus() {
  const selectedId = useSimulationStore((s) => s.selectedId)
  const cameraMode = useSimulationStore((s) => s.camera.mode)
  const cameraTarget = useSimulationStore((s) => s.camera.targetId)

  const focus = useCallback((id: BodyId) => {
    const s = useSimulationStore.getState()
    s.viewBody(id)
    s.select(id)
  }, [])

  const follow = useCallback((id: BodyId) => {
    const s = useSimulationStore.getState()
    s.followBody(id)
    s.select(id)
  }, [])

  const isActive = useCallback(
    (mode: CameraMode, id?: BodyId | null) => cameraMode === mode && (id === undefined || cameraTarget === id),
    [cameraMode, cameraTarget],
  )

  return { selectedId, cameraMode, cameraTarget, focus, follow, isActive }
}
