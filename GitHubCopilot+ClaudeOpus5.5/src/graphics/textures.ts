import { CanvasTexture, LinearFilter, NoColorSpace, RepeatWrapping, SRGBColorSpace, type Texture } from 'three'
import { clamp01, createNoise3D, fbm, mix, mulberry32, smoothstep } from './noise'

type Color3 = [number, number, number]
type Painter = (x: number, y: number, z: number, lat: number, lon: number, outs: Float32Array[]) => void

const TAU = Math.PI * 2
const HALF_PI = Math.PI / 2

function hex(value: string): Color3 {
  const n = parseInt(value.slice(1), 16)
  return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255]
}

function setColor(out: Float32Array, c: Color3): void {
  out[0] = c[0]
  out[1] = c[1]
  out[2] = c[2]
}

function mixInto(out: Float32Array, c: Color3, t: number): void {
  const k = clamp01(t)
  out[0] = mix(out[0], c[0], k)
  out[1] = mix(out[1], c[1], k)
  out[2] = mix(out[2], c[2], k)
}

function createCanvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas 2D is not available')
  return [canvas, ctx]
}

/** Paints one or more equirectangular maps by sampling a function on the unit sphere. */
function paintSphere(width: number, height: number, layers: number, painter: Painter): HTMLCanvasElement[] {
  const canvases = Array.from({ length: layers }, () => createCanvas(width, height))
  const images = canvases.map(([, ctx]) => ctx.createImageData(width, height))
  const outs = Array.from({ length: layers }, () => new Float32Array(4))
  for (let j = 0; j < height; j++) {
    const lat = (0.5 - (j + 0.5) / height) * Math.PI
    const cosLat = Math.cos(lat)
    const y = Math.sin(lat)
    for (let i = 0; i < width; i++) {
      const lon = ((i + 0.5) / width) * TAU - Math.PI
      const x = cosLat * Math.cos(lon)
      const z = cosLat * Math.sin(lon)
      for (const out of outs) {
        out[0] = 0
        out[1] = 0
        out[2] = 0
        out[3] = 1
      }
      painter(x, y, z, lat, lon, outs)
      const k = (j * width + i) * 4
      for (let l = 0; l < layers; l++) {
        const data = images[l].data
        const out = outs[l]
        data[k] = clamp01(out[0]) * 255
        data[k + 1] = clamp01(out[1]) * 255
        data[k + 2] = clamp01(out[2]) * 255
        data[k + 3] = clamp01(out[3]) * 255
      }
    }
  }
  canvases.forEach(([, ctx], l) => ctx.putImageData(images[l], 0, 0))
  return canvases.map(([canvas]) => canvas)
}

function wrapAngle(a: number): number {
  return Math.atan2(Math.sin(a), Math.cos(a))
}

/** Draws craters directly on an equirectangular canvas, stretched near the poles. */
function drawCraters(canvas: HTMLCanvasElement, count: number, seed: number, maxRadius: number): void {
  const ctx = canvas.getContext('2d')
  if (!ctx) return
  const random = mulberry32(seed)
  const { width, height } = canvas
  for (let i = 0; i < count; i++) {
    const v = Math.acos(2 * random() - 1) / Math.PI
    const lat = (0.5 - v) * Math.PI
    const stretch = 1 / Math.max(0.2, Math.cos(lat))
    const r = (0.15 + Math.pow(random(), 3) * 0.85) * maxRadius
    const u = random() * width
    const y = v * height
    for (const offset of [-width, 0, width]) {
      const cx = u + offset
      if (cx + r * stretch < 0 || cx - r * stretch > width) continue
      ctx.save()
      ctx.translate(cx, y)
      ctx.scale(stretch, 1)
      const g = ctx.createRadialGradient(0, 0, 0, 0, 0, r)
      g.addColorStop(0, 'rgba(25,25,25,0.38)')
      g.addColorStop(0.62, 'rgba(45,45,45,0.22)')
      g.addColorStop(0.82, 'rgba(235,232,225,0.28)')
      g.addColorStop(1, 'rgba(235,232,225,0)')
      ctx.fillStyle = g
      ctx.beginPath()
      ctx.arc(0, 0, r, 0, TAU)
      ctx.fill()
      ctx.restore()
    }
  }
}

function earthMaps(): HTMLCanvasElement[] {
  const n = createNoise3D(11)
  const warp = createNoise3D(12)
  const moist = createNoise3D(13)
  const city = createNoise3D(14)
  const deep = hex('#071d45')
  const shallow = hex('#1f5f9e')
  const forest = hex('#2b5122')
  const grass = hex('#5f7d34')
  const sand = hex('#cdaa6a')
  const rock = hex('#7a6650')
  const tundra = hex('#8b8d78')
  const ice = hex('#eef4f8')

  return paintSphere(1024, 512, 2, (x, y, z, lat, _lon, [day, aux]) => {
    const w = fbm(warp, x * 2, y * 2, z * 2, 3) * 0.45
    const h = fbm(n, x * 1.7 + w, y * 1.7 + w, z * 1.7 + w, 6)
    const latAbs = Math.abs(lat) / HALF_PI
    const iceLine = latAbs + fbm(moist, x * 5, y * 5, z * 5, 3) * 0.12
    const seaLevel = 0.03
    if (h > seaLevel) {
      const elevation = (h - seaLevel) / 0.45
      const m = fbm(moist, x * 3 + 5, y * 3, z * 3, 4)
      setColor(day, forest)
      mixInto(day, grass, 0.5 + m * 1.6)
      const desert = smoothstep(0.22, 0.0, Math.abs(latAbs - 0.3)) * smoothstep(0.05, -0.12, m)
      mixInto(day, sand, desert * 1.1)
      mixInto(day, tundra, smoothstep(0.55, 0.75, latAbs))
      mixInto(day, rock, smoothstep(0.25, 0.65, elevation) * 0.8)
      mixInto(day, ice, smoothstep(0.75, 0.9, elevation) * 0.7)
      const habitable = smoothstep(0.75, 0.5, latAbs) * (1 - desert * 0.7)
      const lights = smoothstep(0.25, 0.55, city(x * 40, y * 40, z * 40)) * 0.7 + smoothstep(0.3, 0.6, city(x * 110, y * 110, z * 110)) * 0.6
      aux[0] = lights * habitable * smoothstep(seaLevel, seaLevel + 0.08, h)
      aux[1] = 0
    } else {
      const depth = clamp01((seaLevel - h) / 0.35)
      setColor(day, shallow)
      mixInto(day, deep, smoothstep(0, 0.6, depth))
      aux[0] = 0
      aux[1] = 1
    }
    if (iceLine > 0.88) {
      const k = smoothstep(0.88, 0.93, iceLine)
      mixInto(day, ice, k)
      aux[1] *= 1 - k
      aux[0] *= 1 - k
    }
    aux[2] = 0
  })
}

function earthClouds(): HTMLCanvasElement {
  const n = createNoise3D(21)
  const warp = createNoise3D(22)
  return paintSphere(1024, 512, 1, (x, y, z, lat, _lon, [out]) => {
    const latAbs = Math.abs(lat) / HALF_PI
    const w = fbm(warp, x * 3, y * 3, z * 3, 3) * 0.6
    const c = fbm(n, x * 2.6 + w, y * 5 + w, z * 2.6 + w, 6)
    const band = Math.exp(-Math.pow(latAbs / 0.08, 2)) * 0.12 + Math.exp(-Math.pow((latAbs - 0.62) / 0.12, 2)) * 0.14 - smoothstep(0.15, 0.3, latAbs) * smoothstep(0.45, 0.3, latAbs) * 0.1
    out[0] = 1
    out[1] = 1
    out[2] = 1
    out[3] = smoothstep(0.02, 0.38, c + band) * 0.95
  })[0]
}

function bandedGiant(
  seed: number,
  width: number,
  palette: { light: string; dark: string; accent: string; pole: string },
  options: { frequency: number; contrast: number; turbulence: number; streaks: number },
  extra?: (x: number, y: number, z: number, lat: number, lon: number, out: Float32Array) => void,
): HTMLCanvasElement {
  const n = createNoise3D(seed)
  const n2 = createNoise3D(seed + 1)
  const light = hex(palette.light)
  const dark = hex(palette.dark)
  const accent = hex(palette.accent)
  const pole = hex(palette.pole)
  return paintSphere(width, width / 2, 1, (x, y, z, lat, lon, [out]) => {
    const turb = fbm(n, x * 3, y * 9, z * 3, 5)
    const latN = lat + turb * options.turbulence
    const band = Math.sin(latN * options.frequency) * 0.5 + 0.5
    const band2 = Math.sin(latN * options.frequency * 0.43 + 1.3) * 0.5 + 0.5
    setColor(out, light)
    mixInto(out, dark, band * options.contrast)
    mixInto(out, accent, band2 * options.contrast * 0.5)
    const streak = fbm(n2, x * 5, y * 46, z * 5, 3) * options.streaks
    out[0] += streak
    out[1] += streak
    out[2] += streak
    mixInto(out, pole, smoothstep(0.62, 1, Math.abs(lat) / HALF_PI) * 0.8)
    extra?.(x, y, z, lat, lon, out)
  })[0]
}

function jupiterMap(): HTMLCanvasElement {
  const swirl = createNoise3D(33)
  const spot = hex('#c1593a')
  const collar = hex('#f3e2c6')
  const spotLat = -22 * (Math.PI / 180)
  const spotLon = 0.8
  return bandedGiant(
    31,
    1024,
    { light: '#efe2c6', dark: '#a8754e', accent: '#d9965a', pole: '#8d8478' },
    { frequency: 22, contrast: 0.75, turbulence: 0.06, streaks: 0.12 },
    (x, y, z, lat, lon, out) => {
      const dx = (wrapAngle(lon - spotLon) * Math.cos(lat)) / 0.15
      const dy = (lat - spotLat) / 0.075
      let d = Math.sqrt(dx * dx + dy * dy)
      if (d > 1.8) return
      d += fbm(swirl, x * 14, y * 14, z * 14, 3) * 0.25
      const core = smoothstep(1.0, 0.55, d)
      mixInto(out, collar, smoothstep(1.45, 1.05, d) * (1 - core) * 0.8)
      mixInto(out, spot, core * 0.95)
    },
  )
}

function saturnMap(): HTMLCanvasElement {
  return bandedGiant(
    41,
    512,
    { light: '#efe0b8', dark: '#c2a06a', accent: '#d8bd85', pole: '#9fa6a0' },
    { frequency: 18, contrast: 0.45, turbulence: 0.025, streaks: 0.05 },
  )
}

function uranusMap(): HTMLCanvasElement {
  return bandedGiant(
    51,
    512,
    { light: '#b5e8ee', dark: '#93cfd8', accent: '#a3dce4', pole: '#cdf2f4' },
    { frequency: 12, contrast: 0.35, turbulence: 0.02, streaks: 0.015 },
  )
}

function neptuneMap(): HTMLCanvasElement {
  const n = createNoise3D(63)
  const darkSpot = hex('#162a70')
  const cloud = hex('#dfe8ff')
  const spotLat = -20 * (Math.PI / 180)
  return bandedGiant(
    61,
    512,
    { light: '#3f6fe0', dark: '#2443a8', accent: '#3558c8', pole: '#2b4cb4' },
    { frequency: 14, contrast: 0.5, turbulence: 0.04, streaks: 0.04 },
    (x, y, z, lat, lon, out) => {
      const dx = (wrapAngle(lon - 1.2) * Math.cos(lat)) / 0.12
      const dy = (lat - spotLat) / 0.06
      const d = Math.sqrt(dx * dx + dy * dy)
      mixInto(out, darkSpot, smoothstep(1, 0.5, d) * 0.85)
      const streak = smoothstep(0.32, 0.5, fbm(n, x * 4, y * 26, z * 4, 4))
      const latBand = Math.exp(-Math.pow((lat + 0.45) / 0.08, 2)) + Math.exp(-Math.pow((lat - 0.5) / 0.1, 2)) * 0.6 + Math.exp(-Math.pow((lat + 0.2) / 0.03, 2)) * 0.8
      mixInto(out, cloud, streak * latBand * 0.8)
    },
  )
}

function venusMap(): HTMLCanvasElement {
  const n = createNoise3D(71)
  const warp = createNoise3D(72)
  const light = hex('#f2dfb0')
  const dark = hex('#c69a5c')
  return paintSphere(512, 256, 1, (x, y, z, lat, _lon, [out]) => {
    const w = fbm(warp, x * 2, y * 2, z * 2, 4) * 1.2
    const v = fbm(n, x * 1.5 + w, y * 4 + w + lat * 2, z * 1.5 + w, 5)
    setColor(out, light)
    mixInto(out, dark, 0.45 + v * 1.4)
  })[0]
}

function marsMap(): HTMLCanvasElement {
  const n = createNoise3D(81)
  const n2 = createNoise3D(82)
  const n3 = createNoise3D(83)
  const base = hex('#c45a2f')
  const bright = hex('#e39a63')
  const dark = hex('#5e2b1c')
  const ice = hex('#f4f1ec')
  const canyonLat = -0.14
  return paintSphere(512, 256, 1, (x, y, z, lat, lon, [out]) => {
    const h = fbm(n, x * 2.2, y * 2.2, z * 2.2, 6)
    setColor(out, base)
    mixInto(out, bright, 0.45 + h * 1.4)
    mixInto(out, dark, smoothstep(0.06, 0.28, fbm(n2, x * 1.6, y * 1.6, z * 1.6, 4)) * 0.6)
    const canyon = Math.exp(-Math.pow((lat - canyonLat - Math.sin(lon * 6) * 0.01) / 0.012, 2)) * smoothstep(-1.5, -1.2, lon) * smoothstep(-0.2, -0.5, lon)
    mixInto(out, dark, canyon * 0.6)
    const cap = Math.abs(lat) / HALF_PI + fbm(n3, x * 6, y * 6, z * 6, 3) * 0.08
    mixInto(out, ice, smoothstep(0.88, 0.92, cap))
  })[0]
}

function rockyCratered(seed: number, light: string, dark: string, maria: number, craters: number): HTMLCanvasElement {
  const n = createNoise3D(seed)
  const n2 = createNoise3D(seed + 1)
  const lightC = hex(light)
  const darkC = hex(dark)
  const canvas = paintSphere(512, 256, 1, (x, y, z, _lat, _lon, [out]) => {
    const h = fbm(n, x * 3, y * 3, z * 3, 6)
    setColor(out, lightC)
    mixInto(out, darkC, 0.4 - h * 1.2)
    if (maria > 0) mixInto(out, darkC, smoothstep(0.02, 0.16, fbm(n2, x * 1.4, y * 1.4, z * 1.4, 4)) * maria)
  })[0]
  drawCraters(canvas, craters, seed + 7, 9)
  return canvas
}

function saturnRings(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(1024, 4)
  const img = ctx.createImageData(1024, 4)
  const random = mulberry32(91)
  const ripples = Array.from({ length: 1024 }, () => random())
  const light = hex('#ecdcb4')
  const tan = hex('#bfa77c')
  const dim = hex('#8a7a63')
  for (let i = 0; i < 1024; i++) {
    const r = 1.2 + (i / 1023) * 1.1
    let alpha = 0
    let c: Color3 = dim
    if (r < 1.24) alpha = 0.04
    else if (r < 1.53) {
      alpha = 0.22 + 0.08 * Math.sin(r * 90)
      c = dim
    } else if (r < 1.95) {
      alpha = 0.82 + 0.12 * Math.sin(r * 140)
      c = light
    } else if (r < 2.03) {
      alpha = 0.06
      c = dim
    } else if (r < 2.27) {
      alpha = r > 2.205 && r < 2.215 ? 0.08 : 0.62 + 0.08 * Math.sin(r * 160)
      c = tan
    } else if (r > 2.285 && r < 2.295) {
      alpha = 0.45
      c = light
    }
    const smoothRipple = (ripples[i] + ripples[Math.max(0, i - 1)] + ripples[Math.min(1023, i + 1)]) / 3
    alpha *= 0.82 + 0.18 * smoothRipple
    const shade = 0.9 + 0.1 * smoothRipple
    for (let row = 0; row < 4; row++) {
      const k = (row * 1024 + i) * 4
      img.data[k] = c[0] * shade * 255
      img.data[k + 1] = c[1] * shade * 255
      img.data[k + 2] = c[2] * shade * 255
      img.data[k + 3] = clamp01(alpha) * 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

function uranusRings(): HTMLCanvasElement {
  const [canvas, ctx] = createCanvas(512, 4)
  const img = ctx.createImageData(512, 4)
  const ringRadii = [0.08, 0.2, 0.31, 0.45, 0.52, 0.6, 0.97]
  for (let i = 0; i < 512; i++) {
    const t = i / 511
    let alpha = 0.02
    for (const rr of ringRadii) alpha += Math.exp(-Math.pow((t - rr) / (rr > 0.9 ? 0.012 : 0.005), 2)) * (rr > 0.9 ? 0.75 : 0.45)
    for (let row = 0; row < 4; row++) {
      const k = (row * 512 + i) * 4
      img.data[k] = 190
      img.data[k + 1] = 205
      img.data[k + 2] = 210
      img.data[k + 3] = clamp01(alpha) * 255
    }
  }
  ctx.putImageData(img, 0, 0)
  return canvas
}

function nebulaMap(): HTMLCanvasElement {
  const n = createNoise3D(101)
  const n2 = createNoise3D(102)
  const n3 = createNoise3D(103)
  const purple = hex('#4a2585')
  const blue = hex('#123f80')
  const teal = hex('#0d5568')
  const band = hex('#3a3350')
  const bandNormal = [0.32, 0.88, 0.35]
  const len = Math.hypot(bandNormal[0], bandNormal[1], bandNormal[2])
  return paintSphere(1024, 512, 1, (x, y, z, _lat, _lon, [out]) => {
    const d = (x * bandNormal[0] + y * bandNormal[1] + z * bandNormal[2]) / len
    const milky = Math.exp(-d * d * 30) * (0.55 + fbm(n3, x * 6, y * 6, z * 6, 4) * 1.2)
    const c1 = smoothstep(0.05, 0.45, fbm(n, x * 1.8, y * 1.8, z * 1.8, 5))
    const c2 = smoothstep(0.08, 0.5, fbm(n2, x * 2.4 + 3, y * 2.4, z * 2.4, 5))
    out[0] = purple[0] * c1 * 0.55 + blue[0] * c2 * 0.5 + teal[0] * c1 * c2 * 0.6 + band[0] * milky * 0.6
    out[1] = purple[1] * c1 * 0.55 + blue[1] * c2 * 0.5 + teal[1] * c1 * c2 * 0.6 + band[1] * milky * 0.6
    out[2] = purple[2] * c1 * 0.55 + blue[2] * c2 * 0.5 + teal[2] * c1 * c2 * 0.6 + band[2] * milky * 0.6
  })[0]
}

export interface TextureSet {
  mercury: Texture
  venus: Texture
  earth: Texture
  earthAux: Texture
  earthClouds: Texture
  moon: Texture
  mars: Texture
  jupiter: Texture
  saturn: Texture
  saturnRings: Texture
  uranus: Texture
  uranusRings: Texture
  neptune: Texture
  nebula: Texture
}

type TextureKey = keyof TextureSet

function toTexture(canvas: HTMLCanvasElement, color: boolean): Texture {
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = color ? SRGBColorSpace : NoColorSpace
  texture.wrapS = RepeatWrapping
  texture.anisotropy = 4
  return texture
}

function ringTexture(canvas: HTMLCanvasElement): Texture {
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.generateMipmaps = false
  texture.minFilter = LinearFilter
  return texture
}

const nextFrame = () => new Promise<void>((resolve) => requestAnimationFrame(() => resolve()))

let pending: Promise<TextureSet> | null = null
const progressListeners = new Set<(progress: number, label: string) => void>()

/** Generates every procedural texture, yielding between steps so the loading screen can animate. */
export function generateTextures(onProgress: (progress: number, label: string) => void): Promise<TextureSet> {
  progressListeners.add(onProgress)
  if (!pending) {
    pending = buildTextures((progress, label) => progressListeners.forEach((listener) => listener(progress, label)))
    pending.catch(() => {
      pending = null
    })
  }
  return pending.finally(() => progressListeners.delete(onProgress))
}

async function buildTextures(onProgress: (progress: number, label: string) => void): Promise<TextureSet> {
  const result: Partial<TextureSet> = {}
  const steps: { label: string; weight: number; run: () => void }[] = [
    {
      label: 'Painting Earth’s oceans and continents…',
      weight: 4,
      run: () => {
        const [day, aux] = earthMaps()
        result.earth = toTexture(day, true)
        result.earthAux = toTexture(aux, false)
      },
    },
    { label: 'Swirling Earth’s clouds…', weight: 3, run: () => (result.earthClouds = toTexture(earthClouds(), true)) },
    { label: 'Stirring Jupiter’s storms…', weight: 3, run: () => (result.jupiter = toTexture(jupiterMap(), true)) },
    {
      label: 'Polishing Saturn’s rings…',
      weight: 1,
      run: () => {
        result.saturn = toTexture(saturnMap(), true)
        result.saturnRings = ringTexture(saturnRings())
      },
    },
    { label: 'Dusting Mars with red sand…', weight: 1, run: () => (result.mars = toTexture(marsMap(), true)) },
    { label: 'Thickening Venus’s clouds…', weight: 1, run: () => (result.venus = toTexture(venusMap(), true)) },
    {
      label: 'Making craters on Mercury and the Moon…',
      weight: 1,
      run: () => {
        result.mercury = toTexture(rockyCratered(111, '#aaa59d', '#5d5953', 0, 260), true)
        result.moon = toTexture(rockyCratered(121, '#b9b8b2', '#575855', 0.55, 200), true)
      },
    },
    {
      label: 'Chilling the ice giants…',
      weight: 1,
      run: () => {
        result.uranus = toTexture(uranusMap(), true)
        result.uranusRings = ringTexture(uranusRings())
        result.neptune = toTexture(neptuneMap(), true)
      },
    },
    { label: 'Scattering distant nebulae…', weight: 3, run: () => (result.nebula = toTexture(nebulaMap(), true)) },
  ]
  const total = steps.reduce((sum, s) => sum + s.weight, 0)
  let done = 0
  for (const step of steps) {
    onProgress(done / total, step.label)
    await nextFrame()
    step.run()
    done += step.weight
  }
  onProgress(1, 'Lighting the Sun…')
  const keys: TextureKey[] = [
    'mercury', 'venus', 'earth', 'earthAux', 'earthClouds', 'moon', 'mars', 'jupiter',
    'saturn', 'saturnRings', 'uranus', 'uranusRings', 'neptune', 'nebula',
  ]
  for (const key of keys) {
    if (!result[key]) throw new Error(`Texture ${key} failed to generate`)
  }
  return result as TextureSet
}
