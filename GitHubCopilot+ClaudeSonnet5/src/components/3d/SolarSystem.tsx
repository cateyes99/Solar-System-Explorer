import { useMemo } from 'react'
import { PLANETS } from '../../data/planets'
import { useSimulationStore } from '../../store/simulationStore'
import { computeOrbitLayout } from '../../utils/scale'
import { StarField } from './StarField'
import { Nebula } from './Nebula'
import { Sun } from './Sun'
import { Planet } from './Planet'
import { Moon } from './Moon'
import { AsteroidBelt } from './AsteroidBelt'
import { Comets } from './Comet'
import { Spacecraft } from './Spacecraft'

/** Assembles every body in the scene using a shared, scale-mode-aware orbit layout. */
export function SolarSystem() {
  const scaleMode = useSimulationStore((s) => s.scaleMode)
  const customScale = useSimulationStore((s) => s.customScale)

  const layout = useMemo(() => computeOrbitLayout(PLANETS, scaleMode, customScale), [scaleMode, customScale])

  const marsEntry = layout.get('mars')
  const jupiterEntry = layout.get('jupiter')
  const beltInner = marsEntry ? marsEntry.orbitDistance + marsEntry.radius + 1.4 : 0
  const beltOuter = jupiterEntry ? jupiterEntry.orbitDistance - jupiterEntry.radius - 1.4 : 0

  return (
    <>
      <StarField />
      <Nebula />
      <Sun />

      {PLANETS.map((planet) => (
        <Planet key={planet.id} planet={planet} layout={layout} />
      ))}

      <Moon />
      <AsteroidBelt innerRadius={beltInner} outerRadius={beltOuter} />
      <Comets />
      <Spacecraft />
    </>
  )
}
