import { PLANET_IDS } from '../../data/planets'
import { useLayoutAnimation } from '../../hooks/useLayoutAnimation'
import { useSimulationTime } from '../../hooks/useSimulationTime'
import { useSimulationStore } from '../../store/simulationStore'
import { AsteroidBelt } from './AsteroidBelt'
import { Comet } from './Comet'
import { Orbit } from './Orbit'
import { PassingProbe } from './PassingProbe'
import { Planet } from './Planet'
import { Spacecraft } from './Spacecraft'
import { Nebula, StarField } from './StarField'
import { Sun } from './Sun'
import { SunGoneWave } from './SunGoneWave'

/** Everything that lives in space: the Sun, planets, orbits, belts, comets and the player’s ship. */
export function SolarSystem() {
  useSimulationTime()
  useLayoutAnimation()
  const missionActive = useSimulationStore((s) => s.appMode === 'mission')

  return (
    <>
      <Nebula />
      <StarField />
      <Sun />
      <SunGoneWave />
      {PLANET_IDS.map((id) => (
        <Orbit key={`orbit-${id}`} id={id} />
      ))}
      {PLANET_IDS.map((id) => (
        <Planet key={id} id={id} />
      ))}
      <AsteroidBelt />
      <Comet />
      <PassingProbe />
      {missionActive && <Spacecraft />}
    </>
  )
}
