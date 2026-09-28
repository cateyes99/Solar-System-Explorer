import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSimulationStore } from '../../store/simulationStore'
import { TOUR_STAGES } from '../../data/tour'
import { audio } from '../../utils/audio'

/**
 * Runs the Cinematic Tour.
 *
 * Each stage flies the camera to a target, sets the simulation speed and the
 * scale mode the narration needs, and then simply waits its turn. Pausing,
 * skipping and exiting are all handled through the store, so the controls in the
 * overlay drive this component without any direct coupling.
 */
export function TourDirector() {
  const active = useSimulationStore((state) => state.cinematic.active)
  const paused = useSimulationStore((state) => state.cinematic.paused)
  const stageIndex = useSimulationStore((state) => state.cinematic.stageIndex)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  const elapsed = useRef(0)
  const appliedStage = useRef(-1)

  useEffect(() => {
    if (!active) {
      appliedStage.current = -1
      elapsed.current = 0
      return
    }
    // Only apply a stage once, even if unrelated state changes re-run this.
    if (appliedStage.current === stageIndex) return
    appliedStage.current = stageIndex
    elapsed.current = 0

    const stage = TOUR_STAGES[stageIndex]
    if (!stage) return
    const store = useSimulationStore.getState()

    if (stage.apply?.daysPerSecond !== undefined) store.setDaysPerSecond(stage.apply.daysPerSecond)
    if (stage.apply?.scaleMode) store.setScaleMode(stage.apply.scaleMode)
    if (stage.apply?.showOrbitFlow !== undefined) store.setShowOrbitFlow(stage.apply.showOrbitFlow)
    if (stage.apply?.showAsteroidBelt !== undefined && store.showAsteroidBelt !== stage.apply.showAsteroidBelt) {
      store.toggleAsteroidBelt()
    }

    audio.play('whoosh')
    if (stage.targetId) {
      store.focusBody(stage.targetId, 'cinematic', stage.distanceScale)
    } else {
      store.resetView()
      store.setCameraMode('cinematic')
    }
  }, [active, stageIndex])

  useFrame((_, delta) => {
    if (!active || paused) return
    const stage = TOUR_STAGES[stageIndex]
    if (!stage) return
    elapsed.current += delta
    // Reduced-motion visitors still get the tour, just at a brisker pace.
    const duration = reducedMotion ? stage.duration * 0.65 : stage.duration
    if (elapsed.current < duration) return

    const store = useSimulationStore.getState()
    if (stageIndex >= TOUR_STAGES.length - 1) {
      store.exitTour()
      store.showToast('Tour complete! Where would you like to explore next?', 'info')
    } else {
      store.setTourStage(stageIndex + 1)
    }
  })

  return null
}