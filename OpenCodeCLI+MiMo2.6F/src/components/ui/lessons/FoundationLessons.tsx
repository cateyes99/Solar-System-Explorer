import { motion } from 'framer-motion'
import { useSimStore } from '../../../store/simulationStore'
import { playBlip } from '../../../utils/audio'

/** "See it in 3D" helper button used by several lessons. */
export function SeeIn3D({ label, onClick }: { label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      className="chip"
      onClick={() => {
        playBlip(820, 0.1)
        onClick()
      }}
    >
      {label}
    </button>
  )
}

export function LessonText({ children }: { children: React.ReactNode }) {
  return <p className="text-sm leading-relaxed text-white/85">{children}</p>
}

export function LessonHeading({ children }: { children: React.ReactNode }) {
  return <h3 className="font-display text-lg font-semibold text-cyan-200">{children}</h3>
}

/** What the Sun is, why it shines, fusion, and why planets orbit it. */
export function SunLesson() {
  const focusBody = useSimStore((s) => s.focusBody)
  const setSpeed = useSimStore((s) => s.setSpeed)

  return (
    <div className="space-y-4">
      <LessonHeading>The Sun — our neighbourhood star</LessonHeading>
      <LessonText>
        The Sun is a giant ball of hot glowing gas (called <strong>plasma</strong>). It is so big
        that it holds 99.8% of all the mass in the Solar System — everything else, including every
        planet, is just leftover dust and rock.
      </LessonText>

      {/* Fusion diagram */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
        <p className="mb-2 text-[11px] uppercase tracking-[0.16em] text-solar-400">
          Why does it shine? · Nuclear fusion
        </p>
        <div className="flex items-center justify-center gap-2 py-2">
          {[0, 1, 2, 3].map((index) => (
            <motion.span
              key={index}
              className="h-5 w-5 rounded-full bg-cyan-400 shadow-[0_0_12px_rgba(56,189,248,0.8)]"
              animate={{
                x: [0, 42, 42, 0],
                opacity: [1, 1, 0.4, 1],
                scale: [1, 1, 0.6, 1],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                delay: index * 0.12,
                ease: 'easeInOut',
              }}
              aria-hidden="true"
            />
          ))}
        </div>
        <div className="flex items-center justify-center gap-2 text-center">
          <motion.span
            className="grid h-12 w-12 place-items-center rounded-full bg-solar-400 font-display text-sm font-bold text-space-950"
            animate={{ scale: [1, 1.15, 1], boxShadow: ['0 0 10px #ffb347', '0 0 34px #ffb347', '0 0 10px #ffb347'] }}
            transition={{ duration: 3, repeat: Infinity, delay: 1.4 }}
          >
            He
          </motion.span>
        </div>
        <p className="mt-3 text-center text-[13px] leading-relaxed text-white/75">
          Four tiny <strong className="text-cyan-300">hydrogen</strong> nuclei squash together deep
          in the core and become one <strong className="text-solar-400">helium</strong> nucleus.
          The leftover energy shines out as light and heat. That is <em>nuclear fusion</em> — the
          Sun has been doing it for 4.6 billion years.
        </p>
      </div>

      <LessonHeading>Why do planets orbit it?</LessonHeading>
      <LessonText>
        The Sun's gravity pulls on every planet. But the planets are also moving sideways very
        fast. The pull bends their straight path into a loop — an <strong>orbit</strong>. It's like
        swinging a ball on a string: the string (gravity) keeps the ball going in a circle.
      </LessonText>

      <div className="flex flex-wrap gap-2">
        <SeeIn3D
          label="🔍 Zoom to the Sun"
          onClick={() => {
            focusBody('sun')
            useSimStore.getState().closePanel()
          }}
        />
        <SeeIn3D
          label="⏱ Watch the orbits"
          onClick={() => {
            setSpeed('fast')
            useSimStore.getState().viewSystem()
            useSimStore.getState().closePanel()
          }}
        />
      </div>
    </div>
  )
}

/** Gravity keeps planets moving around the Sun. */
export function OrbitsLesson() {
  const focusBody = useSimStore((s) => s.focusBody)

  return (
    <div className="space-y-4">
      <LessonHeading>Orbits — gravity keeps planets moving around the Sun</LessonHeading>

      <div className="rounded-2xl border border-white/10 bg-space-950/60 p-3">
        <svg viewBox="0 0 320 220" className="w-full" role="img" aria-label="Diagram of a planet orbiting the Sun with gravity and velocity arrows">
          {/* Orbit path */}
          <ellipse cx="160" cy="110" rx="120" ry="78" fill="none" stroke="#38bdf8" strokeOpacity="0.35" strokeDasharray="5 7" />
          {/* Sun */}
          <circle cx="160" cy="110" r="22" fill="#ffb347" />
          <circle cx="160" cy="110" r="30" fill="#ffb347" fillOpacity="0.2" />

          {/* Planet animated along the ellipse */}
          <g>
            <animateTransform
              attributeName="transform"
              type="rotate"
              from="0 160 110"
              to="360 160 110"
              dur="7s"
              repeatCount="indefinite"
            />
            <g transform="translate(160 32)">
              <circle r="9" fill="#4ea3ff" />
              {/* velocity arrow (tangential) */}
              <g stroke="#63f58a" strokeWidth="3" fill="none" markerEnd="">
                <line x1="6" y1="-6" x2="44" y2="-14" />
                <path d="M44 -14 l-9 -3 l4 7 z" fill="#63f58a" stroke="none" />
              </g>
              {/* gravity arrow (toward the Sun) */}
              <g stroke="#ff8c1a" strokeWidth="3" fill="none">
                <line x1="0" y1="10" x2="0" y2="66" />
                <path d="M0 72 l-5 -9 h10 z" fill="#ff8c1a" stroke="none" />
              </g>
            </g>
          </g>

          <text x="238" y="34" fill="#63f58a" fontSize="11" fontFamily="Inter, sans-serif">speed</text>
          <text x="168" y="196" fill="#ff8c1a" fontSize="11" fontFamily="Inter, sans-serif">gravity pull</text>
        </svg>
      </div>

      <LessonText>
        Two things keep an orbit going at once: the planet's forward <strong style={{ color: '#63f58a' }}>
        speed</strong> and the Sun's <strong style={{ color: '#ff8c1a' }}>gravity</strong>. Gravity
        keeps pulling the planet inward, but the planet keeps missing — so it falls around and
        around forever.
      </LessonText>
      <LessonText>
        Push the planet faster and it swings out into a bigger orbit. Slow it down and it spirals
        closer. Every planet has found the speed that matches its distance from the Sun.
      </LessonText>

      <SeeIn3D
        label="🌍 See Earth orbit in 3D"
        onClick={() => {
          focusBody('earth')
          useSimStore.getState().closePanel()
        }}
      />
    </div>
  )
}
