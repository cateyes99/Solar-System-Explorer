import { CanvasTexture, SRGBColorSpace, RepeatWrapping } from 'three'
import { bodyById, type BodyId } from '../data/planets'

function randomSource(seed: number) {
  let value = seed
  return () => {
    value = Math.imul(1664525, value) + 1013904223 | 0
    return (value >>> 0) / 4294967296
  }
}

export function makeSurface(id: BodyId): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const context = canvas.getContext('2d')!
  const random = randomSource(id.charCodeAt(0) * 97)
  const gas = ['jupiter', 'saturn', 'venus', 'uranus', 'neptune'].includes(id)
  context.fillStyle = bodyById[id].color
  context.fillRect(0, 0, 1024, 512)
  if (gas) {
    const palettes: Partial<Record<BodyId, string[]>> = {
      jupiter: ['#cfb79b', '#a77651', '#ede0c5', '#ba8e6d', '#f2e5c9', '#997159'],
      saturn: ['#c9b180', '#ded0a4', '#ae9874', '#e7d5a4', '#c6b285'],
      venus: ['#cfaa70', '#dfc48d', '#eee1b5', '#c99f69'],
      uranus: ['#8dbfc7', '#afd8db', '#97ccd1'],
      neptune: ['#326cb0', '#3c7dc7', '#538ed0', '#659bce'],
    }
    const palette = palettes[id]!
    for (let stripe = 0; stripe < 130; stripe++) {
      const height = random() * 12 + 2
      const top = random() * 512
      context.fillStyle = palette[Math.floor(random() * palette.length)]
      context.globalAlpha = .3 + random() * .4
      context.beginPath()
      context.moveTo(0, top)
      for (let horizontal = 0; horizontal <= 1024; horizontal += 8) context.lineTo(horizontal, top + Math.sin(horizontal * .015 + stripe) * (id === 'venus' ? 13 : 3))
      for (let horizontal = 1024; horizontal >= 0; horizontal -= 8) context.lineTo(horizontal, top + height + Math.sin(horizontal * .015 + stripe) * 3)
      context.fill()
    }
    context.globalAlpha = 1
    if (id === 'jupiter') {
      context.save()
      context.translate(720, 326)
      context.rotate(-.08)
      for (let layer = 22; layer > 0; layer--) {
        context.fillStyle = layer > 17 ? '#d8bc99' : layer > 12 ? '#ad644a' : layer > 5 ? '#c5845d' : '#a76146'
        context.beginPath()
        context.ellipse(0, 0, layer * 2.8, layer, 0, 0, Math.PI * 2)
        context.fill()
      }
      context.restore()
    }
  } else if (id === 'earth') {
    context.fillStyle = '#154878'
    context.fillRect(0, 0, 1024, 512)
    context.fillStyle = '#64865b'
    for (let region = 0; region < 24; region++) {
      context.beginPath()
      context.ellipse(random() * 1024, 80 + random() * 350, 20 + random() * 55, 10 + random() * 50, random() * 3, 0, Math.PI * 2)
      context.fill()
    }
  } else {
    for (let crater = 0; crater < 2400; crater++) {
      const horizontal = random() * 1024
      const vertical = random() * 512
      const radius = random() * (id === 'mars' ? 40 : 14) + 1
      context.fillStyle = id === 'mars' ? (random() > .5 ? '#764233' : '#e6a179') : (random() > .5 ? '#585858' : '#ded6c8')
      context.globalAlpha = .06 + random() * .15
      context.beginPath()
      context.ellipse(horizontal, vertical, radius * 1.4, radius, 0, 0, Math.PI * 2)
      context.fill()
      if (radius < 10) {
        context.strokeStyle = '#292929'
        context.lineWidth = 1
        context.stroke()
      }
    }
    if (id === 'mars') {
      context.globalAlpha = .8
      context.fillStyle = '#e4d9cd'
      context.fillRect(0, 0, 1024, 15)
    }
  }
  context.globalAlpha = .05
  for (let grain = 0; grain < 18000; grain++) {
    context.fillStyle = random() > .5 ? '#ffffff' : '#000000'
    context.fillRect(random() * 1024, random() * 512, 2, 1)
  }
  const texture = new CanvasTexture(canvas)
  texture.colorSpace = SRGBColorSpace
  texture.wrapS = RepeatWrapping
  return texture
}

export function makeGlow(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = canvas.height = 256
  const context = canvas.getContext('2d')!
  const gradient = context.createRadialGradient(128, 128, 8, 128, 128, 128)
  gradient.addColorStop(0, 'rgba(255,244,193,0.9)')
  gradient.addColorStop(.25, 'rgba(255,178,59,0.5)')
  gradient.addColorStop(.45, 'rgba(255,113,20,0.14)')
  gradient.addColorStop(1, 'rgba(255,100,10,0)')
  context.fillStyle = gradient
  context.fillRect(0, 0, 256, 256)
  return new CanvasTexture(canvas)
}

export function makeClouds(): CanvasTexture {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 512
  const context = canvas.getContext('2d')!
  const random = randomSource(42)
  context.filter = 'blur(3px)'
  for (let cloud = 0; cloud < 650; cloud++) {
    context.fillStyle = `rgba(255,255,255,${random() * .5})`
    const horizontal = random() * 1024
    const vertical = random() * 512
    const width = 5 + random() * 45
    const height = 2 + random() * 9
    for (const offset of [-1024, 0, 1024]) {
      context.beginPath()
      context.ellipse(horizontal + offset, vertical, width, height, -.25, 0, Math.PI * 2)
      context.fill()
    }
  }
  const texture = new CanvasTexture(canvas)
  texture.wrapS = RepeatWrapping
  return texture
}