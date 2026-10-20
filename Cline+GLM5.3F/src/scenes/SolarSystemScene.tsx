import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { CameraController } from '../components/3d/CameraController'
import { SolarSystem } from '../components/3d/SolarSystem'
import { StarField } from '../components/3d/StarField'
import { Nebula } from '../components/3d/Nebula'
import { Spacecraft } from '../components/3d/Spacecraft'
import { Timekeeper } from '../components/3d/Timekeeper'
import { PostFX } from '../components/3d/PostFX'

/** The full 3D experience, mounted inside an error boundary by App. */
export function SolarSystemScene(): JSX.Element {
  return (
    <Canvas
      className="absolute inset-0"
      dpr={[1, 1.75]}
      camera={{ fov: 55, near: 0.1, far: 2400, position: [0, 165, 265] }}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
    >
      <color attach="background" args={['#020409']} />
      <Suspense fallback={null}>
        <Timekeeper />
        <CameraController />
        <SolarSystem />
        <StarField />
        <Nebula />
        <Spacecraft />
        <PostFX />
      </Suspense>
    </Canvas>
  )
}
