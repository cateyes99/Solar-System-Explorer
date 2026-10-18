/**
 * Small deterministic helpers used by the procedural texture generator and by
 * the scattered placements (stars, asteroids, corona sprites).
 *
 * Textures must look identical on every reload, so everything here is seeded.
 */

/** Mulberry32: tiny, fast, good enough for graphics. */
export function createRandom(seed: number): () => number {
  let a = seed >>> 0
  return function random(): number {
    a = (a + 0x6d2b79f5) >>> 0
    let t = a
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

/** Deterministic 0…1 hash of a string, handy for per-object variation. */
export function hashString(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i += 1) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  h ^= h >>> 15
  h = Math.imul(h, 2246822507)
  h ^= h >>> 13
  return (h >>> 0) / 4294967296
}

export function lerp(a: number, b: number, t: number): number {
  return a + (b - a) * t
}

export function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

export function smoothstep(edge0: number, edge1: number, x: number): number {
  const t = clamp((x - edge0) / (edge1 - edge0), 0, 1)
  return t * t * (3 - 2 * t)
}

/** Integer hash used as the value source for the noise functions. */
function hash3(x: number, y: number, z: number, seed: number): number {
  let h = Math.imul(x, 374761393) ^ Math.imul(y, 668265263) ^ Math.imul(z, 1442695041) ^ Math.imul(seed, 2246822519)
  h = Math.imul(h ^ (h >>> 13), 1274126177)
  h ^= h >>> 16
  return (h >>> 0) / 4294967296
}

/** Classic 3D value noise with smooth interpolation. */
export function valueNoise3(x: number, y: number, z: number, seed: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const xf = x - xi
  const yf = y - yi
  const zf = z - zi
  const u = xf * xf * (3 - 2 * xf)
  const v = yf * yf * (3 - 2 * yf)
  const w = zf * zf * (3 - 2 * zf)

  const c000 = hash3(xi, yi, zi, seed)
  const c100 = hash3(xi + 1, yi, zi, seed)
  const c010 = hash3(xi, yi + 1, zi, seed)
  const c110 = hash3(xi + 1, yi + 1, zi, seed)
  const c001 = hash3(xi, yi, zi + 1, seed)
  const c101 = hash3(xi + 1, yi, zi + 1, seed)
  const c011 = hash3(xi, yi + 1, zi + 1, seed)
  const c111 = hash3(xi + 1, yi + 1, zi + 1, seed)

  const x00 = c000 + (c100 - c000) * u
  const x10 = c010 + (c110 - c010) * u
  const x01 = c001 + (c101 - c001) * u
  const x11 = c011 + (c111 - c011) * u
  const y0 = x00 + (x10 - x00) * v
  const y1 = x01 + (x11 - x01) * v
  return y0 + (y1 - y0) * w
}

/** Fractal (multi-octave) value noise, normalised to 0…1. */
export function fbm(
  x: number,
  y: number,
  z: number,
  octaves: number,
  seed: number,
  lacunarity = 2,
  gain = 0.5,
): number {
  let amplitude = 1
  let frequency = 1
  let sum = 0
  let norm = 0
  for (let i = 0; i < octaves; i += 1) {
    sum += amplitude * valueNoise3(x * frequency, y * frequency, z * frequency, seed + i * 977)
    norm += amplitude
    amplitude *= gain
    frequency *= lacunarity
  }
  return sum / norm
}

/**
 * Seamlessly wraps horizontally: the sample point travels around a cylinder, so
 * the left and right edges of an equirectangular texture match exactly.
 * Perfect for planets that spin.
 */
export function cylindricalFbm(
  u: number,
  v: number,
  radius: number,
  height: number,
  octaves: number,
  seed: number,
): number {
  const angle = u * Math.PI * 2
  const cx = Math.cos(angle) * radius
  const cz = Math.sin(angle) * radius
  return fbm(cx, v * height, cz, octaves, seed)
}

export function mixHex(a: string, b: string, t: number): string {
  const ca = hexToRgb(a)
  const cb = hexToRgb(b)
  const r = Math.round(lerp(ca[0], cb[0], t))
  const g = Math.round(lerp(ca[1], cb[1], t))
  const bl = Math.round(lerp(ca[2], cb[2], t))
  return `rgb(${r}, ${g}, ${bl})`
}

export function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((c) => c + c)
          .join('')
      : clean
  const value = Number.parseInt(full, 16)
  return [(value >> 16) & 255, (value >> 8) & 255, value & 255]
}