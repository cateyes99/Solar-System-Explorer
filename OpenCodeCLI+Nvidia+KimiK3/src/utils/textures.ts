import * as THREE from 'three'

/** Deterministic pseudo-random generator so textures look the same each load. */
function mulberry32(seed: number) {
  let a = seed >>> 0
  return () => {
    a |= 0; a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function makeCanvas(w: number, h: number) {
  const c = document.createElement('canvas')
  c.width = w; c.height = h
  return c
}

function toTexture(canvas: HTMLCanvasElement): THREE.CanvasTexture {
  const tex = new THREE.CanvasTexture(canvas)
  tex.colorSpace = THREE.SRGBColorSpace
  tex.wrapS = THREE.RepeatWrapping
  return tex
}

function speckle(ctx: CanvasRenderingContext2D, rnd: () => number, n: number, w: number, h: number, alpha: number, dark: boolean) {
  for (let i = 0; i < n; i++) {
    const v = dark ? 0 : 255
    ctx.fillStyle = `rgba(${v},${v},${v},${alpha * rnd()})`
    const r = 0.5 + rnd() * 2.5
    ctx.beginPath()
    ctx.arc(rnd() * w, rnd() * h, r, 0, Math.PI * 2)
    ctx.fill()
  }
}

function bands(ctx: CanvasRenderingContext2D, rnd: () => number, w: number, h: number, colors: string[], bandCount: number) {
  let y = 0
  for (let i = 0; i < bandCount; i++) {
    const bh = (h / bandCount) * (0.6 + rnd() * 0.8)
    ctx.fillStyle = colors[i % colors.length]
    ctx.fillRect(0, y, w, bh + 2)
    // wavy distortion
    ctx.globalAlpha = 0.25
    for (let x = 0; x < w; x += 6) {
      const dy = Math.sin((x / w) * Math.PI * (4 + rnd() * 6)) * bh * 0.25
      ctx.fillRect(x, y + dy, 6, bh * 0.4)
    }
    ctx.globalAlpha = 1
    y += bh
  }
}

/** Procedural planet surface textures — no external image assets needed. */
export function planetTexture(id: string, color: string): THREE.CanvasTexture {
  const w = 512, h = 256
  const c = makeCanvas(w, h)
  const ctx = c.getContext('2d')!
  const rnd = mulberry32(id.length * 7919 + id.charCodeAt(0) * 131)
  ctx.fillStyle = color
  ctx.fillRect(0, 0, w, h)

  switch (id) {
    case 'mercury': {
      speckle(ctx, rnd, 900, w, h, 0.35, true)
      speckle(ctx, rnd, 300, w, h, 0.2, false)
      // craters
      for (let i = 0; i < 60; i++) {
        const x = rnd() * w, y = rnd() * h, r = 2 + rnd() * 9
        ctx.strokeStyle = `rgba(0,0,0,${0.25 + rnd() * 0.3})`
        ctx.lineWidth = 1.5
        ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke()
        ctx.fillStyle = `rgba(0,0,0,${0.12 + rnd() * 0.15})`
        ctx.beginPath(); ctx.arc(x, y, r * 0.7, 0, Math.PI * 2); ctx.fill()
      }
      break
    }
    case 'venus': {
      bands(ctx, rnd, w, h, ['#e8c37a', '#dbb269', '#f0d08c', '#d9ab5e'], 9)
      ctx.globalAlpha = 0.3
      speckle(ctx, rnd, 200, w, h, 0.2, false)
      ctx.globalAlpha = 1
      break
    }
    case 'earth': {
      // oceans
      ctx.fillStyle = '#1c5fa8'
      ctx.fillRect(0, 0, w, h)
      ctx.fillStyle = '#2470bd'
      for (let i = 0; i < 120; i++) {
        ctx.globalAlpha = 0.25
        ctx.beginPath()
        ctx.ellipse(rnd() * w, rnd() * h, 15 + rnd() * 40, 8 + rnd() * 18, rnd() * 3, 0, Math.PI * 2)
        ctx.fill()
      }
      ctx.globalAlpha = 1
      // continents
      const land = ['#3f8f4f', '#5a8a44', '#8a7a4a', '#4d7a3d']
      for (let i = 0; i < 14; i++) {
        const cx = rnd() * w, cy = h * 0.15 + rnd() * h * 0.7
        ctx.fillStyle = land[i % land.length]
        for (let j = 0; j < 9; j++) {
          ctx.beginPath()
          ctx.ellipse(
            cx + (rnd() - 0.5) * 70, cy + (rnd() - 0.5) * 40,
            8 + rnd() * 26, 5 + rnd() * 15, rnd() * 3, 0, Math.PI * 2,
          )
          ctx.fill()
        }
      }
      // polar ice
      ctx.fillStyle = 'rgba(255,255,255,0.9)'
      ctx.fillRect(0, 0, w, 12)
      ctx.fillRect(0, h - 12, w, 12)
      break
    }
    case 'mars': {
      ctx.fillStyle = '#b3552f'
      ctx.fillRect(0, 0, w, h)
      speckle(ctx, rnd, 700, w, h, 0.22, true)
      speckle(ctx, rnd, 200, w, h, 0.15, false)
      ctx.fillStyle = 'rgba(255,255,255,0.85)'
      ctx.fillRect(0, 0, w, 8)
      ctx.fillRect(0, h - 8, w, 8)
      break
    }
    case 'jupiter': {
      bands(ctx, rnd, w, h, ['#d8a06a', '#b98a5c', '#e8c49a', '#a87a50', '#e0b184', '#c49a70'], 12)
      // Great Red Spot
      ctx.fillStyle = '#c1442e'
      ctx.beginPath()
      ctx.ellipse(w * 0.68, h * 0.62, 30, 15, 0, 0, Math.PI * 2)
      ctx.fill()
      ctx.fillStyle = '#d65a3f'
      ctx.beginPath()
      ctx.ellipse(w * 0.68, h * 0.62, 20, 9, 0, 0, Math.PI * 2)
      ctx.fill()
      break
    }
    case 'saturn':
      bands(ctx, rnd, w, h, ['#e0c68f', '#d4b87e', '#ecd9a8', '#c9ac72'], 10)
      break
    case 'uranus':
      bands(ctx, rnd, w, h, ['#9fd8dd', '#93cdd4', '#abe0e4'], 5)
      break
    case 'neptune':
      bands(ctx, rnd, w, h, ['#3f66d4', '#3558b8', '#4a72de', '#2f4da5'], 7)
      // dark storm
      ctx.fillStyle = 'rgba(20,30,90,0.6)'
      ctx.beginPath()
      ctx.ellipse(w * 0.4, h * 0.4, 22, 11, 0, 0, Math.PI * 2)
      ctx.fill()
      break
    default:
      speckle(ctx, rnd, 300, w, h, 0.2, true)
  }
  return toTexture(c)
}

/** Cloud layer for Earth (transparent). */
export function cloudTexture(): THREE.CanvasTexture {
  const w = 512, h = 256
  const c = makeCanvas(w, h)
  const ctx = c.getContext('2d')!
  const rnd = mulberry32(4242)
  ctx.clearRect(0, 0, w, h)
  for (let i = 0; i < 90; i++) {
    const x = rnd() * w, y = rnd() * h
    ctx.fillStyle = `rgba(255,255,255,${0.25 + rnd() * 0.4})`
    for (let j = 0; j < 5; j++) {
      ctx.beginPath()
      ctx.ellipse(x + (rnd() - 0.5) * 40, y + (rnd() - 0.5) * 14, 10 + rnd() * 22, 4 + rnd() * 8, 0, 0, Math.PI * 2)
      ctx.fill()
    }
  }
  const tex = toTexture(c)
  return tex
}

/** Fiery animated-looking surface for the Sun. */
export function sunTexture(): THREE.CanvasTexture {
  const w = 512, h = 256
  const c = makeCanvas(w, h)
  const ctx = c.getContext('2d')!
  const rnd = mulberry32(99)
  const grad = ctx.createLinearGradient(0, 0, 0, h)
  grad.addColorStop(0, '#ffb62e')
  grad.addColorStop(0.5, '#ff8c1a')
  grad.addColorStop(1, '#ffb62e')
  ctx.fillStyle = grad
  ctx.fillRect(0, 0, w, h)
  // granulation
  for (let i = 0; i < 900; i++) {
    const x = rnd() * w, y = rnd() * h, r = 2 + rnd() * 7
    ctx.fillStyle = rnd() > 0.5 ? `rgba(255,220,120,${0.15 + rnd() * 0.3})` : `rgba(200,80,10,${0.1 + rnd() * 0.25})`
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fill()
  }
  return toTexture(c)
}

/** Saturn ring texture (radial stripes rendered on a flat ring). */
export function ringTexture(): THREE.CanvasTexture {
  const size = 256
  const c = makeCanvas(size, size)
  const ctx = c.getContext('2d')!
  const rnd = mulberry32(7)
  ctx.clearRect(0, 0, size, size)
  const cx = size / 2
  for (let r = 60; r < 128; r += 1.5) {
    const alpha = 0.15 + rnd() * 0.55
    const shade = 190 + rnd() * 55
    ctx.strokeStyle = `rgba(${shade},${shade - 20},${shade - 60},${alpha})`
    ctx.lineWidth = 1.4
    ctx.beginPath()
    ctx.arc(cx, cx, r, 0, Math.PI * 2)
    ctx.stroke()
  }
  // Cassini division
  ctx.globalCompositeOperation = 'destination-out'
  ctx.lineWidth = 6
  ctx.beginPath(); ctx.arc(cx, cx, 92, 0, Math.PI * 2); ctx.stroke()
  ctx.globalCompositeOperation = 'source-over'
  const tex = toTexture(c)
  tex.wrapS = THREE.ClampToEdgeWrapping
  return tex
}
