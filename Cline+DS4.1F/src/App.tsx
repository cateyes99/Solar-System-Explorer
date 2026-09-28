import { useEffect } from 'react'
import { SolarSystemScene } from './scenes/SolarSystemScene'
import { Header } from './components/ui/Header'
import { BottomBar } from './components/ui/BottomBar'
import { SimulationControls } from './components/ui/SimulationControls'
import { PlanetPanel } from './components/ui/PlanetPanel'
import { SettingsPanel } from './components/ui/SettingsPanel'
import { EducationPanel } from './components/ui/EducationPanel'
import { WhatIfPanel } from './components/ui/WhatIfPanel'
import { MissionControl } from './components/ui/MissionControl'
import { TourControls } from './components/ui/TourControls'
import { FactCard } from './components/ui/FactCard'
import { Toast } from './components/ui/Toast'
import { Announcer } from './components/ui/Announcer'
import { HelpPanel, WelcomeOverlay } from './components/ui/Overlays'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { Fallback2D } from './components/ui/Fallback2D'
import { CanvasErrorBoundary } from './components/ui/CanvasErrorBoundary'
import { useAssetPreloader } from './hooks/useAssetPreloader'
import { useKeyboardControls } from './hooks/useKeyboardControls'
import { detectWebGL } from './utils/webgl'
import { useSimulationStore } from './store/simulationStore'

/**
 * The whole experience.
 *
 * Layout is a full-screen 3D viewport with floating glass panels on top: the
 * navigation at the top, scale/layers/camera on the left, information on the
 * right, and time plus quick travel along the bottom. Every panel is a drawer on
 * desktop and a bottom sheet on phones.
 */
export default function App() {
  const webglSupported = useSimulationStore((state) => state.webglSupported)
  const ready = useSimulationStore((state) => state.ready)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  const setWebglSupported = useSimulationStore((state) => state.setWebglSupported)
  const setReady = useSimulationStore((state) => state.setReady)
  const setAssetsProgress = useSimulationStore((state) => state.setAssetsProgress)

  // Textures are generated before the scene mounts, with progress on screen.
  useAssetPreloader()
  useKeyboardControls()

  useEffect(() => {
    const capability = detectWebGL()
    setWebglSupported(capability.supported)
    if (!capability.supported) {
      // Nothing to generate for the 2D view: go straight to it.
      setAssetsProgress(1, 'Showing the simplified view')
      setReady(true)
    }
  }, [setWebglSupported, setReady, setAssetsProgress])

  useEffect(() => {
    document.documentElement.dataset.reducedMotion = reducedMotion ? 'true' : 'false'
  }, [reducedMotion])

  const showScene = webglSupported === true

  return (
    <div className="relative h-full w-full overflow-hidden bg-void text-parchment">
      {showScene ? (
        <div className="absolute inset-0">
          <CanvasErrorBoundary>
            {ready ? <SolarSystemScene /> : null}
          </CanvasErrorBoundary>
        </div>
      ) : null}

      {webglSupported === false ? <Fallback2D /> : null}

      {showScene && ready ? (
        <>
          <Header />
          <SimulationControls />
          {/* The bottom bar paints before the sheets so that on phones a sheet
              slides over the HUD instead of being hidden behind it. */}
          <BottomBar />
          <PlanetPanel />
          <TourControls />
          <SettingsPanel />
          <EducationPanel />
          <WhatIfPanel />
          <MissionControl />
          <FactCard />
          <Toast />
          <WelcomeOverlay />
          <HelpPanel />
        </>
      ) : null}

      <Announcer />
      <LoadingScreen />
    </div>
  )
}