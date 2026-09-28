import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Canvas, useFrame } from '@react-three/fiber'
import { AdaptiveDpr, PerformanceMonitor } from '@react-three/drei'
import { bodies } from '../data/planets'
import { Planet } from '../components/3d/Planet'
import { AsteroidBelt, OrbitPaths, StarField } from '../components/3d/Environment'
import { CameraController } from '../components/3d/CameraController'
import { useSimulation } from '../store/simulationStore'
import { Spacecraft } from '../components/3d/Spacecraft'
import { LabelLayout } from '../components/3d/LabelLayout'

function Clock() {
  useFrame((_, delta) => useSimulation.getState().tick(delta), -2)
  return null
}

function Ready({ onReady }: { onReady: () => void }) {
  useEffect(onReady, [onReady])
  return null
}

export default function SolarSystemScene({ onReady }: { onReady: () => void }) {
  const { t } = useTranslation()
  const canvas = useRef<HTMLCanvasElement>(null)
  const [dpr, setDpr] = useState(1.5)
  useEffect(() => { canvas.current?.setAttribute('aria-label', t('Interactive 3D solar system')) }, [t])
  return <Canvas ref={canvas} camera={{ position: [23, 55, 76], fov: 48, near: .05, far: 1500 }} dpr={dpr} gl={{ antialias: true, alpha: true, powerPreference: 'high-performance', preserveDrawingBuffer: true }} onCreated={({ gl }) => { gl.setClearColor('#06090e', 0); gl.domElement.addEventListener('webglcontextlost', event => { event.preventDefault(); window.dispatchEvent(new Event('solar-context-lost')) }) }}>
    <PerformanceMonitor onDecline={() => setDpr(1)} flipflops={2}>
      <AdaptiveDpr pixelated />
      <ambientLight intensity={.34} />
      <Clock />
      <StarField />
      <OrbitPaths />
      <AsteroidBelt />
      {bodies.map(body => <Planet key={body.id} body={body} />)}
      <CameraController />
      <Spacecraft />
      <LabelLayout />
      <Ready onReady={onReady} />
    </PerformanceMonitor>
  </Canvas>
}