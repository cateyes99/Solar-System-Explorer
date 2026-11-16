import { useSimulationStore } from '../../store/simulationStore'
import type { CameraMode, FocusTargetId } from '../../types'

/**
 * Focuses a body the way a pointer click or drag-release does — unless the
 * viewer is holding Alt.
 *
 * Releasing a click or drag on a body normally flies the camera out to a framing
 * distance, which throws away a close-up. That is most painful on Earth in Solo
 * Earth mode, where the whole point is to study the surface: a tiny drag would
 * fling the view back out. Holding Alt keeps the camera exactly where it is while
 * the body is still selected by the caller.
 *
 * Only the on-screen bodies use this. Deliberate camera moves — the cinematic
 * tour, the quick-travel strip, the lesson buttons — call `focusBody` directly
 * and are never affected.
 */
export function focusBodyOnPointer(
  event: { altKey?: boolean },
  id: FocusTargetId,
  mode: CameraMode,
  distanceScale: number,
): void {
  if (event.altKey) return
  useSimulationStore.getState().focusBody(id, mode, distanceScale)
}
