import * as THREE from 'three'
import type { Planet } from '../data/planets'

/**
 * Procedural texture generation via Canvas 2D — no external image assets.
 * Each planet gets a small equirectangular (512x256) color map built from
 * seeded pseudo-random gradients/blobs so every run looks consistent per
 * planet while remaining fully generated code.
 */

function mulberry32(seed: number) {
  let s = seed
  return function random() {
    s |= 0
    s = (s + 0x6d2b79f5) | 0
    let t = Math.imul(s ^ (s >>> 15), 1 | s)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

export function hashSeed(str: string): number {
  let h = 1779033703 ^ str.length
  for (let i = 0; i < str.length; i++) {
    h = Math.imul(h ^ str.charCodeAt(i), 3432918353)
    h = (h << 13) | (h >>> 19)
  }
  return (h ^ (h >>> 16)) >>> 0
}

function hexToRgb(hex: string): [number, number, number] {
  const clean = hex.replace('#', '')
  const full = clean.length === 3 ? clean.split('').map((c) => c + c).join('') : clean
  const bigint = parseInt(full, 16)
  return [(bigint >> 16) & 255, (bigint >> 8) & 255, bigint & 255]
}

function hexAlpha(hex: string, alpha: number): string {
  const [r, g, b] = hexToRgb(hex)
  return `rgba(${r}, ${g}, ${b}, ${alpha})`
}

function lighten(hex: string, amount: number): string {
  const [r, g, b] = hexToRgb(hex)
  const mix = (c: number) => Math.min(255, Math.round(c + (255 - c) * amount))
  return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

function mixColor(hexA: string, hexB: string, t: number): string {
  const [r1, g1, b1] = hexToRgb(hexA)
  const [r2, g2, b2] = hexToRgb(hexB)
  const r = Math.round(r1 + (r2 - r1) * t)
  const g = Math.round(g1 + (g2 - g1) * t)
  const b = Math.round(b1 + (b2 - b1) * t)
  return `rgb(${r}, ${g}, ${b})`
}

function makeCanvas(width: number, height: number) {
  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas context unavailable')
  return { canvas, ctx }
}

/** Draws at x, x-width and x+width so blobs near a seam wrap seamlessly. */
function wrapDraw(width: number, x: number, draw: (x: number) => void) {
  draw(x)
  draw(x - width)
  draw(x + width)
}

function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const texture = new THREE.CanvasTexture(canvas)
  texture.wrapS = THREE.RepeatWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.colorSpace = THREE.SRGBColorSpace
  texture.anisotropy = 4
  texture.needsUpdate = true
  return texture
}

function paintPolarCaps(ctx: CanvasRenderingContext2D, width: number, height: number, coverage: number) {
  const capHeight = height * coverage
  const top = ctx.createLinearGradient(0, 0, 0, capHeight)
  top.addColorStop(0, 'rgba(255,255,255,0.85)')
  top.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = top
  ctx.fillRect(0, 0, width, capHeight)

  const bottom = ctx.createLinearGradient(0, height - capHeight, 0, height)
  bottom.addColorStop(0, 'rgba(255,255,255,0)')
  bottom.addColorStop(1, 'rgba(255,255,255,0.85)')
  ctx.fillStyle = bottom
  ctx.fillRect(0, height - capHeight, width, capHeight)
}

export function createCrateredTexture(baseColor: string, secondaryColor: string, seed: number): THREE.CanvasTexture {
  const width = 512
  const height = 256
  const { canvas, ctx } = makeCanvas(width, height)
  const rand = mulberry32(seed)

  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, width, height)

  for (let i = 0; i < 100; i++) {
    const cx = rand() * width
    const cy = rand() * height
    const r = 4 + rand() * 20
    const dark = rand() > 0.35
    wrapDraw(width, cx, (x) => {
      const gradient = ctx.createRadialGradient(x, cy, 0, x, cy, r)
      if (dark) {
        gradient.addColorStop(0, hexAlpha(secondaryColor, 0.55))
        gradient.addColorStop(0.7, hexAlpha(secondaryColor, 0.25))
        gradient.addColorStop(1, hexAlpha(secondaryColor, 0))
      } else {
        gradient.addColorStop(0, 'rgba(255,255,255,0.18)')
        gradient.addColorStop(0.6, 'rgba(255,255,255,0.08)')
        gradient.addColorStop(1, 'rgba(255,255,255,0)')
      }
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(x, cy, r, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  return toTexture(canvas)
}

export function createRockyTexture(baseColor: string, secondaryColor: string, seed: number): THREE.CanvasTexture {
  const width = 512
  const height = 256
  const { canvas, ctx } = makeCanvas(width, height)
  const rand = mulberry32(seed)

  const base = ctx.createLinearGradient(0, 0, 0, height)
  base.addColorStop(0, lighten(baseColor, 0.12))
  base.addColorStop(0.5, baseColor)
  base.addColorStop(1, lighten(baseColor, 0.12))
  ctx.fillStyle = base
  ctx.fillRect(0, 0, width, height)

  for (let i = 0; i < 55; i++) {
    const cx = rand() * width
    const cy = height * 0.15 + rand() * height * 0.7
    const r = 14 + rand() * 44
    wrapDraw(width, cx, (x) => {
      const gradient = ctx.createRadialGradient(x, cy, 0, x, cy, r)
      gradient.addColorStop(0, hexAlpha(secondaryColor, 0.35))
      gradient.addColorStop(1, hexAlpha(secondaryColor, 0))
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.ellipse(x, cy, r, r * 0.55, rand() * Math.PI, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  ctx.strokeStyle = hexAlpha(secondaryColor, 0.4)
  for (let i = 0; i < 4; i++) {
    const y = height * (0.3 + rand() * 0.4)
    ctx.lineWidth = 2 + rand() * 3
    wrapDraw(width, 0, (xOffset) => {
      ctx.beginPath()
      ctx.moveTo(xOffset, y)
      for (let x = 0; x <= width; x += 32) {
        ctx.lineTo(xOffset + x, y + Math.sin(x * 0.05 + i) * 8)
      }
      ctx.stroke()
    })
  }

  paintPolarCaps(ctx, width, height, 0.1)

  return toTexture(canvas)
}

export function createEarthTexture(seed: number): THREE.CanvasTexture {
  const width = 512
  const height = 256
  const { canvas, ctx } = makeCanvas(width, height)
  const rand = mulberry32(seed)

  const ocean = ctx.createLinearGradient(0, 0, 0, height)
  ocean.addColorStop(0, '#1c4f7c')
  ocean.addColorStop(0.5, '#2f6fb0')
  ocean.addColorStop(1, '#1c4f7c')
  ctx.fillStyle = ocean
  ctx.fillRect(0, 0, width, height)

  for (let cluster = 0; cluster < 7; cluster++) {
    const clusterX = rand() * width
    const clusterY = height * 0.2 + rand() * height * 0.6
    const blobCount = 10 + Math.floor(rand() * 10)
    const isGreen = rand() > 0.3
    for (let b = 0; b < blobCount; b++) {
      const x = clusterX + (rand() - 0.5) * 90
      const y = clusterY + (rand() - 0.5) * 60
      const r = 10 + rand() * 26
      const color = isGreen ? mixColor('#3f8f4f', '#7a6a3a', rand()) : '#7a6a3a'
      wrapDraw(width, x, (px) => {
        ctx.fillStyle = color
        ctx.beginPath()
        ctx.arc(px, y, r, 0, Math.PI * 2)
        ctx.fill()
      })
    }
  }

  paintPolarCaps(ctx, width, height, 0.09)

  return toTexture(canvas)
}

export function createCloudTexture(seed: number): THREE.CanvasTexture {
  const width = 512
  const height = 256
  const { canvas, ctx } = makeCanvas(width, height)
  const rand = mulberry32(seed)

  for (let i = 0; i < 140; i++) {
    const x = rand() * width
    const y = rand() * height
    const r = 6 + rand() * 22
    const alpha = 0.12 + rand() * 0.28
    wrapDraw(width, x, (px) => {
      const gradient = ctx.createRadialGradient(px, y, 0, px, y, r)
      gradient.addColorStop(0, `rgba(255,255,255,${alpha})`)
      gradient.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(px, y, r, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  return toTexture(canvas)
}

export function createHazyTexture(baseColor: string, secondaryColor: string, seed: number): THREE.CanvasTexture {
  const width = 512
  const height = 256
  const { canvas, ctx } = makeCanvas(width, height)
  const rand = mulberry32(seed)

  ctx.fillStyle = baseColor
  ctx.fillRect(0, 0, width, height)

  ctx.globalAlpha = 0.4
  for (let i = 0; i < 16; i++) {
    const y = rand() * height
    ctx.strokeStyle = secondaryColor
    ctx.lineWidth = 6 + rand() * 14
    ctx.beginPath()
    for (let x = 0; x <= width; x += 20) {
      const yy = y + Math.sin(x * 0.02 + i * 1.3) * 14
      if (x === 0) ctx.moveTo(x, yy)
      else ctx.lineTo(x, yy)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  for (let i = 0; i < 40; i++) {
    const x = rand() * width
    const y = rand() * height
    const r = 10 + rand() * 30
    wrapDraw(width, x, (px) => {
      const gradient = ctx.createRadialGradient(px, y, 0, px, y, r)
      gradient.addColorStop(0, 'rgba(255,255,255,0.15)')
      gradient.addColorStop(1, 'rgba(255,255,255,0)')
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(px, y, r, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  return toTexture(canvas)
}

export function createBandedTexture(bandColors: string[], seed: number, greatRedSpot: boolean): THREE.CanvasTexture {
  const width = 512
  const height = 256
  const { canvas, ctx } = makeCanvas(width, height)
  const rand = mulberry32(seed)

  const bandCount = 14
  const bandHeight = height / bandCount
  for (let i = 0; i < bandCount; i++) {
    ctx.fillStyle = bandColors[i % bandColors.length]
    ctx.fillRect(0, i * bandHeight, width, bandHeight + 1)
  }

  ctx.globalAlpha = 0.35
  for (let i = 0; i < bandCount * 3; i++) {
    const y = rand() * height
    ctx.strokeStyle = bandColors[Math.floor(rand() * bandColors.length)]
    ctx.lineWidth = 1 + rand() * 3
    const waveAmp = 4 + rand() * 10
    const waveFreq = 0.01 + rand() * 0.02
    ctx.beginPath()
    for (let x = 0; x <= width; x += 16) {
      const yy = y + Math.sin(x * waveFreq + i) * waveAmp
      if (x === 0) ctx.moveTo(x, yy)
      else ctx.lineTo(x, yy)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  if (greatRedSpot) {
    const spotX = width * 0.62
    const spotY = height * 0.58
    const gradient = ctx.createRadialGradient(spotX, spotY, 4, spotX, spotY, 46)
    gradient.addColorStop(0, 'rgba(196, 84, 60, 0.95)')
    gradient.addColorStop(0.7, 'rgba(196, 84, 60, 0.55)')
    gradient.addColorStop(1, 'rgba(196, 84, 60, 0)')
    ctx.fillStyle = gradient
    ctx.beginPath()
    ctx.ellipse(spotX, spotY, 46, 26, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  return toTexture(canvas)
}

export function createIceGiantTexture(
  baseColor: string,
  secondaryColor: string,
  seed: number,
  darkSpot: boolean,
): THREE.CanvasTexture {
  const width = 512
  const height = 256
  const { canvas, ctx } = makeCanvas(width, height)
  const rand = mulberry32(seed)

  const gradient = ctx.createLinearGradient(0, 0, 0, height)
  gradient.addColorStop(0, lighten(baseColor, 0.15))
  gradient.addColorStop(0.5, baseColor)
  gradient.addColorStop(1, lighten(baseColor, 0.1))
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, width, height)

  ctx.globalAlpha = 0.25
  for (let i = 0; i < 10; i++) {
    const y = rand() * height
    ctx.strokeStyle = secondaryColor
    ctx.lineWidth = 4 + rand() * 10
    ctx.beginPath()
    for (let x = 0; x <= width; x += 24) {
      const yy = y + Math.sin(x * 0.015 + i) * 6
      if (x === 0) ctx.moveTo(x, yy)
      else ctx.lineTo(x, yy)
    }
    ctx.stroke()
  }
  ctx.globalAlpha = 1

  if (darkSpot) {
    const spotX = width * 0.3
    const spotY = height * 0.45
    const gradient2 = ctx.createRadialGradient(spotX, spotY, 2, spotX, spotY, 30)
    gradient2.addColorStop(0, hexAlpha(secondaryColor, 0.7))
    gradient2.addColorStop(1, hexAlpha(secondaryColor, 0))
    ctx.fillStyle = gradient2
    ctx.beginPath()
    ctx.ellipse(spotX, spotY, 30, 18, 0, 0, Math.PI * 2)
    ctx.fill()
  }

  return toTexture(canvas)
}

export function createRingTexture(ringColor: string, seed: number): THREE.CanvasTexture {
  const width = 64
  const height = 512
  const { canvas, ctx } = makeCanvas(width, height)
  const rand = mulberry32(seed)
  const [r, g, b] = hexToRgb(ringColor)

  const bandDefs = 26
  const bandHeight = height / bandDefs
  for (let x = 0; x < width; x++) {
    for (let i = 0; i < bandDefs; i++) {
      const bandStart = i * bandHeight
      const jitter = (rand() - 0.5) * bandHeight * 0.3
      let alpha = 0.55 + rand() * 0.35
      if (rand() < 0.12) alpha = 0.05 + rand() * 0.08
      const brightness = 0.75 + rand() * 0.5
      ctx.fillStyle = `rgba(${Math.min(255, r * brightness)}, ${Math.min(255, g * brightness)}, ${Math.min(255, b * brightness)}, ${alpha})`
      ctx.fillRect(x, bandStart + jitter, 1, bandHeight + 1)
    }
  }

  const fade = ctx.createLinearGradient(0, 0, 0, height)
  fade.addColorStop(0, 'rgba(0,0,0,1)')
  fade.addColorStop(0.06, 'rgba(0,0,0,0)')
  fade.addColorStop(0.94, 'rgba(0,0,0,0)')
  fade.addColorStop(1, 'rgba(0,0,0,1)')
  ctx.globalCompositeOperation = 'destination-out'
  ctx.fillStyle = fade
  ctx.fillRect(0, 0, width, height)
  ctx.globalCompositeOperation = 'source-over'

  const texture = toTexture(canvas)
  texture.wrapT = THREE.ClampToEdgeWrapping
  return texture
}

export function createSunTexture(seed: number): THREE.CanvasTexture {
  const width = 512
  const height = 256
  const { canvas, ctx } = makeCanvas(width, height)
  const rand = mulberry32(seed)

  const base = ctx.createLinearGradient(0, 0, 0, height)
  base.addColorStop(0, '#ffdd88')
  base.addColorStop(0.5, '#ffb347')
  base.addColorStop(1, '#ffdd88')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, width, height)

  for (let i = 0; i < 220; i++) {
    const x = rand() * width
    const y = rand() * height
    const r = 4 + rand() * 18
    const color = rand() > 0.5 ? '#fff2c0' : '#e8862c'
    wrapDraw(width, x, (px) => {
      const gradient = ctx.createRadialGradient(px, y, 0, px, y, r)
      gradient.addColorStop(0, hexAlpha(color, 0.55))
      gradient.addColorStop(1, hexAlpha(color, 0))
      ctx.fillStyle = gradient
      ctx.beginPath()
      ctx.arc(px, y, r, 0, Math.PI * 2)
      ctx.fill()
    })
  }

  return toTexture(canvas)
}

export function createStarSpriteTexture(): THREE.CanvasTexture {
  const size = 64
  const { canvas, ctx } = makeCanvas(size, size)
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, 'rgba(255,255,255,1)')
  gradient.addColorStop(0.4, 'rgba(255,255,255,0.9)')
  gradient.addColorStop(1, 'rgba(255,255,255,0)')
  ctx.fillStyle = gradient
  ctx.beginPath()
  ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2)
  ctx.fill()
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export function createGlowSpriteTexture(color: string): THREE.CanvasTexture {
  const size = 256
  const { canvas, ctx } = makeCanvas(size, size)
  const [r, g, b] = hexToRgb(color)
  const gradient = ctx.createRadialGradient(size / 2, size / 2, 0, size / 2, size / 2, size / 2)
  gradient.addColorStop(0, `rgba(${r},${g},${b},0.85)`)
  gradient.addColorStop(0.4, `rgba(${r},${g},${b},0.35)`)
  gradient.addColorStop(1, `rgba(${r},${g},${b},0)`)
  ctx.fillStyle = gradient
  ctx.fillRect(0, 0, size, size)
  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  return texture
}

export function createPlanetTexture(planet: Planet): THREE.CanvasTexture {
  const seed = hashSeed(planet.id)
  switch (planet.surface) {
    case 'cratered':
      return createCrateredTexture(planet.color, planet.secondaryColor, seed)
    case 'rocky':
      return createRockyTexture(planet.color, planet.secondaryColor, seed)
    case 'earthlike':
      return createEarthTexture(seed)
    case 'hazy':
      return createHazyTexture(planet.color, planet.secondaryColor, seed)
    case 'bands':
      return createBandedTexture(planet.bandColors ?? [planet.color, planet.secondaryColor], seed, planet.id === 'jupiter')
    case 'ice-giant':
      return createIceGiantTexture(planet.color, planet.secondaryColor, seed, planet.id === 'neptune')
    default:
      return createRockyTexture(planet.color, planet.secondaryColor, seed)
  }
}
