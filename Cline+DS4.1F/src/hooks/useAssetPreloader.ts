import { useEffect } from 'react'
import { generateTextures } from '../utils/textures'
import { useSimulationStore } from '../store/simulationStore'

/**
 * Generates every procedural texture once, before the 3D scene mounts, and
 * reports progress to the loading screen.
 *
 * Guarded by a module flag so React's development double-render (and a strict
 * mode remount) can never start the work twice.
 */
let generationStarted = false

export function useAssetPreloader(): void {
  useEffect(() => {
    if (generationStarted) return
    generationStarted = true

    const { setAssetsProgress, setReady, quality } = useSimulationStore.getState()

    generateTextures(quality, (progress) => {
      setAssetsProgress(progress.ratio, progress.label)
    })
      .then(() => {
        setAssetsProgress(1, 'Ready for launch')
        setReady(true)
      })
      .catch((error: unknown) => {
        // Never leave the visitor on the loading screen: show the system with
        // whatever textures exist (there is a fallback texture in the cache).
        setAssetsProgress(1, 'Flight controls ready')
        setReady(true)
        if (import.meta.env.DEV) {
          // Surface the reason in development, but keep production quiet.
          window.console.warn('Texture generation failed', error)
        }
      })
  }, [])
}