import {
  CanvasTexture,
  ClampToEdgeWrapping,
  RepeatWrapping,
  SRGBColorSpace,
} from 'three'
import type { BodyId } from '../types'

function hash(x: number, y: number, seed: number): number {
  const value = Math.sin(x * 127.1 + y * 311.7 + seed * 74.7) * 43758.5453123
  return value - Math.floor(value)
}

function smoothstep(value: number): number {
  return value * value * (3 - 2 * value)
}

function noise(x: number, y: number, seed: number): number {
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = smoothstep(x - ix)
  const fy = smoothstep(y - iy)
  const a = hash(ix, iy, seed)
  const b = hash(ix + 1, iy, seed)
  const c = hash(ix, iy + 1, seed)
  const d = hash(ix + 1, iy + 1, seed)
  return (a + (b - a) * fx) + ((c + (d - c) * fx) - (a + (b - a) * fx)) * fy
}

function fbm(x: number, y: number, seed: number, octaves = 4): number {
  let value = 0
  let amplitude = 0.55
  let frequency = 1
  for (let octave = 0; octave < octaves; octave += 1) {
    value += noise(x * frequency, y * frequency, seed + octave * 7) * amplitude
    frequency *= 2.03
    amplitude *= 0.48
  }
  return value
}

function mix(a: number, b: number, amount: number): number {
  return Math.max(0, Math.min(255, a + (b - a) * amount))
}

type RGB = [number, number, number]
function palette(a: RGB, b: RGB, t: number): RGB {
  return [mix(a[0], b[0], t), mix(a[1], b[1], t), mix(a[2], b[2], t)]
}

function createCanvas(width: number, height = width / 2): HTMLCanvasElement {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  return canvas
}

export function createPlanetTexture(id: BodyId): CanvasTexture {
  const width = id === 'earth' || id === 'jupiter' ? 1024 : 512
  const height = width / 2
  const canvas = createCanvas(width)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas textures are not supported by this browser.')
  const image = context.createImageData(width, height)
  const seed = [...id].reduce((sum, letter) => sum + letter.charCodeAt(0), 0)

  for (let y = 0; y < height; y += 1) {
    const v = y / height
    const latitude = Math.abs(v - 0.5) * 2
    for (let x = 0; x < width; x += 1) {
      const u = x / width
      const index = (y * width + x) * 4
      const broad = fbm(u * 5, v * 4, seed)
      const fine = fbm(u * 19, v * 12, seed + 20, 3)
      let color: RGB = [128, 128, 128]

      if (id === 'mercury' || id === 'moon') {
        const shade = 70 + broad * 100 + fine * 35
        color = [shade * 1.04, shade, shade * 0.93]
      } else if (id === 'venus') {
        const swirl = Math.sin(v * 54 + broad * 13 + Math.sin(u * 9) * 2) * 0.5 + 0.5
        color = palette([157, 112, 54], [245, 218, 155], swirl * 0.48 + broad * 0.45)
      } else if (id === 'earth') {
        const continent = broad * 0.82 + fine * 0.22 + Math.sin(u * 13 + v * 8) * 0.035
        if (latitude > 0.89 - fine * 0.08) {
          color = palette([190, 216, 219], [246, 250, 246], fine)
        } else if (continent > 0.59) {
          const dry = Math.max(0, 1 - Math.abs(v - 0.5) * 3) * fine
          color = continent > 0.76
            ? palette([75, 91, 53], [153, 130, 83], fine)
            : palette([35, 91, 55], [118, 123, 65], dry + broad * 0.25)
        } else {
          const ocean = Math.max(0, Math.min(1, (continent - 0.25) * 2.2))
          color = palette([5, 30, 75], [16, 105, 144], ocean)
        }
      } else if (id === 'mars') {
        const ridge = Math.abs(fine - 0.5) * 2
        color = palette([89, 42, 29], [198, 101, 58], broad * 0.75 + ridge * 0.2)
        if (latitude > 0.92 - fine * 0.05) color = [220, 211, 191]
      } else if (id === 'jupiter') {
        const band = Math.sin(v * 95 + broad * 4) * 0.5 + 0.5
        const thinBand = Math.sin(v * 245 + fine * 2) * 0.5 + 0.5
        color = band > 0.48
          ? palette([157, 112, 81], [225, 198, 158], band * 0.7 + fine * 0.25)
          : palette([104, 76, 65], [187, 142, 109], thinBand * 0.5 + broad * 0.35)
        const spotX = Math.min(Math.abs(u - 0.72), 1 - Math.abs(u - 0.72)) / 0.105
        const spotY = (v - 0.64) / 0.055
        if (spotX * spotX + spotY * spotY < 1 + fine * 0.12) {
          color = palette([132, 50, 34], [213, 109, 74], fine * 0.7 + band * 0.25)
        }
      } else if (id === 'saturn') {
        const band = Math.sin(v * 110 + broad * 2) * 0.5 + 0.5
        color = palette([157, 128, 80], [232, 211, 158], band * 0.32 + broad * 0.55)
      } else if (id === 'uranus') {
        const band = Math.sin(v * 42 + broad) * 0.5 + 0.5
        color = palette([91, 166, 176], [164, 224, 224], broad * 0.4 + band * 0.13)
      } else if (id === 'neptune') {
        const band = Math.sin(v * 78 + broad * 5) * 0.5 + 0.5
        color = palette([24, 51, 137], [55, 118, 210], broad * 0.55 + band * 0.2)
        const spot = ((u - 0.31) / 0.09) ** 2 + ((v - 0.58) / 0.045) ** 2
        if (spot < 1) color = palette([16, 29, 82], [35, 64, 143], fine)
      }

      image.data[index] = color[0]
      image.data[index + 1] = color[1]
      image.data[index + 2] = color[2]
      image.data[index + 3] = 255
    }
  }
  context.putImageData(image, 0, 0)

  if (id === 'mercury' || id === 'moon') {
    const random = (index: number) => hash(index, seed, 8)
    for (let crater = 0; crater < 85; crater += 1) {
      const x = random(crater * 4) * width
      const y = random(crater * 4 + 1) * height
      const radius = (2 + random(crater * 4 + 2) ** 2 * 17) * (width / 512)
      const gradient = context.createRadialGradient(x - radius * 0.2, y - radius * 0.2, 0, x, y, radius)
      gradient.addColorStop(0, 'rgba(30,25,23,.48)')
      gradient.addColorStop(0.66, 'rgba(55,48,42,.36)')
      gradient.addColorStop(0.8, 'rgba(225,215,195,.28)')
      gradient.addColorStop(1, 'rgba(100,90,80,0)')
      context.fillStyle = gradient
      context.beginPath()
      context.arc(x, y, radius, 0, Math.PI * 2)
      context.fill()
    }
  }

  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  texture.wrapT = ClampToEdgeWrapping
  texture.anisotropy = 4
  return texture
}

export function createCloudTexture(): CanvasTexture {
  const width = 512
  const height = 256
  const canvas = createCanvas(width)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas textures are not supported by this browser.')
  const image = context.createImageData(width, height)
  for (let y = 0; y < height; y += 1) {
    for (let x = 0; x < width; x += 1) {
      const index = (y * width + x) * 4
      const u = x / width
      const v = y / height
      const cloud = fbm(u * 8 + Math.sin(v * 24) * 0.3, v * 5, 411, 5)
      const alpha = Math.max(0, Math.min(1, (cloud - 0.57) * 4.5))
      image.data[index] = 240
      image.data[index + 1] = 248
      image.data[index + 2] = 255
      image.data[index + 3] = alpha * 210
    }
  }
  context.putImageData(image, 0, 0)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  return texture
}

export function createRingTexture(): CanvasTexture {
  const canvas = createCanvas(512, 512)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas textures are not supported by this browser.')
  const image = context.createImageData(512, 512)
  for (let y = 0; y < 512; y += 1) {
    for (let x = 0; x < 512; x += 1) {
      const dx = (x - 256) / 256
      const dy = (y - 256) / 256
      const radius = Math.sqrt(dx * dx + dy * dy)
      const index = (y * 512 + x) * 4
      const bands = Math.sin(radius * 285) * 0.5 + 0.5
      const fine = noise(radius * 180, 0, 99)
      const cassini = radius > 0.69 && radius < 0.735 ? 0.12 : 1
      const alpha = radius > 0.56 && radius < 0.98
        ? (0.26 + bands * 0.42 + fine * 0.22) * cassini
        : 0
      image.data[index] = 210
      image.data[index + 1] = 190
      image.data[index + 2] = 148
      image.data[index + 3] = alpha * 235
    }
  }
  context.putImageData(image, 0, 0)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}

export function createGlowTexture(): CanvasTexture {
  const canvas = createCanvas(256, 256)
  const context = canvas.getContext('2d')
  if (!context) throw new Error('Canvas textures are not supported by this browser.')
  const gradient = context.createRadialGradient(128, 128, 0, 128, 128, 128)
  gradient.addColorStop(0, 'rgba(255,245,194,1)')
  gradient.addColorStop(0.12, 'rgba(255,181,67,.7)')
  gradient.addColorStop(0.35, 'rgba(255,111,28,.2)')
  gradient.addColorStop(0.7, 'rgba(255,78,12,.045)')
  gradient.addColorStop(1, 'rgba(255,60,0,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 256, 256)
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  return texture
}
