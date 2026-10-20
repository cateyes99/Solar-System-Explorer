import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'
import { BODIES, BODY_IDS } from '../../data/planets'
import type { BodyId } from '../../data/types'
import { formatNumber } from '../../utils/format'
import { PlanetOrb } from '../ui/PlanetOrb'
import { Figure, LessonSection, ModelBadge } from './common'

const EARTH_G = 9.81
const DROP_METRES = 2
const SLOW_MOTION = 2
const DROP_PIXELS = 130

function DropColumn({ id, run, ballSize }: { id: BodyId; run: number; ballSize: number }) {
  const g = BODIES[id].surfaceGravity
  const seconds = Math.sqrt((2 * DROP_METRES) / g)
  return (
    <div className="flex flex-1 flex-col items-center">
      <div className="text-xs font-semibold text-slate-300">{BODIES[id].name.replace(/^The /, '')}</div>
      <div className="relative mt-1 h-[160px] w-full overflow-hidden rounded-xl bg-white/[0.03]">
        <motion.div
          key={run}
          className="absolute left-1/2 rounded-full bg-gradient-to-br from-rose-300 to-rose-600 shadow-[0_0_12px_rgba(251,113,133,0.6)]"
          style={{ width: ballSize, height: ballSize, marginLeft: -ballSize / 2, top: 4 }}
          initial={{ y: 0 }}
          animate={{ y: run > 0 ? DROP_PIXELS - ballSize + 16 : 0 }}
          transition={{ duration: run > 0 ? seconds * SLOW_MOTION : 0, ease: [0.11, 0, 0.5, 0] }}
        />
        <div className="absolute inset-x-2 bottom-2 h-1 rounded bg-white/25" />
      </div>
      <div className="mt-1 text-xs text-slate-400 tabular-nums">{formatNumber(seconds, 2)} s to land</div>
    </div>
  )
}

function WeightExplorer() {
  const [mass, setMass] = useState(30)
  const [where, setWhere] = useState<BodyId>('moon')
  const [run, setRun] = useState(0)
  const g = BODIES[where].surfaceGravity
  const feelsLike = (mass * g) / EARTH_G
  const ballSize = 10 + mass * 0.22

  return (
    <Figure>
      <label className="block">
        <span className="text-sm font-semibold text-white">
          Mass of your backpack: <span className="text-cyan-200 tabular-nums">{mass} kg</span>
        </span>
        <input type="range" className="range" min={1} max={100} value={mass} onChange={(e) => setMass(Number(e.target.value))} />
      </label>
      <div className="mt-1 flex flex-wrap gap-1.5" role="radiogroup" aria-label="Where are you?">
        {BODY_IDS.filter((id) => id !== 'earth').map((id) => (
          <button key={id} type="button" role="radio" aria-checked={where === id} className={`btn min-h-9 gap-1.5 px-2.5 text-xs ${where === id ? 'btn-active' : ''}`} onClick={() => setWhere(id)}>
            <PlanetOrb id={id} size={12} /> {BODIES[id].name.replace(/^The /, '')}
          </button>
        ))}
      </div>
      <p className="mt-3 rounded-xl bg-white/[0.05] p-3 text-[15px] leading-relaxed text-slate-200" aria-live="polite">
        {where === 'sun' ? 'If you could stand on the Sun (you can’t – it’s gas and far too hot!), ' : `On ${BODIES[where].name.replace(/^The /, 'the ')}, `}
        your {mass} kg backpack would feel as heavy as <strong className="text-amber-200">{formatNumber(feelsLike, feelsLike < 10 ? 1 : 0)} kg</strong> does on Earth.
      </p>
      <div className="mt-3 flex gap-3">
        <DropColumn id="earth" run={run} ballSize={ballSize} />
        <DropColumn id={where} run={run} ballSize={ballSize} />
      </div>
      <div className="mt-3 flex items-center gap-3">
        <button type="button" className="btn-primary" onClick={() => setRun((r) => r + 1)}>
          Drop it from 2 metres!
        </button>
        <span className="text-xs text-slate-400">Shown in slow motion. Try changing the mass – the fall time stays the same!</span>
      </div>
    </Figure>
  )
}

const W = 320
const H = 240
const START_R = 80
const BASE_GM = 560_000

function StarMassDemo() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [starMass, setStarMass] = useState(1)
  const [status, setStatus] = useState('Orbiting nicely')
  const massRef = useRef(starMass)
  const sim = useRef({ x: START_R, y: 0, vx: 0, vy: -Math.sqrt(BASE_GM / START_R), trail: [] as [number, number][], done: false })

  useEffect(() => {
    massRef.current = starMass
  }, [starMass])

  const reset = () => {
    sim.current = { x: START_R, y: 0, vx: 0, vy: -Math.sqrt(BASE_GM / START_R), trail: [], done: false }
    setStatus('Orbiting nicely')
  }

  useEffect(() => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return
    const dpr = Math.min(window.devicePixelRatio || 1, 2)
    canvas.width = W * dpr
    canvas.height = H * dpr
    ctx.scale(dpr, dpr)
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.033, (now - last) / 1000)
      last = now
      const s = sim.current
      const gm = BASE_GM * massRef.current
      const starRadius = 8 + Math.cbrt(massRef.current) * 8
      if (!s.done) {
        const steps = 8
        const h = dt / steps
        for (let i = 0; i < steps; i++) {
          const r2 = s.x * s.x + s.y * s.y
          const r = Math.sqrt(r2)
          const a = gm / r2
          s.vx -= (a * s.x) / r * h
          s.vy -= (a * s.y) / r * h
          s.x += s.vx * h
          s.y += s.vy * h
        }
        s.trail.push([s.x, s.y])
        if (s.trail.length > 240) s.trail.shift()
        const r = Math.hypot(s.x, s.y)
        if (r < starRadius) {
          s.done = true
          setStatus('Crash! The pull was so strong the planet fell into the star.')
        } else if (r > 260) {
          s.done = true
          setStatus('Escaped! The star was too light to hold on to the planet.')
        }
      }

      ctx.clearRect(0, 0, W, H)
      const cx = W / 2
      const cy = H / 2
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, starRadius * 2.4)
      glow.addColorStop(0, 'rgba(255,240,190,1)')
      glow.addColorStop(0.4, 'rgba(255,170,70,0.9)')
      glow.addColorStop(1, 'rgba(255,120,30,0)')
      ctx.fillStyle = glow
      ctx.beginPath()
      ctx.arc(cx, cy, starRadius * 2.4, 0, Math.PI * 2)
      ctx.fill()

      ctx.strokeStyle = 'rgba(96,165,250,0.55)'
      ctx.lineWidth = 2
      ctx.beginPath()
      s.trail.forEach(([x, y], i) => (i === 0 ? ctx.moveTo(cx + x, cy + y) : ctx.lineTo(cx + x, cy + y)))
      ctx.stroke()

      const px = cx + s.x
      const py = cy + s.y
      const r = Math.hypot(s.x, s.y) || 1
      const pull = Math.min(60, (gm / (r * r)) * 0.6)
      ctx.strokeStyle = '#fdba74'
      ctx.lineWidth = 3
      ctx.beginPath()
      ctx.moveTo(px, py)
      ctx.lineTo(px - (s.x / r) * pull, py - (s.y / r) * pull)
      ctx.stroke()

      ctx.fillStyle = '#4f8edc'
      ctx.strokeStyle = '#bfdbfe'
      ctx.lineWidth = 2
      ctx.beginPath()
      ctx.arc(px, py, 7, 0, Math.PI * 2)
      ctx.fill()
      ctx.stroke()
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <Figure caption={<ModelBadge>Simplified gravity simulation</ModelBadge>}>
      <canvas ref={canvasRef} className="h-auto w-full" style={{ aspectRatio: `${W} / ${H}` }} role="img" aria-label={`A planet orbiting a star with ${starMass} times the Sun's mass. ${status}`} />
      <label className="mt-2 block">
        <span className="text-sm font-semibold text-white">
          Star’s mass: <span className="text-amber-200 tabular-nums">{formatNumber(starMass, 2)}× the Sun</span>
        </span>
        <input type="range" className="range" min={0.2} max={3} step={0.05} value={starMass} onChange={(e) => setStarMass(Number(e.target.value))} />
      </label>
      <div className="flex items-center gap-3">
        <button type="button" className="btn" onClick={reset}>
          Reset planet
        </button>
        <p className="text-sm font-semibold text-amber-100" aria-live="polite">
          {status}
        </p>
      </div>
    </Figure>
  )
}

export default function GravityLesson() {
  return (
    <div>
      <LessonSection title="What is gravity?">
        <p>
          Gravity is an invisible pull between things that have mass. The more mass something has, the harder it pulls. Earth’s gravity
          keeps your feet on the ground, and the Sun’s gravity keeps Earth in its orbit.
        </p>
      </LessonSection>
      <LessonSection title="Weigh your backpack on other worlds">
        <p>Your backpack’s mass stays the same everywhere – but how heavy it feels depends on how strongly the world pulls on it.</p>
      </LessonSection>
      <WeightExplorer />
      <LessonSection title="Make the star heavier or lighter">
        <p>Slide the star’s mass and watch what happens to the planet. A heavier star pulls harder; a lighter one might let the planet escape!</p>
      </LessonSection>
      <StarMassDemo />
    </div>
  )
}
