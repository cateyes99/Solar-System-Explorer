/** Tiny deterministic RNG + seamless value-noise helpers for procedural textures. */

/** Mulberry32 — small, fast, deterministic. */
export function mulberry32(seed: number): () => number {
  let a = seed >>> 0
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function hash2(ix: number, iy: number, seed: number): number {
  let h = (Math.imul(ix, 374761393) + Math.imul(iy, 668265263) + Math.imul(seed, 1442695041)) | 0
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

const smooth = (t: number) => t * t * (3 - 2 * t)

/** Value noise on a lattice that wraps seamlessly at u = 1 (period = lattice size). */
export function periodicValueNoise(u: number, v: number, period: number, seed: number): number {
  const x = u * period
  const y = v * period
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = smooth(x - ix)
  const fy = smooth(y - iy)
  const w = (n: number) => ((n % period) + period) % period
  const a = hash2(w(ix), iy, seed)
  const b = hash2(w(ix + 1), iy, seed)
  const c = hash2(w(ix), iy + 1, seed)
  const d = hash2(w(ix + 1), iy + 1, seed)
  return a + (b - a) * fx + (c - a) * fy + (a - b - c + d) * fx * fy
}

/** Fractional Brownian motion. u wraps seamlessly at 1.0 so textures tile horizontally. */
export function fbm(u: number, v: number, baseFreq: number, octaves: number, seed: number): number {
  let sum = 0
  let amp = 0.5
  let norm = 0
  let freq = baseFreq
  for (let o = 0; o < octaves; o++) {
    const p = Math.max(1, Math.round(freq))
    sum += amp * periodicValueNoise(u, v, p, seed + o * 101)
    norm += amp
    amp *= 0.5
    freq *= 2
  }
  return sum / norm
}

export const clamp01 = (x: number): number => (x < 0 ? 0 : x > 1 ? 1 : x)

export function smoothstep(a: number, b: number, x: number): number {
  const t = clamp01((x - a) / (b - a))
  return t * t * (3 - 2 * t)
}

export const lerp = (a: number, b: number, t: number): number => a + (b - a) * t

export type RGB = [number, number, number]

export function mixRGB(a: RGB, b: RGB, t: number): RGB {
  return [lerp(a[0], b[0], t), lerp(a[1], b[1], t), lerp(a[2], b[2], t)]
}

export function hexToRgb(hex: string): RGB {
  const n = parseInt(hex.replace('#', ''), 16)
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255]
}
