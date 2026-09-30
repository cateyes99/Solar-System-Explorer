import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { PLANETS, MOON_BODY, type Body } from '../../../data/planets'
import { formatDistance } from '../../../utils/astronomy'
import { LessonHeading, LessonText, SeeIn3D } from './FoundationLessons'
import { useSimStore } from '../../../store/simulationStore'

const COMPARISON_BODIES: Body[] = [...PLANETS, MOON_BODY]

const MAX_PIXEL = 240

function ComparisonDisc({ body, maxSize }: { body: Body; maxSize: number }) {
  const ratio = body.diameterKm / maxSize
  const size = Math.max(14, ratio * MAX_PIXEL)

  return (
    <div className="flex flex-col items-center gap-2">
      <motion.div
        layout
        animate={{ width: size, height: size }}
        transition={{ type: 'spring', stiffness: 200, damping: 24 }}
        className="rounded-full"
        style={{
          background: `radial-gradient(circle at 32% 30%, #ffffff33, ${body.color} 55%, #00000088)`,
          boxShadow: `0 0 30px ${body.color}55`,
        }}
        role="img"
        aria-label={`${body.name} drawn to relative size`}
      />
      <div className="text-center">
        <div className="font-display text-sm font-semibold text-white">{body.name}</div>
        <div className="text-[11px] text-white/60">{body.diameterKm.toLocaleString()} km wide</div>
      </div>
    </div>
  )
}

/** Planet size comparison with animation. */
export function SizesLesson() {
  const [leftId, setLeftId] = useState('earth')
  const [rightId, setRightId] = useState('jupiter')
  const focusBody = useSimStore((s) => s.focusBody)

  const left = COMPARISON_BODIES.find((b) => b.id === leftId) ?? COMPARISON_BODIES[2]
  const right = COMPARISON_BODIES.find((b) => b.id === rightId) ?? COMPARISON_BODIES[5]
  const maxSize = Math.max(left.diameterKm, right.diameterKm)

  const widthRatio = useMemo(
    () => Math.max(left.diameterKm, right.diameterKm) / Math.min(left.diameterKm, right.diameterKm),
    [left, right],
  )
  const volumeRatio = useMemo(() => widthRatio ** 3, [widthRatio])

  const big = left.diameterKm >= right.diameterKm ? left : right
  const small = left.diameterKm >= right.diameterKm ? right : left

  return (
    <div className="space-y-4">
      <LessonHeading>Planet sizes — how big is big?</LessonHeading>
      <LessonText>
        Pick two worlds and watch them line up. The circles below are drawn to their true size
        compared with each other.
      </LessonText>

      <div className="space-y-2">
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose first body">
          {COMPARISON_BODIES.map((body) => (
            <button
              key={`a-${body.id}`}
              type="button"
              className="chip !text-[11px]"
              data-active={leftId === body.id ? 'true' : 'false'}
              aria-pressed={leftId === body.id}
              onClick={() => setLeftId(body.id)}
            >
              {body.name}
            </button>
          ))}
        </div>
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Choose second body">
          {COMPARISON_BODIES.map((body) => (
            <button
              key={`b-${body.id}`}
              type="button"
              className="chip chip-solar !text-[11px]"
              data-active={rightId === body.id ? 'true' : 'false'}
              aria-pressed={rightId === body.id}
              onClick={() => setRightId(body.id)}
            >
              {body.name}
            </button>
          ))}
        </div>
      </div>

      <div className="flex min-h-[16rem] items-end justify-center gap-8 rounded-2xl border border-white/10 bg-space-950/60 p-4">
        <ComparisonDisc body={left} maxSize={maxSize} />
        <ComparisonDisc body={right} maxSize={maxSize} />
      </div>

      <motion.div
        key={`${left.id}-${right.id}`}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-sm leading-relaxed text-cyan-100"
      >
        <strong>{big.name}</strong> is about <strong>{widthRatio.toFixed(widthRatio < 10 ? 1 : 0)}×</strong>{' '}
        wider than <strong>{small.name}</strong>. That means roughly{' '}
        <strong>{Math.round(volumeRatio).toLocaleString()}</strong> {small.name}s would fit inside{' '}
        {big.name}!
      </motion.div>

      <SeeIn3D
        label={`🔍 Look at ${right.name}`}
        onClick={() => {
          focusBody(right.id)
          useSimStore.getState().closePanel()
        }}
      />
    </div>
  )
}

/** How far the planets really are (log scale + light travel time). */
export function DistancesLesson() {
  const focusBody = useSimStore((s) => s.focusBody)

  const rows = useMemo(() => {
    const maxLog = Math.log10(31)
    return PLANETS.map((planet) => {
      const au = planet.distanceFromSunKm / 149_600_000
      return {
        planet,
        au,
        width: (Math.log10(au + 1) / maxLog) * 100,
        lightMinutes: au * 8.32,
      }
    })
  }, [])

  return (
    <div className="space-y-4">
      <LessonHeading>Distances — how far is far?</LessonHeading>
      <LessonText>
        Distances in space are enormous, so we measure them in <strong>AU</strong> — one AU is the
        distance from the Sun to Earth (149.6 million km). The bars use a compressed scale,
        otherwise Neptune's bar would run off the screen!
      </LessonText>

      <ul className="space-y-2.5">
        {rows.map((row) => (
          <li key={row.planet.id}>
            <div className="mb-1 flex items-baseline justify-between gap-2 text-xs">
              <button
                type="button"
                className="font-display font-semibold text-white hover:text-cyan-300"
                onClick={() => focusBody(row.planet.id)}
              >
                {row.planet.name}
              </button>
              <span className="text-white/60 tabular-nums">
                {row.au.toFixed(2)} AU · {formatDistance(row.planet.distanceFromSunKm)}
              </span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-white/10">
              <motion.div
                className="h-full rounded-full"
                style={{ background: row.planet.color, boxShadow: `0 0 12px ${row.planet.color}` }}
                initial={{ width: 0 }}
                animate={{ width: `${row.width}%` }}
                transition={{ duration: 1, delay: 0.1, ease: 'easeOut' }}
              />
            </div>
            <div className="mt-0.5 text-[11px] text-cyan-200/70">
              Sunlight reaches here in about {row.lightMinutes < 100 ? row.lightMinutes.toFixed(1) : Math.round(row.lightMinutes)}{' '}
              minutes
            </div>
          </li>
        ))}
      </ul>

      <div className="rounded-xl border border-solar-400/30 bg-solar-400/10 p-3 text-[13px] leading-relaxed text-solar-200">
        <strong>Did you know?</strong> Sunlight takes 8 minutes and 20 seconds to reach Earth —
        and more than 4 hours to reach Neptune. When you look at Neptune through a telescope, you
        are seeing it as it was hours ago!
      </div>
    </div>
  )
}
