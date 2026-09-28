import { useEffect, useMemo, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { ErrorBoundary } from './components/ErrorBoundary'
import { WebGLFallback } from './components/ui/WebGLFallback'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { SolarSystemScene } from './scenes/SolarSystemScene'
import { Header } from './components/ui/Header'
import { TimeControls } from './components/ui/TimeControls'
import { PlanetPanel } from './components/ui/PlanetPanel'
import { SettingsPanel } from './components/ui/SettingsPanel'
import { WhatIfPanel } from './components/ui/WhatIfPanel'
import { ExploreLearn } from './components/ui/ExploreLearn'
import { TourControls } from './components/ui/TourControls'
import { MissionControl } from './components/ui/MissionControl'
import { RandomFactCard } from './components/ui/RandomFactCard'
import { Toast } from './components/ui/Toast'
import { useKeyboardControls } from './hooks/useKeyboardControls'
import { useAmbientAudio } from './hooks/useAmbientAudio'
import { useSimulationStore } from './store/simulationStore'

function detectWebGL(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

function WelcomeMessage() {
  const [dismissed, setDismissed] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setDismissed(true), 5500)
    return () => clearTimeout(timer)
  }, [])

  if (dismissed) return null

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.6 }}
      className="pointer-events-none absolute left-1/2 top-6 -translate-x-1/2 text-center"
    >
      <p className="text-glow text-xl font-semibold text-white sm:text-2xl">Welcome to the Solar System</p>
      <p className="mt-1 text-sm text-white/70">Drag to explore • Click a planet to learn • Start a mission</p>
    </motion.div>
  )
}

export default function App() {
  const [webglSupported] = useState(detectWebGL)
  const [minTimeElapsed, setMinTimeElapsed] = useState(false)
  const [sceneReady, setSceneReady] = useState(false)

  useKeyboardControls()
  useAmbientAudio()

  useEffect(() => {
    const timer = setTimeout(() => setMinTimeElapsed(true), 1300)
    return () => clearTimeout(timer)
  }, [])

  const isSpacecraftMode = useSimulationStore((s) => s.isSpacecraftMode)
  const isTourActive = useSimulationStore((s) => s.isTourActive)

  const loadingProgress = useMemo(() => {
    if (minTimeElapsed && sceneReady) return 1
    if (minTimeElapsed || sceneReady) return 0.65
    return 0.15
  }, [sceneReady, minTimeElapsed])

  const showLoading = !(minTimeElapsed && sceneReady)

  if (!webglSupported) {
    return <WebGLFallback />
  }

  return (
    <div className="relative h-full w-full overflow-hidden bg-space-black">
      <ErrorBoundary fallback={<WebGLFallback />} onError={() => setSceneReady(true)}>
        <SolarSystemScene onFirstFrame={() => setSceneReady(true)} />

        <div className="pointer-events-none absolute inset-0 z-10 flex flex-col justify-between">
          <Header />

          <div className="relative flex-1">
            <AnimatePresence>{!showLoading && <WelcomeMessage />}</AnimatePresence>

            <div className="pointer-events-none absolute inset-x-0 top-20 z-30 flex justify-center px-4">
              <Toast />
            </div>
            <div className="pointer-events-none absolute inset-x-0 top-32 z-30 flex justify-center px-4 sm:top-20">
              <RandomFactCard />
            </div>

            <div className="pointer-events-none absolute inset-x-0 bottom-0 z-20 flex justify-center sm:inset-y-4 sm:right-4 sm:left-auto sm:items-start sm:justify-end">
              <PlanetPanel />
              <SettingsPanel />
              <WhatIfPanel />
            </div>

            <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-4">
              <ExploreLearn />
            </div>

            {isSpacecraftMode && (
              <div className="pointer-events-none absolute bottom-4 left-4 z-20">
                <MissionControl />
              </div>
            )}

            {isTourActive && (
              <div className="pointer-events-none absolute inset-x-0 bottom-6 z-20 flex justify-center">
                <TourControls />
              </div>
            )}
          </div>

          {!isSpacecraftMode && !isTourActive && (
            <div className="pointer-events-none flex justify-center px-3 pb-4 sm:pb-6">
              <div className="w-full max-w-4xl">
                <TimeControls />
              </div>
            </div>
          )}
        </div>
      </ErrorBoundary>

      <AnimatePresence>{showLoading && <LoadingScreen progress={loadingProgress} />}</AnimatePresence>
    </div>
  )
}
