import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { PLANETS, MOONS_BY_PARENT } from '../../data/planets'
import { useAppStore } from '../../store/useAppStore'
import { simClock } from '../../store/clock'
import { planetRadiusUnits } from '../../utils/scale'
import { Sun } from './Sun'
import { Planet } from './Planet'
import { OrbitRing } from './OrbitRing'
import { AsteroidBelt } from './AsteroidBelt'
import { Comet } from './Comet'
import { Spacecraft } from './Spacecraft'
import { Labels } from './Labels'
import { planetOrbit } from './orbitMath'

/**
 * Advances the shared simulation clock. This component is mounted first inside
 * the canvas so its `useFrame` runs before any planet reads `simClock`.
 */
function SimulationDriver() {
  const setDisplayedMs = useAppStore((s) => s.setDisplayedMs)
  const uiClock = useRef(0)

  useFrame((_, delta) => {
    simClock.tick(performance.now())
    uiClock.current += delta
    if (uiClock.current > 0.25) {
      uiClock.current = 0
      setDisplayedMs(simClock.simulatedMs)
    }
  })

  return null
}

/**
 * The whole orrery: ten components, one canvas, and no React re-renders while
 * the simulation is running.
 */
export function SolarSystemScene() {
  const scale = useAppStore((s) => s.scale)
  const reducedMotion = useAppStore((s) => s.reducedMotion)
  const orbitsVisible = useAppStore((s) => s.orbitsVisible)
  const moonsVisible = useAppStore((s) => s.moonsVisible)
  const quality = useAppStore((s) => s.quality)

  const planetData = useMemo(
    () =>
      PLANETS.map((planet, index) => ({
        planet,
        orbit: planetOrbit(planet, scale, index),
        radius: planetRadiusUnits(planet.diameterKm, scale.sizeExponent),
        moons: MOONS_BY_PARENT[planet.id] ?? [],
      })),
    [scale],
  )

  return (
    <>
      <SimulationDriver />
      <ambientLight intensity={0.045} color="#8fa8ff" />

      <Sun sizeExponent={scale.sizeExponent} />

      {planetData.map(({ planet, orbit, radius, moons }) => (
        <group key={planet.id}>
          {orbitsVisible && (
            <group rotation={[orbit.inclination, orbit.node, 0]}>
              <OrbitRing orbit={orbit} color={planet.accentColor} opacity={0.22} />
            </group>
          )}
          <Planet planet={planet} orbit={orbit} radius={radius} moons={moonsVisible ? moons : []} />
        </group>
      ))}

      <AsteroidBelt count={reducedMotion || quality === 'performance' ? 550 : 1100} scale={scale} />
      <Comet distanceExponent={scale.distanceExponent} />
      <Spacecraft scale={scale} />
      <Labels />
    </>
  )
}