import { useEffect, useRef, useState } from 'react'
import { useSimulation } from '../../../store/simulationStore'

/**
 * Interactive gravity experiment: change the star's mass and watch the orbit
 * react in real time (real Newtonian gravity, integrated on a tiny canvas).
 */
export function GravityDiagram(): JSX.Element {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [mass, setMass] = useState(1)
  const massRef = useRef(mass)
  massRef.current = mass
  const reduceMotion = useSimulation((s) => s.reduceMotion)
  const resetRef = useRef<(() => void) | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const G = 5200
    let px = 70
    let py = 0
    let vx = 0
    let vy = Math.sqrt(G / 70)
    const trail: Array<[number, number]> = []

    const reset = (): void => {
      px = 70
      py = 0
      vx = 0
      vy = Math.sqrt((G * massRef.current) / 70)
      trail.length = 0
    }
    resetRef.current = reset

    let raf = 0
    let last = performance.now()
    const cx = 150
    const cy = 100

    const step = (now: number): void => {
      raf = requestAnimationFrame(step)
      const dt = Math.min(0.032, (now - last) / 1000)
      last = now
      const M = massRef.current

      if (!reduceMotion) {
        const r2 = px * px + py * py
        const r = Math.sqrt(r2)
        const accel = (G * M) / r2
        vx += (-accel * px) / r / 1 * dt
        vy += (-accel * py) / r * dt
        px += vx * dt
        py += vy * dt
        trail.push([px, py])
        if (trail.length > 240) trail.shift()
        if (r > 360 || r < 10) reset()
      }

      ctx.fillStyle = '#060b1a'
      ctx.fillRect(0, 0, 300, 200)
      // Trail
      if (trail.length > 2) {
        ctx.strokeStyle = 'rgba(103,232,249,0.4)'
        ctx.lineWidth = 1.4
        ctx.beginPath()
        ctx.moveTo(cx + trail[0][0], cy + trail[0][1])
        for (const [tx, ty] of trail) ctx.lineTo(cx + tx, cy + ty)
        ctx.stroke()
      }
      // Star
      const starR = 8 + Math.sqrt(M) * 4
      const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, starR * 2.4)
      grad.addColorStop(0, '#ffe08a')
      grad.addColorStop(0.5, '#ff9d45')
      grad.addColorStop(1, 'rgba(255,110,20,0)')
      ctx.fillStyle = grad
      ctx.beginPath()
      ctx.arc(cx, cy, starR * 2.4, 0, Math.PI * 2)
      ctx.fill()
      // Planet
      ctx.fillStyle = '#67e8f9'
      ctx.beginPath()
      ctx.arc(cx + px, cy + py, 4.2, 0, Math.PI * 2)
      ctx.fill()
    }

    raf = requestAnimationFrame(step)
    return () => cancelAnimationFrame(raf)
  }, [reduceMotion])

  return (
    <div className="space-y-2">
      <canvas
        ref={canvasRef}
        width={300}
        height={200}
        className="w-full rounded-xl border border-white/10"
        role="img"
        aria-label="Gravity orbit experiment"
      />
      <label className="block">
        <span className="stat-label">Star mass ×{mass.toFixed(2)}</span>
        <input
          type="range"
          min={0.3}
          max={3}
          step={0.05}
          value={mass}
          onChange={(e) => setMass(Number(e.target.value))}
        />
      </label>
      <div className="flex items-center gap-2">
        <button
          type="button"
          className="chip"
          onClick={() => {
            resetRef.current?.()
            massRef.current = 1
            setMass(1)
          }}
        >
          ↺ Reset orbit
        </button>
        <p className="text-[12px] leading-snug text-white/60">
          More mass → stronger pull → faster, tighter orbits. Less mass and the planet drifts away!
        </p>
      </div>
    </div>
  )
}
