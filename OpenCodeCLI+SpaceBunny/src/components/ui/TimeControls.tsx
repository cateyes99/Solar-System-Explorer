import { AnimatePresence, motion } from 'framer-motion'
import { Icon } from './Icon'
import { IconButton } from './primitives/Button'
import { SPEED_PRESETS, useAppStore } from '../../store/useAppStore'
import { useLayout } from '../../hooks/useMediaQuery'
import { spaceAudio } from '../../utils/audio'

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function formatDate(ms: number): { date: string; time: string } {
  const d = new Date(ms)
  return {
    date: `${d.getUTCDate()} ${MONTHS[d.getUTCMonth()]} ${d.getUTCFullYear()}`,
    time: `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`,
  }
}

function formatSpeed(daysPerSecond: number): string {
  if (daysPerSecond < 1) return `${(daysPerSecond * 24).toFixed(0)} hours per second`
  if (daysPerSecond < 60) return `${daysPerSecond} days per second`
  const years = daysPerSecond / 365.256
  return years < 1 ? `${daysPerSecond} days per second` : `${years.toFixed(1)} years per second`
}

export function TimeControls() {
  const running = useAppStore((s) => s.running)
  const toggleRunning = useAppStore((s) => s.toggleRunning)
  const speedIndex = useAppStore((s) => s.speedIndex)
  const setSpeedIndex = useAppStore((s) => s.setSpeedIndex)
  const displayedMs = useAppStore((s) => s.displayedMs)
  const stepDays = useAppStore((s) => s.stepDays)
  const sceneMode = useAppStore((s) => s.sceneMode)
  const panelOpen = useAppStore((s) => s.panel !== null)
  const tourActive = useAppStore((s) => s.tourActive)
  const { isCompact } = useLayout()

  const preset = SPEED_PRESETS[speedIndex]
  const { date, time } = formatDate(displayedMs)

  // A bottom sheet on a phone covers the lower half of the screen, so the
  // timeline steps out of the way rather than showing through it.
  // A bottom sheet on a phone covers the lower half of the screen, so the
  // timeline steps out of the way rather than showing through it. On wide
  // screens it stays, but shifts clear of the side panel instead. The cinematic
  // tour owns the bottom of the screen entirely, so it steps out there too.
  const hidden = tourActive || (panelOpen && isCompact)
  const insetForPanel = panelOpen && !isCompact ? 'calc(24rem + 2.5rem)' : undefined

  return (
    <AnimatePresence>
      {!hidden && (
        <motion.div
          key="timeline"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          transition={{ duration: 0.35, ease: [0.22, 0.61, 0.36, 1] }}
          style={{ paddingRight: insetForPanel }}
          className="safe-bottom pointer-events-auto absolute inset-x-0 bottom-0 z-20 flex justify-center px-3 sm:px-5"
        >
      <div className="panel w-full max-w-5xl px-3 py-2.5 sm:px-4">
        <div className="flex flex-col gap-2.5 lg:flex-row lg:items-center lg:gap-5">
          {/* Playback */}
          <div className="flex items-center gap-1.5">
            <IconButton
              icon={running ? 'pause' : 'play'}
              label={running ? 'Pause the simulation' : 'Play the simulation'}
              active={running}
              onClick={() => {
                toggleRunning()
                spaceAudio.play('click')
              }}
              className="h-9 w-9 shrink-0"
            />
            <div className="hidden items-center gap-1 sm:flex">
              <IconButton
                icon="back"
                label="Step back one month"
                onClick={() => stepDays(-30)}
                className="h-8 w-8"
              />
              <IconButton
                icon="forward"
                label="Step forward one month"
                onClick={() => stepDays(30)}
                className="h-8 w-8"
              />
            </div>
          </div>

          {/* Speed */}
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-baseline justify-between gap-2">
              <span className="eyebrow truncate">Simulation speed</span>
              <span className="shrink-0 font-mono text-[11px] text-cyan-200/90">
                {formatSpeed(preset.daysPerSecond)}
              </span>
            </div>
            <div role="radiogroup" aria-label="Simulation speed" className="grid grid-cols-6 gap-1">
              {SPEED_PRESETS.map((option, index) => (
                <button
                  key={option.label}
                  type="button"
                  role="radio"
                  aria-checked={index === speedIndex}
                  title={`${option.label} — ${option.blurb}`}
                  onClick={() => {
                    setSpeedIndex(index)
                    spaceAudio.play('click')
                  }}
                  className={[
                    'rounded-lg px-0.5 py-1.5 text-[9.5px] font-semibold tracking-wide transition-colors sm:text-[11px]',
                    'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow',
                    index === speedIndex
                      ? 'bg-white/14 text-ice-50'
                      : 'text-ice-400 hover:bg-white/6 hover:text-ice-200',
                  ].join(' ')}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Clock */}
          <div className="flex items-center justify-between gap-3 border-t border-edge pt-2 lg:border-t-0 lg:pt-0">
            <div className="min-w-0">
              <p className="eyebrow mb-0.5">Simulated date</p>
              <p
                data-testid="sim-clock"
                className="font-mono text-[13px] leading-tight text-ice-50 tabular-nums"
              >
                {date}
                <span className="ml-2 text-ice-400">{time}</span>
              </p>
            </div>
            {sceneMode !== 'system' && (
              <span className="shrink-0 rounded-full border border-edge px-2 py-0.5 text-[10px] font-medium tracking-wider text-ice-400 uppercase">
                <Icon name="sparkle" size={11} className="mr-1 inline" />
                Lesson mode
              </span>
            )}
          </div>
        </div>
      </div>
      </motion.div>
      )}
    </AnimatePresence>
  )
}