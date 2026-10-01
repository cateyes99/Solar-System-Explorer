import { useEffect, useState } from 'react'
import { MOONS, PLANETS } from '../data/planets'
import {
  createSpaceBackdrop,
  getBodyTexture,
  getCoronaTexture,
  getEarthAlbedo,
  getEarthClouds,
  getEarthNightTexture,
  getMoonGreyTexture,
  getRingTexture,
} from '../utils/textures'
import { loadRealTexture, moonIdsWithImagery, planetIdsWithImagery } from '../utils/imageTextures'

export interface LoadState {
  progress: number
  ready: boolean
}

/**
 * Warms every texture before the orrery appears, so nothing pops in mid-flight.
 *
 * Real NASA imagery is fetched over HTTP and is the bulk of the wait; the
 * remaining procedural textures are generated on a canvas, yielding to the
 * browser between each one so the loading animation keeps animating. Progress is
 * real: it counts actual completed steps.
 */
export function useTexturePreloader(enabled: boolean): LoadState {
  const [progress, setProgress] = useState(0)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    if (!enabled || ready) return
    let cancelled = false

    const yieldToBrowser = () =>
      new Promise<void>((resolve) => {
        if (typeof requestAnimationFrame === 'function') requestAnimationFrame(() => resolve())
        else setTimeout(resolve, 0)
      })

    const run = async () => {
      // 1. Real imagery. These are independent, so fetch them together.
      const realIds = [...planetIdsWithImagery(), ...moonIdsWithImagery()]
      if (!cancelled) setProgress(0.05)
      await Promise.all(realIds.map((id) => loadRealTexture(id)))
      if (cancelled) return

      // 2. Everything still procedural, plus the derived maps.
      const tasks: { label: string; run: () => void }[] = [
        { label: 'background', run: () => createSpaceBackdrop() },
        { label: 'sun', run: () => getBodyTexture('sun') },
        { label: 'corona', run: () => getCoronaTexture() },
        ...PLANETS.map((planet) => ({
          label: planet.id,
          run: () => {
            // Only bodies without real imagery need the canvas version.
            if (!realIds.includes(planet.id)) getBodyTexture(planet.id)
            getRingTexture(planet.id)
          },
        })),
        { label: 'earth-maps', run: () => getEarthAlbedo() },
        { label: 'earth-clouds', run: () => getEarthClouds() },
        { label: 'earth-night', run: () => getEarthNightTexture() },
        ...MOONS.map((moon) => ({
          label: moon.id,
          run: () => {
            // Earth's Moon is reached through getBodyTexture; the rest are painted
            // on demand by getMoonGreyTexture when they have no real imagery.
            if (!realIds.includes(moon.id) && moon.id !== 'luna') getMoonGreyTexture(moon.id)
          },
        })),
      ]

      for (let i = 0; i < tasks.length; i += 1) {
        if (cancelled) return
        tasks[i].run()
        setProgress(0.05 + (0.95 * (i + 1)) / tasks.length)
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
