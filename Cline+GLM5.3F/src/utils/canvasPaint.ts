import type { RGB } from './noise'

/** Shared canvas helpers for the procedural texture generators. */

export function fillRGB(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  paint: (u: number, v: number) => RGB,
): void {
  const img = ctx.createImageData(w, h)
  const d = img.data
  for (let y = 0; y < h; y++) {
    const v = y / h
    for (let x = 0; x < w; x++) {
      const c = paint(x / w, v)
      const i = (y * w + x) * 4
      d[i] = c[0]
      d[i + 1] = c[1]
      d[i + 2] = c[2]
      d[i + 3] = 255
    }
  }
  ctx.putImageData(img, 0, 0)
}

/** Paints crater-like dents onto a canvas (used by Mercury, Mars and the Moon). */
export function paintCraters(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  count: number,
  seed: number,
  maxRadius = 9,
): void {
  let s = seed >>> 0
  const rnd = (): number => {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  for (let i = 0; i < count; i++) {
    const cx = rnd() * w
    const cy = h * 0.06 + rnd() * h * 0.88
    const r = 1.5 + rnd() * rnd() * maxRadius
    const dark = 35 + rnd() * 35
    const grd = ctx.createRadialGradient(cx, cy, r * 0.15, cx, cy, r)
    grd.addColorStop(0, `rgba(${dark},${dark},${dark + 4},0.5)`)
    grd.addColorStop(0.75, `rgba(${dark + 34},${dark + 34},${dark + 38},0.28)`)
    grd.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = grd
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
    ctx.strokeStyle = `rgba(215,212,206,${0.14 + rnd() * 0.14})`
    ctx.lineWidth = Math.max(0.5, r * 0.12)
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.85, 0, Math.PI * 2)
    ctx.stroke()
  }
}
