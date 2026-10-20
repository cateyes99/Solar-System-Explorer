import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import { useEffect, useRef, useState } from 'react'
import { ACESFilmicToneMapping, SRGBColorSpace } from 'three'
import { CameraController } from '../components/3d/CameraController'
import { Effects } from '../components/3d/Effects'
import { LabelManager } from '../components/3d/LabelManager'
import { SolarSystem } from '../components/3d/SolarSystem'
import { TexturesContext } from '../components/3d/shared'
import { generateTextures, type TextureSet } from '../graphics/textures'
import { useSimulationStore, type Quality } from '../store/simulationStore'

const MAX_DPR: Record<Quality, number> = { high: 2, balanced: 1.5, low: 1 }

function ReadySignal() {
  const frames = useRef(0)
  useFrame(() => {
    frames.current += 1
    if (frames.current === 3) useSimulationStore.getState().setSceneReady()
  })
  return null
}

function SceneCanvas({ textures, onContextLost }: { textures: TextureSet; onContextLost: () => void }) {
  const quality = useSimulationStore((s) => s.quality)
  const [performanceScale, setPerformanceScale] = useState(1)
  const deviceDpr = typeof window === 'undefined' ? 1 : window.devicePixelRatio || 1
  const dpr = Math.max(0.75, Math.min(deviceDpr, MAX_DPR[quality]) * performanceScale)

  return (
    <Canvas
      className="!absolute inset-0"
      dpr={dpr}
      camera={{ fov: 50, near: 0.1, far: 30000, position: [-380, 420, 900] }}
      gl={{ antialias: true, powerPreference: 'high-performance', alpha: false, stencil: false }}
      onCreated={({ gl }) => {
        gl.toneMapping = ACESFilmicToneMapping
        gl.outputColorSpace = SRGBColorSpace
        gl.setClearColor('#02030a', 1)
        gl.domElement.addEventListener('webglcontextlost', (event) => {
          event.preventDefault()
          onContextLost()
        })
      }}
      onPointerMissed={() => useSimulationStore.getState().hover(null)}
      aria-label="Interactive 3D model of the Solar System"
      role="img"
    >
      <PerformanceMonitor
        onChange={({ factor }) => setPerformanceScale(0.6 + factor * 0.4)}
        flipflops={4}
        onFallback={() => setPerformanceScale(0.6)}
      />
      <TexturesContext.Provider value={textures}>
        <SolarSystem />
      </TexturesContext.Provider>
      <CameraController />
      <LabelManager />
      <Effects />
      <ReadySignal />
    </Canvas>
  )
}

/** Loaded lazily: generates procedural textures, then mounts the WebGL canvas. */
export default function SolarSystemScene() {
  const [textures, setTextures] = useState<TextureSet | null>(null)
  const [error, setError] = useState<Error | null>(null)
  const [contextLost, setContextLost] = useState(false)
  const [canvasKey, setCanvasKey] = useState(0)

  useEffect(() => {
    let cancelled = false
    const { setLoad } = useSimulationStore.getState()
    generateTextures((progress, label) => {
      if (!cancelled) setLoad(0.2 + progress * 0.7, label)
    })
      .then((set) => {
        if (!cancelled) setTextures(set)
      })
      .catch((err: unknown) => {
        if (!cancelled) setError(err instanceof Error ? err : new Error(String(err)))
      })
    return () => {
      cancelled = true
    }
  }, [])

  if (error) throw error
  if (!textures) return null

  return (
    <>
      <SceneCanvas key={canvasKey} textures={textures} onContextLost={() => setContextLost(true)} />
      {contextLost && (
        <div className="absolute inset-0 z-40 grid place-items-center bg-space-950/80 p-6 text-center" role="alert">
          <div className="glass max-w-md rounded-3xl p-8">
            <h2 className="font-display text-2xl text-white">The 3D view took a nap</h2>
            <p className="mt-3 text-slate-300">
              Your graphics card paused the 3D Solar System. This can happen when the computer is busy.
            </p>
            <button
              type="button"
              className="btn-primary mt-6"
              onClick={() => {
                setContextLost(false)
                setCanvasKey((k) => k + 1)
              }}
            >
              Wake it up
            </button>
          </div>
        </div>
      )}
    </>
  )
}
