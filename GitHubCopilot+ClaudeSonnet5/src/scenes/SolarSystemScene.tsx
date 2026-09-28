import { useRef } from 'react'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { SolarSystem } from '../components/3d/SolarSystem'
import { CameraController } from '../components/3d/CameraController'
import { useSimulationTime } from '../hooks/useSimulationTime'

function SimulationDriver() {
  useSimulationTime()
  return null
}

/** Fires `onReady` once the scene has actually rendered its first real frame. */
function FirstFrameSignal({ onReady }: { onReady: () => void }) {
  const fired = useRef(false)
  useFrame(() => {
    if (!fired.current) {
      fired.current = true
      onReady()
    }
  })
  return null
}

interface SolarSystemSceneProps {
  onFirstFrame: () => void
}

export function SolarSystemScene({ onFirstFrame }: SolarSystemSceneProps) {
  return (
    <Canvas
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={{ position: [0, 42, 95], fov: 50, near: 0.1, far: 4000 }}
      onCreated={({ gl }) => {
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.05
      }}
    >
      <color attach="background" args={['#03040a']} />
      <SimulationDriver />
      <SolarSystem />
      <CameraController />
      <FirstFrameSignal onReady={onFirstFrame} />
    </Canvas>
  )
}
