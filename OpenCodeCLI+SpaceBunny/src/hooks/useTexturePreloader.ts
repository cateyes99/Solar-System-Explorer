import { useEffect, useState } from 'react'
import { PLANETS, SUN } from '../data/planets'
import {
  createSpaceBackdrop,
  getBodyTexture,
  getCoronaTexture,
  getEarthAlbedo,
  getEarthClouds,
  getEarthNightTexture,
  getRingTexture,
} from '../utils/textures'

export interface LoadState {
  progress: number
  ready: boolean
}

/**
 * Generates every procedural texture up front, yielding to the browser between
 * each one so the loading animation keeps animating. Progress is real, not faked.
 */
export function useTexturePreloader(enabled: boolean): LoadState {
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!enabled || ready) return
    let cancelled = false

    const tasks: { label: string; run: () => void }[] = [
      { label: 'background', run: () => createSpaceBackdrop() },
      { label: 'sun', run: () => getBodyTexture('sun') },
      { label: 'corona', run: () => getCoronaTexture() },
      ...PLANETS.map((planet) => ({
        label: planet.id,
        run: () => {
          getBodyTexture(planet.id)
          getRingTexture(planet.id)
        },
      })),
      { label: 'earth-maps', run: () => getEarthAlbedo() },
      { label: 'earth-clouds', run: () => getEarthClouds() },
      { label: 'earth-night', run: () => getEarthNightTexture() },
      { label: 'moon', run: () => getBodyTexture('moon') },
    ]

    const yieldToBrowser = () =>
      new Promise<void>((resolve) => {
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve())
        else setTimeout(resolve, 0)
      })

    const run = async () => {
      for (let i = 0; i < tasks.length; i += 1) {
        if (cancelled) return
        tasks[i].run()
        setProgress((i + 1) / tasks.length)
        await yieldToBrowser()
      }
      if (!cancelled) setReady(true)
    }

    void run()
    return () => {
      cancelled = true
    }
  }, [enabled, ready])

  return { progress, ready }
}

export const SUN_NAME = SUN.name