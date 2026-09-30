import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSimStore } from '../../store/simulationStore'
import { BODY_BY_ID } from '../../data/planets'
import { CloseIcon } from './icons'

/** Track the pointer for the hover tooltip (outside React state per frame). */
const pointer = { x: 0, y: 0 }
let pointerBound = false

function bindPointer(): void {
  if (pointerBound || typeof window === 'undefined') return
  pointerBound = true
  window.addEventListener(
    'pointermove',
    (event) => {
      pointer.x = event.clientX
      pointer.y = event.clientY
    },
    { passive: true },
  )
}

/** Elegant tooltip that follows the cursor while a body is hovered. */
export function HoverTooltip() {
  const hoveredId = useSimStore((s) => s.hoveredId)
  const [position, setPosition] = useState({ x: 0, y: 0 })

  useEffect(() => {
    bindPointer()
    if (!hoveredId) return
    const id = window.setInterval(() => setPosition({ ...pointer }), 60)
    return () => window.clearInterval(id)
  }, [hoveredId])

  const body = hoveredId ? BODY_BY_ID[hoveredId] : undefined

  return (
    <AnimatePresence>
      {body && (
        <motion.div
          key={body.id}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 6 }}
          transition={{ duration: 0.15 }}
          className="pointer-events-none fixed z-30 hidden -translate-y-14 translate-x-4 md:block"
          style={{ left: position.x, top: position.y }}
          role="status"
        >
          <div className="panel rounded-xl px-3 py-2">
            <div className="flex items-center gap-2">
              <span
                className="h-2.5 w-2.5 rounded-full"
                style={{ background: body.color, boxShadow: `0 0 10px ${body.color}` }}
              />
              <span className="font-display text-sm font-semibold text-white">{body.name}</span>
              <span className="text-[11px] text-cyan-300/80">{body.type}</span>
            </div>
            <div className="mt-0.5 text-[11px] text-white/55">
              Click to learn · double-click to follow
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

/** Toasts for easter eggs and mission messages. */
export function Toasts() {
  const toast = useSimStore((s) => s.toast)

  useEffect(() => {
    if (!toast) return
    const id = window.setTimeout(() => useSimStore.getState().showToast('', 'info'), 4200)
    return () => window.clearTimeout(id)
  }, [toast])

  const visible = toast && toast.message.length > 0

  return (
    <div
      className="pointer-events-none fixed left-1/2 top-16 z-50 w-[min(92vw,30rem)] -translate-x-1/2 sm:top-20"
      aria-live="polite"
    >
      <AnimatePresence>
        {visible && toast && (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: -16, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.97 }}
            transition={{ type: 'spring', stiffness: 320, damping: 26 }}
            className={[
              'panel mx-auto rounded-2xl px-4 py-3 text-center text-sm',
              toast.tone === 'fun' ? 'border-solar-400/40 text-solar-200' : 'text-white/90',
            ].join(' ')}
          >
            {toast.message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

/** Opening message that introduces the experience. */
export function WelcomeOverlay() {
  const visible = useSimStore((s) => s.welcomeVisible)
  const dismiss = useSimStore((s) => s.dismissWelcome)

  useEffect(() => {
    if (!visible) return
    const id = window.setTimeout(dismiss, 9000)
    return () => window.clearTimeout(id)
  }, [visible, dismiss])

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="pointer-events-none fixed inset-0 z-40 grid place-items-center px-6 text-center"
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 1.02 }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          onClick={dismiss}
        >
          <div className="max-w-2xl">
            <motion.h1
              className="font-display text-4xl font-bold leading-tight text-white drop-shadow-[0_0_30px_rgba(56,189,248,0.35)] sm:text-6xl"
              initial={{ y: 24, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.9 }}
            >
              Welcome to the Solar System
            </motion.h1>

            <motion.p
              className="mt-4 text-sm text-cyan-100/85 sm:text-lg"
              initial={{ y: 18, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 1.1, duration: 0.8 }}
            >
              Drag to explore • Click a planet to learn • Start a mission
            </motion.p>

            <motion.button
              type="button"
              className="chip pointer-events-auto mt-6 !px-5 !py-2.5 !text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2, duration: 0.6 }}
              onClick={dismiss}
            >
              Begin exploring
            </motion.button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}

const SHORTCUTS: { keys: string; action: string }[] = [
  { keys: '0 – 8', action: 'Jump to the Sun / planets' },
  { keys: 'Space', action: 'Pause or play time' },
  { keys: 'T', action: 'Start or exit the Cinematic Tour' },
  { keys: 'C', action: 'Enter Spacecraft mode' },
  { keys: 'F', action: 'Follow the selected planet' },
  { keys: 'L', action: 'Toggle planet labels' },
  { keys: 'O', action: 'Toggle orbit lines' },
  { keys: 'R', action: 'Random astronomy fact' },
  { keys: 'M', action: 'Mute or unmute' },
  { keys: 'E', action: 'Open Explore & Learn' },
  { keys: 'Esc', action: 'Close panel / back to system view' },
  { keys: '?', action: 'Show this help' },
]

export function ShortcutsModal() {
  const visible = useSimStore((s) => s.shortcutsVisible)
  const toggle = useSimStore((s) => s.toggleShortcuts)

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          className="fixed inset-0 z-50 grid place-items-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-space-950/70 backdrop-blur-sm"
            onClick={toggle}
            aria-label="Close keyboard shortcuts"
          />
          <motion.div
            role="dialog"
            aria-label="Keyboard shortcuts"
            initial={{ scale: 0.94, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.96, y: 12 }}
            className="panel relative w-full max-w-md rounded-3xl p-5"
          >
            <div className="mb-3 flex items-center justify-between">
              <h2 className="font-display text-lg font-bold text-white">Keyboard shortcuts</h2>
              <button type="button" className="chip !px-2 !py-1" onClick={toggle} aria-label="Close">
                <CloseIcon width={14} height={14} />
              </button>
            </div>
            <dl className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {SHORTCUTS.map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center justify-between gap-2 rounded-lg border border-white/10 bg-white/5 px-2.5 py-1.5 text-xs"
                >
                  <dt className="rounded bg-cyan-400/15 px-1.5 py-0.5 font-mono text-cyan-200">
                    {shortcut.keys}
                  </dt>
                  <dd className="text-right text-white/75">{shortcut.action}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
