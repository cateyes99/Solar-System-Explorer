import { Suspense, useEffect, useState } from 'react'
import { SolarSystemScene } from './scenes/SolarSystemScene'
import { SceneErrorBoundary } from './components/SceneErrorBoundary'
import { Header } from './components/ui/Header'
import { TimeControls } from './components/ui/TimeControls'
import { PlanetPanel } from './components/ui/PlanetPanel'
import { TourControls } from './components/ui/TourControls'
import { MissionControl } from './components/ui/MissionControl'
import { SettingsPanel } from './components/ui/SettingsPanel'
import { LearnPanel } from './components/ui/LearnPanel'
import { WhatIfPanel } from './components/ui/WhatIfPanel'
import { RandomFactCard } from './components/ui/RandomFactCard'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { Fallback2D } from './components/ui/Fallback2D'
import { HoverTooltip, ShortcutsModal, Toasts, WelcomeOverlay } from './components/ui/Overlays'
import { useSimStore } from './store/simulationStore'
import { useKeyboardControls } from './hooks/useKeyboardControls'
import { useSimulationTime } from './hooks/useSimulationTime'
import { LabelOverlay } from './components/ui/LabelOverlay'
import { generateSceneTextures, type SceneTextures } from './utils/textures'
import { setSceneTextures } from './utils/sceneTextures'
import { startAmbient, stopAmbient } from './utils/audio'

/** WebGL capability check — runs before we ever mount the 3D scene. */
function isWebGLAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext('webgl2') ?? canvas.getContext('webgl')),
    )
  } catch {
    return false
  }
}

/** Generated once for the whole session (survives React StrictMode double-mount). */
let texturesPromise: Promise<SceneTextures> | null = null

function loadTextures(): Promise<SceneTextures> {
  if (!texturesPromise) {
    texturesPromise = generateSceneTextures((done, total) => {
      useSimStore.getState().setBootProgress(done / total)
    })
  }
  return texturesPromise
}

export default function App() {
  const bootProgress = useSimStore((s) => s.bootProgress)
  const bootComplete = useSimStore((s) => s.bootComplete)
  const reducedMotion = useSimStore((s) => s.reducedMotion)
  const soundOn = useSimStore((s) => s.soundOn)
  const [webgl] = useState(isWebGLAvailable)

  useKeyboardControls()
  useSimulationTime()

  // Procedural texture generation with progress reporting
  useEffect(() => {
    if (!webgl) return
    let cancelled = false
    loadTextures()
      .then((textures) => {
        if (cancelled) return
        setSceneTextures(textures)
        useSimStore.getState().finishBoot()
      })
      .catch((error: unknown) => {
        console.error('Failed to generate scene textures:', error)
        if (!cancelled) useSimStore.getState().finishBoot()
      })
    return () => {
      cancelled = true
    }
  }, [webgl])

  // Honour the system / user reduced-motion preference
  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion)
  }, [reducedMotion])

  // Ambient audio only ever starts after an explicit toggle (off by default)
  useEffect(() => {
    if (soundOn) startAmbient()
    else stopAmbient()
    return () => {
      if (soundOn) stopAmbient()
    }
  }, [soundOn])

  if (!webgl) {
    return <Fallback2D reason="webgl" />
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-space-950">
      <a className="skip-link chip" href="#scene-controls">
        Skip to controls
      </a>

      <main id="scene" className="absolute inset-0" aria-label="Interactive 3D Solar System">
        {bootComplete ? (
          <SceneErrorBoundary fallback={<Fallback2D reason="error" />}>
            <Suspense fallback={<LoadingScreen progress={bootProgress} />}>
              <SolarSystemScene />
            </Suspense>
          </SceneErrorBoundary>
        ) : (
          <LoadingScreen progress={bootProgress} />
        )}
      </main>

      <div id="scene-controls" tabIndex={-1}>
        <Header />
        <TimeControls />
        <PlanetPanel />
        <TourControls />
        <MissionControl />
        <SettingsPanel />
        <LearnPanel />
        <WhatIfPanel />
        <RandomFactCard />
        <Toasts />
        <HoverTooltip />
        <WelcomeOverlay />
        <ShortcutsModal />
      </div>

      {/* Body names projected from 3D space (rendered above the canvas,
          below every HUD panel) */}
      <LabelOverlay />
    </div>
  )
}
