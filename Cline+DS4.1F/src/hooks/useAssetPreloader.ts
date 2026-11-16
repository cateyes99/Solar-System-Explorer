import { useEffect } from 'react'
import { ensureTextures, textureBuildTarget } from '../utils/textures'
import { useSimulationStore } from '../store/simulationStore'

/**
 * Builds the surface maps before the scene mounts, and rebuilds them when the
 * viewer changes the graphics quality or enters/leaves Solo Earth mode.
 *
 * The first build owns the full loading screen, because the scene is not mounted
 * yet. A later build is triggered by the quality selector or by Solo Earth mode:
 * the maps are swapped in place while the scene stays mounted, so only a light
 * overlay is shown and the camera, the simulated date and the spacecraft all
 * keep their state. In Solo Earth mode only Earth's maps (and the sky) are
 * built, and the rest are released, so the mode genuinely offloads them.
 * `ensureTextures` coalesces duplicate requests, so React's development
 * double-render cannot start the work twice.
 */
export function useAssetPreloader(): void {
  const quality = useSimulationStore((state) => state.quality)
  const soloEarth = useSimulationStore((state) => state.soloEarth)

  useEffect(() => {
    const scope = soloEarth ? 'earth' : 'all'
    if (textureBuildTarget() === null) {
      useSimulationStore.getState().setAssetsProgress(0, 'loading.preparing')
    } else {
      useSimulationStore.getState().setRebuilding(true)
    }

    let cancelled = false
    ensureTextures(scope, quality, (progress) => {
      useSimulationStore.getState().setAssetsProgress(progress.ratio, progress.label)
    })
      .then(() => {
        if (cancelled) return
        const state = useSimulationStore.getState()
        state.setAssetsProgress(1, 'loading.ready')
        state.setRebuilding(false)
        state.setSystemTexturesReady(scope === 'all')
        state.setReady(true)
      })
      .catch((error: unknown) => {
        if (cancelled) return
        // Never leave the visitor on the loading screen: show the system with
        // whatever textures exist (there is a fallback texture in the cache).
        const state = useSimulationStore.getState()
        state.setAssetsProgress(1, 'loading.flightControls')
        state.setRebuilding(false)
        state.setSystemTexturesReady(scope === 'all')
        state.setReady(true)
        if (import.meta.env.DEV) {
          window.console.warn('Texture generation failed', error)
        }
      })

    return () => {
      cancelled = true
    }
  }, [quality, soloEarth])
}
