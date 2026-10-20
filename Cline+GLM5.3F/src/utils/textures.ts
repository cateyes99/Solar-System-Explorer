import * as THREE from 'three'
import { fbm, mulberry32, smoothstep, clamp01, mixRGB } from './noise'
import { paintMercury, paintVenus, paintEarth, paintMars, paintMoon } from './paintersTerrestrial'
import { paintJupiter, paintSaturn, paintUranus, paintNeptune } from './paintersGiants'
import type { PlanetId } from '../types'

/**
 * Procedural texture factory. Everything is generated once, on demand, from tiny
 * canvas paintings — no external image assets are downloaded.
 */
const cache = new Map<string, THREE.Texture>()

function canvasTexture(
  key: string,
  w: number,
  h: number,
  draw: (ctx: CanvasRenderingContext2D, w: number, h: number) => void,
  srgb = true,
): THREE.Texture {
  const cached = cache.get(key)
  if (cached) return cached
  const canvas = document.createElement('canvas')
  canvas.width = w
  canvas.height = h
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('2D canvas unavailable for procedural textures')
  draw(ctx, w, h)
  const tex = new THREE.CanvasTexture(canvas)
  tex.wrapS = THREE.RepeatWrapping
  tex.anisotropy = 4
  if (srgb) tex.colorSpace = THREE.SRGBColorSpace
  tex.needsUpdate = true
  cache.set(key, tex)
  return tex
}

const HI_RES: PlanetId[] = ['earth', 'jupiter', 'saturn']

export function getPlanetTexture(id: PlanetId | 'moon'): THREE.Texture {
  const hi = HI_RES.includes(id as PlanetId)
  const [w, h] = hi ? [512, 256] : [256, 128]
  return canvasTexture(`planet-${id}`, w, h, (ctx, cw, ch) => {
    switch (id) {
      case 'mercury':
        paintMercury(ctx, cw, ch)
        break
      case 'venus':
        paintVenus(ctx, cw, ch)
        break
      case 'earth':
        paintEarth(ctx, cw, ch)
        break
      case 'mars':
        paintMars(ctx, cw, ch)
        break
      case 'jupiter':
        paintJupiter(ctx, cw, ch)
        break
      case 'saturn':
        paintSaturn(ctx, cw, ch)
        break
      case 'uranus':
        paintUranus(ctx, cw, ch)
        break
      case 'neptune':
        paintNeptune(ctx, cw, ch)
        break
      case 'moon':
        paintMoon(ctx, cw, ch)
        break
    }
  })
}

/** White puffy clouds with alpha — used as the Earth cloud layer's map. */
export function getCloudTexture(): THREE.Texture {
  return canvasTexture('clouds', 512, 256, (ctx, w, h) => {
    const img = ctx.createImageData(w, h)
    for (let y = 0; y < h; y++) {
      const v = y / h
      for (let x = 0; x < w; x++) {
        const u = x / w
        const n = fbm(u, v, 7, 5, 202)
        const swirl = fbm(u + 0.1 * Math.sin(v * 6), v, 4, 3, 203)
        const a = smoothstep(0.52, 0.72, n * 0.75 + swirl * 0.35)
        const i = (y * w + x) * 4
        img.data[i] = 255
        img.data[i + 1] = 255
        img.data[i + 2] = 255
        img.data[i + 3] = Math.round(a * 230)
      }
    }
    ctx.putImageData(img, 0, 0)
  })
}

/** Saturn's rings: u runs from the inner to the outer ring edge. */
export function getRingTexture(): THREE.Texture {
  return canvasTexture(
    'rings',
    1024,
    16,
    (ctx, w, h) => {
      const img = ctx.createImageData(w, h)
      for (let x = 0; x < w; x++) {
        const u = x / (w - 1)
        const n =
          0.55 +
          0.3 * Math.sin(u * 120 + 2.2 * Math.sin(u * 31)) +
          0.3 * (fbm(u, 0.5, 24, 3, 316) - 0.5)
        let alpha = 0.5 + 0.5 * clamp01(n)
        alpha *= smoothstep(0, 0.06, u) * (1 - smoothstep(0.94, 1, u))
        // The inner C ring is translucent.
        alpha *= 0.35 + 0.65 * smoothstep(0.18, 0.28, u)
        // The Cassini Division is a real gap.
        alpha *= 1 - 0.92 * smoothstep(0.6, 0.63, u) * (1 - smoothstep(0.68, 0.71, u))
        const col = mixRGB([196, 176, 140], [238, 224, 196], clamp01(n))
        for (let y = 0; y < h; y++) {
          const i = (y * w + x) * 4
          img.data[i] = col[0]
          img.data[i + 1] = col[1]
          img.data[i + 2] = col[2]
          img.data[i + 3] = Math.round(alpha * 235)
        }
      }
      ctx.putImageData(img, 0, 0)
    },
    false,
  )
}

/** Soft radial glow sprite (corona, comet coma, engine flare…). */
export function getGlowTexture(inner: string, mid: string, outer: string): THREE.Texture {
  return canvasTexture(
    `glow-${inner}-${mid}-${outer}`,
    256,
    256,
    (ctx, w) => {
      const g = ctx.createRadialGradient(w / 2, w / 2, 0, w / 2, w / 2, w / 2)
      g.addColorStop(0, inner)
      g.addColorStop(0.28, mid)
      g.addColorStop(1, outer)
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, w)
    },
    false,
  )
}

/** Soft, colourful dust cloud used for the deep-space nebulae. */
export function getNebulaTexture(seed: number, colorA: string, colorB: string): THREE.Texture {
  return canvasTexture(`nebula-${seed}`, 512, 512, (ctx, w, h) => {
    const rnd = mulberry32(seed)
    ctx.clearRect(0, 0, w, h)
    for (let i = 0; i < 18; i++) {
      const cx = rnd() * w
      const cy = rnd() * h
      const r = 60 + rnd() * 160
      const color = rnd() > 0.5 ? colorA : colorB
      const a = 0.05 + rnd() * 0.08
      const g = ctx.createRadialGradient(cx, cy, 0, cx, cy, r)
      g.addColorStop(0, color.replace('ALPHA', a.toFixed(3)))
      g.addColorStop(1, color.replace('ALPHA', '0'))
      ctx.fillStyle = g
      ctx.fillRect(0, 0, w, h)
    }
  }, false)
}
