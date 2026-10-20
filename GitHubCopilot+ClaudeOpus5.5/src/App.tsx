import { MotionConfig } from 'framer-motion'
import { lazy, Suspense, useEffect, useState } from 'react'
import { AudioManager } from './components/ui/AudioManager'
import { ErrorBoundary } from './components/ui/ErrorBoundary'
import { FactCard } from './components/ui/FactCard'
import { Fallback2D } from './components/ui/Fallback2D'
import { Header } from './components/ui/Header'
import { HelpDialog } from './components/ui/HelpDialog'
import { LearnPanel } from './components/ui/LearnPanel'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { MissionControl } from './components/ui/MissionControl'
import { PlanetPanel } from './components/ui/PlanetPanel'
import { PlanetLabels } from './components/ui/PlanetLabels'
import { ScaleBadge } from './components/ui/ScaleBadge'
import { SettingsPanel } from './components/ui/SettingsPanel'
import { SimulationControls } from './components/ui/SimulationControls'
import { TimeControls } from './components/ui/TimeControls'
import { Toasts } from './components/ui/Toasts'
import { Tooltip } from './components/ui/Tooltip'
import { TourControls } from './components/ui/TourControls'
import { WelcomeMessage } from './components/ui/WelcomeMessage'
import { WhatIfPanel } from './components/ui/WhatIfPanel'
import { useKeyboardControls } from './hooks/useKeyboardControls'
import { useSimulationStore } from './store/simulationStore'
import { isWebGLAvailable } from './utils/webgl'

const SolarSystemScene = lazy(() => import('./scenes/SolarSystemScene'))

function SceneLayer() {
  const renderMode = useSimulationStore((s) => s.renderMode)
  const [failure, setFailure] = useState<string | null>(null)

  useEffect(() => {
    if (!isWebGLAvailable()) {
      setFailure('WebGL is not available in this browser.')
      useSimulationStore.getState().switchTo2D()
      return
    }
    useSimulationStore.getState().setLoad(0.08, 'Loading the 3D engine…')
  }, [])

  if (renderMode === '2d') return <Fallback2D reason={failure ?? 'The 3D view stopped working.'} />

  return (
    <ErrorBoundary
      fallback={(error) => <FallbackSwitch reason={error.message} onReady={setFailure} />}
    >
      <Suspense fallback={null}>
        <SolarSystemScene />
      </Suspense>
    </ErrorBoundary>
  )
}

function FallbackSwitch({ reason, onReady }: { reason: string; onReady: (reason: string) => void }) {
  useEffect(() => {
    onReady(reason)
    useSimulationStore.getState().switchTo2D()
  }, [reason, onReady])
  return null
}

export default function App() {
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)
  useKeyboardControls()

  useEffect(() => {
    document.documentElement.classList.toggle('reduce-motion', reducedMotion)
  }, [reducedMotion])

  return (
    <MotionConfig reducedMotion={reducedMotion ? 'always' : 'never'}>
      <main className="relative h-full w-full overflow-hidden bg-space-950 select-none" aria-label="Solar System Explorer">
        <h1 className="sr-only">Solar System Explorer – an interactive 3D model of our Solar System</h1>
        <div className="absolute inset-0">
          <SceneLayer />
        </div>
        <PlanetLabels />
        <WelcomeMessage />
        <Header />
        <ScaleBadge />
        <SimulationControls />
        <TimeControls />
        <PlanetPanel />
        <LearnPanel />
        <WhatIfPanel />
        <MissionControl />
        <TourControls />
        <Tooltip />
        <Toasts />
        <FactCard />
        <SettingsPanel />
        <HelpDialog />
        <AudioManager />
      </main>
      <LoadingScreen />
    </MotionConfig>
  )
}
