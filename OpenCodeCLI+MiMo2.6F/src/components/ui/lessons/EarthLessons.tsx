import { useState } from 'react'
import { motion } from 'framer-motion'
import { LessonHeading, LessonText, SeeIn3D } from './FoundationLessons'
import { useSimStore } from '../../../store/simulationStore'

/** Earth's rotation creates day and night. */
export function DayNightLesson() {
  const focusBody = useSimStore((s) => s.focusBody)
  const setSpeed = useSimStore((s) => s.setSpeed)

  return (
    <div className="space-y-4">
      <LessonHeading>Day and night — Earth is spinning</LessonHeading>
      <LessonText>
        Earth turns all the time: one full spin every 23 hours and 56 minutes. The half facing the
        Sun has <strong>day</strong>, the half facing away has <strong>night</strong>. You don't
        feel the spin — you're moving with it at about 1,670 km/h!
      </LessonText>

      <div className="rounded-2xl border border-white/10 bg-space-950/60 p-3">
        <svg viewBox="0 0 340 200" className="w-full" role="img" aria-label="Sunlight lighting one half of the spinning Earth">
          {/* Sun */}
          <circle cx="42" cy="100" r="26" fill="#ffb347" />
          <circle cx="42" cy="100" r="36" fill="#ffb347" fillOpacity="0.22" />
          {[66, 84, 100, 116, 134].map((y) => (
            <line key={y} x1="84" y1={y} x2="126" y2={y} stroke="#ffd9a8" strokeWidth="2" strokeOpacity="0.65" />
          ))}

          {/* Earth with lit / dark halves */}
          <defs>
            <clipPath id="earthClip">
              <circle cx="235" cy="100" r="60" />
            </clipPath>
          </defs>
          <circle cx="235" cy="100" r="60" fill="#0b1e46" />
          <g clipPath="url(#earthClip)">
            {/* Rotating land shapes */}
            <g>
              <animateTransform
                attributeName="transform"
                type="rotate"
                from="0 235 100"
                to="360 235 100"
                dur="9s"
                repeatCount="indefinite"
              />
              <ellipse cx="212" cy="82" rx="34" ry="22" fill="#2f7d3a" />
              <ellipse cx="258" cy="118" rx="30" ry="20" fill="#3f8f45" />
              <ellipse cx="236" cy="146" rx="26" ry="12" fill="#8a6a3f" />
              <ellipse cx="248" cy="64" rx="20" ry="12" fill="#2f7d3a" />
            </g>
            {/* Day side overlay */}
            <rect x="175" y="40" width="60" height="120" fill="#ffe9b3" fillOpacity="0.28" />
          </g>
          <circle cx="235" cy="100" r="60" fill="none" stroke="#4ea3ff" strokeOpacity="0.7" strokeWidth="2" />
          {/* Terminator */}
          <line x1="235" y1="40" x2="235" y2="160" stroke="#ffffff" strokeOpacity="0.5" strokeDasharray="5 6" />

          <text x="196" y="34" fill="#ffe9b3" fontSize="12" fontFamily="Inter, sans-serif">DAY</text>
          <text x="262" y="34" fill="#8ea7d8" fontSize="12" fontFamily="Inter, sans-serif">NIGHT</text>
          <text x="176" y="188" fill="#9fb6ff" fontSize="11" fontFamily="Inter, sans-serif">← sunlight</text>
        </svg>
      </div>

      <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-[13px] leading-relaxed text-cyan-100">
        If Earth suddenly <strong>stopped spinning</strong>, one side would bake for months while
        the other froze for months. A "What If?" experiment is waiting for you in this app!
      </div>

      <SeeIn3D
        label="🌍 Watch Earth spin in 3D"
        onClick={() => {
          setSpeed('normal')
          focusBody('earth')
          useSimStore.getState().closePanel()
        }}
      />
    </div>
  )
}

interface SeasonOption {
  id: string
  label: string
  hemisphereNote: string
  text: string
}

const SEASONS: SeasonOption[] = [
  {
    id: 'spring',
    label: 'Spring',
    hemisphereNote: 'Northern hemisphere',
    text: 'Days and nights are almost equal. Earth is tilting neither toward nor away from the Sun, so the light spreads evenly.',
  },
  {
    id: 'summer',
    label: 'Summer',
    hemisphereNote: 'Northern hemisphere',
    text: 'The north leans toward the Sun, so sunlight hits it more directly and days are longer. That is why it is hotter — not because Earth is closer!',
  },
  {
    id: 'autumn',
    hemisphereNote: 'Northern hemisphere',
    label: 'Autumn',
    text: 'Tilting sideways again. Days get shorter, leaves change colour, and the light gets softer.',
  },
  {
    id: 'winter',
    label: 'Winter',
    hemisphereNote: 'Northern hemisphere',
    text: 'The north leans away from the Sun: sunlight arrives at a slant and days are short. Meanwhile the southern hemisphere is having summer.',
  },
]

/** Earth's axial tilt creates the seasons. */
export function SeasonsLesson() {
  const [selected, setSelected] = useState('summer')
  const focusBody = useSimStore((s) => s.focusBody)
  const current = SEASONS.find((season) => season.id === selected) ?? SEASONS[1]

  // Positions around the orbit (x, y) in the diagram
  const positions = [
    { id: 'spring', x: 320, y: 110 },
    { id: 'summer', x: 200, y: 110 },
    { id: 'autumn', x: 80, y: 110 },
    { id: 'winter', x: 200, y: 30 },
  ]

  return (
    <div className="space-y-4">
      <LessonHeading>Seasons — it's all about the tilt</LessonHeading>
      <LessonText>
        Earth is tilted by <strong>23.4°</strong> and it keeps pointing the same direction in space
        all year long. That tilt decides whether your hemisphere leans toward the Sun (summer) or
        away from it (winter).
      </LessonText>

      <div className="rounded-2xl border border-white/10 bg-space-950/60 p-3">
        <svg viewBox="0 0 400 220" className="w-full" role="img" aria-label="Earth at four points of its orbit showing the seasons">
          <ellipse cx="200" cy="110" rx="150" ry="82" fill="none" stroke="#38bdf8" strokeOpacity="0.35" strokeDasharray="4 8" />
          <circle cx="200" cy="110" r="20" fill="#ffb347" />
          <circle cx="200" cy="110" r="27" fill="#ffb347" fillOpacity="0.2" />

          {positions.map((point) => {
            const season = SEASONS.find((s) => s.id === point.id)
            const isActive = point.id === selected
            return (
              <g
                key={point.id}
                onClick={() => setSelected(point.id)}
                style={{ cursor: 'pointer' }}
                role="button"
                tabIndex={0}
                aria-label={`Show ${season?.label} explanation`}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') setSelected(point.id)
                }}
              >
                <circle
                  cx={point.x}
                  cy={point.y}
                  r={isActive ? 15 : 11}
                  fill="#4ea3ff"
                  stroke={isActive ? '#ffb347' : '#ffffff'}
                  strokeOpacity={isActive ? 1 : 0.4}
                  strokeWidth={isActive ? 3 : 1}
                />
                {/* Axial tilt: always pointing the same way */}
                <line
                  x1={point.x - 6}
                  y1={point.y + 13}
                  x2={point.x + 6}
                  y2={point.y - 13}
                  stroke={isActive ? '#ffd9a8' : '#cbd5e1'}
                  strokeWidth="2.5"
                />
                <text
                  x={point.x}
                  y={point.y + 30}
                  textAnchor="middle"
                  fill={isActive ? '#ffb347' : '#9fb6ff'}
                  fontSize="11"
                  fontFamily="Inter, sans-serif"
                >
                  {season?.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose a season">
        {SEASONS.map((season) => (
          <button
            key={season.id}
            type="button"
            className="chip chip-solar !text-[11px]"
            data-active={selected === season.id ? 'true' : 'false'}
            aria-pressed={selected === season.id}
            onClick={() => setSelected(season.id)}
          >
            {season.label}
          </button>
        ))}
      </div>

      <motion.div
        key={current.id}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-solar-400/30 bg-solar-400/10 p-3 text-[13px] leading-relaxed text-solar-200"
      >
        <strong>{current.label}</strong> ({current.hemisphereNote}) — {current.text}
      </motion.div>

      <LessonText>
        Notice that Earth is actually a little <strong>closer</strong> to the Sun in January than in
        July. Distance doesn't make the seasons — the tilt does.
      </LessonText>

      <SeeIn3D
        label="🌍 See Earth's tilt in 3D"
        onClick={() => {
          focusBody('earth')
          useSimStore.getState().closePanel()
        }}
      />
    </div>
  )
}

function phaseName(day: number): { name: string; emoji: string } {
  const p = ((day % 29.53) + 29.53) % 29.53 / 29.53
  if (p < 0.02 || p > 0.98) return { name: 'New Moon', emoji: '🌑' }
  if (p < 0.24) return { name: 'Waxing Crescent', emoji: '🌒' }
  if (p < 0.26) return { name: 'First Quarter', emoji: '🌓' }
  if (p < 0.49) return { name: 'Waxing Gibbous', emoji: '🌔' }
  if (p < 0.51) return { name: 'Full Moon', emoji: '🌕' }
  if (p < 0.74) return { name: 'Waning Gibbous', emoji: '🌖' }
  if (p < 0.76) return { name: 'Last Quarter', emoji: '🌗' }
  return { name: 'Waning Crescent', emoji: '🌘' }
}

/** Moon phases as the Moon orbits Earth. */
export function MoonPhasesLesson() {
  const [day, setDay] = useState(6.5)
  const focusBody = useSimStore((s) => s.focusBody)

  const fraction = (day % 29.53) / 29.53
  const angle = fraction * Math.PI * 2 // 0 = new Moon (between Earth and Sun)
  const phase = phaseName(day)

  // Diagram coordinates: sunlight comes from the left
  const moonX = 200 + Math.cos(angle + Math.PI) * 78
  const moonY = 130 + Math.sin(angle + Math.PI) * 78

  // Rendered appearance
  const r = 46
  const litRight = fraction < 0.5
  const terminatorRx = Math.abs(Math.cos(angle)) * r
  const isGibbousLike = fraction > 0.25 && fraction < 0.75 ? Math.cos(angle) < 0 || fraction > 0.5 : false
  const ellipseFill = isGibbousLike ? '#f4f1e6' : '#101733'

  return (
    <div className="space-y-4">
      <LessonHeading>Moon phases — our Moon takes 29.5 days</LessonHeading>
      <LessonText>
        The Moon doesn't make its own light — it reflects the Sun. As it orbits Earth, we see
        different amounts of its lit half. That's what creates the phases. Half of the Moon is
        <em> always</em> lit; we just see a changing slice of it.
      </LessonText>

      <div className="grid gap-3 sm:grid-cols-2">
        {/* Top view of the orbit */}
        <div className="rounded-2xl border border-white/10 bg-space-950/60 p-3">
          <p className="mb-1 text-center text-[11px] uppercase tracking-[0.14em] text-cyan-300/80">
            Seen from above
          </p>
          <svg viewBox="0 0 300 240" className="w-full" role="img" aria-label="The Moon orbiting Earth">
            {[-1, -0.5, 0, 0.5, 1].map((offset) => (
              <line
                key={offset}
                x1="6"
                y1={130 + offset * 44}
                x2="52"
                y2={130 + offset * 44}
                stroke="#ffd9a8"
                strokeWidth="2"
                strokeOpacity="0.55"
              />
            ))}
            <text x="6" y="34" fill="#ffd9a8" fontSize="11" fontFamily="Inter, sans-serif">☀︎ sunlight</text>

            <circle cx="200" cy="130" r="78" fill="none" stroke="#38bdf8" strokeOpacity="0.4" strokeDasharray="4 7" />
            <circle cx="200" cy="130" r="22" fill="#4ea3ff" />
            <text x="200" y="172" textAnchor="middle" fill="#9fb6ff" fontSize="11" fontFamily="Inter, sans-serif">Earth</text>

            <circle cx={moonX} cy={moonY} r="11" fill="#d8d3ca" stroke="#ffffff" strokeOpacity="0.4" />
            <text x={moonX} y={moonY + 26} textAnchor="middle" fill="#cbd5e1" fontSize="10" fontFamily="Inter, sans-serif">
              Moon
            </text>
          </svg>
        </div>

        {/* How it looks from Earth */}
        <div className="rounded-2xl border border-white/10 bg-space-950/60 p-3">
          <p className="mb-1 text-center text-[11px] uppercase tracking-[0.14em] text-cyan-300/80">
            Seen from Earth
          </p>
          <svg viewBox="0 0 140 140" className="mx-auto w-full max-w-[10rem]" role="img" aria-label={`Moon phase: ${phase.name}`}>
            <circle cx="70" cy="70" r={r} fill="#101733" />
            <path
              d={
                litRight
                  ? `M70 ${70 - r} A ${r} ${r} 0 0 1 70 ${70 + r} Z`
                  : `M70 ${70 - r} A ${r} ${r} 0 0 0 70 ${70 + r} Z`
              }
              fill="#f4f1e6"
            />
            <ellipse cx="70" cy="70" rx={terminatorRx} ry={r} fill={ellipseFill} />
            <circle cx="70" cy="70" r={r} fill="none" stroke="#ffffff" strokeOpacity="0.35" />
          </svg>
          <p className="mt-2 text-center font-display text-lg font-semibold text-white">
            {phase.emoji} {phase.name}
          </p>
        </div>
      </div>

      <label className="block rounded-xl border border-white/10 bg-white/5 px-3 py-3">
        <span className="mb-2 flex items-center justify-between text-sm font-semibold text-white">
          Move the Moon around Earth
          <span className="text-cyan-300 tabular-nums">Day {day.toFixed(1)}</span>
        </span>
        <input
          type="range"
          min={0}
          max={29.5}
          step={0.1}
          value={day}
          onChange={(event) => setDay(Number(event.target.value))}
          className="w-full"
          aria-label="Days into the Moon's cycle"
        />
        <span className="mt-1 block text-[11px] text-white/55">
          Day 0 = New Moon · Day 7 = First Quarter · Day 14.8 = Full Moon · Day 22 = Last Quarter
        </span>
      </label>

      <SeeIn3D
        label="🌙 Find the Moon in 3D"
        onClick={() => {
          focusBody('moon')
          useSimStore.getState().closePanel()
        }}
      />
    </div>
  )
}
