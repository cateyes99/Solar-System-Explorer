import { useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import { Callout } from './primitives/Overlays'
import { spaceAudio } from '../../utils/audio'

interface Egg {
  key: string
  title: string
  body: string
  tone: 'cyan' | 'warm'
  icon: 'sparkle' | 'sun'
  duration: number
}

/**
 * Each discovery maps the store flags that reveal it. Derived during render so
 * a newly satisfied condition produces the nudge immediately, without a
 * setState-in-effect round trip.
 */
const EGGS: {
  key: string
  satisfied: (flags: { sunClicks: number; greetedEarth: boolean; cometFound: boolean }) => boolean
  egg: Egg
  sound?: 'flare'
}[] = [
  {
    // Five clicks on the Sun.
    key: 'flare',
    satisfied: (f) => f.sunClicks >= 5,
    sound: 'flare',
    egg: {
      key: 'flare',
      title: 'Solar flare!',
      body: 'The Sun just threw out a giant arc of hot gas. Real flares can be tens of thousands of kilometres long.',
      tone: 'warm',
      icon: 'sun',
      duration: 6500,
    },
  },
  {
    key: 'earth',
    satisfied: (f) => f.greetedEarth,
    egg: {
      key: 'earth',
      title: 'Hello, Earth!',
      body: 'The only world we know of with oceans of liquid water and life on the surface.',
      tone: 'cyan',
      icon: 'sparkle',
      duration: 5200,
    },
  },
  {
    key: 'comet',
    satisfied: (f) => f.cometFound,
    egg: {
      key: 'comet',
      title: 'You found a comet',
      body: 'Its tail always points away from the Sun — it is not trailing behind, it is being blown away.',
      tone: 'cyan',
      icon: 'sparkle',
      duration: 6500,
    },
  },
]

/**
 * Tasteful discoveries: repeated clicks on the Sun, clicking Earth, and finding
 * the comet. Each fires at most once and appears as a small, auto-dismissing
 * nudge that never covers an open panel.
 */
export function EasterEggs() {
  const sunClicks = useAppStore((s) => s.sunClicks)
  const greetedEarth = useAppStore((s) => s.greetedEarth)
  const cometFound = useAppStore((s) => s.cometFound)
  const panel = useAppStore((s) => s.panel)
  const factVisible = useAppStore((s) => s.factVisible)
  const tourActive = useAppStore((s) => s.tourActive)
  const introVisible = useAppStore((s) => s.introVisible)

  const [dismissed, setDismissed] = useState<Record<string, boolean>>({})
  const [active, setActive] = useState<Egg | null>(null)
  const shown = useRef<Record<string, boolean>>({})

  const flags = { sunClicks, greetedEarth, cometFound }
  const found = EGGS.find((e) => e.satisfied(flags) && !dismissed[e.key])

  // Announce newly satisfied conditions and schedule the auto-dismiss.
  useEffect(() => {
    if (!found) return
    if (shown.current[found.key]) return
    shown.current[found.key] = true
    if (found.sound === 'flare') spaceAudio.play('flare')
    setActive(found.egg)
    const id = window.setTimeout(() => setActive(null), found.egg.duration)
    return () => window.clearTimeout(id)
  }, [found])

  const dismiss = () => {
    if (!found) return
    setDismissed((prev) => ({ ...prev, [found.key]: true }))
    setActive(null)
  }

  // Hide the nudge whenever something more important is on screen.
  const blocked = panel !== null || factVisible || tourActive || introVisible

  return (
    <div className="safe-top pointer-events-none absolute inset-x-0 top-0 z-40 flex justify-center px-4 pt-16">
      <AnimatePresence>
        {!blocked && active && (
          <div className="pointer-events-auto">
            <Callout
              visible
              title={active.title}
              body={active.body}
              tone={active.tone}
              icon={active.icon}
            />
            <button
              type="button"
              onClick={dismiss}
              className="sr-only focus:not-sr-only focus:mt-2 focus:rounded-lg focus:bg-white/10 focus:px-3 focus:py-1.5 focus:text-[12px] focus:font-semibold focus:text-ice-50"
            >
              Dismiss: {active.title}
            </button>
          </div>
        )}
      </AnimatePresence>
    </div>
  )
}

/**
 * Full-screen warm pulse fired alongside the solar flare. Remounting on each
 * pulse restarts the animation without needing any extra state.
 */
export function FlareFlash() {
  const flarePulse = useAppStore((s) => s.flarePulse)

  if (flarePulse === 0) return null

  return (
    <motion.div
      key={flarePulse}
      initial={{ opacity: 0.5 }}
      animate={{ opacity: 0 }}
      transition={{ duration: 0.75, ease: 'easeOut' }}
      className="pointer-events-none absolute inset-0 z-20 bg-[radial-gradient(circle_at_center,rgba(255,150,60,0.45),transparent_65%)]"
      aria-hidden
    />
  )
}