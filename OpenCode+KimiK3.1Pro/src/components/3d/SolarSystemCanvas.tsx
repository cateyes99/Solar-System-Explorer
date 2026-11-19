import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { SolarSystemScene } from '../../scenes/SolarSystemScene'
import { useSimulationStore } from '../../store/simulationStore'

export function SolarSystemCanvas() {
  const quality = useSimulationStore((state) => state.quality)
  return (
    <Canvas
      className="solar-canvas"
      camera={{ position: [0, 64, 97], fov: 43, near: 0.05, far: 650 }}
      dpr={quality === 'low' ? 1 : [1, 1.7]}
      gl={{ antialias: quality !== 'low', alpha: false, powerPreference: 'high-performance' }}
      onPointerMissed={() => { document.body.style.cursor = 'default' }}
    >
      <Suspense fallback={null}>
        <SolarSystemScene />
      </Suspense>
    </Canvas>
  )
}
