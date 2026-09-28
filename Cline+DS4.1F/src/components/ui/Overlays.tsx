import { useEffect, useRef } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSimulationStore } from '../../store/simulationStore'
import { ToolbarButton } from './primitives'

/**
 * The welcome message.
 *
 * The first ten seconds: one line of magic, one line of instruction, and a button
 * that gets out of the way. It fades on its own so an impatient child is never
 * blocked by it.
 */
export function WelcomeOverlay() {
  const visible = useSimulationStore((state) => state.ui.welcomeVisible)
  const ready = useSimulationStore((state) => state.ready)
  const dismiss = useSimulationStore((state) => state.dismissWelcome)
  const dismissed = useRef(false)

  useEffect(() => {
    if (!visible || !ready || dismissed.current) return
    const id = window.setTimeout(() => {
      dismissed.current = true
      dismiss()
    }, 11000)
    return () => window.clearTimeout(id)
  }, [visible, ready, dismiss])

  return (
    <AnimatePresence>
      {visible && ready ? (
        <motion.div
          key="welcome"
          role="status"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -12 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="pointer-events-none fixed inset-x-0 top-[19%] z-30 flex justify-center px-4"
        >
          <div className="sse-panel pointer-events-auto max-w-[30rem] px-5 py-4 text-center">
            <p className="sse-label-text text-ice">Welcome to the Solar System</p>
            <p className="sse-text-shadow mt-2 text-sm text-parchment">
              Drag to explore · Click a planet to learn · Start a mission
            </p>
            <div className="mt-3 flex justify-center gap-2">
              <ToolbarButton
                variant="primary"
                onClick={() => {
                  dismissed.current = true
                  dismiss()
                }}
              >
                Let&apos;s explore
              </ToolbarButton>
            </div>
          </div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}

const SHORTCUTS: { keys: string; description: string }[] = [
  { keys: 'Drag', description: 'Rotate the view around the Solar System' },
  { keys: 'Scroll / pinch', description: 'Zoom in and out' },
  { keys: 'Right-drag / two fingers', description: 'Pan the view' },
  { keys: 'Click a planet', description: 'Open its information panel' },
  { keys: 'Double-click', description: 'Follow that world' },
  { keys: 'Space', description: 'Pause or resume time' },
  { keys: '← →', description: 'Step back or forward one day' },
  { keys: '1 … 6', description: 'Choose a simulation speed' },
  { keys: 'Esc', description: 'Close panels, or leave a tour or mission' },
  { keys: 'L / O / B / N', description: 'Toggle labels, orbits, the belt and the nebula' },
  { keys: 'R', description: 'Return to the full Solar System view' },
  { keys: 'T', description: 'Start or stop the cinematic tour' },
  { keys: 'E', description: 'Open Explore & Learn' },
  { keys: 'I', description: 'Open the What If experiments' },
  { keys: 'F', description: 'Teach me something (a random fact)' },
  { keys: 'M', description: 'Mute or unmute the sound' },
  { keys: 'S', description: 'Open settings' },
  { keys: 'H', description: 'Show or hide this help' },
  { keys: 'W A S D · R F · Shift', description: 'Fly the spacecraft during a mission' },
]

export function HelpPanel() {
  const open = useSimulationStore((state) => state.ui.helpOpen)
  const toggleHelp = useSimulationStore((state) => state.toggleHelp)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  const setReducedMotion = useSimulationStore((state) => state.setReducedMotion)

  return (
    <AnimatePresence>
      {open ? (
        <motion.div
          key="help"
          role="dialog"
          aria-label="How to explore"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 grid place-items-center bg-void/72 px-3 py-6"
          onClick={() => toggleHelp(false)}
        >
          <motion.div
            initial={{ opacity: 0, y: 22, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 18, scale: 0.98 }}
            transition={{ duration: 0.3 }}
            className="sse-panel sse-scroll max-h-full w-[min(34rem,94vw)] overflow-y-auto p-4"
            onClick={(event) => event.stopPropagation()}
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="sse-label-text text-ice">Flight manual</p>
                <h2 className="mt-1 text-lg font-semibold text-parchment">How to explore</h2>
              </div>
              <button
                type="button"
                aria-label="Close help"
                onClick={() => toggleHelp(false)}
                className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-white/12 bg-white/5 px-3 text-mist transition-colors hover:text-parchment"
              >
                <span aria-hidden="true">✕</span>
              </button>
            </div>

            <div className="sse-divider my-3" />

            <ul className="space-y-1.5">
              {SHORTCUTS.map((shortcut) => (
                <li key={shortcut.keys} className="flex items-baseline justify-between gap-3 text-sm">
                  <span className="sse-chip shrink-0 px-2 py-0.5 text-[0.66rem] text-parchment">{shortcut.keys}</span>
                  <span className="text-right text-xs leading-relaxed text-mist/90">{shortcut.description}</span>
                </li>
              ))}
            </ul>

            <div className="sse-divider my-3" />

            <ToolbarButton compact onClick={() => setReducedMotion(!reducedMotion)} active={reducedMotion}>
              {reducedMotion ? 'Motion is reduced — tap to restore' : 'Reduce motion and effects'}
            </ToolbarButton>

            <p className="mt-3 text-[0.66rem] leading-relaxed text-mist/75">
              Everything here also works with touch, and every control has a keyboard shortcut and a screen-reader label.
              Planet facts are real astronomy with rounded numbers; the 3D picture uses an educational scale so that sizes
              and distances stay visible.
            </p>
          </motion.div>
        </motion.div>
      ) : null}
    </AnimatePresence>
  )
}