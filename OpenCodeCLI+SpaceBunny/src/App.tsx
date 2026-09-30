import { Suspense, lazy, useEffect, useMemo, useState } from 'react'
import { AnimatePresence } from 'framer-motion'
import { Canvas } from '@react-three/fiber'
import * as THREE from 'three'
import { SceneRoot } from './components/three/SceneRoot'
import { Header } from './components/ui/Header'
import { TimeControls } from './components/ui/TimeControls'
import { PlanetNav } from './components/ui/PlanetNav'
import { PlanetPanel } from './components/ui/PlanetPanel'
import { LearnPanel } from './components/ui/LearnPanel'
import { WhatIfPanel } from './components/ui/WhatIfPanel'
import { MissionControl } from './components/ui/MissionControl'
import { SettingsPanel } from './components/ui/SettingsPanel'
import { TourControls } from './components/ui/TourControls'
import { useTourDriver } from './hooks/useTourDriver'
import { FactCard } from './components/ui/FactCard'
import { IntroOverlay } from './components/ui/IntroOverlay'
import { HelpOverlay } from './components/ui/HelpOverlay'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { EasterEggs, FlareFlash } from './components/ui/EasterEggs'
import { Tooltip } from './components/ui/primitives/Overlays'
import { useKeyboardControls } from './hooks/useKeyboardControls'
import { useTexturePreloader } from './hooks/useTexturePreloader'
import { useAppStore } from './store/useAppStore'
import { detectWebGL } from './utils/webgl'
import { resolveBodyName, resolveBodyType } from './utils/astronomy'
import { spaceAudio } from './utils/audio'

const WebGLFallback = lazy(() =>
  import('./components/ui/WebGLFallback').then((m) => ({ default: m.WebGLFallback })),
)

export default function App() {
  const webgl = useMemo(() => detectWebGL(), [])
  return webgl.supported ? <SolarSystemApp /> : <WebGLFallback />
}

function SolarSystemApp() {
  const [booted, setBooted] = useState(false)
  const { progress, ready } = useTexturePreloader(true)

  // The canvas is only created once the first textures exist, so the loading
  // screen is never competing with shader compilation.
  const mountCanvas = progress > 0.08

  useKeyboardControls()
  useTourDriver()

  const soundEnabled = useAppStore((s) => s.soundEnabled)
  useEffect(() => {
    void spaceAudio.setEnabled(soundEnabled)
  }, [soundEnabled])

  return (
    <div className="relative h-full w-full overflow-hidden bg-void">
      <a href="#scene-controls" className="skip-link">
        Skip to the scene controls
      </a>

      {mountCanvas && (
        <Canvas
          className="absolute inset-0"
          dpr={[1, 2]}
          gl={{
            antialias: false,
            alpha: false,
            powerPreference: 'high-performance',
            preserveDrawingBuffer: false,
          }}
          camera={{ fov: 45, near: 0.05, far: 20000, position: [0, 90, 260] }}
          onCreated={({ gl, scene }) => {
            gl.toneMapping = THREE.ACESFilmicToneMapping
            gl.toneMappingExposure = 1.2
            scene.matrixWorldAutoUpdate = true
            setBooted(true)
          }}
          onPointerMissed={() => {
            useAppStore.getState().setHovered(null)
          }}
        >
          <Suspense fallback={null}>
            <SceneRoot />
          </Suspense>
        </Canvas>
      )}

      {/* Interface layer */}
      <div className="pointer-events-none absolute inset-0 z-10">
        <Header />
        <PlanetNav />
        <TimeControls />
        <TourControls />
        <FactCard />
        <EasterEggs />
        <FlareFlash />
        <PointerTooltip />
        <div id="scene-controls" className="contents">
          <PlanetPanel />
          <LearnPanel />
          <WhatIfPanel />
          <MissionControl />
          <SettingsPanel />
        </div>
        <HelpOverlay />
        <IntroOverlay />
      </div>

      <AnimatePresence>
        {(!ready || !booted) && (
          <LoadingScreen key="loading" progress={progress} ready={ready && booted} />
        )}
      </AnimatePresence>
    </div>
  )
}

/** Hover tooltip that follows the pointer over planets and moons. */
function PointerTooltip() {
  const hoveredId = useAppStore((s) => s.hoveredId)
  const pointer = useAppStore((s) => s.hoveredPointer)
  const tourActive = useAppStore((s) => s.tourActive)
  const introVisible = useAppStore((s) => s.introVisible)
  const panelOpen = useAppStore((s) => s.panel !== null)

  const visible = hoveredId !== null && !tourActive && !introVisible && !panelOpen

  // Keep the tooltip inside the viewport on small screens.
  const x = Math.min(Math.max(pointer.x, 90), window.innerWidth - 90)
  const y = Math.max(pointer.y, 110)

  return (
    <Tooltip
      name={hoveredId ? resolveBodyName(hoveredId) : ''}
      detail={hoveredId ? resolveBodyType(hoveredId) : ''}
      x={x}
      y={y}
      visible={visible}
    />
  )
}