import type { QualityLevel } from '../../types'
import { PLANETS } from '../../data/planets'
import { sunRadiusFor } from '../../utils/scale'
import { useSimulationStore } from '../../store/simulationStore'
import { Sun } from './Sun'
import { Planet } from './Planet'
import { Orbit } from './Orbit'
import { AsteroidBelt } from './AsteroidBelt'
import { StarField } from './StarField'
import { Comet } from './Comet'
import { Spacecraft } from './Spacecraft'
import { Timekeeper } from './Timekeeper'
import { CameraController } from './CameraController'
import { TourDirector } from './TourDirector'
import { PostProcessing } from './PostProcessing'

/**
 * Everything that lives inside the WebGL canvas.
 *
 * State that changes every frame stays inside `useFrame` handlers; the only React
 * subscriptions here are things that change rarely (quality, scale mode, layer
 * toggles), which keeps the scene close to immutable at runtime.
 */
interface SolarSystemProps {
  quality: QualityLevel
}

export function SolarSystem({ quality }: SolarSystemProps) {
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  const showOrbits = useSimulationStore((state) => state.showOrbits)
  const showLabels = useSimulationStore((state) => state.showLabels)
  const showAsteroidBelt = useSimulationStore((state) => state.showAsteroidBelt)
  const showNebula = useSimulationStore((state) => state.showNebula)
  const showOrbitFlow = useSimulationStore((state) => state.showOrbitFlow)
  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const customScale = useSimulationStore((state) => state.customScale)
  const whatIfId = useSimulationStore((state) => state.whatIfId)

  const sunRadius = sunRadiusFor(scaleMode, customScale)

  return (
    <>
      {/* Advances simulated time. It must come first: everything below reads the
          clock inside its own useFrame, and useFrame handlers run in mount
          order, so this guarantees they see the current frame's time. */}
      <Timekeeper />

      {/* The Sun's point light does the heavy lifting; this just keeps the night
          sides readable instead of pitch black. */}
      <ambientLight intensity={0.26} color="#8ea6d8" />

      <StarField quality={quality} reducedMotion={reducedMotion} showNebula={showNebula} />
      <Sun
        radius={sunRadius}
        reducedMotion={reducedMotion}
        extinguished={whatIfId === 'no-sun'}
      />

      {PLANETS.map((planet) => (
        <Planet
          key={planet.id}
          body={planet}
          quality={quality}
          reducedMotion={reducedMotion}
          showLabels={showLabels}
        />
      ))}

      {showOrbits
        ? PLANETS.map((planet) => (
            <Orbit key={planet.id} body={planet} showFlow={showOrbitFlow} quality={quality} />
          ))
        : null}

      {showAsteroidBelt ? <AsteroidBelt quality={quality} reducedMotion={reducedMotion} /> : null}

      <Comet reducedMotion={reducedMotion} showLabels={showLabels} />
      <Spacecraft />
      <CameraController />
      <TourDirector />
      <PostProcessing quality={quality} reducedMotion={reducedMotion} />
    </>
  )
}