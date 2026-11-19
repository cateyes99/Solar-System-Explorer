import { lazy, Suspense, useEffect, useMemo } from 'react'
import { AnimatePresence } from 'framer-motion'

const SolarSystemCanvas = lazy(() => import('./components/3d/SolarSystemCanvas').then((module) => ({ default: module.SolarSystemCanvas })))
const LearnPanel = lazy(() => import('./components/education/LearnPanel').then((module) => ({ default: module.LearnPanel })))
import { SceneErrorBoundary, WebGLFallback } from './components/WebGLFallback'
import { canUseWebGL } from './utils/webgl'
import { Header } from './components/ui/Header'
import { PlanetNavigator } from './components/ui/PlanetNavigator'
import { PlanetPanel } from './components/ui/PlanetPanel'
import { TimeControls } from './components/ui/TimeControls'
import { DiscoveryDock } from './components/ui/DiscoveryDock'
import { ScaleButton, ScalePanel } from './components/ui/ScaleControls'
import { MissionControl } from './components/ui/MissionControl'
import { TourControls } from './components/ui/TourControls'
import { SettingsPanel } from './components/ui/SettingsPanel'
import { ShortcutsPanel } from './components/ui/ShortcutsPanel'
import { FactCard } from './components/ui/FactCard'
import { WhatIfBanner, WhatIfPanel } from './components/ui/WhatIfPanel'
import { SceneHeading, Toast, ViewSystemButton, WelcomeMessage } from './components/ui/SceneOverlays'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { useKeyboardControls } from './hooks/useKeyboardControls'
import { useAmbientAudio } from './hooks/useAmbientAudio'
import { useSimulationStore } from './store/simulationStore'

export default function App() {
  const sceneReady = useSimulationStore((state) => state.sceneReady)
  const setSceneReady = useSimulationStore((state) => state.setSceneReady)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  const setReducedMotion = useSimulationStore((state) => state.setReducedMotion)
  const activeModal = useSimulationStore((state) => state.activeModal)
  const webglAvailable = useMemo(() => canUseWebGL(), [])
  useKeyboardControls()
  useAmbientAudio()

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = String(reducedMotion)
  }, [reducedMotion])

  useEffect(() => {
    const media = window.matchMedia('(prefers-reduced-motion: reduce)')
    const update = () => { if (media.matches) setReducedMotion(true) }
    media.addEventListener('change', update)
    return () => media.removeEventListener('change', update)
  }, [setReducedMotion])

  return (
    <div className="app-shell">
      <a className="skip-link" href="#explorer-controls">Skip to explorer controls</a>
      <Header />
      <main className="experience" aria-label="Interactive Solar System explorer">
        <p className="sr-only">Use the destination buttons to visit planets. Drag the scene to rotate, scroll or pinch to zoom, and double-click a world to focus. All information is also available as accessible HTML.</p>
        <div className="scene-container">
          {webglAvailable
            ? <SceneErrorBoundary onError={() => setSceneReady(true)}><Suspense fallback={null}><SolarSystemCanvas /></Suspense></SceneErrorBoundary>
            : <WebGLFallback />}
        </div>
        <SceneHeading />
        <WelcomeMessage />
        <WhatIfBanner />
        <PlanetNavigator />
        <ViewSystemButton />
        <PlanetPanel />
        <DiscoveryDock />
        <MissionControl />
        <TourControls />
        <div id="explorer-controls"><ScaleButton /><TimeControls /></div>
        <Toast />
      </main>
      <Suspense fallback={null}>{activeModal === 'learn' && <LearnPanel />}</Suspense>
      <WhatIfPanel />
      <ScalePanel />
      <SettingsPanel />
      <ShortcutsPanel />
      <FactCard />
      <AnimatePresence>{!sceneReady && <LoadingScreen />}</AnimatePresence>
    </div>
  )
}
