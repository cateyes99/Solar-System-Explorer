import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LESSONS } from '../../data/lessons'
import { useSimulationStore } from '../../store/simulationStore'
import { Sheet, ToolbarButton } from './primitives'
import { LessonWidget } from './lessons/LessonWidgets'
import { CloseIcon, PlayIcon } from './icons'

/**
 * Explore & Learn.
 *
 * A little classroom: pick a lesson, page through the explanation one idea at a
 * time, play with the hands-on widget, then press the scene button to see it
 * happen in the real 3D Solar System.
 */
export function EducationPanel() {
  const open = useSimulationStore((state) => state.ui.educationOpen)
  const lessonId = useSimulationStore((state) => state.ui.lessonId)
  const setLesson = useSimulationStore((state) => state.setLesson)
  const closeEducation = useSimulationStore((state) => state.closeEducation)
  const focusBody = useSimulationStore((state) => state.focusBody)
  const setScaleMode = useSimulationStore((state) => state.setScaleMode)
  const setDaysPerSecond = useSimulationStore((state) => state.setDaysPerSecond)
  const setShowOrbitFlow = useSimulationStore((state) => state.setShowOrbitFlow)
  const [stepIndex, setStepIndex] = useState(0)

  const lesson = LESSONS.find((entry) => entry.id === lessonId)

  // Every new lesson starts at the first idea.
  useEffect(() => {
    setStepIndex(0)
  }, [lessonId])

  const applySceneAction = (): void => {
    if (!lesson?.sceneAction) return
    const action = lesson.sceneAction
    if (action.scaleMode) setScaleMode(action.scaleMode)
    if (action.daysPerSecond !== undefined) setDaysPerSecond(action.daysPerSecond)
    if (action.showOrbitFlow !== undefined) setShowOrbitFlow(action.showOrbitFlow)
    // Close the panel so the child can watch what happens in the scene.
    closeEducation()
    if (action.targetId) focusBody(action.targetId, 'planet', 6.4)
  }

  return (
    <AnimatePresence>
      {open ? (
        <Sheet
          position="center"
          label="Explore and learn"
          className="sm:top-[8.5rem] sm:bottom-44 sm:w-[min(52rem,94vw)] sm:translate-y-0"
        >
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="sse-label-text text-ice">Explore &amp; Learn</p>
              <h2 className="mt-1 text-lg font-semibold text-parchment">
                {lesson ? `${lesson.emoji} ${lesson.title}` : 'Pick something to discover'}
              </h2>
              <p className="mt-1 text-xs text-mist/90">
                {lesson ? lesson.summary : 'Eight short lessons, each with something to try yourself.'}
              </p>
            </div>
            <button
              type="button"
              aria-label="Close the lessons"
              onClick={closeEducation}
              className="inline-flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-white/12 bg-white/5 text-mist transition-colors hover:text-parchment"
            >
              <span aria-hidden="true">
                <CloseIcon />
              </span>
            </button>
          </div>

          <div className="sse-divider my-3" />

          <nav aria-label="Lessons" className="sse-scroll -mx-1 flex gap-1.5 overflow-x-auto px-1 pb-2">
            <button
              type="button"
              aria-pressed={!lesson}
              onClick={() => setLesson(null)}
              className={`min-h-[2.5rem] shrink-0 rounded-lg border px-3 text-xs transition-colors ${
                !lesson ? 'border-ice/60 bg-ice/20 text-parchment' : 'border-white/12 bg-white/4 text-mist'
              }`}
            >
              All lessons
            </button>
            {LESSONS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                aria-pressed={lessonId === entry.id}
                onClick={() => setLesson(entry.id)}
                className={`min-h-[2.5rem] shrink-0 rounded-lg border px-3 text-xs transition-colors ${
                  lessonId === entry.id
                    ? 'border-ice/60 bg-ice/20 text-parchment'
                    : 'border-white/12 bg-white/4 text-mist hover:text-parchment'
                }`}
              >
                <span aria-hidden="true" className="mr-1">
                  {entry.emoji}
                </span>
                {entry.title}
              </button>
            ))}
          </nav>

          {!lesson ? (
            <ul className="mt-2 grid gap-2 sm:grid-cols-2">
              {LESSONS.map((entry) => (
                <li key={entry.id}>
                  <button
                    type="button"
                    onClick={() => setLesson(entry.id)}
                    className="h-full w-full rounded-xl border border-white/10 bg-white/4 p-3 text-left transition-colors hover:border-ice/40 hover:bg-white/8"
                  >
                    <span className="flex items-center gap-2 text-sm font-semibold text-parchment">
                      <span aria-hidden="true">{entry.emoji}</span>
                      {entry.title}
                    </span>
                    <span className="mt-1 block text-xs leading-relaxed text-mist/90">{entry.summary}</span>
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-1 space-y-3">
              <motion.div
                key={`${lesson.id}-${stepIndex}`}
                initial={{ opacity: 0, x: 14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.28 }}
                className="rounded-xl border border-white/10 bg-white/4 p-3"
              >
                <p className="sse-label-text text-[0.58rem]">
                  Idea {stepIndex + 1} of {lesson.steps.length}
                </p>
                <p className="mt-2 text-sm leading-relaxed text-parchment/95">{lesson.steps[stepIndex].text}</p>
                {lesson.steps[stepIndex].highlight ? (
                  <p className="mt-2 rounded-lg border border-solar/30 bg-solar/10 px-2.5 py-2 text-xs text-parchment">
                    {lesson.steps[stepIndex].highlight}
                  </p>
                ) : null}

                <div className="mt-3 flex flex-wrap items-center gap-1.5">
                  <ToolbarButton
                    compact
                    onClick={() => setStepIndex((value) => Math.max(0, value - 1))}
                    disabled={stepIndex === 0}
                  >
                    Back
                  </ToolbarButton>
                  <ToolbarButton
                    compact
                    variant="primary"
                    onClick={() => setStepIndex((value) => Math.min(lesson.steps.length - 1, value + 1))}
                    disabled={stepIndex >= lesson.steps.length - 1}
                  >
                    Next idea
                  </ToolbarButton>
                  <span className="flex items-center gap-1" aria-hidden="true">
                    {lesson.steps.map((step, index) => (
                      <span
                        key={step.text.slice(0, 12)}
                        className={`h-1.5 rounded-full transition-all ${
                          index === stepIndex ? 'w-5 bg-ice' : 'w-1.5 bg-white/25'
                        }`}
                      />
                    ))}
                  </span>
                  {lesson.sceneAction ? (
                    <ToolbarButton compact icon={<PlayIcon size={16} />} onClick={applySceneAction} className="ml-auto">
                      {lesson.sceneAction.label}
                    </ToolbarButton>
                  ) : null}
                </div>
              </motion.div>

              <LessonWidget lessonId={lesson.id} />
            </div>
          )}
        </Sheet>
      ) : null}
    </AnimatePresence>
  )
}