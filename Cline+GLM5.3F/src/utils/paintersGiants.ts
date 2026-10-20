import { fbm, mixRGB, smoothstep, clamp01 } from './noise'
import type { RGB } from './noise'
import { fillRGB } from './canvasPaint'

/** Procedural band painters for the gas and ice giants. All wrap seamlessly at u = 1. */

const JUPITER_BANDS: RGB[] = [
  [172, 118, 82],
  [224, 182, 138],
  [188, 138, 96],
  [234, 210, 172],
  [158, 102, 70],
  [230, 198, 156],
  [142, 96, 74],
  [212, 172, 128],
  [176, 138, 106],
  [218, 188, 150],
]

const SATURN_BANDS: RGB[] = [
  [196, 164, 112],
  [226, 202, 152],
  [206, 176, 124],
  [236, 216, 172],
  [214, 188, 138],
  [230, 208, 162],
  [200, 172, 122],
]

function bandColor(stops: RGB[], t: number): RGB {
  const n = stops.length - 1
  const x = clamp01(t) * n
  const i = Math.min(n - 1, Math.floor(x))
  return mixRGB(stops[i], stops[i + 1], x - i)
}

export function paintJupiter(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  fillRGB(ctx, w, h, (u, v) => {
    const turb = fbm(u, v, 9, 4, 91) - 0.5
    const vv = clamp01(v + turb * 0.055)
    let c = bandColor(JUPITER_BANDS, vv)
    const fine = fbm(u, v, 22, 3, 92)
    c = mixRGB(c, [246, 228, 196], clamp01((fine - 0.5) * 0.3 + 0.15))
    // The Great Red Spot, at about 20° south.
    let du = Math.abs(u - 0.72)
    du = Math.min(du, 1 - du)
    const dv = (v - 0.63) * 1.9
    const d = Math.sqrt((du / 0.052) ** 2 + (dv / 0.045) ** 2)
    if (d < 1.7) {
      c = mixRGB(c, [198, 76, 44], smoothstep(1.35, 0.4, d))
      c = mixRGB(c, [232, 134, 92], smoothstep(0.95, 0.2, d) * 0.55)
    }
    return c
  })
}

export function paintSaturn(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  fillRGB(ctx, w, h, (u, v) => {
    const turb = fbm(u, v, 8, 4, 93) - 0.5
    const vv = clamp01(v + turb * 0.035)
    let c = bandColor(SATURN_BANDS, vv)
    const fine = fbm(u, v, 18, 3, 94)
    c = mixRGB(c, [244, 230, 198], clamp01((fine - 0.5) * 0.2 + 0.1))
    return c
  })
}

export function paintUranus(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  fillRGB(ctx, w, h, (u, v) => {
    const base = mixRGB([138, 206, 214], [172, 226, 232], clamp01(0.5 + 0.5 * Math.sin(v * Math.PI * 5)))
    const haze = fbm(u, v, 6, 3, 95)
    return mixRGB(base, [200, 238, 240], clamp01((haze - 0.5) * 0.2 + 0.08))
  })
}

export function paintNeptune(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  fillRGB(ctx, w, h, (u, v) => {
    const turb = fbm(u, v, 7, 4, 96) - 0.5
    const vv = clamp01(v + turb * 0.05)
    let c = bandColor(
      [
        [36, 70, 160],
        [58, 104, 200],
        [42, 82, 176],
        [70, 122, 216],
        [36, 68, 152],
        [62, 110, 206],
        [40, 74, 164],
      ],
      vv,
    )
    // Bright methane-ice streaks.
    const streaks: Array<[number, number, number, number]> = [
      [0.3, 0.35, 0.06, 0.025],
      [0.62, 0.55, 0.05, 0.02],
      [0.85, 0.42, 0.07, 0.018],
    ]
    for (const [su, sv, rw, rh] of streaks) {
      let du = Math.abs(u - su)
      du = Math.min(du, 1 - du)
      const d = Math.sqrt((du / rw) ** 2 + ((v - sv) / rh) ** 2)
      c = mixRGB(c, [206, 224, 255], smoothstep(1.2, 0.2, d) * 0.5)
    }
    // A small dark spot.
    let du2 = Math.abs(u - 0.45)
    du2 = Math.min(du2, 1 - du2)
    const dDark = Math.sqrt((du2 / 0.05) ** 2 + ((v - 0.42) / 0.035) ** 2)
    c = mixRGB(c, [18, 36, 96], smoothstep(1.1, 0.2, dDark) * 0.7)
    return c
  })
}
