import { fbm, mixRGB, smoothstep, clamp01 } from './noise'
import type { RGB } from './noise'
import { fillRGB, paintCraters } from './canvasPaint'

/** Procedural surface painters for the rocky bodies. All wrap seamlessly at u = 1. */

const OCEAN_DEEP: RGB = [13, 42, 84]
const OCEAN: RGB = [26, 92, 150]
const OCEAN_SHALLOW: RGB = [62, 148, 196]
const LAND_LOW: RGB = [56, 118, 60]
const LAND_MID: RGB = [128, 122, 62]
const LAND_HIGH: RGB = [128, 96, 62]
const SNOW: RGB = [235, 240, 245]

export function paintMercury(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  fillRGB(ctx, w, h, (u, v) => {
    const n = fbm(u, v, 8, 4, 7)
    const g = 88 + n * 88
    return [g * 1.03, g, g * 0.97]
  })
  paintCraters(ctx, w, h, 110, 99)
}

export function paintVenus(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  fillRGB(ctx, w, h, (u, v) => {
    const swirl = fbm(u + 0.15 * Math.sin(v * Math.PI * 3), v, 5, 4, 21)
    const bands = 0.5 + 0.5 * Math.sin(v * Math.PI * 7 + swirl * 4)
    const t = clamp01(swirl * 0.65 + bands * 0.35)
    return mixRGB([210, 168, 106], [246, 226, 180], t)
  })
}

export function paintEarth(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  fillRGB(ctx, w, h, (u, v) => {
    const lat = Math.abs(v - 0.5) * 2
    const cont = fbm(u, v, 6, 5, 31) + 0.18 * fbm(u, v, 14, 3, 77)
    const sea = 0.52
    if (cont < sea) {
      const depth = smoothstep(sea - 0.24, sea, cont)
      let c = mixRGB(OCEAN_DEEP, OCEAN, smoothstep(0, 0.6, depth))
      c = mixRGB(c, OCEAN_SHALLOW, smoothstep(0.75, 1, depth))
      const ice = smoothstep(0.86, 0.96, lat + fbm(u, v, 12, 2, 5) * 0.06)
      return mixRGB(c, SNOW, ice)
    }
    const relief = fbm(u, v, 16, 4, 141)
    let c = mixRGB(LAND_LOW, LAND_MID, smoothstep(0.3, 0.75, relief))
    c = mixRGB(c, LAND_HIGH, smoothstep(0.68, 0.95, cont))
    // Deserts around the equator where the "climate noise" says dry.
    const desert = smoothstep(0.22, 0.1, lat) * smoothstep(0.35, 0.62, fbm(u, v, 7, 3, 55))
    c = mixRGB(c, [194, 158, 92], desert * 0.85)
    // Snowcaps: high latitudes or tall relief.
    const snow = Math.max(
      smoothstep(0.76, 0.9, lat + relief * 0.08),
      smoothstep(0.88, 0.99, cont),
    )
    return mixRGB(c, SNOW, snow)
  })
}

export function paintMars(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  fillRGB(ctx, w, h, (u, v) => {
    const n = fbm(u, v, 7, 5, 61)
    const dark = fbm(u, v, 12, 3, 62)
    let c = mixRGB([148, 60, 34], [208, 112, 62], smoothstep(0.3, 0.75, n))
    c = mixRGB(c, [92, 46, 30], smoothstep(0.55, 0.8, dark) * 0.7)
    const lat = Math.abs(v - 0.5) * 2
    const cap = smoothstep(0.86, 0.94, lat + fbm(u, v, 10, 2, 63) * 0.05)
    return mixRGB(c, [238, 232, 224], cap)
  })
  paintCraters(ctx, w, h, 40, 44, 6)
}

export function paintMoon(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  fillRGB(ctx, w, h, (u, v) => {
    const n = fbm(u, v, 9, 4, 12)
    const maria = smoothstep(0.62, 0.78, fbm(u, v, 4, 3, 13))
    let c = mixRGB([150, 148, 146], [196, 194, 190], n)
    c = mixRGB(c, [96, 94, 96], maria * 0.75)
    return c
  })
  paintCraters(ctx, w, h, 130, 55, 8)
}
