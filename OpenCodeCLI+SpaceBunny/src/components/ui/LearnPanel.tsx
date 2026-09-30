import { useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { LESSONS, LESSON_BY_ID } from '../../data/lessons'
import { PLANET_BY_ID } from '../../data/planets'
import { useAppStore } from '../../store/useAppStore'
import { useLessonStore } from '../../store/useLessonStore'
import { Icon } from './Icon'
import { Button } from './primitives/Button'
import { Pill, Slider } from './primitives/Controls'
import { Panel } from './primitives/Panel'
import { GRAVITY_EXPLANATIONS, gravityOutcome } from '../../utils/gravity'
import { formatDistanceKm } from '../../utils/astronomy'
import { AU_KM } from '../../data/planets'
import { spaceAudio } from '../../utils/audio'
import type { LessonId } from '../../types'

export function LearnPanel() {
  const panel = useAppStore((s) => s.panel)
  const lessonId = useAppStore((s) => s.lessonId)
  const openLesson = useAppStore((s) => s.openLesson)
  const closeLesson = useAppStore((s) => s.closeLesson)
  const setPanel = useAppStore((s) => s.setPanel)

  const active = lessonId ? LESSON_BY_ID[lessonId] : null

  return (
    <AnimatePresence>
      {panel === 'learn' &&
        (active ? (
          <LessonPanelBody
            key="lesson"
            lessonId={lessonId!}
            onBack={() => {
              closeLesson()
              setPanel('learn')
            }}
          />
        ) : (
          <Panel
            key="lessons"
            title="Explore & Learn"
            eyebrow="Eight short lessons"
            onClose={() => setPanel(null)}
          >
            <LessonList onOpen={openLesson} />
          </Panel>
        ))}
    </AnimatePresence>
  )
}

function LessonList({ onOpen }: { onOpen: (id: LessonId) => void }) {
  return (
    <div className="space-y-2.5">
      <p className="text-[13px] leading-relaxed text-ice-200/80">
        Pick a topic. Each one opens a live 3D scene you can play with — nothing here is a static picture.
      </p>
      {LESSONS.map((lesson) => (
        <button
          key={lesson.id}
          type="button"
          onClick={() => {
            onOpen(lesson.id)
            spaceAudio.play('whoosh')
          }}
          className="group flex w-full items-start gap-3.5 rounded-xl border border-edge bg-white/3 p-3.5 text-left transition-colors hover:border-edge-strong hover:bg-white/7 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
        >
          <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-edge bg-white/5 text-cyan-200 transition-colors group-hover:text-ice-50">
            <Icon name={lesson.icon} size={17} />
          </span>
          <span className="min-w-0 flex-1">
            <span className="flex items-baseline justify-between gap-2">
              <span className="text-[13.5px] font-semibold text-ice-50">{lesson.title}</span>
              <span className="shrink-0 text-[10px] font-medium tracking-wider text-ice-400/70 uppercase">
                {lesson.kicker}
              </span>
            </span>
            <span className="mt-1 block text-[12px] leading-relaxed text-ice-200/70">{lesson.summary}</span>
          </span>
          <Icon name="chevron-right" size={16} className="mt-2 shrink-0 text-ice-400/60" />
        </button>
      ))}
    </div>
  )
}

function LessonPanelBody({ lessonId, onBack }: { lessonId: LessonId; onBack: () => void }) {
  const lesson = LESSON_BY_ID[lessonId]
  const [step, setStep] = useState(0)
  const current = lesson.steps[Math.min(step, lesson.steps.length - 1)]
  const isLast = step >= lesson.steps.length - 1

  return (
    <Panel
      title={lesson.title}
      eyebrow={lesson.kicker}
      onClose={onBack}
      footer={
        <div className="flex items-center justify-between gap-3">
          <Button size="sm" icon="back" onClick={() => setStep((s) => Math.max(0, s - 1))} disabled={step === 0}>
            Back
          </Button>
          <div className="flex items-center gap-1.5" role="group" aria-label="Lesson steps">
            {lesson.steps.map((s, i) => (
              <button
                key={s.title}
                type="button"
                aria-label={`Step ${i + 1}: ${s.title}`}
                aria-current={i === step}
                onClick={() => setStep(i)}
                className={`h-1.5 rounded-full transition-all duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                  i === step ? 'w-5 bg-cyan-glow' : 'w-1.5 bg-white/25 hover:bg-white/45'
                }`}
              />
            ))}
          </div>
          <Button
            size="sm"
            iconAfter="chevron-right"
            variant={isLast ? 'solid' : 'ghost'}
            onClick={() => {
              setStep((s) => Math.min(lesson.steps.length - 1, s + 1))
              spaceAudio.play('click')
            }}
            disabled={isLast}
          >
            {isLast ? 'Done' : 'Next'}
          </Button>
        </div>
      }
    >
      <div className="space-y-5">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-ice-50">{current.title}</h3>
          <p className="mt-2 text-[13.5px] leading-relaxed text-ice-200/85">{current.body}</p>
        </div>

        <LessonControls lessonId={lessonId} />

        {isLast && (
          <section className="rounded-xl border border-cyan-glow/25 bg-cyan-glow/8 p-4">
            <h3 className="flex items-center gap-2 text-[12px] font-semibold tracking-[0.16em] text-cyan-200 uppercase">
              <Icon name="sparkle" size={15} />
              Remember
            </h3>
            <p className="mt-2 text-[13px] leading-relaxed text-ice-100/90">{lesson.takeaway}</p>
          </section>
        )}
      </div>
    </Panel>
  )
}

/** Interactive controls specific to each lesson's 3D scene. */
function LessonControls({ lessonId }: { lessonId: LessonId }) {
  const fuse = useLessonStore((s) => s.fuse)
  const pick = useLessonStore((s) => s.pick)
  const clearPick = useLessonStore((s) => s.clearPick)
  const mass = useLessonStore((s) => s.mass)
  const setMass = useLessonStore((s) => s.setMass)
  const speedFactor = useLessonStore((s) => s.speedFactor)
  const setSpeedFactor = useLessonStore((s) => s.setSpeedFactor)
  const seasonAngle = useLessonStore((s) => s.seasonAngle)
  const setSeasonAngle = useLessonStore((s) => s.setSeasonAngle)
  const moonAngle = useLessonStore((s) => s.moonAngle)
  const setMoonAngle = useLessonStore((s) => s.setMoonAngle)
  const orbitsPaused = useLessonStore((s) => s.orbitsPaused)
  const toggleOrbitsPaused = useLessonStore((s) => s.toggleOrbitsPaused)

  switch (lessonId) {
    case 'sun':
      return (
        <div className="rounded-xl border border-edge bg-white/3 p-4">
          <Button icon="sparkle" onClick={fuse} className="w-full">
            Trigger a fusion flash
          </Button>
          <p className="mt-2 text-center text-[11px] text-ice-400/70">
            Watch the hydrogen stream heat up as it falls into the core.
          </p>
        </div>
      )

    case 'sizes':
      return <SizesControl pick={pick} clearPick={clearPick} />

    case 'gravity':
      return <GravityControl mass={mass} setMass={setMass} speedFactor={speedFactor} setSpeedFactor={setSpeedFactor} />

    case 'seasons':
      return (
        <div className="space-y-3 rounded-xl border border-edge bg-white/3 p-4">
          <Slider
            label="Move Earth around the Sun"
            value={seasonAngle}
            min={0}
            max={Math.PI * 2}
            step={0.02}
            onChange={setSeasonAngle}
            format={(v) => {
              const months = [
                'March (spring in the north)',
                'June (summer in the north)',
                'September (autumn in the north)',
                'December (winter in the north)',
              ]
              return months[Math.round((v / (Math.PI * 2)) * 4) % 4]
            }}
            hint="The axis keeps pointing the same way as Earth moves. Watch which pole leans towards the Sun."
          />
        </div>
      )

    case 'moon-phases':
      return <MoonPhaseControl angle={moonAngle} setAngle={setMoonAngle} />

    case 'day-night':
      return (
        <div className="rounded-xl border border-edge bg-white/3 p-4">
          <p className="text-[12px] leading-relaxed text-ice-200/80">
            Earth turns once every 24 hours. The Sun only ever lights one half at a time, so anywhere you are
            standing right now, it is somebody else&apos;s midnight.
          </p>
        </div>
      )

    case 'orbits':
      return (
        <div className="rounded-xl border border-edge bg-white/3 p-4">
          <Button
            icon={orbitsPaused ? 'play' : 'pause'}
            onClick={toggleOrbitsPaused}
            className="w-full"
          >
            {orbitsPaused ? 'Let it move again' : 'Freeze the motion'}
          </Button>
          <div className="mt-3 flex items-center gap-2 text-[11px]">
            <span className="inline-block h-2 w-2 rounded-full bg-cyan-glow" />
            <span className="text-ice-200/80">blue arrow = speed carrying it forward</span>
          </div>
          <div className="mt-1.5 flex items-center gap-2 text-[11px]">
            <span className="inline-block h-2 w-2 rounded-full bg-solar" />
            <span className="text-ice-200/80">orange arrow = gravity pulling it in</span>
          </div>
        </div>
      )

    case 'distances':
    default:
      return <DistancesControl />
  }
}

function SizesControl({ pick, clearPick }: { pick: string[]; clearPick: () => void }) {
  const compare = pick.map((id) => PLANET_BY_ID[id as keyof typeof PLANET_BY_ID])
  const a = compare[0]
  const b = compare[1]

  return (
    <div className="space-y-3 rounded-xl border border-edge bg-white/3 p-4">
      <p className="text-[12px] leading-relaxed text-ice-200/80">
        {pick.length < 2
          ? 'Tap a planet in the scene to build a comparison.'
          : 'Here is the honest comparison.'}
      </p>

      {pick.length === 2 && a && b && (
        <div className="space-y-2 rounded-lg border border-edge bg-black/25 p-3">
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] font-semibold text-ice-50">{a.name}</span>
            <span className="font-mono text-[12px] text-cyan-200">{a.diameterKm.toLocaleString()} km</span>
          </div>
          <div className="flex items-baseline justify-between gap-3">
            <span className="text-[13px] font-semibold text-ice-50">{b.name}</span>
            <span className="font-mono text-[12px] text-cyan-200">{b.diameterKm.toLocaleString()} km</span>
          </div>
          <div className="mt-1 border-t border-edge pt-2 text-[12px] leading-relaxed text-ice-200/80">
            {b.diameterKm >= a.diameterKm ? (
              <>
                <strong className="text-ice-50">{b.name}</strong> is {(b.diameterKm / a.diameterKm).toFixed(1)}×
                wider and about {Math.pow(b.diameterKm / a.diameterKm, 3).toFixed(0)}× more room inside than{' '}
                {a.name}.
              </>
            ) : (
              <>
                <strong className="text-ice-50">{a.name}</strong> is {(a.diameterKm / b.diameterKm).toFixed(1)}×
                wider and about {Math.pow(a.diameterKm / b.diameterKm, 3).toFixed(0)}× more room inside than{' '}
                {b.name}.
              </>
            )}
          </div>
        </div>
      )}

      <Button size="sm" onClick={clearPick} className="w-full">
        Reset comparison
      </Button>
    </div>
  )
}

function GravityControl({
  mass,
  setMass,
  speedFactor,
  setSpeedFactor,
}: {
  mass: number
  setMass: (v: number) => void
  speedFactor: number
  setSpeedFactor: (v: number) => void
}) {
  const message = GRAVITY_EXPLANATIONS[gravityOutcome(speedFactor)]

  return (
    <div className="space-y-4 rounded-xl border border-edge bg-white/3 p-4">
      <Slider
        label="Mass of the star"
        value={mass}
        min={0.2}
        max={3}
        step={0.05}
        onChange={setMass}
        format={(v) => (v > 2.4 ? 'Black hole' : `${v.toFixed(2)} × Sun`)}
        accent="warm"
        hint="More mass means a deeper well and a tighter orbit."
      />
      <Slider
        label="Launch speed"
        value={speedFactor}
        min={0.5}
        max={1.8}
        step={0.01}
        onChange={setSpeedFactor}
        format={(v) => `${v.toFixed(2)}× the circular speed`}
        hint="1.00× is the speed that produces a circular orbit."
      />
      <div className="rounded-lg border border-edge bg-black/25 p-3">
        <p className={`text-[12.5px] font-semibold ${message.tone}`}>{message.title}</p>
        <p className="mt-1 text-[11.5px] leading-relaxed text-ice-200/75">{message.body}</p>
      </div>
    </div>
  )
}

const MOON_PHASES = [
  { angle: 0, name: 'New Moon', note: 'The lit half faces away from us, so the Moon is invisible.' },
  { angle: Math.PI / 4, name: 'Waxing Crescent', note: 'A sliver appears on the right after sunset.' },
  { angle: Math.PI / 2, name: 'First Quarter', note: 'Half of the Moon is lit — and it rises at noon.' },
  { angle: (3 * Math.PI) / 4, name: 'Waxing Gibbous', note: 'More than half is lit and still growing.' },
  { angle: Math.PI, name: 'Full Moon', note: 'The whole lit face is turned towards Earth. It rises at sunset.' },
  { angle: (5 * Math.PI) / 4, name: 'Waning Gibbous', note: 'Still more than half, but now it is shrinking.' },
  { angle: (3 * Math.PI) / 2, name: 'Last Quarter', note: 'Half lit again, rising in the middle of the night.' },
  { angle: (7 * Math.PI) / 4, name: 'Waning Crescent', note: 'The last sliver, visible just before sunrise.' },
]

function MoonPhaseControl({ angle, setAngle }: { angle: number; setAngle: (v: number) => void }) {
  // Find the nearest named phase to the current slider position.
  const nearest = MOON_PHASES.reduce((best, phase) =>
    Math.abs(phase.angle - angle) < Math.abs(best.angle - angle) ? phase : best,
  )
  const snapped = Math.abs(nearest.angle - angle) < 0.09

  return (
    <div className="space-y-3 rounded-xl border border-edge bg-white/3 p-4">
      <div className="flex flex-wrap gap-1.5">
        {MOON_PHASES.map((phase) => {
          const active = snapped && phase.name === nearest.name
          return (
            <button
              key={phase.name}
              type="button"
              onClick={() => setAngle(phase.angle)}
              aria-pressed={active}
              className={`rounded-full border px-2.5 py-1 text-[11px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow ${
                active ? 'border-cyan-glow/50 bg-cyan-glow/15 text-cyan-100' : 'border-edge text-ice-400 hover:text-ice-200'
              }`}
            >
              {phase.name}
            </button>
          )
        })}
      </div>
      <Slider
        label="Moon position"
        value={angle}
        min={0}
        max={Math.PI * 2}
        step={0.01}
        onChange={setAngle}
        format={(v) => `${Math.round((v / (Math.PI * 2)) * 100)}% around the orbit`}
      />
      <AnimatePresence mode="wait">
        <motion.div
          key={nearest.name}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
          className="rounded-lg border border-edge bg-black/25 p-3"
        >
          <p className="text-[12.5px] font-semibold text-cyan-200">{nearest.name}</p>
          <p className="mt-1 text-[11.5px] leading-relaxed text-ice-200/75">{nearest.note}</p>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}

function DistancesControl() {
  return (
    <div className="space-y-3 rounded-xl border border-edge bg-white/3 p-4">
      <p className="text-[12px] leading-relaxed text-ice-200/80">
        Distances are shown on a curved road so Neptune still fits on screen. Here are the real numbers:
      </p>
      <div className="space-y-1.5">
        {Object.values(PLANET_BY_ID).map((planet) => (
          <div key={planet.id} className="flex items-center gap-2">
            <span className="w-16 shrink-0 truncate text-[11.5px] text-ice-200/80">{planet.name}</span>
            <div className="h-1.5 min-w-0 flex-1 overflow-hidden rounded-full bg-white/8">
              <div
                className="h-full rounded-full"
                style={{
                  width: `${(planet.semiMajorAxisAU / 30.07) * 100}%`,
                  background: planet.accentColor,
                }}
              />
            </div>
            <span className="w-24 shrink-0 text-right font-mono text-[10.5px] text-ice-400">
              {formatDistanceKm(planet.semiMajorAxisAU * AU_KM)}
            </span>
          </div>
        ))}
      </div>
      <Pill tone="muted">1 AU = 149,597,870 km, the Earth–Sun distance</Pill>
    </div>
  )
}