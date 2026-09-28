import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useSimulationStore } from '../../store/simulationStore'
import { CloseIcon, ChevronIcon } from './icons'
import { GravityDemo } from './lessons/GravityDemo'
import { PlanetSizeCompare } from './lessons/PlanetSizeCompare'
import { PlanetDistanceStrip } from './lessons/PlanetDistanceStrip'
import { MoonPhaseTracker } from './lessons/MoonPhaseTracker'
import { SeasonsDiagram } from './lessons/SeasonsDiagram'

type LessonId = 'sun' | 'sizes' | 'distances' | 'gravity' | 'day-night' | 'seasons' | 'moon-phases' | 'orbits'

interface Lesson {
  id: LessonId
  title: string
  summary: string
}

const LESSONS: Lesson[] = [
  { id: 'sun', title: 'The Sun', summary: 'Why it shines, and why planets orbit it.' },
  { id: 'sizes', title: 'Planet Sizes', summary: 'Compare any two planets side by side.' },
  { id: 'distances', title: 'Planet Distances', summary: 'See how far apart the planets really are.' },
  { id: 'gravity', title: 'Gravity', summary: 'A playful, simplified demo of gravity\u2019s pull.' },
  { id: 'day-night', title: 'Day and Night', summary: 'Why Earth\u2019s spin gives us day and night.' },
  { id: 'seasons', title: 'Seasons', summary: 'How Earth\u2019s tilt creates the seasons.' },
  { id: 'moon-phases', title: 'Moon Phases', summary: 'Track the Moon\u2019s changing shape in our sky.' },
  { id: 'orbits', title: 'Orbits', summary: 'Gravity keeps planets moving around the Sun.' },
]

function FusionDiagram() {
  return (
    <div className="relative flex h-24 w-full items-center justify-center">
      <motion.div
        className="absolute h-4 w-4 rounded-full bg-cyan-glow"
        animate={{ x: [-40, -3] }}
        transition={{ duration: 1.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute h-4 w-4 rounded-full bg-cyan-glow"
        animate={{ x: [40, 3] }}
        transition={{ duration: 1.6, repeat: Infinity, repeatType: 'reverse', ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute h-10 w-10 rounded-full bg-solar-orange"
        animate={{ scale: [0.6, 1.3, 0.9], opacity: [0.4, 1, 0.8] }}
        transition={{ duration: 1.6, repeat: Infinity, ease: 'easeInOut' }}
        style={{ boxShadow: '0 0 30px 10px rgba(255,157,77,0.5)' }}
      />
    </div>
  )
}

function DayNightDiagram() {
  return (
    <div className="relative h-28 w-28 overflow-hidden rounded-full ring-1 ring-white/10">
      <motion.div
        className="absolute inset-[-25%]"
        style={{ background: 'linear-gradient(90deg, #e8cf9a 50%, #0d1730 50%)' }}
        animate={{ rotate: 360 }}
        transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
      />
    </div>
  )
}

function OrbitsDiagram() {
  return (
    <svg viewBox="0 0 200 160" className="h-40 w-full max-w-xs">
      <circle cx={100} cy={80} r={55} fill="none" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 4" />
      <circle cx={100} cy={80} r={9} fill="#ffb347" />
      <circle cx={155} cy={80} r={6} fill="#4fd6ff" />
      <line x1={155} y1={80} x2={155} y2={42} stroke="#4fd6ff" strokeWidth={2} />
      <polygon points="155,34 149,44 161,44" fill="#4fd6ff" />
      <line x1={155} y1={80} x2={117} y2={80} stroke="#ff9d4d" strokeWidth={2} />
      <polygon points="109,80 119,74 119,86" fill="#ff9d4d" />
    </svg>
  )
}

function LessonContent({ id }: { id: LessonId }) {
  const select = useSimulationStore((s) => s.select)

  switch (id) {
    case 'sun':
      return (
        <div className="flex flex-col items-center gap-4">
          <FusionDiagram />
          <p className="text-sm leading-relaxed text-white/80">
            The Sun is a giant ball of hydrogen and helium gas. Deep in its core, immense pressure squeezes hydrogen
            atoms together so hard that they fuse into helium — a process called <strong>nuclear fusion</strong> —
            releasing the light and heat that reach us here on Earth. The Sun’s huge gravity is also what keeps every
            planet orbiting around it instead of drifting off into space.
          </p>
          <button
            type="button"
            onClick={() => select('sun')}
            className="rounded-full bg-electric-blue/20 px-4 py-2 text-sm font-medium text-white ring-1 ring-electric-blue/50 hover:bg-electric-blue/30"
          >
            Fly to the Sun
          </button>
        </div>
      )
    case 'sizes':
      return <PlanetSizeCompare />
    case 'distances':
      return <PlanetDistanceStrip />
    case 'gravity':
      return <GravityDemo />
    case 'day-night':
      return (
        <div className="flex flex-col items-center gap-4">
          <DayNightDiagram />
          <p className="text-sm leading-relaxed text-white/80">
            Earth spins all the way around once roughly every 24 hours. Whichever side faces the Sun experiences
            daytime, while the side facing away experiences night — the spinning is what gives us our daily cycle.
          </p>
          <button
            type="button"
            onClick={() => select('earth')}
            className="rounded-full bg-electric-blue/20 px-4 py-2 text-sm font-medium text-white ring-1 ring-electric-blue/50 hover:bg-electric-blue/30"
          >
            Watch Earth spin
          </button>
        </div>
      )
    case 'seasons':
      return (
        <div className="flex flex-col items-center gap-3">
          <SeasonsDiagram />
          <button
            type="button"
            onClick={() => select('earth')}
            className="rounded-full bg-electric-blue/20 px-4 py-2 text-sm font-medium text-white ring-1 ring-electric-blue/50 hover:bg-electric-blue/30"
          >
            View Earth’s tilt in 3D
          </button>
        </div>
      )
    case 'moon-phases':
      return (
        <div className="flex flex-col items-center gap-3">
          <MoonPhaseTracker />
          <button
            type="button"
            onClick={() => select('moon')}
            className="rounded-full bg-electric-blue/20 px-4 py-2 text-sm font-medium text-white ring-1 ring-electric-blue/50 hover:bg-electric-blue/30"
          >
            Fly to the Moon
          </button>
        </div>
      )
    case 'orbits':
      return (
        <div className="flex flex-col items-center gap-4">
          <OrbitsDiagram />
          <p className="text-sm leading-relaxed text-white/80">
            Every orbiting planet is really doing two things at once: flying forward in a straight line (
            <span className="text-cyan-glow">blue arrow</span>), and constantly getting pulled back toward the Sun by
            gravity (<span className="text-solar-orange">orange arrow</span>). Balanced together, those two effects
            bend the planet’s path into a graceful, endless loop — an orbit.
          </p>
        </div>
      )
    default:
      return null
  }
}

/** The "Explore & Learn" educational mode: a lesson picker plus small interactive widgets. */
export function ExploreLearn() {
  const isExploreOpen = useSimulationStore((s) => s.isExploreOpen)
  const toggleExplore = useSimulationStore((s) => s.toggleExplore)
  const [activeLesson, setActiveLesson] = useState<LessonId | null>(null)

  const lesson = LESSONS.find((l) => l.id === activeLesson)

  return (
    <AnimatePresence>
      {isExploreOpen && (
        <motion.section
          role="dialog"
          aria-label="Explore & Learn"
          initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.2 }}
      className="glass-panel pointer-events-auto relative flex max-h-[80vh] w-full max-w-lg flex-col gap-4 overflow-y-auto rounded-3xl p-5"
    >
      <button
        type="button"
        onClick={toggleExplore}
        aria-label="Close Explore & Learn"
        className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
      >
        <CloseIcon className="h-4 w-4" />
      </button>

      <AnimatePresence mode="wait">
        {!lesson ? (
          <motion.div key="list" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-3">
            <header>
              <h2 className="text-lg font-semibold text-white">Explore & Learn</h2>
              <p className="mt-1 text-xs text-white/60">Pick a topic to dive into a short, interactive lesson.</p>
            </header>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {LESSONS.map((l) => (
                <button
                  key={l.id}
                  type="button"
                  onClick={() => setActiveLesson(l.id)}
                  className="flex flex-col gap-1 rounded-xl bg-white/5 p-3 text-left transition-colors hover:bg-white/10"
                >
                  <span className="text-sm font-medium text-white">{l.title}</span>
                  <span className="text-xs text-white/55">{l.summary}</span>
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div key={lesson.id} initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} className="flex flex-col gap-4">
            <button
              type="button"
              onClick={() => setActiveLesson(null)}
              className="flex w-fit items-center gap-1 text-xs font-medium text-white/60 hover:text-white"
            >
              <ChevronIcon direction="left" className="h-3.5 w-3.5" /> All lessons
            </button>
            <h2 className="text-lg font-semibold text-white">{lesson.title}</h2>
            <LessonContent id={lesson.id} />
          </motion.div>
        )}
      </AnimatePresence>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
