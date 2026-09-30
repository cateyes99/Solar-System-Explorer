import { useEffect } from 'react'
import { useAppStore } from '../../../store/useAppStore'
import { useLessonStore } from '../../../store/useLessonStore'
import { bodyPosition, setBodyRadius } from '../../../store/registry'
import {
  DistancesLesson,
  EarthLessonScene,
  GravityLesson,
  MoonPhasesLesson,
  OrbitsLesson,
  SizesLesson,
  SunLesson,
} from './LessonScenes'

/** Where the camera should sit for each lesson, in world units. */
const FRAMING: Record<string, number> = {
  sun: 22,
  sizes: 30,
  distances: 26,
  gravity: 26,
  'day-night': 15,
  seasons: 24,
  'moon-phases': 15,
  orbits: 22,
}

/**
 * Routes to the right interactive lesson scene and points the shared camera rig
 * at it. Every lesson publishes a focus target so the existing camera rig —
 * with all its smoothing — keeps working unchanged.
 */
export function LessonScene() {
  const lessonId = useAppStore((s) => s.lessonId)

  const burst = useLessonStore((s) => s.burst)
  const pick = useLessonStore((s) => s.pick)
  const togglePick = useLessonStore((s) => s.togglePick)
  const mass = useLessonStore((s) => s.mass)
  const speedFactor = useLessonStore((s) => s.speedFactor)
  const seasonAngle = useLessonStore((s) => s.seasonAngle)
  const moonAngle = useLessonStore((s) => s.moonAngle)
  const orbitsPaused = useLessonStore((s) => s.orbitsPaused)

  useEffect(() => {
    if (!lessonId) return
    bodyPosition('lesson-focus').set(0, 0, 0)
    setBodyRadius('lesson-focus', 4)
    useAppStore.getState().setCameraOverride({
      id: 'lesson-focus',
      distance: FRAMING[lessonId] ?? 24,
    })
    return () => useAppStore.getState().setCameraOverride(null)
  }, [lessonId])

  useEffect(() => {
    bodyPosition('lesson-focus').set(0, 0, 0)
  }, [])

  if (!lessonId) return null

  switch (lessonId) {
    case 'sun':
      return <SunLesson burst={burst} />
    case 'sizes':
      return <SizesLesson pick={pick} onPick={togglePick} />
    case 'distances':
      return <DistancesLesson />
    case 'gravity':
      return <GravityLesson mass={mass} speedFactor={speedFactor} />
    case 'day-night':
      return <EarthLessonScene showSeasons={false} seasonAngle={0} />
    case 'seasons':
      return <EarthLessonScene showSeasons seasonAngle={seasonAngle} />
    case 'moon-phases':
      return <MoonPhasesLesson angle={moonAngle} />
    case 'orbits':
      return <OrbitsLesson paused={orbitsPaused} />
    default:
      return null
  }
}