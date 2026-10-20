import { lazy, Suspense, type ComponentType, type LazyExoticComponent } from 'react'
import { LESSONS, type LessonId } from '../../data/lessons'
import { useSimulationStore } from '../../store/simulationStore'
import { Icon } from './Icon'
import { Panel } from './Panel'

const LESSON_COMPONENTS: Record<LessonId, LazyExoticComponent<ComponentType>> = {
  sun: lazy(() => import('../lessons/SunLesson')),
  orbits: lazy(() => import('../lessons/OrbitsLesson')),
  sizes: lazy(() => import('../lessons/SizesLesson')),
  distances: lazy(() => import('../lessons/DistancesLesson')),
  gravity: lazy(() => import('../lessons/GravityLesson')),
  'day-night': lazy(() => import('../lessons/DayNightLesson')),
  seasons: lazy(() => import('../lessons/SeasonsLesson')),
  'moon-phases': lazy(() => import('../lessons/MoonPhasesLesson')),
}

function LessonList() {
  const openLesson = useSimulationStore((s) => s.openLesson)
  return (
    <>
      <p className="text-[15px] leading-relaxed text-slate-300">
        Pick a lesson. Each one has something to play with, and the 3D Solar System moves to show you what you’re learning about.
      </p>
      <ul className="mt-4 grid gap-2">
        {LESSONS.map((lesson, i) => (
          <li key={lesson.id}>
            <button
              type="button"
              onClick={() => openLesson(lesson.id)}
              className="group flex w-full items-center gap-4 rounded-2xl border border-white/8 bg-white/[0.04] p-3.5 text-left transition hover:border-white/20 hover:bg-white/[0.08]"
            >
              <span
                className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl font-display text-lg font-bold text-slate-900"
                style={{ background: `linear-gradient(135deg, ${lesson.accent}, ${lesson.accent}99)` }}
                aria-hidden="true"
              >
                {i + 1}
              </span>
              <span className="min-w-0 flex-1">
                <span className="font-display block text-[17px] font-bold text-white">{lesson.title}</span>
                <span className="block text-sm text-slate-400">{lesson.subtitle}</span>
              </span>
              <Icon name="chevronRight" className="text-slate-500 transition group-hover:translate-x-0.5 group-hover:text-white" />
            </button>
          </li>
        ))}
      </ul>
    </>
  )
}

export function LearnPanel() {
  const appMode = useSimulationStore((s) => s.appMode)
  const infoOpen = useSimulationStore((s) => s.infoOpen)
  const activeLesson = useSimulationStore((s) => s.activeLesson)
  const openLesson = useSimulationStore((s) => s.openLesson)
  const setAppMode = useSimulationStore((s) => s.setAppMode)
  const lesson = LESSONS.find((l) => l.id === activeLesson)
  const LessonComponent = activeLesson ? LESSON_COMPONENTS[activeLesson] : null

  return (
    <Panel
      open={appMode === 'learn' && !infoOpen}
      onClose={() => setAppMode('explore')}
      title={lesson ? lesson.title : 'Explore & Learn'}
      eyebrow={lesson ? lesson.subtitle : 'Interactive lessons'}
      accent={lesson?.accent ?? '#60a5fa'}
      closeLabel="Close lessons"
      headerExtra={
        lesson && (
          <button type="button" className="btn shrink-0 px-3" onClick={() => openLesson(null)}>
            <Icon name="chevronLeft" size={18} /> All
          </button>
        )
      }
    >
      {LessonComponent ? (
        <Suspense fallback={<p className="py-8 text-center text-slate-400">Loading lesson…</p>}>
          <LessonComponent key={activeLesson} />
        </Suspense>
      ) : (
        <LessonList />
      )}
    </Panel>
  )
}
