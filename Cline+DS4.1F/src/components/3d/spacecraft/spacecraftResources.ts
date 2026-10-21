import {
  CanvasTexture,
  DoubleSide,
  EquirectangularReflectionMapping,
  MeshStandardMaterial,
  NoColorSpace,
  PMREMGenerator,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three'
import type { Texture, WebGLRenderer } from 'three'
import { clamp, createRandom, fbm } from '../../../utils/random'

/**
 * Materials and surface maps for the spacecraft.
 *
 * Like every other surface in the app, the probe's maps are painted
 * procedurally, so the build stays self-contained and works offline. Unlike the
 * planets, though, the ship is a *metal* object lit by a single distant point
 * light: without something to reflect, PBR metal renders almost black between
 * highlights. So the probe also builds itself a small pre-filtered environment
 * map (dark space, a warm Sun, a faint galactic band, stars) and applies it to
 * its own materials only — the rest of the scene keeps its existing lighting.
 */

function makeCanvas(width: number, height: number): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

function ctx2d(canvas: HTMLCanvasElement): CanvasRenderingContext2D {
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('This browser cannot create a 2D canvas context.')
  return ctx
}

interface TextureOptions {
  /** Tiling, for maps that repeat across a large surface. */
  repeat?: [number, number]
  /** Data maps (roughness, bump) must not be gamma-decoded. */
  data?: boolean
}

function toTexture(canvas: HTMLCanvasElement, options: TextureOptions = {}): Texture {
  const map = new CanvasTexture(canvas)
  map.colorSpace = options.data ? NoColorSpace : SRGBColorSpace
  map.wrapS = RepeatWrapping
  map.wrapT = RepeatWrapping
  map.anisotropy = 4
  map.generateMipmaps = true
  if (options.repeat) map.repeat.set(options.repeat[0], options.repeat[1])
  map.needsUpdate = true
  return map
}

/* ------------------------------------------------------------------ *
 * Hull: brushed titanium with machined panel lines
 * ------------------------------------------------------------------ */

interface PanelSpec {
  x: number
  y: number
  w: number
  h: number
  shade: number
}

/** A deterministic panel layout, shared by the albedo, roughness and bump maps. */
function hullPanels(size: number): PanelSpec[] {
  const random = createRandom(9137)
  const columns = 4
  const rows = 6
  const cellWidth = size / columns
  const cellHeight = size / rows
  const panels: PanelSpec[] = []
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const shade = 0.88 + random() * 0.24
      // Occasionally split a cell, so the panelling does not read as a plain grid.
      if (random() < 0.34) {
        const split = 0.34 + random() * 0.32
        panels.push({ x: col * cellWidth, y: row * cellHeight, w: cellWidth * split, h: cellHeight, shade })
        panels.push({
          x: col * cellWidth + cellWidth * split,
          y: row * cellHeight,
          w: cellWidth * (1 - split),
          h: cellHeight,
          shade: 0.88 + random() * 0.24,
        })
      } else {
        panels.push({ x: col * cellWidth, y: row * cellHeight, w: cellWidth, h: cellHeight, shade })
      }
    }
  }
  return panels
}

function paintHullAlbedo(size: number, panels: PanelSpec[]): HTMLCanvasElement {
  const canvas = makeCanvas(size, size)
  const ctx = ctx2d(canvas)
  const base = ctx.createLinearGradient(0, 0, 0, size)
  base.addColorStop(0, '#dfe7f0')
  base.addColorStop(0.5, '#c8d2de')
  base.addColorStop(1, '#a8b4c3')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, size, size)

  // Fine brushed-metal streaks.
  const random = createRandom(4412)
  ctx.lineWidth = 0.6
  for (let i = 0; i < 900; i += 1) {
    const y = random() * size
    ctx.strokeStyle = `rgba(255,255,255,${0.02 + random() * 0.05})`
    ctx.beginPath()
    ctx.moveTo(0, y)
    ctx.lineTo(size, y + (random() - 0.5) * 4)
    ctx.stroke()
  }

  // Per-panel tone, seams, rivets.
  for (const panel of panels) {
    const delta = panel.shade - 1
    ctx.fillStyle = delta >= 0 ? `rgba(255,255,255,${delta * 0.9})` : `rgba(18,26,40,${-delta * 0.9})`
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h)
  }
  ctx.strokeStyle = 'rgba(38,50,68,0.6)'
  ctx.lineWidth = 1.4
  for (const panel of panels) {
    ctx.strokeRect(panel.x + 0.7, panel.y + 0.7, panel.w - 1.4, panel.h - 1.4)
  }
  ctx.fillStyle = 'rgba(52,64,84,0.65)'
  for (const panel of panels) {
    const count = Math.max(2, Math.floor(panel.w / 26))
    for (let i = 0; i < count; i += 1) {
      const x = panel.x + 8 + (i / Math.max(1, count - 1)) * (panel.w - 16)
      for (const y of [panel.y + 4, panel.y + panel.h - 4]) {
        ctx.beginPath()
        ctx.arc(x, y, 1.1, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }

  // A blue identification band with a thin white edge.
  ctx.fillStyle = 'rgba(47,123,255,0.8)'
  ctx.fillRect(0, size * 0.58, size, size * 0.018)
  ctx.fillStyle = 'rgba(255,255,255,0.55)'
  ctx.fillRect(0, size * 0.604, size, size * 0.004)

  // A small gold service hatch.
  ctx.fillStyle = 'rgba(196,150,60,0.5)'
  ctx.fillRect(size * 0.62, size * 0.2, size * 0.16, size * 0.1)
  ctx.strokeStyle = 'rgba(40,50,68,0.7)'
  ctx.lineWidth = 1.2
  ctx.strokeRect(size * 0.62, size * 0.2, size * 0.16, size * 0.1)

  return canvas
}

function paintHullRough(size: number, panels: PanelSpec[]): HTMLCanvasElement {
  const canvas = makeCanvas(size, size)
  const ctx = ctx2d(canvas)
  ctx.fillStyle = '#5f5f5f'
  ctx.fillRect(0, 0, size, size)
  const random = createRandom(6621)
  for (const panel of panels) {
    const value = Math.round(58 + random() * 44)
    ctx.fillStyle = `rgb(${value},${value},${value})`
    ctx.fillRect(panel.x, panel.y, panel.w, panel.h)
  }
  ctx.strokeStyle = '#a6a6a6'
  ctx.lineWidth = 1.6
  for (const panel of panels) {
    ctx.strokeRect(panel.x + 0.8, panel.y + 0.8, panel.w - 1.6, panel.h - 1.6)
  }
  // A few polished scuffs.
  for (let i = 0; i < 26; i += 1) {
    ctx.fillStyle = `rgba(40,40,40,${0.25 + random() * 0.4})`
    ctx.fillRect(random() * size, random() * size, 10 + random() * 40, 4 + random() * 14)
  }
  return canvas
}

function paintHullBump(size: number, panels: PanelSpec[]): HTMLCanvasElement {
  const canvas = makeCanvas(size, size)
  const ctx = ctx2d(canvas)
  ctx.fillStyle = '#cfcfcf'
  ctx.fillRect(0, 0, size, size)
  // Seams read as recessed grooves.
  ctx.strokeStyle = '#242424'
  ctx.lineWidth = 2
  for (const panel of panels) {
    ctx.strokeRect(panel.x + 0.8, panel.y + 0.8, panel.w - 1.6, panel.h - 1.6)
  }
  // Rivets read as raised studs.
  ctx.fillStyle = '#ffffff'
  for (const panel of panels) {
    const count = Math.max(2, Math.floor(panel.w / 26))
    for (let i = 0; i < count; i += 1) {
      const x = panel.x + 8 + (i / Math.max(1, count - 1)) * (panel.w - 16)
      for (const y of [panel.y + 4, panel.y + panel.h - 4]) {
        ctx.beginPath()
        ctx.arc(x, y, 1.4, 0, Math.PI * 2)
        ctx.fill()
      }
    }
  }
  return canvas
}

/* ------------------------------------------------------------------ *
 * Solar arrays: dark cells on a silver grid
 * ------------------------------------------------------------------ */

function paintSolarAlbedo(width: number, height: number): HTMLCanvasElement {
  const canvas = makeCanvas(width, height)
  const ctx = ctx2d(canvas)
  ctx.fillStyle = '#070d1e'
  ctx.fillRect(0, 0, width, height)
  const columns = 8
  const rows = 4
  const cellWidth = width / columns
  const cellHeight = height / rows
  const random = createRandom(2266)
  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < columns; col += 1) {
      const x = col * cellWidth
      const y = row * cellHeight
      const tone = 0.85 + random() * 0.3
      const gradient = ctx.createLinearGradient(x, y, x + cellWidth, y + cellHeight)
      gradient.addColorStop(0, `rgb(${Math.round(18 * tone)},${Math.round(38 * tone)},${Math.round(84 * tone)})`)
      gradient.addColorStop(0.5, `rgb(${Math.round(28 * tone)},${Math.round(60 * tone)},${Math.round(124 * tone)})`)
      gradient.addColorStop(1, `rgb(${Math.round(14 * tone)},${Math.round(30 * tone)},${Math.round(72 * tone)})`)
      ctx.fillStyle = gradient
      ctx.fillRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4)
      // Silver bus bars around each cell.
      ctx.strokeStyle = 'rgba(152,166,186,0.85)'
      ctx.lineWidth = 1.5
      ctx.strokeRect(x + 2, y + 2, cellWidth - 4, cellHeight - 4)
      // Fingers across the cell.
      ctx.strokeStyle = 'rgba(92,122,172,0.22)'
      ctx.lineWidth = 0.6
      for (let f = 1; f < 8; f += 1) {
        const fy = y + 2 + (cellHeight - 4) * (f / 8)
        ctx.beginPath()
        ctx.moveTo(x + 3, fy)
        ctx.lineTo(x + cellWidth - 3, fy)
        ctx.stroke()
      }
    }
  }
  // Frame.
  ctx.strokeStyle = '#8a93a3'
  ctx.lineWidth = 6
  ctx.strokeRect(3, 3, width - 6, height - 6)
  return canvas
}

function paintSolarRough(width: number, height: number): HTMLCanvasElement {
  const canvas = makeCanvas(width, height)
  const ctx = ctx2d(canvas)
  // Cells are glassy; the grid between them is rougher.
  ctx.fillStyle = '#8f8f8f'
  ctx.fillRect(0, 0, width, height)
  ctx.fillStyle = '#2e2e2e'
  ctx.fillRect(6, 6, width - 12, height - 12)
  return canvas
}

/* ------------------------------------------------------------------ *
 * Gold multi-layer insulation, a ribbed dish, and the environment
 * ------------------------------------------------------------------ */

function paintMliBump(size: number): HTMLCanvasElement {
  const canvas = makeCanvas(size, size)
  const ctx = ctx2d(canvas)
  const image = ctx.createImageData(size, size)
  const data = image.data
  for (let y = 0; y < size; y += 1) {
    for (let x = 0; x < size; x += 1) {
      const broad = fbm(x * 0.085, y * 0.085, 0.5, 4, 5150)
      const creases = fbm(x * 0.24 + 11, y * 0.24, 3.7, 3, 991)
      const value = Math.round(clamp(0.5 + (broad - 0.5) * 1.3 + (creases - 0.5) * 0.9, 0, 1) * 255)
      const offset = (y * size + x) * 4
      data[offset] = value
      data[offset + 1] = value
      data[offset + 2] = value
      data[offset + 3] = 255
    }
  }
  ctx.putImageData(image, 0, 0)
  return canvas
}

function paintDish(size: number): HTMLCanvasElement {
  const canvas = makeCanvas(size, size)
  const ctx = ctx2d(canvas)
  ctx.fillStyle = '#eef1f5'
  ctx.fillRect(0, 0, size, size)
  const center = size / 2
  // Concentric ribs.
  for (let i = 1; i <= 9; i += 1) {
    const radius = (i / 9) * (size * 0.48)
    ctx.strokeStyle = `rgba(120,132,150,${0.35 + i * 0.02})`
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.arc(center, center, radius, 0, Math.PI * 2)
    ctx.stroke()
  }
  // Radial ribs.
  ctx.strokeStyle = 'rgba(120,132,150,0.3)'
  ctx.lineWidth = 1
  for (let i = 0; i < 24; i += 1) {
    const angle = (i / 24) * Math.PI * 2
    ctx.beginPath()
    ctx.moveTo(center, center)
    ctx.lineTo(center + Math.cos(angle) * size * 0.48, center + Math.sin(angle) * size * 0.48)
    ctx.stroke()
  }
  // Dark hub.
  ctx.fillStyle = 'rgba(70,80,98,0.85)'
  ctx.beginPath()
  ctx.arc(center, center, size * 0.08, 0, Math.PI * 2)
  ctx.fill()
  return canvas
}

/**
 * A tiny equirectangular space panorama, pre-filtered into an environment map.
 * It is deliberately dim: it exists to give the metal something believable to
 * reflect, not to add light to the scene.
 */
function buildEnvironment(gl: WebGLRenderer): Texture {
  const width = 512
  const height = 256
  const canvas = makeCanvas(width, height)
  const ctx = ctx2d(canvas)

  const sky = ctx.createLinearGradient(0, 0, 0, height)
  sky.addColorStop(0, '#04060f')
  sky.addColorStop(0.5, '#070b18')
  sky.addColorStop(1, '#020308')
  ctx.fillStyle = sky
  ctx.fillRect(0, 0, width, height)

  // A faint galactic band.
  const band = ctx.createLinearGradient(0, height * 0.18, 0, height * 0.82)
  band.addColorStop(0, 'rgba(40,52,110,0)')
  band.addColorStop(0.5, 'rgba(72,88,152,0.2)')
  band.addColorStop(1, 'rgba(40,52,110,0)')
  ctx.fillStyle = band
  ctx.fillRect(0, 0, width, height)

  const random = createRandom(20240607)
  for (let i = 0; i < 340; i += 1) {
    const x = random() * width
    const y = random() * height
    const radius = random() * 0.9 + 0.2
    ctx.fillStyle = `rgba(220,232,255,${0.25 + random() * 0.6})`
    ctx.beginPath()
    ctx.arc(x, y, radius, 0, Math.PI * 2)
    ctx.fill()
  }

  // The Sun: the warm highlight the hull can catch.
  const sunX = width * 0.22
  const sunY = height * 0.34
  const glow = ctx.createRadialGradient(sunX, sunY, 0, sunX, sunY, width * 0.34)
  glow.addColorStop(0, 'rgba(255,246,224,1)')
  glow.addColorStop(0.06, 'rgba(255,226,168,0.9)')
  glow.addColorStop(0.2, 'rgba(255,176,92,0.32)')
  glow.addColorStop(0.5, 'rgba(255,140,60,0.07)')
  glow.addColorStop(1, 'rgba(255,120,40,0)')
  ctx.fillStyle = glow
  ctx.fillRect(0, 0, width, height)

  const equirect = new CanvasTexture(canvas)
  equirect.mapping = EquirectangularReflectionMapping
  equirect.colorSpace = SRGBColorSpace
  equirect.needsUpdate = true

  const pmrem = new PMREMGenerator(gl)
  pmrem.compileEquirectangularShader()
  const target = pmrem.fromEquirectangular(equirect)
  pmrem.dispose()
  equirect.dispose()
  return target.texture
}

/* ------------------------------------------------------------------ *
 * Materials
 * ------------------------------------------------------------------ */

export interface SpacecraftMaterials {
  /** Brushed titanium hull. */
  hull: MeshStandardMaterial
  /** Gold multi-layer insulation. */
  mli: MeshStandardMaterial
  /** Solar cells. */
  solar: MeshStandardMaterial
  /** White radiator / antenna ceramic. */
  radiator: MeshStandardMaterial
  /** Dark carbon-composite structure. */
  dark: MeshStandardMaterial
  /** Sensor optics. */
  glass: MeshStandardMaterial
  /** Glowing ion plasma. */
  engine: MeshStandardMaterial
  /** Small status light strips. */
  accent: MeshStandardMaterial
  /** The ribbed high-gain dish. */
  dish: MeshStandardMaterial
}

function createMaterials(gl: WebGLRenderer): SpacecraftMaterials {
  const envMap = buildEnvironment(gl)

  const hullSize = 512
  const panels = hullPanels(hullSize)
  const hullMap = toTexture(paintHullAlbedo(hullSize, panels), { repeat: [2, 1] })
  const hullRough = toTexture(paintHullRough(hullSize, panels), { repeat: [2, 1], data: true })
  const hullBump = toTexture(paintHullBump(hullSize, panels), { repeat: [2, 1], data: true })
  const solarMap = toTexture(paintSolarAlbedo(512, 512))
  const solarRough = toTexture(paintSolarRough(512, 512), { data: true })
  const mliBump = toTexture(paintMliBump(256), { repeat: [3, 3], data: true })
  const dishMap = toTexture(paintDish(512))

  return {
    hull: new MeshStandardMaterial({
      map: hullMap,
      roughnessMap: hullRough,
      bumpMap: hullBump,
      bumpScale: 0.012,
      // Slightly below a pure metal: the ship spends its life against black
      // space, and a touch of diffuse keeps the panelling readable in the dark.
      metalness: 0.72,
      roughness: 1,
      envMap,
      envMapIntensity: 1.1,
    }),
    mli: new MeshStandardMaterial({
      color: '#d7a13c',
      metalness: 1,
      roughness: 0.34,
      bumpMap: mliBump,
      bumpScale: 0.04,
      envMap,
      envMapIntensity: 1.15,
    }),
    solar: new MeshStandardMaterial({
      map: solarMap,
      roughnessMap: solarRough,
      metalness: 0.55,
      roughness: 1,
      emissive: '#0a1c44',
      emissiveIntensity: 0.22,
      envMap,
      envMapIntensity: 0.7,
    }),
    radiator: new MeshStandardMaterial({
      color: '#e7ecf3',
      metalness: 0.18,
      roughness: 0.78,
      envMap,
      envMapIntensity: 0.5,
    }),
    dark: new MeshStandardMaterial({
      color: '#191e26',
      metalness: 0.55,
      roughness: 0.55,
      // Double-sided so the open thruster bells read from the side as well as
      // from behind, where the inner wall faces the camera.
      side: DoubleSide,
      envMap,
      envMapIntensity: 0.6,
    }),
    glass: new MeshStandardMaterial({
      color: '#0b1b2e',
      metalness: 0.92,
      roughness: 0.06,
      emissive: '#123048',
      emissiveIntensity: 0.25,
      envMap,
      envMapIntensity: 1.5,
    }),
    engine: new MeshStandardMaterial({
      color: '#a8ecff',
      emissive: '#6fe0ff',
      emissiveIntensity: 2.4,
      metalness: 0.2,
      roughness: 0.4,
      toneMapped: false,
    }),
    accent: new MeshStandardMaterial({
      color: '#8fe8ff',
      emissive: '#4fd8ff',
      emissiveIntensity: 1.8,
      metalness: 0.3,
      roughness: 0.4,
      toneMapped: false,
    }),
    dish: new MeshStandardMaterial({
      map: dishMap,
      color: '#ffffff',
      metalness: 0.42,
      roughness: 0.5,
      side: DoubleSide,
      envMap,
      envMapIntensity: 0.7,
    }),
  }
}

let cached: SpacecraftMaterials | null = null

/**
 * The probe's materials, built once and shared for the app's lifetime — the same
 * pattern the shared sphere geometries use. There is one spacecraft, so there is
 * nothing to gain from rebuilding or disposing them.
 */
export function getSpacecraftMaterials(gl: WebGLRenderer): SpacecraftMaterials {
  if (!cached) cached = createMaterials(gl)
  return cached
}
