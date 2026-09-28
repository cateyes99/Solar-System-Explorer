import { useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { motion } from 'framer-motion'
import { PLANETS, SUN, MOON } from '../../../data/planets'
import { AU_KM, lightMinutes } from '../../../utils/astronomy'
import { formatKm, formatTemperature } from '../../../utils/format'
import { SliderRow } from '../primitives'
import type { LessonId } from '../../../types'

/**
 * The hands-on part of every lesson.
 *
 * Each widget is small, self-contained and driven by the child: drag a slider,
 * press a button, watch what happens. Nothing here talks to the 3D scene — the
 * lesson's scene action does that — so the widgets stay cheap and predictable.
 */

/* ------------------------------------------------------------------ *
 * Planet sizes
 * ------------------------------------------------------------------ */

const SIZE_PRESETS: { id: string; label: string; ids: string[] }[] = [
  { id: 'earth-jupiter', label: 'Earth vs Jupiter', ids: ['earth', 'jupiter'] },
  { id: 'mercury-jupiter', label: 'Mercury vs Jupiter', ids: ['mercury', 'jupiter'] },
  { id: 'earth-saturn', label: 'Earth vs Saturn', ids: ['earth', 'saturn'] },
  {
    id: 'all',
    label: 'All eight',
    ids: ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'],
  },
]

function SizesWidget() {
  const [presetId, setPresetId] = useState('earth-jupiter')
  const preset = SIZE_PRESETS.find((entry) => entry.id === presetId) ?? SIZE_PRESETS[0]
  const bodies = useMemo(
    () => preset.ids.map((id) => PLANETS.find((planet) => planet.id === id)).filter((body) => body !== undefined),
    [preset],
  )

  const largest = Math.max(...bodies.map((body) => body.diameterKm))
  const maxPixels = presetId === 'all' ? 190 : 210

  return (
    <WidgetShell title="True sizes, side by side">
      <div className="flex flex-wrap gap-1.5">
        {SIZE_PRESETS.map((entry) => (
          <button
            key={entry.id}
            type="button"
            aria-pressed={presetId === entry.id}
            onClick={() => setPresetId(entry.id)}
            className={`min-h-[2.25rem] rounded-lg border px-2.5 text-xs transition-colors ${
              presetId === entry.id
                ? 'border-ice/60 bg-ice/20 text-parchment'
                : 'border-white/12 bg-white/4 text-mist hover:text-parchment'
            }`}
          >
            {entry.label}
          </button>
        ))}
      </div>

      <div className="mt-3 flex min-h-[13rem] flex-wrap items-end justify-center gap-4">
        {bodies.map((body) => {
          const size = (body.diameterKm / largest) * maxPixels
          return (
            <div key={body.id} className="flex flex-col items-center gap-2">
              <motion.span
                initial={{ width: 8, height: 8, opacity: 0.4 }}
                animate={{ width: size, height: size, opacity: 1 }}
                transition={{ type: 'spring', stiffness: 90, damping: 16 }}
                className="block rounded-full"
                style={{
                  background: `radial-gradient(circle at 34% 30%, ${body.color}, #05070f 78%)`,
                  boxShadow: `0 0 26px -6px ${body.color}`,
                }}
              />
              <span className="text-center text-[0.68rem] text-parchment">{body.name}</span>
              <span className="sse-numeric text-[0.62rem] text-mist/85">{formatKm(body.diameterKm)} wide</span>
            </div>
          )
        })}
      </div>

      <p className="mt-2 text-xs leading-relaxed text-mist/90">
        Jupiter is about 11 Earths wide. The Sun is far bigger still: roughly 109 Earths would fit across it, and about
        1.3 million Earths would fit inside it.
      </p>
    </WidgetShell>
  )
}

/* ------------------------------------------------------------------ *
 * Distances
 * ------------------------------------------------------------------ */

function DistancesWidget() {
  const [trueSpacing, setTrueSpacing] = useState(true)

  // True spacing uses the real distances; the compressed view squeezes the
  // square root of the distance so the inner planets stay visible.
  const maxAu = PLANETS[PLANETS.length - 1].distanceFromSunKm / AU_KM
  const rows = PLANETS.map((planet) => {
    const au = planet.distanceFromSunKm / AU_KM
    const width = trueSpacing ? (au / maxAu) * 100 : (Math.sqrt(au) / Math.sqrt(maxAu)) * 100
    return { planet, au, width }
  })

  return (
    <WidgetShell title="How far from the Sun?">
      <div className="flex flex-wrap items-center gap-1.5">
        <button
          type="button"
          aria-pressed={trueSpacing}
          onClick={() => setTrueSpacing(true)}
          className={`min-h-[2.25rem] rounded-lg border px-2.5 text-xs transition-colors ${
            trueSpacing ? 'border-ice/60 bg-ice/20 text-parchment' : 'border-white/12 bg-white/4 text-mist'
          }`}
        >
          True distances
        </button>
        <button
          type="button"
          aria-pressed={!trueSpacing}
          onClick={() => setTrueSpacing(false)}
          className={`min-h-[2.25rem] rounded-lg border px-2.5 text-xs transition-colors ${
            !trueSpacing ? 'border-ice/60 bg-ice/20 text-parchment' : 'border-white/12 bg-white/4 text-mist'
          }`}
        >
          Squeezed (to see the inner planets)
        </button>
      </div>

      <ul className="mt-3 space-y-1.5">
        {rows.map(({ planet, au, width }) => (
          <li key={planet.id} className="flex items-center gap-2">
            <span className="w-16 shrink-0 text-[0.68rem] text-parchment">{planet.name}</span>
            <span className="relative h-3 flex-1 overflow-hidden rounded-full bg-white/8">
              <motion.span
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ background: `linear-gradient(90deg, ${planet.color}88, ${planet.color})` }}
                animate={{ width: `${width}%` }}
                transition={{ duration: 0.5, ease: 'easeOut' }}
              />
            </span>
            <span className="sse-numeric w-24 shrink-0 text-right text-[0.62rem] text-mist/90">
              {au.toFixed(2)} AU · {lightMinutes(planet.distanceFromSunKm).toFixed(0)} min light
            </span>
          </li>
        ))}
      </ul>
      <p className="mt-2 text-xs leading-relaxed text-mist/90">
        1 AU (astronomical unit) is the distance from the Sun to Earth: about 150 million km. Sunlight needs 8 minutes to
        reach Earth, and over 4 hours to reach Neptune.
      </p>
    </WidgetShell>
  )
}

/* ------------------------------------------------------------------ *
 * Gravity
 * ------------------------------------------------------------------ */

/** Earth's surface gravity, in m/s². */
const EARTH_GRAVITY = 9.807

/** The Moon's surface gravity, in m/s². */
const MOON_GRAVITY = MOON.surfaceGravity

/** Surface gravity of a planet: g = G·M/r², expressed in Earth units. */
function surfaceGravity(massEarths: number, radiusEarths: number): number {
  return (EARTH_GRAVITY * massEarths) / (radiusEarths * radiusEarths)
}

/** How long a dropped ball takes to fall 10 metres, in seconds. */
function fallTimeSeconds(gravity: number): number {
  return Math.sqrt((2 * 10) / gravity)
}

function GravityWidget() {
  const [mass, setMass] = useState(1)
  const [radius, setRadius] = useState(1)
  const [dropKey, setDropKey] = useState(0)

  const gravity = surfaceGravity(mass, radius)
  const fallTime = Math.min(6, Math.max(0.35, fallTimeSeconds(gravity)))
  const childWeight = 30 // an average eight-year-old, in kilograms
  const weightOnWorld = childWeight * (gravity / EARTH_GRAVITY)

  return (
    <WidgetShell title="Your own gravity experiment">
      <div className="space-y-1">
        <SliderRow
          label="How heavy is the planet?"
          value={mass}
          min={0.1}
          max={20}
          step={0.1}
          onChange={setMass}
          format={(value) => `${value.toFixed(1)}× Earth`}
        />
        <SliderRow
          label="How wide is the planet?"
          value={radius}
          min={0.4}
          max={3}
          step={0.05}
          onChange={setRadius}
          format={(value) => `${value.toFixed(2)}× Earth`}
        />
      </div>

      <div className="mt-3 grid grid-cols-3 gap-2 text-center">
        <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">
          <div className="sse-label-text text-[0.55rem]">Gravity</div>
          <div className="sse-numeric text-sm text-ice">{gravity.toFixed(2)} m/s²</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">
          <div className="sse-label-text text-[0.55rem]">You would weigh</div>
          <div className="sse-numeric text-sm text-ice">{weightOnWorld.toFixed(1)} kg</div>
        </div>
        <div className="rounded-lg border border-white/10 bg-white/5 px-2 py-2">
          <div className="sse-label-text text-[0.55rem]">Ball falls 10 m in</div>
          <div className="sse-numeric text-sm text-ice">{fallTime.toFixed(2)} s</div>
        </div>
      </div>

      <div className="relative mt-3 h-32 overflow-hidden rounded-lg border border-white/10 bg-gradient-to-b from-navy/70 to-void/80">
        <div className="absolute inset-x-0 bottom-0 h-1.5 bg-white/15" />
        <motion.div
          key={dropKey}
          initial={{ y: -6 }}
          animate={{ y: 88 }}
          transition={{ duration: fallTime, ease: 'easeIn' }}
          className="absolute left-1/2 h-5 w-5 -translate-x-1/2 rounded-full bg-solar shadow-[0_0_18px_2px_rgba(255,138,43,0.55)]"
        />
      </div>

      <div className="mt-2 flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setDropKey((value) => value + 1)}
          className="min-h-[2.5rem] rounded-xl border border-electric/60 bg-electric/90 px-3 text-sm font-semibold text-white transition-colors hover:bg-electric"
        >
          Drop the ball again
        </button>
        <span className="text-[0.68rem] text-mist/85">
          Earth pulls with {EARTH_GRAVITY.toFixed(2)} m/s²; the Moon only {MOON_GRAVITY.toFixed(2)} m/s².
        </span>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-mist/90">
        Gravity grows with mass but shrinks quickly with size: doubling the mass doubles the pull, while doubling the
        radius quarters it, because the surface ends up farther from the middle.
      </p>
    </WidgetShell>
  )
}

/* ------------------------------------------------------------------ *
 * Day and night
 * ------------------------------------------------------------------ */

function DayNightWidget() {
  const [hour, setHour] = useState(14)
  const sunriseHour = 6
  const isDaytime = hour >= sunriseHour && hour < sunriseHour + 12
  const markerAngle = (hour / 24) * 360

  return (
    <WidgetShell title="Spin the Earth and watch the Sun">
      <svg viewBox="0 0 260 140" className="h-40 w-full" role="img" aria-label="Earth rotating in sunlight">
        <defs>
          <radialGradient id="daynight-earth" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#2f7bff" />
            <stop offset="100%" stopColor="#04203f" />
          </radialGradient>
          <radialGradient id="daynight-sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff3c4" />
            <stop offset="100%" stopColor="#ff8a2b" />
          </radialGradient>
        </defs>

        <circle cx="26" cy="58" r="15" fill="url(#daynight-sun)" />
        {[0, 1, 2, 3, 4].map((index) => (
          <line
            key={index}
            x1={48 + index * 7}
            y1={48 + index * 5}
            x2={104 + index * 7}
            y2={48 + index * 5}
            stroke="rgba(255,214,138,0.45)"
            strokeWidth="2"
            strokeLinecap="round"
          />
        ))}

        <circle cx="180" cy="58" r="42" fill="#0a1024" />
        <circle cx="180" cy="58" r="42" fill="url(#daynight-earth)" opacity="0.9" />
        <path
          d={isDaytime ? 'M 180 16 A 42 42 0 0 1 180 100 Z' : 'M 180 16 A 42 42 0 0 0 180 100 Z'}
          fill="rgba(140,196,255,0.3)"
          transform={`rotate(${markerAngle} 180 58)`}
        />
        <circle cx="180" cy="58" r="42" fill="none" stroke="rgba(120,190,255,0.4)" />
        <line x1="180" y1="6" x2="180" y2="14" stroke="#ffd166" strokeWidth="2" />
        <text x="180" y="124" textAnchor="middle" fill="#9fb3d9" fontSize="11">
          {String(hour).padStart(2, '0')}:00 · {isDaytime ? 'daytime' : 'night time'}
        </text>
        <text x="26" y="88" textAnchor="middle" fill="#e8f1ff" fontSize="10">
          Sun
        </text>
      </svg>

      <label className="mt-1 block">
        <span className="flex items-baseline justify-between text-xs text-parchment">
          <span>Time of day at your house</span>
          <span className="sse-numeric text-ice">{String(hour).padStart(2, '0')}:00</span>
        </span>
        <input
          type="range"
          min={0}
          max={23}
          step={1}
          value={hour}
          onChange={(event) => setHour(Number(event.target.value))}
          className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-ice"
        />
      </label>

      <p className="mt-2 text-xs leading-relaxed text-mist/90">
        Earth turns once every 24 hours, so every place swings through sunlight and shadow. The line between day and night
        is called the terminator — look for it on Earth in the 3D scene.
      </p>
      <p className="mt-1 text-[0.68rem] text-mist/75">
        Sunrise is at {sunriseHour}:00 in this simplified model, so daylight lasts 12 hours. Real day lengths change with
        the seasons.
      </p>
    </WidgetShell>
  )
}
function WidgetShell({ children, title }: { children: ReactNode; title: string }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/4 p-3">
      <p className="sse-label-text mb-2 text-[0.6rem]">{title}</p>
      {children}
    </div>
  )
}

/* ------------------------------------------------------------------ *
 * The Sun
 * ------------------------------------------------------------------ */

function SunWidget() {
  return (
    <WidgetShell title="Inside the Sun">
      <div className="flex flex-col items-center gap-3 sm:flex-row">
        <svg viewBox="0 0 160 160" className="h-40 w-40 shrink-0" role="img" aria-label="Cross-section of the Sun">
          <defs>
            <radialGradient id="sun-core" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="#fff6d0" />
              <stop offset="35%" stopColor="#ffd166" />
              <stop offset="70%" stopColor="#ff8a2b" />
              <stop offset="100%" stopColor="#c1350a" />
            </radialGradient>
          </defs>
          <motion.circle
            cx="80"
            cy="80"
            r="62"
            fill="url(#sun-core)"
            animate={{ opacity: [0.92, 1, 0.92], scale: [1, 1.03, 1] }}
            transition={{ duration: 3.6, repeat: Infinity }}
            style={{ transformOrigin: '80px 80px' }}
          />
          <circle cx="80" cy="80" r="28" fill="#fff8dc" opacity="0.22" />
          <circle cx="80" cy="80" r="9" fill="#fffdf5" />
          <circle cx="80" cy="80" r="76" fill="none" stroke="rgba(255,214,138,0.35)" strokeDasharray="4 6" />
        </svg>
        <div className="space-y-1.5 text-xs leading-relaxed text-parchment/90">
          <p>
            <strong className="text-solar">Core:</strong> about 15 million °C. Here hydrogen atoms are squeezed into
            helium — that is nuclear fusion.
          </p>
          <p>
            <strong className="text-solar">Surface:</strong> about {formatTemperature(SUN.temperatureC)}. This is the
            bright disc we see.
          </p>
          <p>
            <strong className="text-solar">Corona:</strong> the pale halo around the edge. It is hotter than the visible
            surface, and we still do not fully know why.
          </p>
          <p className="text-mist/85">
            Every second the Sun turns about 600 million tonnes of hydrogen into helium, and a little of that mass becomes
            pure energy.
          </p>
        </div>
      </div>
    </WidgetShell>
  )
}

/* ------------------------------------------------------------------ *
 * Seasons
 * ------------------------------------------------------------------ */

const SEASON_LABELS = [
  { angle: 0, label: 'Summer in the north' },
  { angle: 90, label: 'Autumn in the north' },
  { angle: 180, label: 'Winter in the north' },
  { angle: 270, label: 'Spring in the north' },
]

function SeasonsWidget() {
  const [angle, setAngle] = useState(0)
  const season = SEASON_LABELS[Math.round(angle / 90) % 4]
  const radians = (angle * Math.PI) / 180
  const orbitRadiusX = 86
  const earthX = 140 + Math.cos(radians) * orbitRadiusX
  const earthY = 92 + Math.sin(radians) * orbitRadiusX * 0.42

  return (
    <WidgetShell title="Why we have seasons">
      <svg viewBox="0 0 280 190" className="h-44 w-full" role="img" aria-label="Earth's tilt as it orbits the Sun">
        <defs>
          <radialGradient id="seasons-sun" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#fff3c4" />
            <stop offset="100%" stopColor="#ff8a2b" />
          </radialGradient>
        </defs>
        <ellipse cx="140" cy="92" rx="86" ry="36" fill="none" stroke="rgba(120,190,255,0.25)" strokeDasharray="4 6" />
        <circle cx="140" cy="92" r="16" fill="url(#seasons-sun)" />

        {/* The axis keeps leaning the same way all year — that is the whole story. */}
        <line x1={earthX} y1={earthY - 15} x2={earthX - 7} y2={earthY + 15} stroke="#ffd166" strokeWidth="2" />
        <circle cx={earthX} cy={earthY} r="10" fill="#2f7bff" />
        <circle cx={earthX} cy={earthY} r="10" fill="none" stroke="rgba(200,230,255,0.5)" />
        <text x={earthX} y={earthY - 24} textAnchor="middle" fill="#e8f1ff" fontSize="9">
          Earth
        </text>
        <text x="140" y="178" textAnchor="middle" fill="#9fb3d9" fontSize="11">
          {season.label}
        </text>
      </svg>

      <label className="mt-1 block">
        <span className="flex items-baseline justify-between text-xs text-parchment">
          <span>Move Earth around its orbit</span>
          <span className="sse-numeric text-ice">{Math.round(angle)}° of 360°</span>
        </span>
        <input
          type="range"
          min={0}
          max={270}
          step={5}
          value={angle}
          onChange={(event) => setAngle(Number(event.target.value))}
          className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-ice"
        />
      </label>

      <p className="mt-2 text-xs leading-relaxed text-mist/90">
        Earth leans over by 23.4° and that lean keeps pointing the same way as Earth travels. When your half leans toward
        the Sun you get summer; when it leans away you get winter. Distance from the Sun is not the reason — Earth is
        actually closest to the Sun in January!
      </p>
    </WidgetShell>
  )
}

/* ------------------------------------------------------------------ *
 * Moon phases
 * ------------------------------------------------------------------ */

const PHASE_PRESETS = [
  { label: 'New', value: 0 },
  { label: 'Crescent', value: 0.125 },
  { label: 'First quarter', value: 0.25 },
  { label: 'Gibbous', value: 0.375 },
  { label: 'Full', value: 0.5 },
  { label: 'Waning gibbous', value: 0.625 },
  { label: 'Last quarter', value: 0.75 },
  { label: 'Waning crescent', value: 0.875 },
]

/** The everyday name of a phase between 0 (new) and 1 (new again). */
export function phaseName(phase: number): string {
  const index = Math.round(phase * 8) % 8
  return PHASE_PRESETS[index].label
}

/** Draws the lit part of the Moon for a phase between 0 (new) and 1 (new again). */
function moonPhasePath(phase: number, radius = 52, centre = 70): string {
  const litRight = phase < 0.5
  const rx = Math.abs(Math.cos(2 * Math.PI * phase)) * radius
  const innerSweep = phase < 0.25 || phase > 0.75 ? 0 : 1
  const outerSweep = litRight ? 1 : 0
  return `M ${centre},${centre - radius} A ${radius},${radius} 0 0 ${outerSweep} ${centre},${centre + radius} A ${rx},${radius} 0 0 ${innerSweep} ${centre},${centre - radius}`
}

function MoonPhasesWidget() {
  const [phase, setPhase] = useState(0.25)

  return (
    <WidgetShell title="Why the Moon changes shape">
      <div className="flex flex-col items-center gap-3 sm:flex-row sm:items-start">
        <svg
          viewBox="0 0 140 140"
          className="h-32 w-32 shrink-0"
          role="img"
          aria-label="The Moon in its current phase"
        >
          <circle cx="70" cy="70" r="52" fill="#1a2035" stroke="rgba(200,215,240,0.25)" />
          <path d={moonPhasePath(phase)} fill="#e8e5df" />
          <circle cx="70" cy="70" r="52" fill="none" stroke="rgba(200,215,240,0.35)" />
        </svg>
        <div className="w-full">
          <div className="flex flex-wrap gap-1.5">
            {PHASE_PRESETS.map((preset) => (
              <button
                key={preset.label}
                type="button"
                aria-pressed={Math.abs(phase - preset.value) < 0.01}
                onClick={() => setPhase(preset.value)}
                className={`min-h-[2.1rem] rounded-lg border px-2 text-[0.68rem] transition-colors ${
                  Math.abs(phase - preset.value) < 0.01
                    ? 'border-ice/60 bg-ice/20 text-parchment'
                    : 'border-white/12 bg-white/4 text-mist hover:text-parchment'
                }`}
              >
                {preset.label}
              </button>
            ))}
          </div>
          <label className="mt-3 block">
            <span className="flex items-baseline justify-between text-xs text-parchment">
              <span>{phaseName(phase)}</span>
              <span className="sse-numeric text-ice">day {(phase * 29.5).toFixed(1)} of 29.5</span>
            </span>
            <input
              type="range"
              min={0}
              max={0.99}
              step={0.01}
              value={phase}
              onChange={(event) => setPhase(Number(event.target.value))}
              className="mt-2 h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-ice"
            />
          </label>
        </div>
      </div>

      <p className="mt-2 text-xs leading-relaxed text-mist/90">
        The Moon does not make its own light — it reflects sunlight, and half of it is always lit. As it orbits Earth we
        see different amounts of that lit half, and that is what we call a phase. The whole cycle takes about 29.5 days.
      </p>
    </WidgetShell>
  )
}

/* ------------------------------------------------------------------ *
 * Orbits
 * ------------------------------------------------------------------ */

function OrbitsWidget() {
  return (
    <WidgetShell title="Two things at once: falling and moving">
      <svg
        viewBox="0 0 260 160"
        className="h-44 w-full"
        role="img"
        aria-label="A planet orbiting with velocity and gravity arrows"
      >
        <defs>
          <marker id="arrow-moving" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="#4fd8ff" />
          </marker>
          <marker id="arrow-gravity" markerWidth="8" markerHeight="8" refX="4" refY="4" orient="auto">
            <path d="M 0 0 L 8 4 L 0 8 z" fill="#ff8a2b" />
          </marker>
        </defs>

        <ellipse cx="130" cy="80" rx="102" ry="58" fill="none" stroke="rgba(120,190,255,0.3)" strokeDasharray="4 6" />
        <circle cx="130" cy="80" r="14" fill="#ffb347" />
        <text x="130" y="84" textAnchor="middle" fill="#3a2103" fontSize="9">
          Sun
        </text>

        <motion.g
          animate={{ rotate: 360 }}
          transition={{ duration: 9, repeat: Infinity, ease: 'linear' }}
          style={{ transformOrigin: '130px 80px' }}
        >
          <circle cx="232" cy="80" r="8" fill="#2f7bff" />
          <line x1="232" y1="80" x2="232" y2="42" stroke="#4fd8ff" strokeWidth="2" markerEnd="url(#arrow-moving)" />
          <line x1="232" y1="80" x2="192" y2="80" stroke="#ff8a2b" strokeWidth="2" markerEnd="url(#arrow-gravity)" />
          <text x="238" y="32" fill="#4fd8ff" fontSize="9">
            moving
          </text>
          <text x="174" y="70" fill="#ff8a2b" fontSize="9">
            gravity
          </text>
        </motion.g>
      </svg>

      <p className="mt-2 text-xs leading-relaxed text-mist/90">
        A planet is always doing two things at once: moving forward, and being pulled toward the Sun. Those two together
        bend its path into an orbit — the planet is forever falling, and forever missing. That is why gravity keeps the
        planets moving around the Sun.
      </p>
      <p className="mt-1 text-[0.68rem] text-mist/75">
        Orbits are not perfect circles. They are slightly stretched ellipses, so every planet has a closest and a farthest
        point from the Sun.
      </p>
    </WidgetShell>
  )
}

/* ------------------------------------------------------------------ *
 * Dispatcher
 * ------------------------------------------------------------------ */

export function LessonWidget({ lessonId }: { lessonId: LessonId }) {
  switch (lessonId) {
    case 'sun':
      return <SunWidget />
    case 'sizes':
      return <SizesWidget />
    case 'distances':
      return <DistancesWidget />
    case 'gravity':
      return <GravityWidget />
    case 'day-night':
      return <DayNightWidget />
    case 'seasons':
      return <SeasonsWidget />
    case 'moon-phases':
      return <MoonPhasesWidget />
    case 'orbits':
      return <OrbitsWidget />
    default:
      return null
  }
}