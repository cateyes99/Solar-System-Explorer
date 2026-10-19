import { useEffect, useRef, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { useTranslation } from '../../i18n'
import { useContent } from '../../i18n/content'
import { useSimulationStore } from '../../store/simulationStore'
import { DraggableSheet, ToolbarButton } from './primitives'
import { BackIcon, CloseIcon, ForwardIcon, PauseIcon, PlayIcon } from './icons'

/**
 * Cinematic Tour controls and narration.
 *
 * The progress bar is driven by requestAnimationFrame and writes straight to the
 * DOM, so a smooth animation costs zero React renders.
 */
export function TourControls() {
  const { t } = useTranslation()
  const content = useContent()
  const stages = content.tourStages
  const active = useSimulationStore((state) => state.cinematic.active)
  const paused = useSimulationStore((state) => state.cinematic.paused)
  const stageIndex = useSimulationStore((state) => state.cinematic.stageIndex)
  const pauseTour = useSimulationStore((state) => state.pauseTour)
  const resumeTour = useSimulationStore((state) => state.resumeTour)
  const setTourStage = useSimulationStore((state) => state.setTourStage)
  const exitTour = useSimulationStore((state) => state.exitTour)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)

  // Drag position and opacity are per-instance: this panel is unaffected by the
  // others, and stays where the user put it for as long as it is open.
  const [opacity, setOpacity] = useState(1)

  const barRef = useRef<HTMLDivElement>(null)

  const stage = stages[stageIndex]
  const duration = stage ? (reducedMotion ? stage.duration * 0.65 : stage.duration) : 6

  useEffect(() => {
    if (!active || !stage) return
    let frame = 0
    const started = performance.now()
    // Continue from wherever the bar was when the tour was paused.
    const base = paused ? Number.parseFloat(barRef.current?.dataset.progress ?? '0') : 0

    const tick = (now: number): void => {
      const elapsed = (now - started) / 1000 + base * duration
      const progress = Math.min(1, elapsed / duration)
      const bar = barRef.current
      if (bar) {
        bar.style.width = `${(progress * 100).toFixed(2)}%`
        bar.dataset.progress = String(progress)
      }
      if (progress < 1 && !useSimulationStore.getState().cinematic.paused) {
        frame = requestAnimationFrame(tick)
      }
    }

    if (!paused) frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [active, paused, stageIndex, duration, stage])

  return (
    <AnimatePresence>
      {active && stage ? (
        <DraggableSheet
          key="tour-controls"
          role="region"
          label={t('tour.label')}
          opacity={opacity}
          onOpacityChange={setOpacity}
          initial={{ opacity: 0, y: -18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -18 }}
          transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
          className="inset-x-3 top-[7.2rem] z-40 mx-auto max-w-[46rem] sm:left-4 sm:right-auto sm:top-[6.4rem]"
          header={
            <span className="sse-label-text">
              {t('tour.progress', { index: stageIndex + 1, total: stages.length })}
            </span>
          }
          headerActions={
            <div className="flex items-center gap-1" aria-hidden="true">
              {stages.map((entry, index) => (
                <span
                  key={entry.id}
                  className={`h-1.5 rounded-full transition-all duration-300 ${
                    index === stageIndex ? 'w-5 bg-ice' : index < stageIndex ? 'w-1.5 bg-ice/50' : 'w-1.5 bg-white/20'
                  }`}
                />
              ))}
            </div>
          }
        >
          <h2 className="sse-text-shadow text-lg font-semibold text-parchment">{stage.title}</h2>
          <p className="mt-1 text-sm leading-relaxed text-parchment/92">{stage.narration}</p>

          <div className="mt-3 h-1 w-full overflow-hidden rounded-full bg-white/12">
            <div ref={barRef} className="h-full rounded-full bg-gradient-to-r from-electric to-ice" style={{ width: '0%' }} data-progress="0" />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-1.5">
            <ToolbarButton
              compact
              icon={<BackIcon size={16} />}
              onClick={() => setTourStage(Math.max(0, stageIndex - 1))}
              disabled={stageIndex === 0}
            >
              {t('tour.back')}
            </ToolbarButton>
            <ToolbarButton
              compact
              variant={paused ? 'primary' : 'ghost'}
              icon={paused ? <PlayIcon size={16} /> : <PauseIcon size={16} />}
              onClick={() => (paused ? resumeTour() : pauseTour())}
            >
              {paused ? t('tour.resume') : t('tour.pause')}
            </ToolbarButton>
            <ToolbarButton
              compact
              icon={<ForwardIcon size={16} />}
              onClick={() => setTourStage(stageIndex + 1)}
              disabled={stageIndex >= stages.length - 1}
            >
              {t('tour.skip')}
            </ToolbarButton>
            <ToolbarButton compact variant="danger" icon={<CloseIcon size={16} />} onClick={exitTour}>
              {t('tour.exit')}
            </ToolbarButton>
          </div>
        </DraggableSheet>
      ) : null}
    </AnimatePresence>
  )
}
