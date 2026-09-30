import * as THREE from 'three'

/**
 * Procedural texture factory.
 *
 * Every surface in the scene is generated at runtime with canvas + noise, so
 * the app ships with zero image assets and still looks richly detailed.
 */

// ---------------------------------------------------------------------------
// Seeded value noise (3D so planet textures wrap seamlessly around the sphere)
// ---------------------------------------------------------------------------

function hash3(x: number, y: number, z: number, seed: number): number {
  let n = Math.imul(x, 374761393) + Math.imul(y, 668265263) + Math.imul(z, 1442695041)
  n = (n + Math.imul(seed, 1274126177)) | 0
  n = Math.imul(n ^ (n >>> 13), 1274126177)
  n = n ^ (n >>> 16)
  return (n >>> 0) / 4294967295
}

const fade = (t: number) => t * t * (3 - 2 * t)
const lerp = (a: number, b: number, t: number) => a + (b - a) * t

function valueNoise3(x: number, y: number, z: number, seed: number): number {
  const xi = Math.floor(x)
  const yi = Math.floor(y)
  const zi = Math.floor(z)
  const xf = fade(x - xi)
  const yf = fade(y - yi)
  const zf = fade(z - zi)

  const c000 = hash3(xi, yi, zi, seed)
  const c100 = hash3(xi + 1, yi, zi, seed)
  const c010 = hash3(xi, yi + 1, zi, seed)
  const c110 = hash3(xi + 1, yi + 1, zi, seed)
  const c001 = hash3(xi, yi, zi + 1, seed)
  const c101 = hash3(xi + 1, yi, zi + 1, seed)
  const c011 = hash3(xi, yi + 1, zi + 1, seed)
  const c111 = hash3(xi + 1, yi + 1, zi + 1, seed)

  const x00 = lerp(c000, c100, xf)
  const x10 = lerp(c010, c110, xf)
  const x01 = lerp(c001, c101, xf)
  const x11 = lerp(c011, c111, xf)
  return lerp(lerp(x00, x10, yf), lerp(x01, x11, yf), zf)
}

function fbm3(
  x: number,
  y: number,
  z: number,
  seed: number,
  octaves = 4,
  lacunarity = 2.05,
  gain = 0.5,
): number {
  let amplitude = 0.5
  let frequency = 1
  let sum = 0
  let norm = 0
  for (let i = 0; i < octaves; i++) {
    sum += amplitude * valueNoise3(x * frequency, y * frequency, z * frequency, seed + i * 71)
    norm += amplitude
    amplitude *= gain
    frequency *= lacunarity
  }
  return sum / norm
}

// ---------------------------------------------------------------------------
// Canvas helpers
// ---------------------------------------------------------------------------

function createCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D context unavailable')
  return [canvas, ctx]
}

function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}

type RGB = [number, number, number]

function mix(a: RGB, b: RGB, t: number): RGB {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]
}

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)

// ---------------------------------------------------------------------------
// Planet surface painters
// ---------------------------------------------------------------------------

interface PaintOptions {
  width: number
  height: number
  seed: number
  octaves?: number
  scale?: number
  painter: (
    u: number,
    v: number,
    noise: (ox: number, oy: number) => number,
  ) => RGB
}

/** Generic equirectangular painter with seamless horizontal wrapping. */
function paintSurface(opts: PaintOptions): HTMLCanvasElement {
  const { width, height, seed, painter } = opts
  const octaves = opts.octaves ?? 4
  const scale = opts.scale ?? 3
  const [canvas, ctx] = createCanvas(width, height)
  const image = ctx.createImageData(width, height)
  const data = image.data

  for (let py = 0; py < height; py++) {
    const v = py / (height - 1)
    const lat = (v - 0.5) * Math.PI // -π/2 .. π/2
    const cosLat = Math.cos(lat)
    const sinLat = Math.sin(lat)
    for (let px = 0; px < width; px++) {
      const u = px / width
      const theta = u * Math.PI * 2
      // Point on a unit sphere → seamless noise in all directions
      const sx = Math.cos(theta) * cosLat * scale
      const sy = sinLat * scale
      const sz = Math.sin(theta) * cosLat * scale
      const noise = (ox: number, oy: number) => fbm3(sx + ox, sy + oy, sz, seed, octaves)
      const [r, g, b] = painter(u, v, noise)
      const idx = (py * width + px) * 4
      data[idx] = r
      data[idx + 1] = g
      data[idx + 2] = b
      data[idx + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

function paintMercury(): HTMLCanvasElement {
  const canvas = paintSurface({
    width: 512,
    height: 256,
    seed: 11,
    scale: 4,
    octaves: 5,
    painter: (_u, v, noise) => {
      const base = noise(0, 0)
      const patch = noise(6, 3)
      const shade = 0.55 + base * 0.5 + patch * 0.15
      const tone: RGB = [138, 128, 118]
      const dark: RGB = [72, 66, 60]
      const c = mix(dark, tone, clamp01(shade - 0.3))
      // subtle latitude shading so poles read as cooler
      return mix(c, [190, 185, 178], Math.abs(v - 0.5) * 0.18)
    },
  })
  const ctx = canvas.getContext('2d')!
  // Craters: rim highlight + shadow core
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const r = 3 + Math.pow(Math.random(), 2.4) * 22
    const g = ctx.createRadialGradient(x, y, r * 0.1, x, y, r)
    g.addColorStop(0, 'rgba(40,36,32,0.55)')
    g.addColorStop(0.72, 'rgba(70,64,58,0.35)')
    g.addColorStop(0.86, 'rgba(205,198,190,0.35)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  return canvas
}

function paintVenus(): HTMLCanvasElement {
  return paintSurface({
    width: 512,
    height: 256,
    seed: 23,
    scale: 3,
    octaves: 5,
    painter: (_u, v, noise) => {
      // Swirling cream/gold cloud bands stretched horizontally
      const swirl = noise(0, 0)
      const band = Math.sin((v + swirl * 0.22) * Math.PI * 7) * 0.5 + 0.5
      const t = clamp01(band * 0.65 + swirl * 0.5)
      const light: RGB = [244, 226, 186]
      const mid: RGB = [219, 183, 122]
      const deep: RGB = [163, 124, 66]
      const c = mix(mid, light, clamp01(t * 1.3 - 0.25))
      return mix(deep, c, clamp01(t + 0.2))
    },
  })
}

function paintEarth(): HTMLCanvasElement {
  const canvas = paintSurface({
    width: 768,
    height: 384,
    seed: 7,
    scale: 2.6,
    octaves: 6,
    painter: (_u, v, noise) => {
      const latitude = Math.abs(v - 0.5) * 2 // 0 equator → 1 pole
      // Continent shaping: layered noise gives believable coastline wobble
      const continent = noise(0, 0)
      const detail = noise(4, 4)
      const elevation = continent * 0.75 + detail * 0.25

      const oceanDeep: RGB = [7, 30, 78]
      const oceanShallow: RGB = [35, 116, 186]
      const beach: RGB = [194, 178, 128]
      const forest: RGB = [38, 96, 52]
      const grass: RGB = [86, 133, 61]
      const desert: RGB = [176, 143, 88]
      const mountain: RGB = [120, 104, 82]
      const ice: RGB = [238, 244, 250]

      if (elevation < 0.485) {
        const d = clamp01((0.485 - elevation) / 0.2)
        return mix(oceanShallow, oceanDeep, Math.pow(d, 0.7))
      }

      const landT = clamp01((elevation - 0.485) / 0.22)
      let land = mix(grass, forest, clamp01(noise(9, 2) * 1.4 - 0.15))
      // Dry bands near the horse latitudes
      const dry = Math.max(0, Math.cos(latitude * Math.PI * 1.35)) * (noise(2, 8) * 0.9 + 0.35)
      land = mix(land, desert, clamp01(dry * 0.75))
      land = mix(beach, land, clamp01(landT * 5))
      land = mix(land, mountain, clamp01((landT - 0.6) * 2.4))

      // Polar ice caps
      const polar = clamp01((latitude - 0.82) / 0.12)
      const cap = clamp01(polar + (latitude > 0.7 ? (noise(3, 3) - 0.55) * 0.9 : 0))
      return mix(land, ice, clamp01(cap))
    },
  })

  // A few wispy inland lakes / rivers for texture
  const ctx = canvas.getContext('2d')!
  ctx.globalAlpha = 0.35
  ctx.fillStyle = '#2f6fb0'
  for (let i = 0; i < 26; i++) {
    const x = Math.random() * canvas.width
    const y = canvas.height * 0.18 + Math.random() * canvas.height * 0.64
    ctx.beginPath()
    ctx.ellipse(x, y, 4 + Math.random() * 16, 3 + Math.random() * 9, Math.random(), 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.globalAlpha = 1
  return canvas
}

function paintMars(): HTMLCanvasElement {
  const canvas = paintSurface({
    width: 512,
    height: 256,
    seed: 31,
    scale: 3.4,
    octaves: 5,
    painter: (_u, v, noise) => {
      const latitude = Math.abs(v - 0.5) * 2
      const n = noise(0, 0)
      const patch = noise(5, 5)
      const rustLight: RGB = [214, 121, 74]
      const rust: RGB = [176, 86, 52]
      const dark: RGB = [108, 56, 40]
      let c = mix(dark, rustLight, clamp01(n * 1.25 - 0.1))
      c = mix(c, rust, clamp01(patch * 0.7))
      // Thin frost at the poles
      const cap = clamp01((latitude - 0.9) / 0.08)
      return mix(c, [236, 232, 226], cap)
    },
  })
  const ctx = canvas.getContext('2d')!
  // Olympus Mons-style shield volcano + Valles Marineris scar
  ctx.globalAlpha = 0.3
  ctx.fillStyle = '#8a4630'
  ctx.beginPath()
  ctx.ellipse(canvas.width * 0.72, canvas.height * 0.62, 46, 26, 0, 0, Math.PI * 2)
  ctx.fill()
  ctx.globalAlpha = 0.35
  ctx.fillStyle = '#6d3826'
  ctx.fillRect(canvas.width * 0.12, canvas.height * 0.5, canvas.width * 0.34, 10)
  ctx.globalAlpha = 1
  return canvas
}

function paintJupiter(): HTMLCanvasElement {
  const width = 768
  const height = 384
  const [canvas, ctx] = createCanvas(width, height)
  const image = ctx.createImageData(width, height)
  const data = image.data

  const light: RGB = [236, 214, 178]
  const mid: RGB = [198, 158, 112]
  const dark: RGB = [139, 95, 66]
  const white: RGB = [248, 240, 228]

  for (let py = 0; py < height; py++) {
    const v = py / (height - 1)
    for (let px = 0; px < width; px++) {
      const u = px / width
      const theta = u * Math.PI * 2
      const sx = Math.cos(theta) * 3
      const sz = Math.sin(theta) * 3
      // Turbulent bands: warped latitude stripes
      const turb = fbm3(sx, v * 8, sz, 41, 5)
      const turb2 = fbm3(sx * 2.2, v * 16, sz * 2.2, 97, 4)
      const warped = v + (turb - 0.5) * 0.07 + (turb2 - 0.5) * 0.03
      const band = Math.sin(warped * Math.PI * 13) * 0.5 + 0.5
      const zone = Math.sin(warped * Math.PI * 4.3 + 1.2) * 0.5 + 0.5
      const t = clamp01(band * 0.6 + zone * 0.4 + (turb2 - 0.5) * 0.35)
      let c = mix(dark, mid, clamp01(t * 1.4))
      c = mix(c, light, clamp01(t * t * 1.2 - 0.15))
      c = mix(c, white, clamp01((zone - 0.85) * 2.2))
      const idx = (py * width + px) * 4
      data[idx] = c[0]
      data[idx + 1] = c[1]
      data[idx + 2] = c[2]
      data[idx + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)

  // Great Red Spot — an oval storm with swirling edges
  const sx = width * 0.66
  const sy = height * 0.63
  const rx = width * 0.075
  const ry = height * 0.062
  ctx.save()
  ctx.translate(sx, sy)
  const spot = ctx.createRadialGradient(0, 0, 2, 0, 0, rx)
  spot.addColorStop(0, 'rgba(196, 84, 47, 0.95)')
  spot.addColorStop(0.55, 'rgba(176, 76, 45, 0.8)')
  spot.addColorStop(0.82, 'rgba(214, 138, 96, 0.45)')
  spot.addColorStop(1, 'rgba(236, 214, 178, 0)')
  ctx.scale(1, ry / rx)
  ctx.fillStyle = spot
  ctx.beginPath()
  ctx.arc(0, 0, rx, 0, Math.PI * 2)
  ctx.fill()
  ctx.restore()
  return canvas
}

function paintSaturn(): HTMLCanvasElement {
  return paintSurface({
    width: 512,
    height: 256,
    seed: 57,
    scale: 2.6,
    octaves: 4,
    painter: (_u, v, noise) => {
      const turb = noise(0, 0)
      const warped = v + (turb - 0.5) * 0.05
      const band = Math.sin(warped * Math.PI * 9.5) * 0.5 + 0.5
      const soft = Math.sin(warped * Math.PI * 3.4 + 0.6) * 0.5 + 0.5
      const t = clamp01(band * 0.55 + soft * 0.45 + (turb - 0.5) * 0.25)
      const pale: RGB = [243, 227, 191]
      const gold: RGB = [214, 184, 132]
      const tan: RGB = [172, 140, 96]
      let c = mix(tan, gold, clamp01(t * 1.3))
      c = mix(c, pale, clamp01(t * t * 1.35 - 0.2))
      const latitude = Math.abs(v - 0.5) * 2
      return mix(c, [250, 246, 236], clamp01((latitude - 0.9) / 0.08))
    },
  })
}

function paintUranus(): HTMLCanvasElement {
  return paintSurface({
    width: 512,
    height: 256,
    seed: 71,
    scale: 2.2,
    octaves: 3,
    painter: (_u, _v, noise) => {
      const n = noise(0, 0)
      const base: RGB = [143, 222, 228]
      const deep: RGB = [104, 191, 205]
      return mix(deep, base, clamp01(0.35 + n * 0.8))
    },
  })
}

function paintNeptune(): HTMLCanvasElement {
  const canvas = paintSurface({
    width: 512,
    height: 256,
    seed: 83,
    scale: 2.4,
    octaves: 4,
    painter: (_u, v, noise) => {
      const n = noise(0, 0)
      const band = Math.sin(v * Math.PI * 8 + n * 1.4) * 0.5 + 0.5
      const deep: RGB = [26, 52, 158]
      const bright: RGB = [70, 116, 235]
      const cyan: RGB = [128, 190, 244]
      let c = mix(deep, bright, clamp01(band * 0.7 + n * 0.5))
      return mix(c, cyan, clamp01((band - 0.75) * 2.2))
    },
  })
  const ctx = canvas.getContext('2d')!
  // A dark storm spot, similar to the Great Dark Spot
  const g = ctx.createRadialGradient(
    canvas.width * 0.35,
    canvas.height * 0.42,
    4,
    canvas.width * 0.35,
    canvas.height * 0.42,
    46,
  )
  g.addColorStop(0, 'rgba(10, 22, 90, 0.85)')
  g.addColorStop(1, 'rgba(10, 22, 90, 0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(canvas.width * 0.35, canvas.height * 0.42, 58, 30, 0, 0, Math.PI * 2)
  ctx.fill()
  return canvas
}

function paintMoon(): HTMLCanvasElement {
  const canvas = paintSurface({
    width: 384,
    height: 192,
    seed: 19,
    scale: 3.6,
    octaves: 5,
    painter: (_u, _v, noise) => {
      const n = noise(0, 0)
      const mare = noise(7, 7)
      const light: RGB = [196, 193, 188]
      const dark: RGB = [96, 95, 93]
      return mix(dark, light, clamp01(n * 1.2 - 0.05 + (mare > 0.55 ? -0.28 : 0)))
    },
  })
  const ctx = canvas.getContext('2d')!
  for (let i = 0; i < 70; i++) {
    const x = Math.random() * canvas.width
    const y = Math.random() * canvas.height
    const r = 2 + Math.pow(Math.random(), 2.6) * 14
    const g = ctx.createRadialGradient(x, y, r * 0.15, x, y, r)
    g.addColorStop(0, 'rgba(60,60,58,0.5)')
    g.addColorStop(0.8, 'rgba(225,222,216,0.3)')
    g.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(x, y, r, 0, Math.PI * 2)
    ctx.fill()
  }
  return canvas
}

/** Earth's cloud layer as an alpha map. */
function paintClouds(): THREE.CanvasTexture {
  const width = 512
  const height = 256
  const [canvas, ctx] = createCanvas(width, height)
  const image = ctx.createImageData(width, height)
  const data = image.data
  for (let py = 0; py < height; py++) {
    const v = py / (height - 1)
    const lat = (v - 0.5) * Math.PI
    for (let px = 0; px < width; px++) {
      const u = px / width
      const theta = u * Math.PI * 2
      const sx = Math.cos(theta) * Math.cos(lat) * 3.2
      const sy = Math.sin(lat) * 3.2
      const sz = Math.sin(theta) * Math.cos(lat) * 3.2
      const base = fbm3(sx, sy, sz, 211, 5)
      // Belted cloud structure plus noise → believable swirls
      const belts = Math.sin(lat * 5 + base * 2.2) * 0.5 + 0.5
      const alpha = clamp01((base * 0.75 + belts * 0.35 - 0.52) * 3.4)
      const idx = (py * width + px) * 4
      data[idx] = 255
      data[idx + 1] = 255
      data[idx + 2] = 255
      data[idx + 3] = Math.round(alpha * 235)
    }
  }
  ctx.putImageData(image, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

/**
 * Saturn's ring texture. Sampled left→right across the RingGeometry UVs,
 * which we remap to run radially (see SatRing component).
 */
function paintRings(): HTMLCanvasElement {
  const width = 1024
  const height = 32
  const [canvas, ctx] = createCanvas(width, height)
  const image = ctx.createImageData(width, height)
  const data = image.data
  for (let px = 0; px < width; px++) {
    const t = px / (width - 1)
    // Ring structure: gaps (Cassini division) and brightness zones
    let alpha = 1
    if (t < 0.06) alpha = 0.25 // C ring
    else if (t < 0.16) alpha = 0.55
    else if (t < 0.3) alpha = 0.92 // B ring
    else if (t < 0.36) alpha = 0.12 // Cassini division
    else if (t < 0.72) alpha = 0.85 // A ring
    else if (t < 0.76) alpha = 0.1 // Encke gap
    else if (t < 0.95) alpha = 0.7
    else alpha = 0.05

    const grain = hash3(px, 3, 9, 555)
    const brightness = 0.72 + grain * 0.4 + Math.sin(t * 60) * 0.06
    const r = clamp01(0.86 * brightness)
    const g = clamp01(0.8 * brightness)
    const b = clamp01(0.66 * brightness)
    for (let py = 0; py < height; py++) {
      const idx = (py * width + px) * 4
      data[idx] = Math.round(r * 255)
      data[idx + 1] = Math.round(g * 255)
      data[idx + 2] = Math.round(b * 255)
      data[idx + 3] = Math.round(clamp01(alpha * (0.85 + grain * 0.3)) * 255)
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

// ---------------------------------------------------------------------------
// Sprite textures
// ---------------------------------------------------------------------------

function radialSprite(size: number, stops: [number, string][]): THREE.CanvasTexture {
  const [canvas, ctx] = createCanvas(size, size)
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  for (const [offset, color] of stops) g.addColorStop(offset, color)
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function starSprite(): THREE.CanvasTexture {
  return radialSprite(64, [
    [0, 'rgba(255,255,255,1)'],
    [0.25, 'rgba(255,255,255,0.55)'],
    [1, 'rgba(255,255,255,0)'],
  ])
}

function softGlowSprite(): THREE.CanvasTexture {
  return radialSprite(256, [
    [0, 'rgba(255,236,196,0.95)'],
    [0.22, 'rgba(255,178,74,0.55)'],
    [0.5, 'rgba(255,120,40,0.16)'],
    [1, 'rgba(255,90,30,0)'],
  ])
}

function nebulaSprite(): THREE.CanvasTexture {
  const size = 256
  const [canvas, ctx] = createCanvas(size, size)
  const image = ctx.createImageData(size, size)
  const data = image.data
  for (let py = 0; py < size; py++) {
    for (let px = 0; px < size; px++) {
      const dx = (px / size - 0.5) * 2
      const dy = (py / size - 0.5) * 2
      const d = Math.sqrt(dx * dx + dy * dy)
      const falloff = clamp01(1 - d)
      const n = fbm3(px / 34, py / 34, 0, 313, 4)
      const a = Math.pow(falloff, 2.1) * (0.35 + n * 0.85)
      const idx = (py * size + px) * 4
      data[idx] = 255
      data[idx + 1] = 255
      data[idx + 2] = 255
      data[idx + 3] = Math.round(clamp01(a) * 255)
    }
  }
  ctx.putImageData(image, 0, 0)
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  return texture
}

function dustSprite(): THREE.CanvasTexture {
  return radialSprite(32, [
    [0, 'rgba(200,225,255,0.9)'],
    [0.5, 'rgba(150,190,255,0.25)'],
    [1, 'rgba(120,160,255,0)'],
  ])
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

export interface SceneTextures {
  mercury: THREE.CanvasTexture
  venus: THREE.CanvasTexture
  earth: THREE.CanvasTexture
  mars: THREE.CanvasTexture
  jupiter: THREE.CanvasTexture
  saturn: THREE.CanvasTexture
  uranus: THREE.CanvasTexture
  neptune: THREE.CanvasTexture
  moon: THREE.CanvasTexture
  clouds: THREE.CanvasTexture
  rings: THREE.CanvasTexture
  star: THREE.CanvasTexture
  glow: THREE.CanvasTexture
  nebula: THREE.CanvasTexture
  dust: THREE.CanvasTexture
}

const PAINTERS: Record<keyof Omit<SceneTextures, 'clouds' | 'rings' | 'star' | 'glow' | 'nebula' | 'dust'>, () => HTMLCanvasElement> = {
  mercury: paintMercury,
  venus: paintVenus,
  earth: paintEarth,
  mars: paintMars,
  jupiter: paintJupiter,
  saturn: paintSaturn,
  uranus: paintUranus,
  neptune: paintNeptune,
  moon: paintMoon,
}

/**
 * Generate every texture, reporting progress between steps so the loading
 * screen can update without blocking the main thread for long.
 */
export async function generateSceneTextures(
  onProgress: (done: number, total: number) => void,
): Promise<SceneTextures> {
  const steps = Object.keys(PAINTERS).length + 6
  let done = 0
  const tick = async () => {
    done += 1
    onProgress(done, steps)
    // Yield to the browser so the loader animates smoothly
    await new Promise((resolve) => setTimeout(resolve, 0))
  }

  const result = {} as SceneTextures
  for (const [key, painter] of Object.entries(PAINTERS) as [keyof typeof PAINTERS, () => HTMLCanvasElement][]) {
    result[key] = toTexture(painter())
    await tick()
  }
  result.clouds = paintClouds()
  await tick()
  result.rings = toTexture(paintRings())
  result.rings.wrapT = THREE.ClampToEdgeWrapping
  await tick()
  result.star = starSprite()
  await tick()
  result.glow = softGlowSprite()
  await tick()
  result.nebula = nebulaSprite()
  await tick()
  result.dust = dustSprite()
  await tick()
  return result
}

export function disposeTextures(textures: SceneTextures): void {
  Object.values(textures).forEach((t) => t.dispose())
}
