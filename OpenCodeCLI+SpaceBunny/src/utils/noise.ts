/**
 * Small deterministic noise toolkit used by the procedural texture generators.
 * Everything is seeded so the Solar System looks identical on every reload.
 */

const PERM_SIZE = 256

function buildPermutation(seed: number): Uint8Array {
  const perm = new Uint8Array(PERM_SIZE)
  for (let i = 0; i < PERM_SIZE; i += 1) perm[i] = i
  let state = seed >>> 0
  for (let i = PERM_SIZE - 1; i > 0; i -= 1) {
    state = (state * 1_664_525 + 1_013_904_223) >>> 0
    const j = state % (i + 1)
    const tmp = perm[i]
    perm[i] = perm[j]
    perm[j] = tmp
  }
  return perm
}

export interface Noise {
  /** 3D value noise in roughly [-1, 1]. */
  noise3(x: number, y: number, z: number): number
  /** Fractal brownian motion, normalised to roughly [-1, 1]. */
  fbm(x: number, y: number, z: number, octaves?: number, lacunarity?: number, gain?: number): number
  /** Ridged multifractal — good for cloud filaments and ring structure. */
  ridged(x: number, y: number, z: number, octaves?: number): number
}

export function createNoise(seed = 1337): Noise {
  const perm = buildPermutation(seed)
  const grad = (hash: number, x: number, y: number, z: number) => {
    switch (hash & 15) {
      case 0:
        return x + y
      case 1:
        return -x + y
      case 2:
        return x - y
      case 3:
        return -x - y
      case 4:
        return x + z
      case 5:
        return -x + z
      case 6:
        return x - z
      case 7:
        return -x - z
      case 8:
        return y + z
      case 9:
        return -y + z
      case 10:
        return y - z
      case 11:
        return -y - z
      case 12:
        return x + y
      case 13:
        return -y + z
      case 14:
        return -x + y
      default:
        return -y - z
    }
  }

  const fade = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

  const noise3 = (x: number, y: number, z: number): number => {
    const xi = Math.floor(x) & 255
    const yi = Math.floor(y) & 255
    const zi = Math.floor(z) & 255
    const xf = x - Math.floor(x)
    const yf = y - Math.floor(y)
    const zf = z - Math.floor(z)
    const u = fade(xf)
    const v = fade(yf)
    const w = fade(zf)

    const a = perm[xi] + yi
    const aa = perm[a & 255] + zi
    const ab = perm[(a + 1) & 255] + zi
    const b = perm[(xi + 1) & 255] + yi
    const ba = perm[b & 255] + zi
    const bb = perm[(b + 1) & 255] + zi

    const n000 = grad(perm[aa & 255], xf, yf, zf)
    const n100 = grad(perm[ba & 255], xf - 1, yf, zf)
    const n010 = grad(perm[ab & 255], xf, yf - 1, zf)
    const n110 = grad(perm[bb & 255], xf - 1, yf - 1, zf)
    const n001 = grad(perm[(aa + 1) & 255], xf, yf, zf - 1)
    const n101 = grad(perm[(ba + 1) & 255], xf - 1, yf, zf - 1)
    const n011 = grad(perm[(ab + 1) & 255], xf, yf - 1, zf - 1)
    const n111 = grad(perm[(bb + 1) & 255], xf - 1, yf - 1, zf - 1)

    const lerp = (a2: number, b2: number, t: number) => a2 + (b2 - a2) * t
    const x00 = lerp(n000, n100, u)
    const x10 = lerp(n010, n110, u)
    const x01 = lerp(n001, n101, u)
    const x11 = lerp(n011, n111, u)
    return lerp(lerp(x00, x10, v), lerp(x01, x11, v), w)
  }

  const fbm = (
    x: number,
    y: number,
    z: number,
    octaves = 5,
    lacunarity = 2.03,
    gain = 0.5,
  ): number => {
    let amplitude = 1
    let frequency = 1
    let sum = 0
    let norm = 0
    for (let i = 0; i < octaves; i += 1) {
      sum += amplitude * noise3(x * frequency, y * frequency, z * frequency)
      norm += amplitude
      amplitude *= gain
      frequency *= lacunarity
    }
    return sum / norm
  }

  const ridged = (x: number, y: number, z: number, octaves = 4): number => {
    let amplitude = 0.5
    let frequency = 1
    let sum = 0
    let norm = 0
    for (let i = 0; i < octaves; i += 1) {
      const n = 1 - Math.abs(noise3(x * frequency, y * frequency, z * frequency))
      sum += n * n * amplitude
      norm += amplitude
      amplitude *= 0.5
      frequency *= 2.07
    }
    return sum / norm
  }

  return { noise3, fbm, ridged }
}

/** Wrap-safe 3D noise on a sphere: samples a point on the unit sphere. */
export function sphereNoise(
  noise: Noise,
  lon: number,
  lat: number,
  frequency: number,
  octaves = 5,
): number {
  const phi = (lon * Math.PI) / 180
  const theta = (lat * Math.PI) / 180
  const x = Math.cos(theta) * Math.cos(phi)
  const y = Math.sin(theta)
  const z = Math.cos(theta) * Math.sin(phi)
  return noise.fbm(x * frequency, y * frequency, z * frequency, octaves)
}