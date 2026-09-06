import { useEffect, useState } from 'react'
import { SolarSystemScene } from './scenes/SolarSystemScene'
import { Header } from './components/ui/Header'
import { Tooltip } from './components/ui/Tooltip'
import { TimeControls } from './components/ui/TimeControls'
import { PlanetPanel } from './components/ui/PlanetPanel'
import { ExploreLearn } from './components/ui/ExploreLearn'
import { WhatIfPanel } from './components/ui/WhatIfPanel'
import { MissionControl } from './components/ui/MissionControl'
import { SettingsPanel } from './components/ui/SettingsPanel'
import { TourControls } from './components/ui/TourControls'
import { FactCard } from './components/ui/FactCard'
import { Toasts } from './components/ui/Toasts'
import { WelcomeOverlay } from './components/ui/WelcomeOverlay'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { FallbackScreen } from './components/ui/FallbackScreen'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { useAppKeyboard } from './hooks/useKeyboardControls'
import { useSimulation } from './store/simulationStore'
import { hasWebGLSupport } from './utils/webgl'

function Scene(): JSX.Element {
  return (
    <ErrorBoundary fallback={<FallbackScreen />}>
      <SolarSystemScene />
    </ErrorBoundary>
  )
}

export default function App(): JSX.Element {
  const [webglOk] = useState(hasWebGLSupport)
  const reduceMotion = useSimulation((s) => s.reduceMotion)
  useAppKeyboard()

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = reduceMotion ? 'true' : 'false'
  }, [reduceMotion])

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-space-950 font-body text-white">
      {webglOk ? (
        <>
          <Scene />
          <Header />
          <TimeControls />
          <Tooltip />
          <PlanetPanel />
          <ExploreLearn />
          <WhatIfPanel />
          <MissionControl />
          <SettingsPanel />
          <TourControls />
          <FactCard />
          <Toasts />
          <WelcomeOverlay />
          <LoadingScreen />
        </>
      ) : (
        <FallbackScreen />
      )}
    </div>
  )
}
