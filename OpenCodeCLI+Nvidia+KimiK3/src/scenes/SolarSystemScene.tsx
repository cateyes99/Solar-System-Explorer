import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Canvas } from '@react-three/fiber'
import { PLANETS } from '../data/planets'
import { buildScale } from '../utils/scale'
import { simClock } from '../utils/clock'
import { useSimulationStore } from '../store/simulationStore'
import { Sun } from '../components/3d/Sun'
import { PlanetNode } from '../components/3d/Planet'
import { Orbit } from '../components/3d/Orbit'
import { StarField } from '../components/3d/StarField'
import { AsteroidBelt } from '../components/3d/AsteroidBelt'
import { CameraController } from '../components/3d/CameraController'
import { Comet, Spacecraft } from '../components/3d/Extras'

/** Advances the simulation clock each frame (outside React state). */
function ClockTicker() {
  const lastUiUpdate = useRef(0)
  useFrame((_, delta) => {
    if (!simClock.paused) simClock.days += Math.min(delta, 0.1) * simClock.speed
    // throttled UI date update (~4 Hz) to avoid re-render storms
    const now = performance.now()
    if (now - lastUiUpdate.current > 250) {
      lastUiUpdate.current = now
      const el = document.getElementById('sim-date')
      if (el) {
        const d = new Date(Date.UTC(2024, 0, 1) + simClock.days * 86_400_000)
        el.textContent = d.toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' })
      }
    }
  })
  return null
}

export function SolarSystemScene({ spacecraftActive }: { spacecraftActive: boolean }) {
  const scaleMode = useSimulationStore((s) => s.scaleMode)
  const customSize = useSimulationStore((s) => s.customSize)
  const customDistance = useSimulationStore((s) => s.customDistance)
  const showOrbits = useSimulationStore((s) => s.showOrbits)
  const paused = useSimulationStore((s) => s.paused)
  const speed = useSimulationStore((s) => s.speed)

  useEffect(() => { simClock.paused = paused }, [paused])
  useEffect(() => { simClock.speed = speed }, [speed])

  const scaled = useMemo(
    () => buildScale(PLANETS, scaleMode, customSize, customDistance),
    [scaleMode, customSize, customDistance],
  )

  const marsOrbit = scaled.find((b) => b.planet.id === 'mars')?.orbitRadius ?? 40
  const jupiterOrbit = scaled.find((b) => b.planet.id === 'jupiter')?.orbitRadius ?? 55

  const phases = useMemo(() => PLANETS.map((_, i) => (i * 2.399) % (Math.PI * 2)), [])

  return (
    <Canvas
      camera={{ position: [0, 90, 170], fov: 55, near: 0.1, far: 4000 }}
      dpr={[1, 1.75]}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      onPointerMissed={() => useSimulationStore.getState().select(null)}
    >
      <color attach="background" args={['#04060f']} />
      <fog attach="fog" args={['#04060f', 400, 1600]} />

      <ClockTicker />
      <StarField />
      <Sun />

      {scaled.map((body, i) => (
        <group key={body.planet.id}>
          {showOrbits && <Orbit radius={body.orbitRadius} />}
          <PlanetNode planet={body.planet} radius={body.radius} orbitRadius={body.orbitRadius} phase={phases[i]} />
        </group>
      ))}

      <AsteroidBelt innerRadius={marsOrbit + 4} outerRadius={jupiterOrbit - 4} />
      <Comet />
      <Spacecraft active={spacecraftActive} />
      <CameraController />
    </Canvas>
  )
}
