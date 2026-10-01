import * as THREE from 'three'
import { MOONS, PLANET_BY_ID, SUN } from '../data/planets'
import type { PlanetId } from '../types'
import { createNoise, sphereNoise, type Noise } from './noise'
import { mulberry32 } from './math'
import { realTextureNow } from './imageTextures'

/**
 * Every graphic in this app is generated on the fly with the 2D canvas API.
 * No binary assets ship with the bundle, which keeps the download tiny and
 * lets each world be re-tuned by editing a few lines of code.
 */

const noise: Noise = createNoise(20240610)
const detailNoise: Noise = createNoise(77771)

const cache = new Map<string, THREE.Texture>()

function canvas(width: number, height: number): HTMLCanvasElement {
  const el = document.createElement('canvas')
  el.width = width
  el.height = height
  return el
}

function context(el: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = el.getContext('2d', { willReadFrequently: true })
  if (!ctx) throw new Error('2D canvas is unavailable in this browser')
  return ctx
}

function toTexture(el: HTMLCanvasElement, srgb = true): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(el)
  texture.colorSpace = srgb ? THREE.SRGBColorSpace : THREE.NoColorSpace
  texture.anisotropy = 8
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.needsUpdate = true
  return texture
}

/** lon/lat in degrees to equirectangular pixel coordinates. */
function project(lon: number, lat: number, w: number, h: number): [number, number] {
  return [((lon + 180) / 360) * w, ((90 - lat) / 180) * h]
}

function tracePolygon(ctx: CanvasRenderingContext2D, poly: number[][], w: number, h: number): void {
  ctx.beginPath()
  poly.forEach(([lon, lat], index) => {
    const [x, y] = project(lon, lat, w, h)
    if (index === 0) ctx.moveTo(x, y)
    else ctx.lineTo(x, y)
  })
  ctx.closePath()
  ctx.fill()
}

/* -------------------------------------------------------------------------- */
/*                                  Surfaces                                   */
/* -------------------------------------------------------------------------- */

/** Blocky crater fields — used for Mercury, the Moon and Mars. */
function paintCraters(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  rand: () => number,
  count: number,
  minR: number,
  maxR: number,
): void {
  ctx.save()
  for (let i = 0; i < count; i += 1) {
    const cx = rand() * w
    const cy = rand() * h
    const r = minR + rand() * (maxR - minR)
    const light = 0.55 + rand() * 0.45

    const floor = ctx.createRadialGradient(cx - r * 0.25, cy - r * 0.25, r * 0.05, cx, cy, r)
    floor.addColorStop(0, `rgba(0,0,0,${0.16 * light})`)
    floor.addColorStop(0.72, `rgba(0,0,0,${0.1 * light})`)
    floor.addColorStop(1, 'rgba(0,0,0,0)')
    ctx.fillStyle = floor
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()

    ctx.strokeStyle = `rgba(255,255,255,${0.24 * light})`
    ctx.lineWidth = Math.max(0.7, r * 0.14)
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.94, Math.PI * 0.9, Math.PI * 1.85)
    ctx.stroke()

    ctx.strokeStyle = `rgba(0,0,0,${0.2 * light})`
    ctx.beginPath()
    ctx.arc(cx, cy, r * 0.94, Math.PI * 1.85, Math.PI * 2.9)
    ctx.stroke()

    ctx.fillStyle = `rgba(255,255,255,${0.05 * light})`
    ctx.beginPath()
    ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.25, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

/** Horizontal atmospheric bands with turbulent edges — gas and ice giants. */
function paintBanded(
  ctx: CanvasRenderingContext2D,
  w: number,
  h: number,
  palette: string[],
  bandCount: number,
  turbulence: number,
  seedOffset: number,
): void {
  const colors = palette.map((c) => new THREE.Color(c))
  const image = ctx.createImageData(w, h)
  const data = image.data

  const bandColor = (t: number) => {
    const scaled = ((t % 1) + 1) % 1
    const pos = scaled * bandCount
    const index = Math.floor(pos) % colors.length
    const next = (index + 1) % colors.length
    return { a: colors[index], b: colors[next], f: pos - Math.floor(pos) }
  }

  for (let y = 0; y < h; y += 1) {
    const lat = 90 - (y / h) * 180
    const baseLat = lat / 180 + 0.5

    for (let x = 0; x < w; x += 1) {
      const lon = (x / w) * 360 - 180
      const phi = (lon * Math.PI) / 180
      const theta = (lat * Math.PI) / 180

      // Warp the band coordinate with 3D noise so bands swirl around the limb.
      const nx = Math.cos(theta) * Math.cos(phi) * 2.1
      const ny = Math.sin(theta) * 2.1
      const nz = Math.cos(theta) * Math.sin(phi) * 2.1
      const warp =
        noise.fbm(nx * 1.6 + seedOffset, ny * 3.2, nz * 1.6, 4) * turbulence +
        detailNoise.ridged(nx * 5.5, ny * 9, nz * 5.5, 3) * turbulence * 0.5

      const t = baseLat + warp
      const { a, b, f } = bandColor(t * bandCount * 0.5)
      const r = (a.r + (b.r - a.r) * f) * 255
      const g = (a.g + (b.g - a.g) * f) * 255
      const bl = (a.b + (b.b - a.b) * f) * 255

      // Pole dimming gives the sphere a sense of depth at high latitudes.
      const polar = Math.pow(Math.abs(Math.sin(theta)), 6) * 0.16
      const grain = noise.noise3(nx * 22, ny * 22, nz * 22) * 0.035

      const i = (y * w + x) * 4
      data[i] = Math.max(0, Math.min(255, (r + grain * 255) * (1 - polar)))
      data[i + 1] = Math.max(0, Math.min(255, (g + grain * 255) * (1 - polar)))
      data[i + 2] = Math.max(0, Math.min(255, (bl + grain * 255) * (1 - polar)))
      data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
}

/* ------------------------------ Earth landmasses ---------------------------- */

const NORTH_AMERICA: number[][] = [
  [-166, 68], [-156, 71], [-130, 70], [-100, 70], [-80, 73], [-68, 66], [-64, 60], [-56, 53],
  [-66, 45], [-74, 40], [-76, 35], [-81, 31], [-80, 25], [-83, 28], [-90, 29], [-97, 26],
  [-97, 21], [-95, 18], [-88, 21], [-87, 15], [-83, 9], [-77, 7], [-85, 14], [-92, 16],
  [-97, 16], [-105, 20], [-110, 24], [-114, 31], [-117, 33], [-122, 37], [-124, 42],
  [-124, 48], [-131, 54], [-136, 58], [-146, 60], [-153, 58], [-163, 60],
]

const GREENLAND: number[][] = [
  [-44, 60], [-50, 64], [-53, 68], [-56, 71], [-61, 76], [-68, 79], [-65, 82], [-45, 83],
  [-25, 82], [-19, 77], [-21, 72], [-25, 70], [-32, 68], [-40, 64],
]

const SOUTH_AMERICA: number[][] = [
  [-77, 8], [-72, 11], [-63, 10], [-52, 5], [-50, 0], [-44, -2], [-35, -5], [-38, -13],
  [-48, -25], [-53, -32], [-57, -35], [-62, -39], [-63, -42], [-65, -45], [-68, -50],
  [-70, -54], [-75, -52], [-74, -45], [-73, -37], [-71, -30], [-70, -20], [-76, -14],
  [-79, -7], [-81, -4], [-80, 0],
]

const AFRICA: number[][] = [
  [-17, 15], [-17, 21], [-13, 28], [-10, 33], [0, 36], [10, 37], [20, 33], [25, 32],
  [32, 31], [34, 28], [38, 22], [43, 12], [51, 11], [48, 4], [41, -2], [40, -10],
  [35, -18], [32, -26], [26, -34], [18, -34], [12, -18], [9, -1], [9, 4], [5, 6],
  [-3, 5], [-9, 5], [-13, 9],
]

const EURASIA: number[][] = [
  [-9, 43], [-2, 43], [-4, 48], [2, 51], [8, 54], [11, 58], [5, 61], [11, 64], [15, 68],
  [24, 71], [40, 68], [55, 69], [70, 73], [90, 76], [110, 76], [130, 73], [145, 72],
  [160, 70], [170, 68], [180, 66], [178, 62], [165, 60], [158, 57], [150, 59], [143, 54],
  [140, 52], [133, 48], [130, 43], [126, 40], [122, 39], [120, 35], [122, 31], [118, 25],
  [110, 21], [108, 16], [106, 10], [103, 1], [100, 6], [98, 9], [94, 16], [90, 22],
  [87, 21], [82, 17], [78, 9], [76, 11], [73, 17], [70, 22], [66, 25], [61, 25], [57, 25],
  [56, 26], [50, 29], [48, 30], [43, 30], [43, 20], [39, 17], [43, 13], [45, 13],
  [52, 17], [57, 22], [52, 26], [45, 30], [37, 32], [34, 36], [30, 36], [26, 38],
  [23, 40], [18, 40], [15, 38], [12, 44], [4, 44], [-2, 43],
]

const AUSTRALIA: number[][] = [
  [114, -22], [113, -26], [116, -32], [119, -34], [125, -33], [131, -31], [135, -35],
  [138, -35], [141, -38], [146, -39], [150, -37], [153, -31], [153, -25], [148, -20],
  [145, -15], [142, -11], [137, -12], [132, -11], [130, -14], [126, -14], [122, -17],
]

const MADAGASCAR: number[][] = [
  [49, -12], [50, -16], [47, -25], [45, -25], [43, -20], [44, -16],
]

const JAPAN: number[][] = [
  [131, 32], [135, 34], [140, 36], [142, 40], [141, 45], [138, 37], [133, 35], [130, 33],
]

const NEW_ZEALAND: number[][] = [
  [173, -35], [178, -38], [177, -41], [174, -41], [172, -43], [167, -46], [168, -44], [172, -40],
]

const BRITAIN: number[][] = [
  [-5, 50], [0, 51], [1, 53], [-1, 55], [-3, 58], [-5, 58], [-5, 54], [-6, 52],
]

const SUMATRA_JAVA: number[][] = [
  [95, 5], [104, -2], [106, -6], [114, -8], [110, -7], [103, -4], [97, 2],
]

const BORNEO_NEW_GUINE: number[][] = [
  [109, 2], [119, 5], [118, -4], [110, -3], [131, -2], [141, -3], [147, -8], [138, -9],
  [131, -4], [122, -2],
]

const ISLANDS: number[][][] = [
  MADAGASCAR,
  JAPAN,
  NEW_ZEALAND,
  BRITAIN,
  SUMATRA_JAVA,
  BORNEO_NEW_GUINE,
  [
    [-24, 63], [-18, 64], [-14, 66], [-19, 67], [-24, 65],
  ],
]

const LANDMASSES: number[][][] = [
  NORTH_AMERICA,
  GREENLAND,
  SOUTH_AMERICA,
  AFRICA,
  EURASIA,
  AUSTRALIA,
  ...ISLANDS,
]

/** Inland seas carved back out of the land polygons. */
const INLAND_SEAS: number[][][] = [
  [
    [28, 41], [34, 42], [41, 42], [41, 46], [33, 46], [29, 44],
  ],
  [
    [47, 37], [53, 40], [54, 47], [49, 46], [47, 42],
  ],
  [
    [-95, 51], [-80, 55], [-78, 62], [-88, 57], [-94, 53],
  ],
  [
    [-88, 41], [-82, 45], [-76, 44], [-80, 41],
  ],
  [
    [-60, -63], [-45, -60], [10, -66], [60, -67], [110, -66], [160, -72], [165, -80],
    [-180, -79], [-180, -68],
  ],
]

function buildLandMask(w: number, h: number): ImageData {
  const el = canvas(w, h)
  const ctx = context(el)
  ctx.fillStyle = '#000'
  ctx.fillRect(0, 0, w, h)
  ctx.fillStyle = '#fff'
  for (const poly of LANDMASSES) tracePolygon(ctx, poly, w, h)
  ctx.fillStyle = '#000'
  for (const poly of INLAND_SEAS) tracePolygon(ctx, poly, w, h)
  return ctx.getImageData(0, 0, w, h)
}

/* --------------------------------- Earth ----------------------------------- */

const CITIES: [number, number, number][] = [
  // lon, lat, relative brightness
  [-74, 40.7, 1.0], [-118, 34, 0.85], [-87, 41.9, 0.8], [-95, 29.8, 0.7], [-80, 25.8, 0.6],
  [-99, 19.4, 0.75], [-79, 9, 0.35], [-46, -23.5, 0.75], [-58, -34.6, 0.7], [-70, -33, 0.5],
  [-3, 51.5, 0.85], [2.3, 48.9, 0.85], [12.5, 41.9, 0.7], [-0.1, 51.5, 0.9], [4.9, 52.4, 0.6],
  [30.5, 50.4, 0.6], [37, 55.7, 0.6], [28.9, 41, 0.6], [23.7, 38, 0.45], [19, 47.5, 0.45],
  [13.4, 52.5, 0.5], [-8.6, 41.1, 0.45], [9.2, 45.5, 0.45], [26, 39.9, 0.4], [72.8, 18.5, 0.6],
  [88, 22.6, 0.7], [77.2, 28.6, 0.85], [80.3, 13.1, 0.7], [72.6, 23, 0.5], [90.4, 23.8, 0.6],
  [100.5, 13.7, 0.7], [106.8, -6.2, 0.75], [103.8, 1.3, 0.6], [116.4, 39.9, 0.85],
  [121.5, 31.2, 0.9], [114, 30.6, 0.6], [113.3, 23.1, 0.7], [104.1, 30.7, 0.55],
  [114, 22.5, 0.6], [126.9, 37.6, 0.85], [139.7, 35.7, 0.9], [135.5, 34.7, 0.7],
  [116.4, 39.9, 0.8], [121.6, 25, 0.7], [151.2, -33.9, 0.55], [144.9, -37.8, 0.5],
  [-43.2, -22.9, 0.6], [-38.5, -12.9, 0.4], [-56, -34.9, 0.4], [-75, 45, 0.4],
  [-73, 4.7, 0.4], [-84, 10, 0.3], [-17, 14.7, 0.25], [3, 6.5, 0.35], [31, -29, 0.3],
  [18, -33.9, 0.25], [28, -26.2, 0.35], [36.8, -1.3, 0.3], [55.3, 25.2, 0.3],
]

interface EarthMaps {
  albedo: HTMLCanvasElement
  lights: HTMLCanvasElement
}

function paintEarthAlbedo(w: number, h: number): EarthMaps {
  const el = canvas(w, h)
  const ctx = context(el)
  const mask = buildLandMask(w, h)
  const maskData = mask.data
  const image = ctx.createImageData(w, h)
  const data = image.data

  const deep = new THREE.Color('#04193f')
  const shallow = new THREE.Color('#0d5f9c')
  const forest = new THREE.Color('#2c5c2c')
  const grass = new THREE.Color('#5b7a34')
  const desert = new THREE.Color('#b08a4e')
  const tundra = new THREE.Color('#8e9484')
  const ice = new THREE.Color('#f2f7ff')
  const rock = new THREE.Color('#6d6559')

  const landAt = (x: number, y: number, jx: number, jy: number): boolean => {
    const px = Math.round(x + jx)
    const py = Math.round(y + jy)
    if (px < 0 || py < 0 || px >= w || py >= h) return false
    return maskData[(py * w + px) * 4] > 127
  }

  for (let y = 0; y < h; y += 1) {
    const lat = 90 - (y / h) * 180
    const absLat = Math.abs(lat)

    for (let x = 0; x < w; x += 1) {
      const lon = (x / w) * 360 - 180
      const phi = (lon * Math.PI) / 180
      const theta = (lat * Math.PI) / 180
      const sx = Math.cos(theta) * Math.cos(phi)
      const sy = Math.sin(theta)
      const sz = Math.cos(theta) * Math.sin(phi)

      const i = (y * w + x) * 4

      // Antarctica is drawn as a solid cap rather than a wobbly polygon.
      if (lat < -63) {
        const edge = detailNoise.fbm(sx * 3, sy * 3, sz * 3, 3) * 5
        if (lat < -63 + edge) {
          data[i] = 236
          data[i + 1] = 242
          data[i + 2] = 252
          data[i + 3] = 255
          continue
        }
      }

      const jx = noise.noise3(sx * 26, sy * 26, sz * 26) * 2.6
      const jy = noise.noise3(sx * 26 + 40, sy * 26, sz * 26 + 40) * 2.6
      const isLand = landAt(x, y, jx, jy)

      const relief = detailNoise.fbm(sx * 6, sy * 6, sz * 6, 5)
      const detail = detailNoise.noise3(sx * 34, sy * 34, sz * 34)

      let color: THREE.Color
      if (isLand) {
        // Deserts cluster around the subtropics, forests near the equator.
        const arid = Math.cos((absLat * Math.PI) / 27) * (0.4 + relief * 0.7)
        const dry = detailNoise.fbm(sx * 2.4 + 11, sy * 2.4, sz * 2.4, 4) * 0.9 + 0.4
        const mountain = detailNoise.ridged(sx * 9 + 3, sy * 9, sz * 9, 4)

        color = grass.clone()
        color.lerp(forest, Math.min(1, Math.max(0, dry * 0.9)))
        color.lerp(desert, Math.min(1, Math.max(0, arid * dry * 1.5)))
        color.lerp(rock, Math.min(0.8, Math.max(0, (mountain - 0.55) * 2.4)))

        if (absLat > 58) color.lerp(tundra, Math.min(1, (absLat - 58) / 16))
        if (absLat > 70) color.lerp(ice, Math.min(1, (absLat - 70) / 10))
        if (absLat > 82) color.copy(ice)
      } else {
        color = deep.clone()
        color.lerp(shallow, Math.min(1, Math.max(0, relief * 0.55 + 0.35)))
        if (absLat > 62) color.lerp(shallow, 0.2)
        color.offsetHSL(0, 0, detail * 0.03)
      }

      data[i] = Math.max(0, Math.min(255, color.r * 255 + detail * 8))
      data[i + 1] = Math.max(0, Math.min(255, color.g * 255 + detail * 8))
      data[i + 2] = Math.max(0, Math.min(255, color.b * 255 + detail * 8))
      data[i + 3] = 255
    }
  }

  ctx.putImageData(image, 0, 0)

  // City glow layer for the night side.
  const lights = ctx.createImageData(w, h)
  const rand = mulberry32(9182)
  CITIES.forEach(([lon, lat, strength]) => {
    const [cx, cy] = project(lon, lat, w, h)
    const count = Math.round(90 * strength)
    const spread = w * 0.012
    for (let k = 0; k < count; k += 1) {
      const a = rand() * Math.PI * 2
      const r = Math.pow(rand(), 0.6) * spread
      const px = Math.round(cx + Math.cos(a) * r)
      const py = Math.round(cy + Math.sin(a) * r * 0.6)
      if (py < 0 || py >= h) continue
      for (let dx = -2; dx <= 2; dx += 1) {
        for (let dy = -2; dy <= 2; dy += 1) {
          const nx = px + dx
          const ny = py + dy
          if (nx < 0 || nx >= w) continue
          const d = Math.hypot(dx, dy) / 3
          const v = Math.max(0, (1 - d) * strength * (0.35 + rand() * 0.65))
          const idx = (ny * w + nx) * 4
          lights.data[idx] = Math.min(255, lights.data[idx] + v * 255)
          lights.data[idx + 1] = Math.min(255, lights.data[idx + 1] + v * 210)
          lights.data[idx + 2] = Math.min(255, lights.data[idx + 2] + v * 140)
          lights.data[idx + 3] = 255
        }
      }
    }
  })
  const lightCanvas = canvas(w, h)
  const lightCtx = context(lightCanvas)
  lightCtx.putImageData(lights, 0, 0)

  return { albedo: el, lights: lightCanvas }
}

function paintEarthClouds(w: number, h: number): HTMLCanvasElement {
  const el = canvas(w, h)
  const ctx = context(el)
  const image = ctx.createImageData(w, h)
  const data = image.data

  for (let y = 0; y < h; y += 1) {
    const lat = 90 - (y / h) * 180
    const absLat = Math.abs(lat)
    // Intertropical convergence zone plus mid-latitude storm tracks.
    const itcz = Math.exp(-((absLat / 9) ** 2)) * 0.75
    const storm = Math.exp(-(((absLat - 52) / 15) ** 2)) * 0.55
    const subtropical = Math.exp(-(((absLat - 26) / 9) ** 2)) * 0.25
    const bandBias = itcz + storm + subtropical

    for (let x = 0; x < w; x += 1) {
      const lon = (x / w) * 360 - 180
      const v = sphereNoise(noise, lon, lat, 3.1, 6)
      const swirl = detailNoise.ridged(lon * 0.06, lat * 0.12, 0.5, 4)
      const density = v * 0.75 + swirl * 0.45 + bandBias - 0.62
      const a = Math.max(0, Math.min(1, density * 2.4))
      const i = (y * w + x) * 4
      data[i] = 255
      data[i + 1] = 255
      data[i + 2] = 255
      data[i + 3] = a * 255
    }
  }
  ctx.putImageData(image, 0, 0)
  return el
}

/* --------------------------------- Bodies ---------------------------------- */

function paintSun(w: number, h: number): HTMLCanvasElement {
  const el = canvas(w, h)
  const ctx = context(el)
  const image = ctx.createImageData(w, h)
  const data = image.data
  const hot = new THREE.Color('#fff6d0')
  const warm = new THREE.Color('#ffb03a')
  const cool = new THREE.Color('#e4510c')

  for (let y = 0; y < h; y += 1) {
    const lat = 90 - (y / h) * 180
    for (let x = 0; x < w; x += 1) {
      const lon = (x / w) * 360 - 180
      const granulation = sphereNoise(noise, lon, lat, 9, 5) * 0.5 + 0.5
      const cells = sphereNoise(detailNoise, lon, lat, 22, 3) * 0.5 + 0.5
      const t = Math.min(1, Math.max(0, granulation * 0.65 + cells * 0.4 - 0.05))

      const color = t < 0.55 ? warm.clone().lerp(cool, 1 - t / 0.55) : cool.clone().lerp(hot, (t - 0.55) / 0.45)
      const i = (y * w + x) * 4
      data[i] = color.r * 255
      data[i + 1] = color.g * 255
      data[i + 2] = color.b * 255
      data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)

  // Sunspots: dark, cooler patches on the photosphere.
  const rand = mulberry32(4242)
  for (let i = 0; i < 9; i += 1) {
    const cx = rand() * w
    const cy = h * (0.2 + rand() * 0.6)
    const r = w * (0.012 + rand() * 0.022)
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
    g.addColorStop(0, 'rgba(60,20,0,0.9)')
    g.addColorStop(0.6, 'rgba(120,50,0,0.5)')
    g.addColorStop(1, 'rgba(120,50,0,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.arc(cx, cy, r, 0, Math.PI * 2)
    ctx.fill()
  }
  return el
}

function paintCratered(w: number, h: number, base: THREE.Color, seed: number, density: number): HTMLCanvasElement {
  const el = canvas(w, h)
  const ctx = context(el)
  const image = ctx.createImageData(w, h)
  const data = image.data

  for (let y = 0; y < h; y += 1) {
    const lat = 90 - (y / h) * 180
    for (let x = 0; x < w; x += 1) {
      const lon = (x / w) * 360 - 180
      const n = sphereNoise(noise, lon, lat, 4.5, 6) * 0.5 + 0.5
      const d = detailNoise.fbm(Math.cos((lat * Math.PI) / 180) * 8, lat * 0.08, Math.sin((lon * Math.PI) / 180) * 8, 5)
      const shade = 0.82 + n * 0.28 + d * 0.16
      const i = (y * w + x) * 4
      data[i] = Math.max(0, Math.min(255, base.r * 255 * shade))
      data[i + 1] = Math.max(0, Math.min(255, base.g * 255 * shade))
      data[i + 2] = Math.max(0, Math.min(255, base.b * 255 * shade))
      data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)

  const rand = mulberry32(seed)
  paintCraters(ctx, w, h, rand, density, w * 0.004, w * 0.03)

  // Draw the equirectangular seam so wrap-around artefacts stay hidden.
  for (let y = 0; y < h; y += 1) {
    const px = Math.floor(rand() * w)
    const i = (y * w + px) * 4
    data[i] = Math.max(0, data[i] - 6)
    data[i + 1] = Math.max(0, data[i + 1] - 6)
    data[i + 2] = Math.max(0, data[i + 2] - 6)
  }
  ctx.putImageData(image, 0, 0)
  return el
}

function paintVenus(w: number, h: number): HTMLCanvasElement {
  const el = canvas(w, h)
  const ctx = context(el)
  paintBanded(ctx, w, h, ['#c9a25a', '#f0d9a8', '#e8c887', '#fff0c9', '#d8b273'], 9, 0.055, 5)

  ctx.save()
  ctx.globalAlpha = 0.5
  ctx.globalCompositeOperation = 'lighter'
  const rand = mulberry32(88)
  for (let i = 0; i < 26; i += 1) {
    const cx = rand() * w
    const cy = rand() * h
    const rx = w * (0.05 + rand() * 0.1)
    const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, rx)
    g.addColorStop(0, 'rgba(255,245,220,0.5)')
    g.addColorStop(1, 'rgba(255,245,220,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(cx, cy, rx, rx * 0.42, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
  return el
}

function paintMars(w: number, h: number): HTMLCanvasElement {
  const el = canvas(w, h)
  const ctx = context(el)
  const image = ctx.createImageData(w, h)
  const data = image.data
  const rust = new THREE.Color('#a63c17')
  const dark = new THREE.Color('#5f2a17')
  const pale = new THREE.Color('#d98a54')

  for (let y = 0; y < h; y += 1) {
    const lat = 90 - (y / h) * 180
    const absLat = Math.abs(lat)
    for (let x = 0; x < w; x += 1) {
      const lon = (x / w) * 360 - 180
      const n = sphereNoise(noise, lon, lat, 3.4, 6) * 0.5 + 0.5
      const fine = sphereNoise(detailNoise, lon, lat, 11, 4) * 0.5 + 0.5
      const color = rust.clone().lerp(dark, Math.pow(1 - n, 1.6)).lerp(pale, Math.pow(n, 3) * 0.7)
      const i = (y * w + x) * 4
      let r = color.r * 255 * (0.86 + fine * 0.28)
      let g = color.g * 255 * (0.86 + fine * 0.28)
      let b = color.b * 255 * (0.86 + fine * 0.28)
      if (absLat > 72) {
        const cap = Math.min(1, (absLat - 72) / 8)
        r += (238 - r) * cap
        g += (244 - g) * cap
        b += (252 - b) * cap
      }
      data[i] = Math.min(255, r)
      data[i + 1] = Math.min(255, g)
      data[i + 2] = Math.min(255, b)
      data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)

  const rand = mulberry32(31337)
  paintCraters(ctx, w, h, rand, 260, w * 0.004, w * 0.022)

  // Valles Marineris hint and Olympus Mons.
  ctx.strokeStyle = 'rgba(60,20,8,0.55)'
  ctx.lineWidth = h * 0.012
  ctx.beginPath()
  const [, my] = project(-90, -14, w, h)
  ctx.moveTo(w * 0.18, my)
  ctx.lineTo(w * 0.42, my + h * 0.012)
  ctx.stroke()

  const [ox, oy] = project(-134, 18, w, h)
  const spot = ctx.createRadialGradient(ox, oy, 0, ox, oy, w * 0.018)
  spot.addColorStop(0, 'rgba(255,190,140,0.75)')
  spot.addColorStop(1, 'rgba(255,190,140,0)')
  ctx.fillStyle = spot
  ctx.beginPath()
  ctx.arc(ox, oy, w * 0.018, 0, Math.PI * 2)
  ctx.fill()
  return el
}

function paintJupiter(w: number, h: number): HTMLCanvasElement {
  const el = canvas(w, h)
  const ctx = context(el)
  paintBanded(
    ctx,
    w,
    h,
    ['#8a5a3b', '#d9a86f', '#f2d9b0', '#c98d55', '#e9cfa0', '#a9703f', '#f7e6c6'],
    13,
    0.045,
    2,
  )

  // Great Red Spot.
  const [cx, cy] = project(80, -22, w, h)
  const rx = w * 0.075
  const ry = rx * 0.52
  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(-0.08)
  for (let i = 6; i >= 0; i -= 1) {
    const t = i / 6
    ctx.beginPath()
    ctx.ellipse(0, 0, rx * (1 - t * 0.85), ry * (1 - t * 0.85), 0, 0, Math.PI * 2)
    ctx.fillStyle = `rgba(${170 + t * 60},${60 + t * 40},${38 + t * 30},${0.28 + t * 0.14})`
    ctx.fill()
  }
  ctx.restore()

  ctx.save()
  ctx.globalAlpha = 0.35
  ctx.globalCompositeOperation = 'lighter'
  const rand = mulberry32(5150)
  for (let i = 0; i < 18; i += 1) {
    const x = rand() * w
    const y = h * (0.15 + rand() * 0.7)
    const r = w * (0.02 + rand() * 0.05)
    const g = ctx.createRadialGradient(x, y, 0, x, y, r)
    g.addColorStop(0, 'rgba(255,250,235,0.6)')
    g.addColorStop(1, 'rgba(255,250,235,0)')
    ctx.fillStyle = g
    ctx.beginPath()
    ctx.ellipse(x, y, r, r * 0.35, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
  return el
}

function paintSaturn(w: number, h: number): HTMLCanvasElement {
  const el = canvas(w, h)
  const ctx = context(el)
  paintBanded(ctx, w, h, ['#c9a35f', '#ecd29b', '#f7e6bd', '#d8b273', '#f2dda8'], 9, 0.03, 7)
  return el
}

function paintUranus(w: number, h: number): HTMLCanvasElement {
  const el = canvas(w, h)
  const ctx = context(el)
  paintBanded(ctx, w, h, ['#6fc3d4', '#a5e3ec', '#c9f0f4', '#84d0de'], 5, 0.012, 3)
  return el
}

function paintNeptune(w: number, h: number): HTMLCanvasElement {
  const el = canvas(w, h)
  const ctx = context(el)
  paintBanded(ctx, w, h, ['#1b3f9c', '#2f63d8', '#4d86ee', '#12307f'], 7, 0.03, 13)

  const [cx, cy] = project(140, -30, w, h)
  const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, w * 0.05)
  g.addColorStop(0, 'rgba(10,25,80,0.85)')
  g.addColorStop(1, 'rgba(10,25,80,0)')
  ctx.fillStyle = g
  ctx.beginPath()
  ctx.ellipse(cx, cy, w * 0.05, h * 0.03, 0, 0, Math.PI * 2)
  ctx.fill()

  ctx.save()
  ctx.globalAlpha = 0.55
  ctx.fillStyle = '#cfe4ff'
  for (let i = 0; i < 5; i += 1) {
    const y = h * (0.25 + i * 0.11)
    ctx.beginPath()
    ctx.ellipse(w * (0.2 + i * 0.15), y, w * 0.035, h * 0.008, 0, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
  return el
}

function paintMoon(w: number, h: number): HTMLCanvasElement {
  const el = canvas(w, h)
  const ctx = context(el)
  const image = ctx.createImageData(w, h)
  const data = image.data
  const highland = new THREE.Color('#a9a49a')
  const mare = new THREE.Color('#5d5a56')

  for (let y = 0; y < h; y += 1) {
    const lat = 90 - (y / h) * 180
    for (let x = 0; x < w; x += 1) {
      const lon = (x / w) * 360 - 180
      const n = sphereNoise(noise, lon, lat, 3.2, 5) * 0.5 + 0.5
      const mareMask = sphereNoise(detailNoise, lon, lat, 2.1, 3) * 0.5 + 0.5
      const color = highland.clone().lerp(mare, Math.pow(Math.max(0, mareMask - 0.45) * 1.9, 1.4))
      const shade = 0.85 + n * 0.3
      const i = (y * w + x) * 4
      data[i] = color.r * 255 * shade
      data[i + 1] = color.g * 255 * shade
      data[i + 2] = color.b * 255 * shade
      data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  const rand = mulberry32(1979)
  paintCraters(ctx, w, h, rand, 420, w * 0.003, w * 0.026)
  return el
}

/* --------------------------------- Rings ----------------------------------- */

/**
 * Saturn's rings: real radial structure — the C ring, the bright B ring, the
 * Cassini Division gap, the A ring and the narrow Encke gap.
 */
function paintSaturnRings(w: number, h: number): HTMLCanvasElement {
  const el = canvas(w, h)
  const ctx = context(el)
  const image = ctx.createImageData(w, h)
  const data = image.data

  for (let x = 0; x < w; x += 1) {
    const t = x / w
    let density = 0
    let color = new THREE.Color('#d9c9a8')

    if (t > 0.03 && t < 0.2) density = 0.18 + Math.pow(t, 1.4) * 0.2 // C ring
    else if (t > 0.2 && t < 0.62) density = 0.92 // B ring
    else if (t >= 0.62 && t < 0.7) density = 0.08 // Cassini Division
    else if (t >= 0.7 && t < 0.94) density = 0.72 // A ring
    else if (t >= 0.94) density = 0.05

    if (t > 0.9 && t < 0.925) density *= 0.12 // Encke gap
    if (t < 0.02) density = 0

    for (let y = 0; y < h; y += 1) {
      const streak = detailNoise.fbm(x * 0.35, y * 0.06, 3.3, 5) * 0.5 + 0.5
      const fine = detailNoise.fbm(x * 1.4, y * 0.15, 11, 3) * 0.5 + 0.5
      const d = Math.max(0, Math.min(1, density * (0.62 + streak * 0.55 + fine * 0.22)))
      const shade = color.clone().lerp(new THREE.Color('#8d7c62'), 1 - streak)
      const i = (y * w + x) * 4
      data[i] = shade.r * 255
      data[i + 1] = shade.g * 255
      data[i + 2] = shade.b * 255
      data[i + 3] = d * 255
    }
  }
  ctx.putImageData(image, 0, 0)
  return el
}

function paintUranusRings(w: number, h: number): HTMLCanvasElement {
  const el = canvas(w, h)
  const ctx = context(el)
  ctx.clearRect(0, 0, w, h)
  const rings = [0.14, 0.3, 0.42, 0.55, 0.62, 0.78, 0.9]
  rings.forEach((pos, i) => {
    const g = ctx.createLinearGradient((pos - 0.012) * w, 0, (pos + 0.012) * w, 0)
    g.addColorStop(0, 'rgba(160,225,240,0)')
    g.addColorStop(0.5, `rgba(190,240,250,${i % 2 ? 0.32 : 0.55})`)
    g.addColorStop(1, 'rgba(160,225,240,0)')
    ctx.fillStyle = g
    ctx.fillRect((pos - 0.014) * w, 0, 0.028 * w, h)
  })
  return el
}

/* ------------------------------- Space backdrop ----------------------------- */

/**
 * The static sky: a deep navy gradient, the Milky Way band, faint nebulae and
 * a dusting of dim stars. Twinkling 3D stars are layered on top of this.
 */
export function createSpaceBackdrop(): THREE.Texture {
  const w = 2048
  const h = 1024
  const el = canvas(w, h)
  const ctx = context(el)
  const image = ctx.createImageData(w, h)
  const data = image.data
  const base = new THREE.Color('#05070f')
  const milky = new THREE.Color('#2c3a63')
  const nebulaA = new THREE.Color('#4b2688')
  const nebulaB = new THREE.Color('#0f5c7a')

  for (let y = 0; y < h; y += 1) {
    const lat = 90 - (y / h) * 180
    const theta = (lat * Math.PI) / 180
    for (let x = 0; x < w; x += 1) {
      const lon = (x / w) * 360 - 180
      const phi = (lon * Math.PI) / 180
      const sx = Math.cos(theta) * Math.cos(phi)
      const sy = Math.sin(theta)
      const sz = Math.cos(theta) * Math.sin(phi)

      // Galactic plane tilted across the sky. The band is deliberately wide so
      // that it is visible from any camera angle, not just when you happen to be
      // looking straight along it.
      const galLat = Math.asin(THREE.MathUtils.clamp(-0.42 * sx + 0.9 * sy + 0.14 * sz, -1, 1))
      const band = Math.exp(-((galLat / 0.44) ** 2))
      const clumps = noise.fbm(sx * 3.2, sy * 3.2, sz * 3.2, 5) * 0.5 + 0.5
      const dust = detailNoise.ridged(sx * 8, sy * 8, sz * 8, 4)

      const color = base.clone()
      color.lerp(milky, 0.12 + band * (0.62 + clumps * 0.5))
      color.lerp(nebulaA, Math.max(0, noise.fbm(sx * 1.5 + 5, sy * 1.5, sz * 1.5, 4)) * 0.5 * (0.45 + band))
      color.lerp(nebulaB, Math.max(0, detailNoise.fbm(sx * 2.1 - 3, sy * 2.1, sz * 2.1, 4)) * 0.42 * (0.35 + band))
      color.multiplyScalar(1 - dust * 0.35 * band)

      const i = (y * w + x) * 4
      data[i] = Math.max(0, color.r * 255)
      data[i + 1] = Math.max(0, color.g * 255)
      data[i + 2] = Math.max(0, color.b * 255)
      data[i + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)

  // Baked dim stars so the background is never completely empty.
  //
  // These are drawn as single texels on purpose: the backdrop texture is
  // magnified roughly four times across a normal field of view, so anything
  // larger turns into a soft bokeh blob. The twinkling 3D star layer sits on
  // top of this and carries the real star field.
  const rand = mulberry32(1024)
  for (let i = 0; i < 9000; i += 1) {
    const x = Math.floor(rand() * w)
    const y = Math.floor(rand() * h)
    const theta = (90 - (y / h) * 180) * (Math.PI / 180)
    const galLat = Math.asin(
      THREE.MathUtils.clamp(
        -0.42 * Math.cos(theta) * Math.cos((x / w) * Math.PI * 2) +
          0.9 * Math.sin(theta) +
          0.14 * Math.cos(theta) * Math.sin((x / w) * Math.PI * 2),
        -1,
        1,
      ),
    )
    const density = 0.3 + Math.exp(-((galLat / 0.44) ** 2)) * 0.7
    if (rand() > density) continue

    const bright = 0.2 + rand() * 0.55
    const warm = rand()
    const r = Math.round(200 + warm * 55)
    const g = Math.round(215 + warm * 25)
    const b = 255
    ctx.fillStyle = `rgba(${r},${g},${b},${bright})`
    ctx.fillRect(x, y, 1, 1)
  }

  const texture = toTexture(el)
  texture.mapping = THREE.EquirectangularReflectionMapping
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

/** Soft round sprite used for stars, glows and the comet tail. */
export function createGlowSprite(inner = '#ffffff', outer = '#7cc4ff'): THREE.Texture {
  const key = `glow:${inner}:${outer}`
  const cached = cache.get(key)
  if (cached) return cached
  const size = 128
  const el = canvas(size, size)
  const ctx = context(el)
  const g = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  g.addColorStop(0, inner)
  g.addColorStop(0.22, inner)
  g.addColorStop(0.45, outer)
  g.addColorStop(1, 'rgba(0,0,0,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  const texture = toTexture(el)
  cache.set(key, texture)
  return texture
}

/* ------------------------------- Public API -------------------------------- */

function remember(key: string, texture: THREE.Texture): THREE.Texture {
  cache.set(key, texture)
  return texture
}

export function getSunTexture(): THREE.Texture {
  const key = 'sun'
  const hit = cache.get(key)
  if (hit) return hit
  return remember(key, toTexture(paintSun(1024, 512)))
}

let earthMaps: EarthMaps | null = null

/** Paints the Earth day map once and shares the canvases between textures. */
function earthMapCanvases(): EarthMaps {
  earthMaps ??= paintEarthAlbedo(1024, 512)
  return earthMaps
}

export function getEarthAlbedo(): THREE.Texture {
  const key = 'earth:albedo'
  const hit = cache.get(key)
  if (hit) return hit
  return remember(key, toTexture(earthMapCanvases().albedo))
}

export function getEarthNightTexture(): THREE.Texture {
  const key = 'earth:lights'
  const hit = cache.get(key)
  if (hit) return hit
  return remember(key, toTexture(earthMapCanvases().lights))
}

export function getEarthClouds(): THREE.Texture {
  const key = 'earth:clouds'
  const hit = cache.get(key)
  if (hit) return hit
  return remember(key, toTexture(paintEarthClouds(1024, 512)))
}

export function getRingTexture(id: PlanetId): THREE.Texture | null {
  const planet = PLANET_BY_ID[id]
  if (planet.ringStyle === 'none') return null
  const key = `rings:${id}`
  const hit = cache.get(key)
  if (hit) return hit
  const el = planet.ringStyle === 'icy' ? paintSaturnRings(1024, 4) : paintUranusRings(1024, 4)
  const texture = toTexture(el)
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.repeat.set(1, 1)
  return remember(key, texture)
}

/**
 * The albedo map for a body.
 *
 * Real NASA imagery wins whenever it exists: `imageTextures` loads it during the
 * preload and it is already in the cache by the time the scene mounts. The
 * procedural painter is the fallback for the Sun, Mercury, Uranus and any moon
 * without a public equirectangular map, and it is also what runs if an image
 * request fails, so the app never renders a blank planet.
 */
export function getBodyTexture(id: PlanetId | 'sun' | 'moon'): THREE.Texture {
  const key = `body:${id}`
  const hit = cache.get(key)
  if (hit) return hit

  const real = realTextureNow(id)
  if (real) return remember(key, real)

  let el: HTMLCanvasElement
  switch (id) {
    case 'sun':
      el = paintSun(1024, 512)
      break
    case 'moon':
      el = paintMoon(1024, 512)
      break
    case 'mercury':
      el = paintCratered(1024, 512, new THREE.Color('#8f857c'), 11, 620)
      break
    case 'venus':
      el = paintVenus(1024, 512)
      break
    case 'earth':
      el = earthMapCanvases().albedo
      break
    case 'mars':
      el = paintMars(1024, 512)
      break
    case 'jupiter':
      el = paintJupiter(1024, 512)
      break
    case 'saturn':
      el = paintSaturn(1024, 512)
      break
    case 'uranus':
      el = paintUranus(1024, 512)
      break
    default:
      el = paintNeptune(1024, 512)
      break
  }
  return remember(key, toTexture(el))
}

export function getMoonTexture(): THREE.Texture {
  return getBodyTexture('moon')
}

/** A moon's surface map: real imagery where available, otherwise procedural. */
export function getMoonGreyTexture(moonId: string): THREE.Texture {
  const key = `moon:${moonId}`
  const hit = cache.get(key)
  if (hit) return hit

  const real = realTextureNow(moonId)
  if (real) return remember(key, real)

  const moon = MOONS.find((m) => m.id === moonId)
  const base = new THREE.Color(moon?.color ?? '#b9b3a8')
  return remember(key, toTexture(paintCratered(512, 256, base, moonId.length * 97, 220)))
}

export function getCoronaTexture(): THREE.Texture {
  const key = 'corona'
  const hit = cache.get(key)
  if (hit) return hit
  const size = 512
  const el = canvas(size, size)
  const ctx = context(el)
  const g = ctx.createRadialGradient(size / 2, size / 2, size * 0.2, size / 2, size / 2, size / 2)
  g.addColorStop(0, 'rgba(255,238,190,0.9)')
  g.addColorStop(0.3, 'rgba(255,190,90,0.4)')
  g.addColorStop(0.58, 'rgba(255,120,40,0.14)')
  g.addColorStop(1, 'rgba(255,90,30,0)')
  ctx.fillStyle = g
  ctx.fillRect(0, 0, size, size)
  // Streaky corona rays — kept subtle so the Sun reads as a hot ball rather
  // than a graphic sunburst.
  const rand = mulberry32(6161)
  ctx.globalCompositeOperation = 'lighter'
  for (let i = 0; i < 140; i += 1) {
    const a = rand() * Math.PI * 2
    const inner = size * (0.19 + rand() * 0.05)
    const outer = size * (0.23 + rand() * 0.16)
    const wdt = 0.008 + rand() * 0.014
    const grad = ctx.createLinearGradient(
      size / 2 + Math.cos(a) * inner,
      size / 2 + Math.sin(a) * inner,
      size / 2 + Math.cos(a) * outer,
      size / 2 + Math.sin(a) * outer,
    )
    grad.addColorStop(0, 'rgba(255,214,140,0.13)')
    grad.addColorStop(1, 'rgba(255,170,80,0)')
    ctx.strokeStyle = grad
    ctx.lineWidth = wdt * size
    ctx.beginPath()
    ctx.moveTo(size / 2 + Math.cos(a) * inner, size / 2 + Math.sin(a) * inner)
    ctx.lineTo(size / 2 + Math.cos(a) * outer, size / 2 + Math.sin(a) * outer)
    ctx.stroke()
  }
  ctx.globalCompositeOperation = 'source-over'
  return remember(key, toTexture(el))
}

export function disposeTextureCache(): void {
  cache.forEach((texture) => texture.dispose())
  cache.clear()
}

export const SUN_DIAMETER_KM = SUN.diameterKm