import { useEffect, useRef, useState } from 'react'
import { Icon } from '../ui/Icon'
import { Figure, LessonSection, ModelBadge } from './common'

const CX = 160
const CY = 130
const R = 85
const ANGULAR_SPEED = 0.9

/** A planet circling a star, with arrows showing speed and gravity. Gravity can be switched off. */
function OrbitDemo() {
  const planetRef = useRef<SVGCircleElement>(null)
  const velocityRef = useRef<SVGLineElement>(null)
  const gravityRef = useRef<SVGLineElement>(null)
  const trailRef = useRef<SVGPolylineElement>(null)
  const [gravityOn, setGravityOn] = useState(true)
  const [escaped, setEscaped] = useState(false)
  const sim = useRef({ angle: -Math.PI / 2, x: CX, y: CY - R, vx: 0, vy: 0, trail: [] as string[] })

  useEffect(() => {
    let frame = 0
    let last = performance.now()
    const tick = (now: number) => {
      const dt = Math.min(0.05, (now - last) / 1000)
      last = now
      const s = sim.current
      if (gravityOn) {
        s.angle += ANGULAR_SPEED * dt
        s.x = CX + Math.cos(s.angle) * R
        s.y = CY + Math.sin(s.angle) * R
        s.vx = -Math.sin(s.angle) * R * ANGULAR_SPEED
        s.vy = Math.cos(s.angle) * R * ANGULAR_SPEED
      } else {
        s.x += s.vx * dt
        s.y += s.vy * dt
        if (s.x < -40 || s.x > 360 || s.y < -40 || s.y > 300) setEscaped(true)
      }
      s.trail.push(`${s.x.toFixed(1)},${s.y.toFixed(1)}`)
      if (s.trail.length > 70) s.trail.shift()
      planetRef.current?.setAttribute('cx', String(s.x))
      planetRef.current?.setAttribute('cy', String(s.y))
      trailRef.current?.setAttribute('points', s.trail.join(' '))
      const speed = Math.hypot(s.vx, s.vy) || 1
      velocityRef.current?.setAttribute('x1', String(s.x))
      velocityRef.current?.setAttribute('y1', String(s.y))
      velocityRef.current?.setAttribute('x2', String(s.x + (s.vx / speed) * 48))
      velocityRef.current?.setAttribute('y2', String(s.y + (s.vy / speed) * 48))
      const gx = CX - s.x
      const gy = CY - s.y
      const gl = Math.hypot(gx, gy) || 1
      gravityRef.current?.setAttribute('x1', String(s.x))
      gravityRef.current?.setAttribute('y1', String(s.y))
      gravityRef.current?.setAttribute('x2', String(s.x + (gx / gl) * 40))
      gravityRef.current?.setAttribute('y2', String(s.y + (gy / gl) * 40))
      gravityRef.current?.setAttribute('opacity', gravityOn ? '1' : '0')
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [gravityOn])

  const reset = () => {
    sim.current = { angle: -Math.PI / 2, x: CX, y: CY - R, vx: 0, vy: 0, trail: [] }
    setEscaped(false)
    setGravityOn(true)
  }

  return (
    <Figure
      caption={
        <span>
          <span className="font-semibold text-cyan-300">Cyan arrow</span>: the planet’s speed ·{' '}
          <span className="font-semibold text-orange-300">Orange arrow</span>: gravity’s pull
        </span>
      }
    >
      <svg viewBox="0 0 320 260" className="h-auto w-full" role="img" aria-label={gravityOn ? 'A planet orbiting a star' : 'Gravity is off: the planet flies away in a straight line'}>
        <defs>
          <marker id="arrow-cyan" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10z" fill="#67e8f9" />
          </marker>
          <marker id="arrow-orange" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0 L10 5 L0 10z" fill="#fdba74" />
          </marker>
          <radialGradient id="orbit-star">
            <stop offset="0%" stopColor="#fff4c2" />
            <stop offset="60%" stopColor="#ffb347" />
            <stop offset="100%" stopColor="#ff7a1a" stopOpacity="0" />
          </radialGradient>
        </defs>
        <circle cx={CX} cy={CY} r={R} fill="none" stroke="rgba(255,255,255,0.15)" strokeDasharray="4 6" />
        <circle cx={CX} cy={CY} r={34} fill="url(#orbit-star)" />
        <circle cx={CX} cy={CY} r={16} fill="#ffc14d" />
        <polyline ref={trailRef} fill="none" stroke="rgba(96,165,250,0.5)" strokeWidth={3} strokeLinecap="round" />
        <line ref={gravityRef} stroke="#fdba74" strokeWidth={3} markerEnd="url(#arrow-orange)" />
        <line ref={velocityRef} stroke="#67e8f9" strokeWidth={3} markerEnd="url(#arrow-cyan)" />
        <circle ref={planetRef} r={10} fill="#4f8edc" stroke="#bfdbfe" strokeWidth={2} />
      </svg>
      <div className="mt-2 flex flex-wrap justify-center gap-2">
        <button type="button" className="btn-primary" onClick={() => setGravityOn(false)} disabled={!gravityOn}>
          <Icon name="close" size={18} /> Switch off gravity!
        </button>
        <button type="button" className="btn" onClick={reset}>
          Reset
        </button>
      </div>
      <p className="mt-2 min-h-6 text-center text-sm font-semibold text-amber-200" aria-live="polite">
        {!gravityOn && (escaped ? 'Without gravity the planet flew away in a straight line!' : 'No more pull… there it goes!')}
      </p>
    </Figure>
  )
}

export default function OrbitsLesson() {
  return (
    <div>
      <LessonSection title="Gravity keeps planets moving around the Sun">
        <p>
          Imagine swinging a ball on a string around your head. The string keeps pulling the ball towards your hand, so it goes round
          and round. If you let go, the ball flies off in a straight line.
        </p>
        <p>
          For planets, the “string” is the Sun’s <strong className="text-orange-200">gravity</strong>. The planet wants to travel
          straight, but gravity keeps bending its path into a curve around the Sun.
        </p>
      </LessonSection>
      <OrbitDemo />
      <div className="mt-2">
        <ModelBadge />
      </div>
      <LessonSection title="Closer planets go faster">
        <p>
          Planets near the Sun feel a stronger pull, so they have to move faster to stay in orbit. Mercury takes just 88 days to go
          around once. Faraway Neptune moves slowly and takes about 165 years! Watch the 3D view – the inner planets race ahead.
        </p>
      </LessonSection>
    </div>
  )
}
