import { EARTH } from '../../data/planets'
import { useSimulationStore } from '../../store/simulationStore'
import type { QualityLevel } from '../../types'
import { Planet } from './Planet'

/**
 * Solo Earth mode: the standalone globe.
 *
 * Everything else in the Solar System is unmounted, so this scene is Earth and
 * the sky. The Sun is gone with it, so a single point light at the origin stands
 * in for it — the same colour, intensity and `decay={0}` falloff the Sun used,
 * and at the origin, so every one of Earth's shaders (which all read the shared
 * `SUN_POSITION`) keeps exactly the day/night terminator it has always had.
 *
 * The globe itself is the ordinary `Planet` in `solo` mode: pinned to a fixed
 * point instead of orbiting, and without its moons.
 */
export function SoloEarth({ quality }: { quality: QualityLevel }) {
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  // The World map's city and country names are the point of the mode, so they
  // keep following the "Labels" toggle. Only the globe's own floating "Earth"
  // tag is dropped (`bodyLabel`), because a standalone globe does not need it.
  const showLabels = useSimulationStore((state) => state.showLabels)
  return (
    <>
      <pointLight color="#fff3dc" intensity={3.5} distance={0} decay={0} />
      <Planet
        body={EARTH}
        quality={quality}
        reducedMotion={reducedMotion}
        showLabels={showLabels}
        bodyLabel={false}
        solo
      />
    </>
  )
}
