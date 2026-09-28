import { CanvasTexture, ClampToEdgeWrapping, NoColorSpace, RepeatWrapping, SRGBColorSpace } from 'three'
import type { Texture } from 'three'
import type { QualityLevel } from '../types'
import type { TextureId } from '../data/visuals'
import { TEXTURE_IDS, TEXTURE_SOURCES } from './textureSources'
import { cylindricalFbm, clamp, createRandom, lerp, smoothstep } from './random'

/**
 * Every surface in the Solar System is mapped here.
 *
 * Two sources, in order of preference:
 *
 *  1. **Real map data** (`public/textures`, see `textureSources.ts` and
 *     `public/textures/CREDITS.md`). These are equirectangular photographic and
 *     mosaic products built from NASA / JPL / USGS imagery — Blue Marble for
 *     Earth, MESSENGER for Mercury, Cassini for Saturn and its rings, and so on.
 *     They are committed to the repository, so the built app is still completely
 *     self-contained and runs offline.
 *  2. **The procedural painters below**, used only for maps that have no real
 *     counterpart (the Sun's corona glow, the star and comet sprites) and as an
 *     automatic fallback if a file is ever missing or fails to decode. A planet
 *     therefore never appears blank.
 *
 * Both paths produce seamless cylindrical maps, so a rotating planet never shows
 * a seam. Everything happens once, before the 3D scene mounts, and reports
 * progress to the loading screen.
 */

export interface TextureProgress {
  label: string
  ratio: number
}

interface MapSize {
  width: number
  height: number
}

function context2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This browser cannot create a 2D canvas context.')
  return ctx
}

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function toTexture(canvas: HTMLCanvasElement, colorSpace: Texture['colorSpace'] = SRGBColorSpace): Texture {
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = colorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.anisotropy = 4
  texture.generateMipmaps = true
  texture.needsUpdate = true
  return texture
}

interface FieldOptions {
  /** Horizontal detail: larger = more features around the equator. */
  radius: number
  /** Vertical detail: larger = more features from pole to pole. */
  height: number
  octaves: number
  seed: number
  /** Optional horizontal warp so coastlines and storms look organic. */
  warp?: number
  /** Extra multiplication on the vertical axis (used for banded gas giants). */
  verticalScale?: number
}

/**
 * Samples a seamless fractal field, one value per pixel (0…1).
 * The sample point travels around a cylinder, so column 0 and column w-1 match.
 */
function sampleField(width: number, height: number, options: FieldOptions): Float32Array {
  const field = new Float32Array(width * height)
  const verticalScale = options.verticalScale ?? 1
  for (let y = 0; y < height; y += 1) {
    const v = (y + 0.5) / height
    for (let x = 0; x < width; x += 1) {
      const u = (x + 0.5) / width
      let value = cylindricalFbm(u, v * verticalScale, options.radius, options.height, options.octaves, options.seed)
      if (options.warp) {
        // A second, slower field shifts u sideways; because it is itself
        // periodic in u the result stays seamless.
        const shift = cylindricalFbm(u, v * verticalScale, options.radius * 0.6, options.height * 0.6, 3, options.seed + 5171)
        value = cylindricalFbm(
          u + (shift - 0.5) * options.warp,
          v * verticalScale,
          options.radius,
          options.height,
          options.octaves,
          options.seed,
        )
      }
      field[y * width + x] = value
    }
  }
  return field
}

type ColorFn = (value: number, u: number, v: number, x: number, y: number) => [number, number, number]
type AlphaFn = (value: number, u: number, v: number) => number

/** Writes a sampled field into an ImageData buffer using a colour ramp. */
function colorize(
  canvas: HTMLCanvasElement,
  field: Float32Array,
  colorAt: ColorFn,
  alphaAt?: AlphaFn,
): CanvasRenderingContext2D {
  const ctx = context2d(canvas)
  const { width, height } = canvas
  const image = ctx.createImageData(width, height)
  const data = image.data
  for (let y = 0; y < height; y += 1) {
    const v = (y + 0.5) / height
    for (let x = 0; x < width; x += 1) {
      const u = (x + 0.5) / width
      const index = y * width + x
      const [r, g, b] = colorAt(field[index], u, v, x, y)
      const offset = index * 4
      data[offset] = r
      data[offset + 1] = g
      data[offset + 2] = b
      data[offset + 3] = alphaAt ? Math.round(clamp(alphaAt(field[index], u, v), 0, 1) * 255) : 255
    }
  }
  ctx.putImageData(image, 0, 0)
  return ctx
}

/** Ray-traced-looking craters, drawn with two gradients each. */
function addCraters(
  ctx: CanvasRenderingContext2D,
  count: number,
  seed: number,
  minRadius: number,
  maxRadius: number,
  strength = 1,
): void {
  const random = createRandom(seed)
  const { width, height } = ctx.canvas
  for (let i = 0; i < count; i += 1) {
    const radius = lerp(minRadius, maxRadius, Math.pow(random(), 2.2))
    const x = random() * width
    const y = height * (0.03 + random() * 0.94)
    // Craters near the poles would be stretched; shrink them instead.
    const latitude = Math.abs(y / height - 0.5) * 2
    const squash = Math.max(0.25, 1 - latitude * 0.75)
    ctx.save()
    ctx.translate(x, y)
    ctx.scale(1 / squash, 1)
    const outer = ctx.createRadialGradient(0, 0, radius * 0.1, 0, 0, radius)
    outer.addColorStop(0, `rgba(0,0,0,${0.28 * strength})`)
    outer.addColorStop(0.62, `rgba(0,0,0,${0.12 * strength})`)
    outer.addColorStop(0.86, `rgba(255,255,255,${0.22 * strength})`)
    outer.addColorStop(1, 'rgba(255,255,255,0)')
    ctx.fillStyle = outer
    ctx.beginPath()
    ctx.arc(0, 0, radius, 0, Math.PI * 2)
    ctx.fill()
    ctx.restore()
  }
}

/** A colour ramp defined as [position, colour] stops. */
type Stop = [number, [number, number, number]]

function ramp(stops: Stop[], t: number): [number, number, number] {
  const value = clamp(t, 0, 1)
  for (let i = 0; i < stops.length - 1; i += 1) {
    const [posA, colorA] = stops[i]
    const [posB, colorB] = stops[i + 1]
    if (value <= posB) {
      const span = posB - posA || 1
      const local = clamp((value - posA) / span, 0, 1)
      return [
        Math.round(lerp(colorA[0], colorB[0], local)),
        Math.round(lerp(colorA[1], colorB[1], local)),
        Math.round(lerp(colorA[2], colorB[2], local)),
      ]
    }
  }
  return stops[stops.length - 1][1]
}

function mix(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  const local = clamp(t, 0, 1)
  return [
    Math.round(lerp(a[0], b[0], local)),
    Math.round(lerp(a[1], b[1], local)),
    Math.round(lerp(a[2], b[2], local)),
  ]
}

function paintSun(size: MapSize): HTMLCanvasElement {
  const canvas = makeCanvas(size.width, size.height)
  const granulation = sampleField(size.width, size.height, {
    radius: 7.5,
    height: 3.4,
    octaves: 3,
    seed: 1201,
  })
  const field = sampleField(size.width, size.height, {
    radius: 3.2,
    height: 2.1,
    octaves: 5,
    seed: 991,
    warp: 0.05,
  })
  colorize(canvas, field, (value, _u, _v, x, y) => {
    // A slow plasma field plus fine granulation makes a living surface.
    const detail = granulation[y * size.width + x]
    const t = clamp(value * 0.72 + detail * 0.34 - 0.03, 0, 1)
    const base = ramp(
      [
        [0, [150, 36, 0]],
        [0.3, [234, 96, 12]],
        [0.55, [255, 152, 32]],
        [0.76, [255, 208, 92]],
        [1, [255, 252, 226]],
      ],
      t,
    )
    const spots = smoothstep(0.62, 0.74, 1 - Math.abs(detail - 0.42) * 3.4)
    return mix(base, [120, 40, 8], spots * 0.5)
  })
  return canvas
}

function paintMercury(size: MapSize): HTMLCanvasElement {
  const canvas = makeCanvas(size.width, size.height)
  const field = sampleField(size.width, size.height, {
    radius: 3.4,
    height: 2.2,
    octaves: 6,
    seed: 4421,
    warp: 0.04,
  })
  const ctx = colorize(canvas, field, (value, _u, v) => {
    const base = ramp(
      [
        [0, [66, 62, 58]],
        [0.45, [116, 110, 102]],
        [0.75, [152, 145, 136]],
        [1, [186, 178, 168]],
      ],
      value,
    )
    const polar = smoothstep(0.72, 1, Math.abs(v - 0.5) * 2)
    return mix(base, [92, 88, 84], polar * 0.3)
  })
  addCraters(ctx, 320, 7731, size.width * 0.004, size.width * 0.03, 1)
  addCraters(ctx, 40, 5533, size.width * 0.03, size.width * 0.07, 0.7)
  return canvas
}

function paintMoon(size: MapSize): HTMLCanvasElement {
  const canvas = makeCanvas(size.width, size.height)
  const maria = sampleField(size.width, size.height, {
    radius: 2.1,
    height: 1.5,
    octaves: 4,
    seed: 3319,
  })
  const field = sampleField(size.width, size.height, {
    radius: 5.5,
    height: 3.1,
    octaves: 6,
    seed: 8123,
  })
  const ctx = colorize(canvas, field, (value, _u, _v, x, y) => {
    const base = ramp(
      [
        [0, [86, 82, 78]],
        [0.4, [140, 136, 130]],
        [0.72, [186, 182, 176]],
        [1, [222, 219, 213]],
      ],
      value,
    )
    const mare = smoothstep(0.55, 0.68, maria[y * size.width + x])
    return mix(base, [96, 94, 92], mare * 0.75)
  })
  addCraters(ctx, 420, 2237, size.width * 0.004, size.width * 0.045, 1)
  return canvas
}

function paintVenus(size: MapSize): HTMLCanvasElement {
  const canvas = makeCanvas(size.width, size.height)
  const field = sampleField(size.width, size.height, {
    radius: 3.6,
    height: 1.1,
    octaves: 5,
    seed: 6007,
    warp: 0.12,
  })
  colorize(canvas, field, (value) =>
    ramp(
      [
        [0, [186, 152, 96]],
        [0.35, [222, 190, 132]],
        [0.6, [240, 216, 168]],
        [0.85, [250, 236, 202]],
        [1, [255, 248, 226]],
      ],
      value,
    ),
  )
  return canvas
}

/** Data shared between the Earth maps, so the night lights only light up land. */
interface SharedBuild {
  landMask: Uint8Array | null
  width: number
  height: number
}

/** Blends the top and bottom rows toward white: polar ice caps. */
function applyPolarIce(
  ctx: CanvasRenderingContext2D,
  detail: Float32Array,
  edgeBase: number,
  softness: number,
): void {
  const { width, height } = ctx.canvas
  const image = ctx.getImageData(0, 0, width, height)
  const data = image.data
  for (let y = 0; y < height; y += 1) {
    const v = (y + 0.5) / height
    const belt = Math.abs(v - 0.5) * 2
    for (let x = 0; x < width; x += 1) {
      const index = y * width + x
      const edge = edgeBase + (detail[index] - 0.5) * softness
      const amount = smoothstep(edge, edge + softness, belt)
      if (amount <= 0) continue
      const offset = index * 4
      data[offset] = Math.round(lerp(data[offset], 252, amount))
      data[offset + 1] = Math.round(lerp(data[offset + 1], 253, amount))
      data[offset + 2] = Math.round(lerp(data[offset + 2], 255, amount))
    }
  }
  ctx.putImageData(image, 0, 0)
}

function paintEarth(size: MapSize, shared: SharedBuild): HTMLCanvasElement {
  const canvas = makeCanvas(size.width, size.height)
  const { width, height } = size
  const landField = sampleField(width, height, {
    radius: 2.35,
    height: 1.75,
    octaves: 6,
    seed: 2024,
    warp: 0.07,
  })
  const detailField = sampleField(width, height, {
    radius: 11,
    height: 6,
    octaves: 4,
    seed: 313,
  })
  const mask = new Uint8Array(width * height)
  const ctx = colorize(canvas, landField, (value, _u, v, x, y) => {
    const index = y * width + x
    const detail = detailField[index]
    const belt = Math.abs(v - 0.5) * 2 // 0 at the equator, 1 at the poles

    if (value <= 0.5) {
      // Ocean: darker the deeper you go.
      const depth = clamp((0.5 - value) * 7, 0, 1)
      const ocean = mix([52, 132, 186], [7, 34, 78], depth)
      return mix(ocean, [16, 66, 128], detail * 0.3)
    }

    mask[index] = 1
    const elevation = clamp((value - 0.5) * 4.6, 0, 1)
    // Rainforests at the equator, deserts in the subtropical belt, tundra nearer
    // the poles — the same pattern the real world has.
    const desert = smoothstep(0.16, 0.32, belt) * (1 - smoothstep(0.4, 0.56, belt))
    const tundra = smoothstep(0.4, 0.7, belt)
    let color = mix([54, 106, 52], [118, 142, 64], detail)
    color = mix(color, [186, 158, 102], desert * (0.45 + detail * 0.55))
    color = mix(color, [146, 138, 116], tundra * 0.8)
    color = mix(color, [124, 100, 78], smoothstep(0.55, 0.95, elevation) * 0.72)
    return mix(color, [40, 78, 46], (1 - elevation) * 0.32)
  })

  applyPolarIce(ctx, detailField, 0.875, 0.075)
  shared.landMask = mask
  shared.width = width
  shared.height = height
  return canvas
}

function paintEarthClouds(size: MapSize): HTMLCanvasElement {
  const canvas = makeCanvas(size.width, size.height)
  const field = sampleField(size.width, size.height, {
    radius: 4.1,
    height: 2.1,
    octaves: 6,
    seed: 5150,
    warp: 0.14,
  })
  colorize(
    canvas,
    field,
    (value) => mix([206, 220, 236], [255, 255, 255], smoothstep(0.5, 0.9, value)),
    (value) => smoothstep(0.47, 0.69, value) * 0.92,
  )
  return canvas
}

function paintEarthNight(size: MapSize, shared: SharedBuild): HTMLCanvasElement {
  const canvas = makeCanvas(size.width, size.height)
  const ctx = context2d(canvas)
  ctx.fillStyle = '#04060f'
  ctx.fillRect(0, 0, size.width, size.height)
  const mask = shared.landMask
  if (!mask) return canvas

  const random = createRandom(90210)
  const clusters = Math.round((size.width * size.height) / 260)
  for (let i = 0; i < clusters; i += 1) {
    const x = Math.floor(random() * size.width)
    const y = Math.floor(random() * size.height)
    const index = y * size.width + x
    if (!mask[index]) continue
    const belt = Math.abs((y + 0.5) / size.height - 0.5) * 2
    // People mostly live away from the poles — and rarely mid-ocean.
    if (belt > 0.78 && random() > 0.06) continue
    const radius = 0.7 + Math.pow(random(), 3) * 3.4
    const brightness = 0.28 + random() * 0.55
    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius)
    gradient.addColorStop(0, `rgba(255, 238, 190, ${brightness})`)
    gradient.addColorStop(0.45, `rgba(255, 196, 120, ${brightness * 0.5})`)
    gradient.addColorStop(1, 'rgba(255, 170, 90, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }
  return canvas
}

function paintMars(size: MapSize): HTMLCanvasElement {
  const canvas = makeCanvas(size.width, size.height)
  const albedo = sampleField(size.width, size.height, {
    radius: 2.6,
    height: 1.7,
    octaves: 5,
    seed: 8080,
  })
  const field = sampleField(size.width, size.height, {
    radius: 4.4,
    height: 2.6,
    octaves: 6,
    seed: 1618,
    warp: 0.06,
  })
  const ctx = colorize(canvas, field, (value, _u, _v, x, y) => {
    const base = ramp(
      [
        [0, [96, 44, 26]],
        [0.35, [162, 68, 38]],
        [0.6, [196, 96, 56]],
        [0.8, [214, 132, 88]],
        [1, [232, 178, 132]],
      ],
      value,
    )
    // Dark basaltic regions and bright dusty plains.
    const dark = smoothstep(0.56, 0.72, albedo[y * size.width + x])
    return mix(base, [88, 58, 44], dark * 0.6)
  })
  applyPolarIce(ctx, field, 0.94, 0.04)
  return canvas
}

/** Multiplies a colour's brightness, keeping it inside the 0…255 range. */
function shade(color: [number, number, number], amount: number): [number, number, number] {
  return [
    clamp(Math.round(color[0] * (1 + amount)), 0, 255),
    clamp(Math.round(color[1] * (1 + amount)), 0, 255),
    clamp(Math.round(color[2] * (1 + amount)), 0, 255),
  ]
}

interface BandedOptions {
  bands: Stop[]
  radius: number
  height: number
  octaves: number
  seed: number
  /** How far the turbulent flow shifts the bands up and down. */
  turbulence: number
  /** Extra brightness variation from fine cloud detail. */
  detailStrength: number
  /** How much darker the poles are. */
  polarShading: number
}

/** Gas and ice giants are all "latitude bands plus turbulence" at heart. */
function paintBandedGiant(size: MapSize, options: BandedOptions): HTMLCanvasElement {
  const canvas = makeCanvas(size.width, size.height)
  const flow = sampleField(size.width, size.height, {
    radius: options.radius,
    height: options.height * 0.4,
    octaves: 4,
    seed: options.seed + 11,
  })
  const detail = sampleField(size.width, size.height, {
    radius: options.radius * 3.1,
    height: options.height * 1.6,
    octaves: 3,
    seed: options.seed + 29,
  })
  colorize(canvas, flow, (value, _u, v, x, y) => {
    const latitude = clamp(v + (value - 0.5) * options.turbulence, 0, 1)
    let color = ramp(options.bands, latitude)
    color = shade(color, (detail[y * size.width + x] - 0.5) * options.detailStrength)
    const pole = smoothstep(0.72, 1, Math.abs(v - 0.5) * 2)
    return shade(color, -pole * options.polarShading)
  })
  return canvas
}

const JUPITER_BANDS: Stop[] = [
  [0, [150, 126, 108]],
  [0.05, [206, 182, 152]],
  [0.11, [168, 138, 110]],
  [0.17, [228, 206, 178]],
  [0.23, [158, 118, 88]],
  [0.29, [236, 214, 186]],
  [0.35, [196, 158, 120]],
  [0.41, [244, 228, 198]],
  [0.47, [234, 210, 178]],
  [0.53, [186, 138, 102]],
  [0.59, [242, 222, 192]],
  [0.65, [170, 128, 98]],
  [0.71, [226, 204, 176]],
  [0.77, [162, 130, 106]],
  [0.83, [214, 192, 166]],
  [0.9, [172, 144, 120]],
  [1, [148, 126, 108]],
]

const SATURN_BANDS: Stop[] = [
  [0, [176, 158, 128]],
  [0.12, [214, 194, 156]],
  [0.24, [232, 214, 178]],
  [0.36, [206, 184, 146]],
  [0.48, [238, 222, 188]],
  [0.6, [210, 188, 150]],
  [0.72, [232, 214, 180]],
  [0.84, [202, 180, 144]],
  [1, [180, 160, 130]],
]

const URANUS_BANDS: Stop[] = [
  [0, [148, 196, 202]],
  [0.2, [176, 222, 226]],
  [0.45, [188, 232, 236]],
  [0.7, [178, 224, 228]],
  [1, [158, 204, 210]],
]

const NEPTUNE_BANDS: Stop[] = [
  [0, [32, 56, 138]],
  [0.16, [46, 78, 176]],
  [0.34, [58, 96, 202]],
  [0.5, [52, 88, 192]],
  [0.68, [60, 100, 206]],
  [0.84, [42, 72, 166]],
  [1, [30, 52, 130]],
]

/** Soft elliptical storm, drawn with layered radial gradients. */
function drawStorm(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  radiusX: number,
  radiusY: number,
  core: [number, number, number],
  rim: [number, number, number],
): void {
  ctx.save()
  ctx.translate(cx, cy)
  ctx.scale(radiusX / radiusY, 1)
  for (let layer = 0; layer < 3; layer += 1) {
    const scale = 1 - layer * 0.28
    const gradient = ctx.createRadialGradient(0, 0, radiusY * 0.12 * scale, 0, 0, radiusY * scale)
    gradient.addColorStop(0, `rgba(${core[0]}, ${core[1]}, ${core[2]}, 0.85)`)
    gradient.addColorStop(0.55, `rgba(${rim[0]}, ${rim[1]}, ${rim[2]}, 0.55)`)
    gradient.addColorStop(1, `rgba(${rim[0]}, ${rim[1]}, ${rim[2]}, 0)`)
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.arc(0, 0, radiusY * scale, 0, Math.PI * 2)
    ctx.fill()
  }
  ctx.restore()
}

function paintJupiter(size: MapSize): HTMLCanvasElement {
  const canvas = paintBandedGiant(size, {
    bands: JUPITER_BANDS,
    radius: 3.1,
    height: 2.4,
    octaves: 5,
    seed: 3301,
    turbulence: 0.028,
    detailStrength: 0.5,
    polarShading: 0.22,
  })
  const ctx = context2d(canvas)
  // The Great Red Spot, in the southern hemisphere.
  drawStorm(
    ctx,
    canvas.width * 0.44,
    canvas.height * 0.63,
    canvas.width * 0.062,
    canvas.height * 0.052,
    [176, 62, 38],
    [206, 104, 66],
  )
  // Smaller companion storms.
  drawStorm(
    ctx,
    canvas.width * 0.72,
    canvas.height * 0.36,
    canvas.width * 0.04,
    canvas.height * 0.028,
    [242, 238, 228],
    [230, 226, 214],
  )
  drawStorm(
    ctx,
    canvas.width * 0.18,
    canvas.height * 0.44,
    canvas.width * 0.03,
    canvas.height * 0.022,
    [238, 232, 220],
    [226, 220, 206],
  )
  return canvas
}

function paintSaturn(size: MapSize): HTMLCanvasElement {
  return paintBandedGiant(size, {
    bands: SATURN_BANDS,
    radius: 3,
    height: 2.1,
    octaves: 5,
    seed: 4907,
    turbulence: 0.016,
    detailStrength: 0.28,
    polarShading: 0.16,
  })
}

function paintUranus(size: MapSize): HTMLCanvasElement {
  return paintBandedGiant(size, {
    bands: URANUS_BANDS,
    radius: 2.6,
    height: 1.8,
    octaves: 4,
    seed: 7717,
    turbulence: 0.008,
    detailStrength: 0.12,
    polarShading: 0.08,
  })
}

function paintNeptune(size: MapSize): HTMLCanvasElement {
  const canvas = paintBandedGiant(size, {
    bands: NEPTUNE_BANDS,
    radius: 2.9,
    height: 1.9,
    octaves: 5,
    seed: 8821,
    turbulence: 0.014,
    detailStrength: 0.22,
    polarShading: 0.12,
  })
  const ctx = context2d(canvas)
  drawStorm(
    ctx,
    canvas.width * 0.6,
    canvas.height * 0.62,
    canvas.width * 0.05,
    canvas.height * 0.034,
    [20, 36, 96],
    [30, 52, 120],
  )
  drawStorm(
    ctx,
    canvas.width * 0.22,
    canvas.height * 0.3,
    canvas.width * 0.035,
    canvas.height * 0.02,
    [226, 236, 255],
    [200, 216, 250],
  )
  return canvas
}

const gauss = (x: number, mu: number, sigma: number): number =>
  Math.exp(-((x - mu) * (x - mu)) / (2 * sigma * sigma))

/**
 * Ring systems are drawn as a 1D band profile: the u axis is the distance from
 * the planet, so we can punch the Cassini division and the Encke gap in exactly
 * the right places (they are limited to a few percent of the ring width).
 */
function paintRings(size: MapSize): HTMLCanvasElement {
  const canvas = makeCanvas(size.width, size.height)
  const ctx = context2d(canvas)
  const random = createRandom(4242)
  const bandCount = Math.round(size.width / 5)
  const bands = Array.from({ length: bandCount }, () => ({
    position: random(),
    width: 0.0015 + random() * 0.016,
    brightness: 0.3 + random() * 0.7,
  }))

  const profile = new Float32Array(size.width)
  for (let x = 0; x < size.width; x += 1) {
    const u = x / (size.width - 1)
    let value = 0.5 + 0.16 * Math.sin(u * 61) + 0.09 * Math.sin(u * 173)
    for (let i = 0; i < bands.length; i += 1) {
      const band = bands[i]
      const distance = Math.abs(u - band.position)
      if (distance < band.width) {
        value = Math.max(value, band.brightness * (1 - (distance / band.width) * 0.35))
      }
    }
    // Faint inner C ring.
    value *= 0.4 + 0.6 * smoothstep(0, 0.16, u)
    // Main features: Cassini division, Encke gap and a few minor gaps.
    value *= 1 - 0.96 * gauss(u, 0.63, 0.021)
    value *= 1 - 0.85 * gauss(u, 0.885, 0.0045)
    value *= 1 - 0.5 * gauss(u, 0.31, 0.009)
    value *= 1 - 0.34 * gauss(u, 0.47, 0.006)
    // Feather the outer edge.
    value *= 1 - 0.55 * smoothstep(0.965, 1, u)
    profile[x] = clamp(value, 0, 1)
  }

  const image = ctx.createImageData(size.width, size.height)
  const data = image.data
  for (let y = 0; y < size.height; y += 1) {
    const v = (y + 0.5) / size.height
    for (let x = 0; x < size.width; x += 1) {
      const u = x / (size.width - 1)
      const thickness = cylindricalFbm(u, v, 6, 1.4, 3, 5150)
      const brightness = clamp(profile[x] * (0.82 + thickness * 0.36), 0, 1)
      const warm = mix([214, 196, 162], [246, 238, 222], brightness)
      const offset = (y * size.width + x) * 4
      data[offset] = warm[0]
      data[offset + 1] = warm[1]
      data[offset + 2] = warm[2]
      data[offset + 3] = Math.round(brightness * 235)
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

/**
 * Uranus's rings, drawn from measured geometry rather than photographed.
 *
 * There is no calibrated Voyager 2 ring strip in the free map sets, and reusing
 * Saturn's would be a lie: Uranus's rings are nine *narrow* lines (the widest
 * solid one, epsilon, is 58 km across) inside a broad, very faint dust sheet.
 * Every band below sits at its published distance from Uranus's centre with its
 * published width and normal optical depth, from the PDS Ring-Moon Systems Node
 * tables (Showalter & Lissauer 2006; Nicholson et al. 2018). Only the shading
 * between those numbers is drawn here.
 *
 * Two compromises are unavoidable at this size:
 *
 *  - the strip covers 14,237 km in 1,024 pixels, so one pixel is about 14 km and
 *    a 1.6 km ring cannot be resolved. Each ring gets a floor of roughly half a
 *    pixel either side of its true centre, which keeps it visible as a thin line
 *    instead of disappearing between samples;
 *  - the two outer dust rings (nu at 67,300 km and mu at 97,700 km) fall outside
 *    the disc, which ends at the epsilon ring's outer edge.
 */
const URANUS_EQUATORIAL_RADIUS_KM = 25_559
/** The disc geometry spans 1.448 to 2.005 Uranus radii, i.e. epsilon's edges. */
const URANUS_RING_INNER_KM = 1.448 * URANUS_EQUATORIAL_RADIUS_KM
const URANUS_RING_OUTER_KM = 2.005 * URANUS_EQUATORIAL_RADIUS_KM

interface MeasuredRing {
  name: string
  /** Distance from the planet's centre, km. */
  radiusKm: number
  /** Radial width, km. */
  widthKm: number
  /** Normal optical depth: how much light the ring blocks. */
  depth: number
}

const URANUS_RINGS: MeasuredRing[] = [
  { name: 'dust sheet', radiusKm: 38_440, widthKm: 23_200, depth: 0.005 },
  { name: 'zeta (1986U2R)', radiusKm: 39_600, widthKm: 3_500, depth: 0.0045 },
  { name: 'six', radiusKm: 41_838, widthKm: 1.53, depth: 0.3 },
  { name: 'five', radiusKm: 42_234, widthKm: 2.28, depth: 0.5 },
  { name: 'four', radiusKm: 42_571, widthKm: 2.33, depth: 0.3 },
  { name: 'alpha-4 dust', radiusKm: 43_027, widthKm: 3_353, depth: 0.002 },
  { name: 'alpha', radiusKm: 44_718, widthKm: 8.46, depth: 0.4 },
  { name: 'beta-alpha dust', radiusKm: 44_879, widthKm: 312, depth: 0.002 },
  { name: 'beta', radiusKm: 45_661, widthKm: 9.49, depth: 0.3 },
  { name: 'eta', radiusKm: 47_176, widthKm: 1.6, depth: 0.4 },
  { name: 'eta extension', radiusKm: 47_201, widthKm: 40, depth: 0.02 },
  { name: 'gamma', radiusKm: 47_627, widthKm: 2.15, depth: 0.3 },
  { name: 'delta extension', radiusKm: 48_289, widthKm: 15, depth: 0.03 },
  { name: 'delta', radiusKm: 48_300, widthKm: 4.6, depth: 0.5 },
  { name: 'lambda extension', radiusKm: 49_936, widthKm: 3.1, depth: 0.15 },
  { name: 'lambda', radiusKm: 50_024, widthKm: 2.3, depth: 0.1 },
  { name: 'epsilon', radiusKm: 51_149, widthKm: 58.1, depth: 0.5 },
]

function paintUranusRings(size: MapSize): HTMLCanvasElement {
  const canvas = makeCanvas(size.width, size.height)
  const ctx = context2d(canvas)
  const span = URANUS_RING_OUTER_KM - URANUS_RING_INNER_KM
  const kmPerPixel = span / size.width

  // Optical depth at every sample: the sum of the rings that cover that radius.
  const depth = new Float32Array(size.width)
  for (let x = 0; x < size.width; x += 1) {
    const radius = URANUS_RING_INNER_KM + ((x + 0.5) / size.width) * span
    let total = 0
    for (const ring of URANUS_RINGS) {
      const sigma = Math.max(ring.widthKm / 2, kmPerPixel * 0.55)
      const offset = (radius - ring.radiusKm) / sigma
      total += ring.depth * Math.exp(-0.5 * offset * offset)
    }
    depth[x] = total
  }

  const image = ctx.createImageData(size.width, size.height)
  const data = image.data
  // Uranus's ring particles are dark — this is a layer of soot, not bright ice.
  const particle: [number, number, number] = [118, 118, 128]
  for (let y = 0; y < size.height; y += 1) {
    for (let x = 0; x < size.width; x += 1) {
      const grazing = 0.86 + cylindricalFbm(x / size.width, y / size.height, 5, 1.2, 3, 6021) * 0.28
      // Alpha from optical depth: a ring of depth 0.5 hides about 40% of what
      // lies behind it, which is what the Voyager images show.
      const alpha = 1 - Math.exp(-depth[x] * grazing)
      const offset = (y * size.width + x) * 4
      data[offset] = particle[0]
      data[offset + 1] = particle[1]
      data[offset + 2] = particle[2]
      data[offset + 3] = Math.round(clamp(alpha, 0, 1) * 235)
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

/**
 * Lifts a photographic exposure's tone curve.
 *
 * The Milky Way panorama is a real long-exposure photograph: its dust lane sits
 * around 1–4 out of 255, because the camera was exposing for the stars. An eye
 * looking up sees a band, not black, so the map is brought up with a gamma curve
 * that leaves the bright star cores (255) untouched and raises the faint dust
 * into view. Without this the sky sphere renders as an empty black shell.
 */
function liftExposure(canvas: HTMLCanvasElement, gamma: number): void {
  const ctx = context2d(canvas)
  const image = ctx.getImageData(0, 0, canvas.width, canvas.height)
  const data = image.data
  const lut = new Uint8ClampedArray(256)
  for (let value = 0; value < 256; value += 1) {
    lut[value] = Math.round(Math.pow(value / 255, gamma) * 255)
  }
  for (let i = 0; i < data.length; i += 4) {
    data[i] = lut[data[i]]
    data[i + 1] = lut[data[i + 1]]
    data[i + 2] = lut[data[i + 2]]
  }
  ctx.putImageData(image, 0, 0)
}

/** Radial sprite used for the Sun's corona, comet halos and glow sprites. */
function paintGlow(size: MapSize): HTMLCanvasElement {
  const canvas = makeCanvas(size.width, size.height)
  const ctx = context2d(canvas)
  const center = size.width / 2
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
  gradient.addColorStop(0, 'rgba(255, 255, 246, 1)')
  gradient.addColorStop(0.12, 'rgba(255, 240, 190, 0.92)')
  gradient.addColorStop(0.28, 'rgba(255, 186, 92, 0.55)')
  gradient.addColorStop(0.52, 'rgba(255, 130, 48, 0.22)')
  gradient.addColorStop(0.78, 'rgba(255, 96, 32, 0.07)')
  gradient.addColorStop(1, 'rgba(255, 80, 20, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size.width, size.height)
  return canvas
}

/** A soft, low-contrast nebula band for the far background. */
function paintNebula(size: MapSize): HTMLCanvasElement {
  const canvas = makeCanvas(size.width, size.height)
  const field = sampleField(size.width, size.height, {
    radius: 2.2,
    height: 1.2,
    octaves: 6,
    seed: 70707,
    warp: 0.2,
  })
  const colorField = sampleField(size.width, size.height, {
    radius: 1.4,
    height: 0.9,
    octaves: 3,
    seed: 70708,
  })
  colorize(
    canvas,
    field,
    (value, _u, _v, x, y) => {
      const tint = colorField[y * size.width + x]
      const base = mix([38, 32, 96], [96, 42, 138], tint)
      const cool = mix(base, [22, 74, 118], smoothstep(0.4, 0.8, 1 - tint))
      return mix(cool, [188, 214, 255], smoothstep(0.72, 1, value) * 0.55)
    },
    (value, _u, v) => {
      // Concentrate the haze into a diagonal galactic band.
      const band = gauss(v, 0.45, 0.16) + gauss(v, 0.72, 0.1) * 0.5
      return clamp(smoothstep(0.42, 0.85, value) * band * 0.7, 0, 1)
    },
  )
  return canvas
}

/** Sprite used by the star-field points: a bright core with a soft halo. */
function paintStar(size: MapSize): HTMLCanvasElement {
  const canvas = makeCanvas(size.width, size.height)
  const ctx = context2d(canvas)
  const center = size.width / 2
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.22, 'rgba(255, 255, 255, 0.72)')
  gradient.addColorStop(0.5, 'rgba(210, 228, 255, 0.22)')
  gradient.addColorStop(1, 'rgba(180, 210, 255, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size.width, size.height)
  return canvas
}

/** Icy comet nucleus: a bright core inside a faint cyan coma. */
function paintComet(size: MapSize): HTMLCanvasElement {
  const canvas = makeCanvas(size.width, size.height)
  const ctx = context2d(canvas)
  const center = size.width / 2
  const gradient = ctx.createRadialGradient(center, center, 0, center, center, center)
  gradient.addColorStop(0, 'rgba(255, 255, 255, 1)')
  gradient.addColorStop(0.18, 'rgba(206, 246, 255, 0.85)')
  gradient.addColorStop(0.42, 'rgba(150, 226, 255, 0.34)')
  gradient.addColorStop(1, 'rgba(120, 200, 255, 0)')
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size.width, size.height)
  const speckle = createRandom(606)
  for (let i = 0; i < 90; i += 1) {
    const x = speckle() * size.width
    const y = speckle() * size.height
    ctx.fillStyle = `rgba(255, 255, 255, ${0.05 + speckle() * 0.08})`
    ctx.fillRect(x, y, 1, 1)
  }
  return canvas
}

/* ------------------------------------------------------------------ *
 * Real map data
 * ------------------------------------------------------------------ */

/**
 * How much of a source map's resolution is uploaded, per quality tier.
 *
 * A 2048×1024 map costs 8 MB of video memory per body before mipmaps, and the
 * Solar System has eleven of them. A slower machine is served the same picture at
 * a lower texel density rather than a different map, and the browser's own
 * high-quality downscaler does the work once, at load time.
 */
const QUALITY_SCALE: Record<QualityLevel, number> = { high: 1, medium: 0.5, low: 0.25 }

function imageUrl(file: string): string {
  const base = import.meta.env.BASE_URL || '/'
  return `${base.endsWith('/') ? base : `${base}/`}textures/${file}`
}

function loadImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Could not load ${url}`))
    image.src = url
  })
}

/** Draws a decoded map into a canvas at the size the quality tier asked for. */
function drawScaled(image: HTMLImageElement, scale: number): HTMLCanvasElement {
  const width = Math.max(2, Math.round(image.naturalWidth * scale))
  const height = Math.max(1, Math.round(image.naturalHeight * scale))
  const canvas = makeCanvas(width, height)
  const ctx = context2d(canvas)
  ctx.imageSmoothingEnabled = true
  ctx.imageSmoothingQuality = 'high'
  ctx.drawImage(image, 0, 0, width, height)
  return canvas
}

/**
 * Which pixels of Earth are water?
 *
 * Deep ocean is the only strongly blue-dominant surface on the planet: ice is
 * white (no colour lead at all), deserts lean red and vegetation leans green. So
 * the blue lead of a pixel is a robust water indicator, and a blur afterwards
 * turns coastlines into a gradient instead of a step.
 */
function waterMaskFromImage(canvas: HTMLCanvasElement): Float32Array {
  const { width, height } = canvas
  const data = context2d(canvas).getImageData(0, 0, width, height).data
  const mask = new Float32Array(width * height)
  for (let i = 0; i < mask.length; i += 1) {
    const r = data[i * 4]
    const g = data[i * 4 + 1]
    const b = data[i * 4 + 2]
    mask[i] = clamp((b - Math.max(r, g)) / 30, 0, 1)
  }
  return mask
}

/** Separable 3-tap box blur, run twice: softens a mask without eating detail. */
function soften(mask: Float32Array, width: number, height: number): Float32Array {
  const at = (values: Float32Array, x: number, y: number): number =>
    values[clamp(y, 0, height - 1) * width + clamp(x, 0, width - 1)]
  let source = mask
  for (let pass = 0; pass < 2; pass += 1) {
    const horizontal = new Float32Array(width * height)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        horizontal[y * width + x] = (at(source, x - 1, y) + 2 * at(source, x, y) + at(source, x + 1, y)) / 4
      }
    }
    const vertical = new Float32Array(width * height)
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        vertical[y * width + x] = (at(horizontal, x, y - 1) + 2 * at(horizontal, x, y) + at(horizontal, x, y + 1)) / 4
      }
    }
    source = vertical
  }
  return source
}

/**
 * Turns a "how much water is here" mask into a roughness map.
 *
 * `MeshStandardMaterial` reads roughness from a texture's green channel, so this
 * writes one: open water is glassy (≈0.10), dry land is rough (≈0.92). That is
 * what puts a sun glint on the oceans — the most recognisable thing about a
 * photograph of Earth from space, and the reason the real planet is not
 * uniformly matte.
 */
function roughnessFromWater(mask: Float32Array, width: number, height: number): HTMLCanvasElement {
  const canvas = makeCanvas(width, height)
  const ctx = context2d(canvas)
  const image = ctx.createImageData(width, height)
  const data = image.data
  for (let i = 0; i < mask.length; i += 1) {
    const roughness = Math.round(lerp(235, 26, mask[i]))
    data[i * 4] = roughness
    data[i * 4 + 1] = roughness
    data[i * 4 + 2] = roughness
    data[i * 4 + 3] = 255
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

/** A flat, mid-rough surface: used when nothing better can be worked out. */
function plainRoughness(width: number, height: number): HTMLCanvasElement {
  const canvas = makeCanvas(width, height)
  const ctx = context2d(canvas)
  ctx.fillStyle = '#b4b4b4'
  ctx.fillRect(0, 0, width, height)
  return canvas
}

/**
 * State that has to outlive a single map build. Earth is the one body whose maps
 * feed each other — the day map gives the land mask the procedural night-lights
 * painter needs and the ocean roughness the material needs — so both travel
 * through here.
 */
let earthWater: { mask: Float32Array; width: number; height: number } | null = null
let sharedLandMask: SharedBuild | null = null

function analyseEarth(canvas: HTMLCanvasElement): void {
  const { width, height } = canvas
  const mask = soften(waterMaskFromImage(canvas), width, height)
  earthWater = { mask, width, height }
  const landMask = new Uint8Array(width * height)
  for (let i = 0; i < landMask.length; i += 1) landMask[i] = mask[i] < 0.5 ? 1 : 0
  sharedLandMask = { landMask, width, height }
}

/* ------------------------------------------------------------------ *
 * Generation pipeline
 * ------------------------------------------------------------------ */

interface Painter {
  id: TextureId
  label: string
  build: (size: MapSize, shared: SharedBuild) => HTMLCanvasElement
}

/**
 * The procedural painters, keyed by the map they produce. They are only reached
 * when the matching file in `public/textures` is absent or fails to decode.
 */
const PAINTERS: Painter[] = [
  { id: 'nebula', label: 'Painting the Milky Way', build: (size) => paintNebula(size) },
  { id: 'star', label: 'Lighting the stars', build: (size) => paintStar(size) },
  { id: 'glow', label: 'Kindling the Sun’s glow', build: (size) => paintGlow(size) },
  { id: 'sun', label: 'Stirring the Sun’s plasma', build: (size) => paintSun(size) },
  { id: 'earth', label: 'Building Earth’s continents', build: (size, shared) => paintEarth(size, shared) },
  { id: 'earthClouds', label: 'Rolling out Earth’s clouds', build: (size) => paintEarthClouds(size) },
  { id: 'earthNight', label: 'Switching on the city lights', build: (size) => paintEarthNight(size, sharedLandMask ?? { landMask: null, width: 0, height: 0 }) },
  { id: 'moon', label: 'Pocking the Moon with craters', build: (size) => paintMoon(size) },
  { id: 'mercury', label: 'Cratering Mercury', build: (size) => paintMercury(size) },
  { id: 'venus', label: 'Wrapping Venus in clouds', build: (size) => paintVenus(size) },
  { id: 'mars', label: 'Rusting the dust on Mars', build: (size) => paintMars(size) },
  { id: 'jupiter', label: 'Spinning Jupiter’s storms', build: (size) => paintJupiter(size) },
  { id: 'saturn', label: 'Banding Saturn’s skies', build: (size) => paintSaturn(size) },
  { id: 'saturnRings', label: 'Assembling Saturn’s rings', build: (size) => paintRings(size) },
  { id: 'uranusRings', label: 'Threading Uranus’s nine rings', build: (size) => paintUranusRings(size) },
  { id: 'uranus', label: 'Chilling Uranus', build: (size) => paintUranus(size) },
  { id: 'neptune', label: 'Winding up Neptune’s winds', build: (size) => paintNeptune(size) },
  { id: 'comet', label: 'Waking a distant comet', build: (size) => paintComet(size) },
]

const PAINTER_BY_ID = new Map<TextureId, Painter>(PAINTERS.map((painter) => [painter.id, painter]))

const LARGE_MAPS: TextureId[] = ['earth', 'earthClouds', 'earthNight', 'jupiter', 'saturn', 'sun', 'nebula']

function resolutionFor(id: TextureId, quality: QualityLevel): MapSize {
  if (id === 'star') return { width: 64, height: 64 }
  if (id === 'glow') return { width: 256, height: 256 }
  if (id === 'comet') return { width: 128, height: 128 }
  if (id === 'saturnRings') return { width: quality === 'low' ? 512 : 1024, height: 16 }
  if (id === 'uranusRings') return { width: quality === 'low' ? 512 : 1024, height: 16 }

  const large = LARGE_MAPS.includes(id)
  if (quality === 'high') return large ? { width: 1024, height: 512 } : { width: 512, height: 256 }
  if (quality === 'medium') return large ? { width: 512, height: 256 } : { width: 256, height: 128 }
  return large ? { width: 384, height: 192 } : { width: 192, height: 96 }
}

/** Textures are shared by every component, so they live in one cache. */
const cache = new Map<TextureId, Texture>()
let fallback: Texture | null = null

export function getTexture(id: TextureId): Texture {
  const texture = cache.get(id)
  if (texture) return texture
  if (!fallback) {
    const canvas = makeCanvas(4, 4)
    const ctx = context2d(canvas)
    ctx.fillStyle = '#404040'
    ctx.fillRect(0, 0, 4, 4)
    fallback = toTexture(canvas)
  }
  return fallback
}

export function hasTextures(): boolean {
  return cache.size === TEXTURE_IDS.length
}

function nextFrame(): Promise<void> {
  return new Promise((resolve) => {
    if (typeof requestAnimationFrame === 'function') {
      requestAnimationFrame(() => resolve())
    } else {
      setTimeout(resolve, 0)
    }
  })
}

/**
 * Maps that carry numbers rather than colour — a cloud-coverage mask, an ocean
 * roughness value — must not be gamma-decoded by the GPU on the way in, so they
 * are uploaded as raw data. Everything else is a photograph and is treated as sRGB.
 */
const DATA_MAPS: TextureId[] = ['earthClouds', 'earthRoughness']

/**
 * How far the Milky Way panorama's exposure is lifted before it is uploaded (see
 * `liftExposure`). Left at 1, its dust lane sits at 1/255 and the sky sphere
 * renders as an empty black shell.
 */
const MILKY_WAY_GAMMA = 0.7

function mapTexture(canvas: HTMLCanvasElement, id: TextureId): Texture {
  return toTexture(canvas, DATA_MAPS.includes(id) ? NoColorSpace : SRGBColorSpace)
}

/**
 * Builds one map: the shipped real map when there is one, otherwise the painter.
 * Returns null only for ids that have neither (the derived ocean roughness).
 */
async function buildMap(id: TextureId, quality: QualityLevel, shared: SharedBuild): Promise<Texture | null> {
  const source = TEXTURE_SOURCES[id]
  if (source) {
    try {
      const image = await loadImage(imageUrl(source.file))
      const canvas = drawScaled(image, QUALITY_SCALE[quality])
      if (id === 'earth') analyseEarth(canvas)
      if (id === 'nebula') liftExposure(canvas, MILKY_WAY_GAMMA)
      return mapTexture(canvas, id)
    } catch (error) {
      // A missing or corrupt file is not worth failing a launch over: the painter
      // below produces the same body from noise instead.
      if (import.meta.env.DEV) window.console.warn(`Falling back to a painted ${id} map`, error)
    }
  }

  if (id === 'earthRoughness') {
    if (earthWater) {
      return mapTexture(roughnessFromWater(earthWater.mask, earthWater.width, earthWater.height), id)
    }
    const land = sharedLandMask?.landMask
    if (land && shared.width > 0) {
      const mask = Float32Array.from(land, (value) => (value ? 0 : 1))
      const soft = soften(mask, shared.width, shared.height)
      return mapTexture(roughnessFromWater(soft, shared.width, shared.height), id)
    }
    return mapTexture(plainRoughness(256, 128), id)
  }

  const painter = PAINTER_BY_ID.get(id)
  return painter ? mapTexture(painter.build(resolutionFor(id, quality), shared), id) : null
}

/**
 * Loads and paints every map, yielding to the browser between each one so the
 * loading screen can animate and report progress.
 */
export async function generateTextures(
  quality: QualityLevel,
  onProgress: (progress: TextureProgress) => void,
): Promise<void> {
  const shared: SharedBuild = { landMask: null, width: 0, height: 0 }
  for (let index = 0; index < TEXTURE_IDS.length; index += 1) {
    const id = TEXTURE_IDS[index]
    onProgress({
      label: TEXTURE_SOURCES[id]?.label ?? PAINTER_BY_ID.get(id)?.label ?? 'Preparing textures',
      ratio: index / TEXTURE_IDS.length,
    })
    // Yield first: the browser paints the updated progress bar before we block.
    await nextFrame()
    const texture = await buildMap(id, quality, shared)
    if (texture) cache.set(id, texture)
  }
  onProgress({ label: 'Ready for launch', ratio: 1 })
}

/** Frees GPU memory. Only used when the whole experience is torn down. */
export function disposeTextures(): void {
  cache.forEach((texture) => texture.dispose())
  cache.clear()
  fallback?.dispose()
  fallback = null
  earthWater = null
  sharedLandMask = null
}