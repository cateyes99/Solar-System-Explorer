import { useEffect, useRef, useState } from 'react'
import { LessonHeading, LessonText, SeeIn3D } from './FoundationLessons'
import { useSimStore } from '../../../store/simulationStore'

/**
 * Simple, honest gravity demo: increase the planet's mass and the orbiting
 * moon speeds up (v = √(GM/r), exactly how real orbits work).
 */
export function GravityLesson() {
  const [mass, setMass] = useState(1)
  const moonRef = useRef<SVGGElement>(null)

  useEffect(() => {
    let frame = 0
    let angle = 0.4
    let last = performance.now()
    // Real physics: orbital angular speed scales with the square root of mass
    const angularSpeed = 1.1 * Math.sqrt(mass)

    const loop = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.05)
      last = now
      angle += angularSpeed * dt
      moonRef.current?.setAttribute(
        'transform',
        `rotate(${(angle * 180) / Math.PI} 170 115)`,
      )
      frame = requestAnimationFrame(loop)
    }
    frame = requestAnimationFrame(loop)
    return () => cancelAnimationFrame(frame)
  }, [mass])

  const planetRadius = 24 * Math.cbrt(mass)
  const speedFactor = Math.sqrt(mass)

  return (
    <div className="space-y-4">
      <LessonHeading>Gravity — the invisible tug</LessonHeading>
      <LessonText>
        Anything with mass pulls on other things. The bigger the mass, the stronger the pull —
        that is <strong>gravity</strong>. It is why you stay on the ground, why the Moon circles
        Earth, and why Earth circles the Sun.
      </LessonText>

      <div className="rounded-2xl border border-white/10 bg-space-950/60 p-3">
        <svg viewBox="0 0 340 230" className="w-full" role="img" aria-label="A moon orbiting a planet whose mass you can change">
          <ellipse
            cx="170"
            cy="115"
            rx="120"
            ry="72"
            fill="none"
            stroke="#38bdf8"
            strokeOpacity="0.4"
            strokeDasharray="4 8"
          />
          {/* Central planet, sized by mass */}
          <circle cx="170" cy="115" r={planetRadius + 14} fill="#4ea3ff" fillOpacity="0.15" />
          <circle cx="170" cy="115" r={planetRadius} fill="#4ea3ff" />
          <text
            x="170"
            y={115 + planetRadius + 26}
            textAnchor="middle"
            fill="#9fb6ff"
            fontSize="11"
            fontFamily="Inter, sans-serif"
          >
            {mass.toFixed(1)}× mass
          </text>

          <g ref={moonRef}>
            <circle cx={170 + 120} cy={115} r="8" fill="#d8d3ca" />
            <line x1={170 + 60} y1={115} x2={170 + 112} y2={115} stroke="#ff8c1a" strokeWidth="2.5" markerEnd="" opacity="0.85" />
          </g>

          <g transform="translate(24 26)">
            <circle r="5" fill="#ffb347" />
            <text x="12" y="4" fill="#ffd9a8" fontSize="11" fontFamily="Inter, sans-serif">
              pull gets stronger →
            </text>
          </g>
        </svg>
      </div>

      <label className="block rounded-xl border border-white/10 bg-white/5 px-3 py-3">
        <span className="mb-2 flex items-center justify-between text-sm font-semibold text-white">
          Change the planet's mass
          <span className="text-cyan-300 tabular-nums">{mass.toFixed(1)}×</span>
        </span>
        <input
          type="range"
          min={0.4}
          max={3}
          step={0.1}
          value={mass}
          onChange={(event) => setMass(Number(event.target.value))}
          className="w-full"
          aria-label="Planet mass multiplier"
        />
        <span className="mt-1 block text-[11px] text-white/55">
          Moon orbits at about {speedFactor.toFixed(2)}× the speed of a real Moon (gravity is
          stronger, so it has to go faster to keep from falling in).
        </span>
      </label>

      <div className="rounded-xl border border-cyan-400/30 bg-cyan-400/10 p-3 text-[13px] leading-relaxed text-cyan-100">
        <strong>Try this thought:</strong> if the Sun were four times more massive, Earth would
        need to travel <strong>twice</strong> as fast to keep the same orbit — because the square
        root of 4 is 2. That is real orbital physics, exactly as NASA uses it!
      </div>

      <SeeIn3D
        label="🌍 Watch gravity at work around the Sun"
        onClick={() => {
          useSimStore.getState().viewSystem()
          useSimStore.getState().closePanel()
        }}
      />
    </div>
  )
}
