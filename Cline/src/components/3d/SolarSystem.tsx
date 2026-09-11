import { PLANETS } from '../../data/planets'
import { useSceneLayout } from '../../hooks/useSceneLayout'
import { useSimulation } from '../../store/simulationStore'
import { Orbit } from './Orbit'
import { Planet } from './Planet'
import { Sun } from './Sun'
import { AsteroidBelt } from './AsteroidBelt'
import { Comet } from './Comet'
import { PlanetLabels } from './PlanetLabels'

/** All orbital bodies: the Sun, planets with orbit lines, belt, comet and labels. */
export function SolarSystem(): JSX.Element {
  const layout = useSceneLayout()
  const showOrbits = useSimulation((s) => s.showOrbits)
  const showLabels = useSimulation((s) => s.showLabels)

  return (
    <group>
      {/* Gentle fill so night sides stay readable for education. */}
      <ambientLight intensity={0.13} />
      <Sun radius={layout.sunRadius} />
      {PLANETS.map((p) => (
        <group key={p.id}>
          {showOrbits && (
            <Orbit
              radius={layout.orbitRadius(p.id)}
              inclinationDeg={p.orbitalInclinationDeg}
              ascendingNodeDeg={p.ascendingNodeDeg}
              opacity={0.3}
            />
          )}
          <Planet planet={p} />
        </group>
      ))}
      <AsteroidBelt />
      <Comet />
      {showLabels && <PlanetLabels />}
    </group>
  )
}
