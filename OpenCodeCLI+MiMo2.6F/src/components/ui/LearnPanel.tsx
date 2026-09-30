import { AnimatePresence, motion } from 'framer-motion'
import { useSimStore } from '../../store/simulationStore'
import { CloseIcon } from './icons'
import { DayNightLesson, MoonPhasesLesson, SeasonsLesson } from './lessons/EarthLessons'
import { GravityLesson } from './lessons/GravityLesson'
import { OrbitsLesson, SunLesson } from './lessons/FoundationLessons'
import { DistancesLesson, SizesLesson } from './lessons/ScaleLessons'

interface LessonMeta {
  id: string
  title: string
  blurb: string
}

const LESSONS: LessonMeta[] = [
  { id: 'sun', title: 'The Sun', blurb: 'Why does it shine?' },
  { id: 'sizes', title: 'Planet Sizes', blurb: 'How big is big?' },
  { id: 'distances', title: 'Planet Distances', blurb: 'How far is far?' },
  { id: 'gravity', title: 'Gravity', blurb: 'The invisible tug' },
  { id: 'daynight', title: 'Day & Night', blurb: "Earth's spin" },
  { id: 'seasons', title: 'Seasons', blurb: '23.4° of tilt' },
  { id: 'moonphases', title: 'Moon Phases', blurb: 'New, crescent, full…' },
  { id: 'orbits', title: 'Orbits', blurb: 'Why planets keep going' },
]

function renderLesson(id: string): React.ReactNode {
  switch (id) {
    case 'sizes':
      return <SizesLesson />
    case 'distances':
      return <DistancesLesson />
    case 'gravity':
      return <GravityLesson />
    case 'daynight':
      return <DayNightLesson />
    case 'seasons':
      return <SeasonsLesson />
    case 'moonphases':
      return <MoonPhasesLesson />
    case 'orbits':
      return <OrbitsLesson />
    case 'sun':
    default:
      return <SunLesson />
  }
}

/** Explore & Learn: interactive lessons for children. */
export function LearnPanel() {
  const open = useSimStore((s) => s.panel) === 'learn'
  const activeLesson = useSimStore((s) => s.activeLesson)
  const setActiveLesson = useSimStore((s) => s.setActiveLesson)
  const closePanel = useSimStore((s) => s.closePanel)

  const current = LESSONS.find((lesson) => lesson.id === activeLesson) ?? LESSONS[0]

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-space-950/75 backdrop-blur-sm"
            onClick={closePanel}
            aria-label="Close lessons"
          />

          <motion.div
            role="dialog"
            aria-label="Explore and Learn"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="panel relative flex max-h-[92svh] w-full max-w-5xl flex-col overflow-hidden rounded-t-3xl sm:max-h-[86vh] sm:rounded-3xl"
          >
            <header className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <div>
                <h2 className="font-display text-xl font-bold text-white">Explore &amp; Learn</h2>
                <p className="text-[11px] uppercase tracking-[0.16em] text-cyan-300/80">
                  {current.title} · {current.blurb}
                </p>
              </div>
              <button
                type="button"
                className="chip !px-2 !py-1"
                onClick={closePanel}
                aria-label="Close Explore and Learn"
              >
                <CloseIcon width={14} height={14} />
              </button>
            </header>

            <div className="flex min-h-0 flex-1 flex-col sm:flex-row">
              {/* Lesson navigation */}
              <nav
                aria-label="Lessons"
                className="flex shrink-0 gap-1.5 overflow-x-auto border-b border-white/10 p-3 sm:w-56 sm:flex-col sm:overflow-y-auto sm:border-b-0 sm:border-r"
              >
                {LESSONS.map((lesson) => (
                  <button
                    key={lesson.id}
                    type="button"
                    onClick={() => setActiveLesson(lesson.id)}
                    data-active={activeLesson === lesson.id ? 'true' : 'false'}
                    className="chip shrink-0 justify-start !text-left sm:w-full"
                    aria-current={activeLesson === lesson.id ? 'page' : undefined}
                  >
                    <span>
                      <span className="block">{lesson.title}</span>
                      <span className="hidden text-[10px] font-normal text-white/50 sm:block">
                        {lesson.blurb}
                      </span>
                    </span>
                  </button>
                ))}
              </nav>

              {/* Lesson content */}
              <div className="min-h-0 flex-1 overflow-y-auto px-4 py-4 sm:px-6 sm:py-5">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={current.id}
                    initial={{ opacity: 0, x: 16 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -16 }}
                    transition={{ duration: 0.25 }}
                  >
                    {renderLesson(current.id)}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
