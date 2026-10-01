import type { QualityLevel } from '../../types'
import { COMETS, ORBITING_WORLDS } from '../../data/planets'
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

      {ORBITING_WORLDS.map((body) => (
        <Planet
          key={body.id}
          body={body}
          quality={quality}
          reducedMotion={reducedMotion}
          showLabels={showLabels}
        />
      ))}

      {COMETS.map((comet) => (
        <Comet key={comet.id} body={comet} reducedMotion={reducedMotion} showLabels={showLabels} />
      ))}

      {showOrbits
        ? ORBITING_WORLDS.map((body) => (
            <Orbit key={body.id} body={body} showFlow={showOrbitFlow} quality={quality} />
          ))
        : null}

      {showOrbits
        ? COMETS.map((comet) => (
            <Orbit key={comet.id} body={comet} showFlow={showOrbitFlow} quality={quality} />
          ))
        : null}

      {showAsteroidBelt ? <AsteroidBelt quality={quality} reducedMotion={reducedMotion} /> : null}

      <Spacecraft />
      <CameraController />
      <TourDirector />
      <PostProcessing quality={quality} reducedMotion={reducedMotion} />
    </>
  )
}