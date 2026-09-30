import { useEffect, useRef } from 'react'
import { TOUR_STAGES } from '../data/tour'
import { useAppStore } from '../store/useAppStore'
import { spaceAudio } from '../utils/audio'

/**
 * Drives the cinematic tour: advances the stage after its scripted duration.
 *
 * When the reduced-motion preference is on, stages never auto-advance — the
 * child steps through them deliberately instead of being flown past.
 */
export function useTourDriver(): void {
  const tourActive = useAppStore((s) => s.tourActive)
  const tourPaused = useAppStore((s) => s.tourPaused)
  const tourStage = useAppStore((s) => s.tourStage)
  const reducedMotion = useAppStore((s) => s.reducedMotion)
  const setTourStage = useAppStore((s) => s.setTourStage)
  const exitTour = useAppStore((s) => s.exitTour)

  const elapsed = useRef(0)

  useEffect(() => {
    elapsed.current = 0
  }, [tourStage])

  useEffect(() => {
    if (!tourActive) return
    spaceAudio.play('whoosh')
  }, [tourActive])

  useEffect(() => {
    if (!tourActive || tourPaused || reducedMotion) return
    const stage = TOUR_STAGES[Math.min(tourStage, TOUR_STAGES.length - 1)]

    const id = window.setInterval(() => {
      elapsed.current += 250
      if (elapsed.current < stage.duration * 1000) return
      elapsed.current = 0
      if (tourStage >= TOUR_STAGES.length - 1) exitTour()
      else setTourStage(tourStage + 1)
    }, 250)

    return () => window.clearInterval(id)
  }, [tourActive, tourPaused, reducedMotion, tourStage, setTourStage, exitTour])
}