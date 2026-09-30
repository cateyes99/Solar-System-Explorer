import { useState } from 'react'
import { PerformanceMonitor } from '@react-three/drei'
import { Canvas, useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { PLANETS } from '../data/planets'
import { useSimStore } from '../store/simulationStore'
import { simClock } from '../utils/simClock'
import { HOME_CAMERA, homeDistanceScale } from '../utils/scale'
import { StarField } from '../components/3d/StarField'
import { Nebula } from '../components/3d/Nebula'
import { Sun } from '../components/3d/Sun'
import { Planet } from '../components/3d/Planet'
import { Moon } from '../components/3d/Moon'
import { Orbit } from '../components/3d/Orbit'
import { AsteroidBelt } from '../components/3d/AsteroidBelt'
import { Comet } from '../components/3d/Comet'
import { PassingCraft } from '../components/3d/PassingCraft'
import { Spacecraft } from '../components/3d/Spacecraft'
import { CameraRig } from '../components/3d/CameraRig'
import { LabelBridge } from '../components/3d/LabelBridge'
import { Effects } from '../components/3d/Effects'

/** Advances simulated time; lives in the render loop so React never re-renders. */
function SimulationClock() {
  useFrame((_, delta) => {
    if (simClock.paused || simClock.speed === 0) return
    simClock.days += Math.min(delta, 0.1) * simClock.speed
  })
  return null
}

/**
 * The complete 3D Solar System. React composition for structure, imperative
 * mutation (positions/rotations/camera) inside useFrame for performance.
 */
export function SolarSystemScene() {
  const quality = useSimStore((s) => s.quality)
  const reducedMotion = useSimStore((s) => s.reducedMotion)
  const [dpr, setDpr] = useState(() =>
    quality === 'high' ? 2 : quality === 'low' ? 1 : Math.min(1.6, window.devicePixelRatio || 1),
  )

  const dprCap = quality === 'high' ? 2 : quality === 'low' ? 1 : 1.75
  const dprFloor = quality === 'low' ? 0.75 : 1

  // Pull back on narrow viewports so the outer orbits fit from the first frame.
  const homeScale = homeDistanceScale(window.innerWidth / Math.max(1, window.innerHeight))
  const homePosition = [
    HOME_CAMERA.position[0] * homeScale,
    HOME_CAMERA.position[1] * homeScale,
    HOME_CAMERA.position[2] * homeScale,
  ] as [number, number, number]

  return (
    <Canvas
      dpr={dpr}
      frameloop="always"
      camera={{ position: homePosition, fov: 48, near: 0.08, far: 7000 }}
      gl={{
        antialias: false,
        alpha: false,
        stencil: false,
        powerPreference: 'high-performance',
      }}
      onCreated={({ gl }) => {
        gl.setClearColor('#020309', 1)
        gl.toneMapping = THREE.ACESFilmicToneMapping
        gl.toneMappingExposure = 1.08
      }}
      onPointerMissed={() => {
        const state = useSimStore.getState()
        if (!state.tour.active && state.cameraMode !== 'spacecraft') state.select(null)
      }}
    >
      <color attach="background" args={['#030416']} />

      <PerformanceMonitor
        onDecline={() => setDpr((value) => Math.max(dprFloor, value - 0.25))}
        onIncline={() => setDpr((value) => Math.min(dprCap, value + 0.25))}
      >
        <SimulationClock />
        <LabelBridge />

        {/* The Sun's point light does the heavy lifting; ambient keeps night
            sides readable instead of pure black. */}
        <ambientLight intensity={0.185} color="#93a8ff" />
        <hemisphereLight args={['#3b5cff', '#120b1e', 0.14]} />

        <StarField />
        <Nebula />

        <Sun />

        {/* Orbits first: they render behind the bodies */}
        {PLANETS.map((body) => (
          <Orbit key={`orbit-${body.id}`} body={body} />
        ))}

        {PLANETS.map((body) => (
          <Planet key={body.id} body={body} />
        ))}

        <Moon />
        <AsteroidBelt />
        <Comet />
        <PassingCraft />
        <Spacecraft />

        {/* Camera rig mounted last so it reads this frame's body positions */}
        <CameraRig />

        <Effects quality={quality} reducedMotion={reducedMotion} />
      </PerformanceMonitor>
    </Canvas>
  )
}
