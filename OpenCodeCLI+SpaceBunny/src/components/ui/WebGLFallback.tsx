import { useEffect, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { PLANETS, SUN } from '../../data/planets'
import { Icon } from './Icon'
import { resolveBodyName } from '../../utils/astronomy'
import { formatYears } from '../../utils/astronomy'

/**
 * Shown when WebGL is unavailable. Rather than a dead end, it renders a simple
 * animated 2D Solar System with the same planet data so the page still teaches
 * something.
 */
export function WebGLFallback() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [selected, setSelected] = useState<string | null>('earth')

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let raf = 0
    const dpr = Math.min(2, window.devicePixelRatio || 1)
    const resize = () => {
      canvas.width = canvas.clientWidth * dpr
      canvas.height = canvas.clientHeight * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    const radii = [0.32, 0.39, 0.44, 0.5, 0.62, 0.6, 0.46, 0.45]
    const colors = PLANETS.map((p) => p.color)

    const draw = (time: number) => {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      const width = canvas.clientWidth
      const height = canvas.clientHeight
      ctx.clearRect(0, 0, width, height)

      const cx = width / 2
      const cy = height / 2
      const maxR = Math.min(width, height) * 0.44
      const scale = Math.pow(30, 0.62)

      // Stars
      ctx.fillStyle = 'rgba(255,255,255,0.5)'
      for (let i = 0; i < 140; i += 1) {
        const x = ((i * 9301 + 49297) % 233280) / 233280 * width
        const y = ((i * 4021 + 12345) % 233280) / 233280 * height
        const s = ((i % 5) + 1) * 0.28
        ctx.globalAlpha = 0.2 + ((i * 37) % 60) / 100
        ctx.fillRect(x, y, s, s)
      }
      ctx.globalAlpha = 1

      // Orbits
      PLANETS.forEach((planet) => {
        const r = (Math.pow(planet.semiMajorAxisAU, 0.62) / scale) * maxR
        ctx.beginPath()
        ctx.arc(cx, cy, r, 0, Math.PI * 2)
        ctx.strokeStyle = 'rgba(126,166,221,0.2)'
        ctx.lineWidth = 1
        ctx.stroke()

        const angle = (time / 1000 / (planet.orbitalPeriodDays / 40) + planet.orbitPhase) % (Math.PI * 2)
        const x = cx + Math.cos(angle) * r
        const y = cy + Math.sin(angle) * r
        const pr = Math.max(3, radii[PLANETS.indexOf(planet)] * 14)

        const gradient = ctx.createRadialGradient(x - pr * 0.3, y - pr * 0.3, pr * 0.1, x, y, pr)
        gradient.addColorStop(0, '#ffffff')
        gradient.addColorStop(0.35, colors[PLANETS.indexOf(planet)])
        gradient.addColorStop(1, 'rgba(0,0,0,0.6)')
        ctx.beginPath()
        ctx.arc(x, y, pr, 0, Math.PI * 2)
        ctx.fillStyle = gradient
        ctx.fill()

        ctx.fillStyle = 'rgba(198,216,242,0.55)'
        ctx.font = '10px system-ui, sans-serif'
        ctx.textAlign = 'center'
        ctx.fillText(planet.name, x, y - pr - 5)
      })

      // Sun
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, 34)
      glow.addColorStop(0, '#fff6d8')
      glow.addColorStop(0.4, '#ffb347')
      glow.addColorStop(1, 'rgba(255,122,43,0)')
      ctx.beginPath()
      ctx.arc(cx, cy, 34, 0, Math.PI * 2)
      ctx.fillStyle = glow
      ctx.fill()
      raf = requestAnimationFrame(draw)
    }
    raf = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(raf)
      window.removeEventListener('resize', resize)
    }
  }, [])

  const activePlanet = PLANETS.find((p) => p.id === selected)

  return (
    <div className="absolute inset-0 z-50 flex flex-col overflow-auto bg-void">
      <div className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-5 py-8">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-5"
        >
          <p className="eyebrow mb-2 flex items-center gap-2">
            <Icon name="flask" size={14} />
            Simplified 2D mode
          </p>
          <h1 className="text-balance text-[22px] leading-tight font-semibold tracking-tight text-ice-50 sm:text-[28px]">
            Your browser can&apos;t display the 3D Solar System
          </h1>
          <p className="mt-2 max-w-2xl text-[13.5px] leading-relaxed text-ice-200/75">
            This usually means WebGL is turned off, blocked, or your graphics hardware is not supported. Try
            enabling hardware acceleration in your browser settings, or try a different browser — Chrome, Edge,
            Firefox and Safari all support the 3D version.
          </p>
        </motion.div>

        <div className="grid flex-1 gap-4 lg:grid-cols-[1.6fr_1fr]">
          <div className="panel relative min-h-[16rem] max-h-[32rem] overflow-hidden">
            <canvas ref={canvasRef} className="h-full w-full" aria-label="Animated 2D Solar System diagram" />
          </div>

          <div className="panel scroll-area max-h-[24rem] overflow-y-auto px-5 py-4">
            <h2 className="mb-3 text-[14px] font-semibold text-ice-50">Still want to explore?</h2>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {PLANETS.map((planet) => (
                <button
                  key={planet.id}
                  type="button"
                  onClick={() => setSelected(planet.id)}
                  aria-pressed={selected === planet.id}
                  className={[
                    'rounded-full border px-3 py-1.5 text-[11.5px] font-medium transition-colors',
                    selected === planet.id
                      ? 'border-cyan-glow/50 bg-cyan-glow/15 text-cyan-100'
                      : 'border-edge text-ice-200/80 hover:border-edge-strong hover:text-ice-50',
                  ].join(' ')}
                >
                  {planet.name}
                </button>
              ))}
            </div>

            {activePlanet && (
              <div className="space-y-3">
                <h3 className="text-[15px] font-semibold text-ice-50">{activePlanet.name}</h3>
                <p className="text-[13px] leading-relaxed text-ice-200/80">{activePlanet.description}</p>
                <dl className="space-y-1.5 text-[12px]">
                  <div className="flex justify-between gap-3 border-b border-edge/60 pb-1.5">
                    <dt className="text-ice-400">Diameter</dt>
                    <dd className="font-mono text-ice-50">{activePlanet.diameterKm.toLocaleString()} km</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-edge/60 pb-1.5">
                    <dt className="text-ice-400">Year</dt>
                    <dd className="font-mono text-ice-50">{formatYears(activePlanet.orbitalPeriodDays)}</dd>
                  </div>
                  <div className="flex justify-between gap-3 border-b border-edge/60 pb-1.5">
                    <dt className="text-ice-400">Moons</dt>
                    <dd className="font-mono text-ice-50">
                      {activePlanet.moonCount === 0 ? 'None' : activePlanet.moonCount}
                    </dd>
                  </div>
                </dl>
                <p className="rounded-lg border border-solar/25 bg-solar/8 p-3 text-[12px] leading-relaxed text-ice-100/90">
                  {activePlanet.didYouKnow}
                </p>
              </div>
            )}

            <p className="mt-4 border-t border-edge pt-3 text-[10.5px] leading-relaxed text-ice-400/55">
              {SUN.name} · {SUN.diameterKm.toLocaleString()} km across · {SUN.facts[1]}{' '}
              {resolveBodyName('sun')} is at the centre of the diagram.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}