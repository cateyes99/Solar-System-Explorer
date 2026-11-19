import { useEffect } from 'react'
import { Bloom, EffectComposer, Vignette } from '@react-three/postprocessing'
import { useThree } from '@react-three/fiber'
import { ACESFilmicToneMapping } from 'three'
import { PLANETS } from '../data/planets'
import { useSimulationStore } from '../store/simulationStore'
import { getOrbitRadius } from '../utils/scale'
import { SimulationTicker } from '../hooks/useSimulationTime'
import { Sun } from '../components/3d/Sun'
import { Planet } from '../components/3d/Planet'
import { Orbit } from '../components/3d/Orbit'
import { StarField } from '../components/3d/StarField'
import { Nebula } from '../components/3d/Nebula'
import { AsteroidBelt } from '../components/3d/AsteroidBelt'
import { CameraController } from '../components/3d/CameraController'
import { Comet } from '../components/3d/Comet'
import { Spacecraft } from '../components/3d/Spacecraft'

function SceneReady() {
  const setSceneReady = useSimulationStore((state) => state.setSceneReady)
  const gl = useThree((state) => state.gl)
  useEffect(() => {
    gl.toneMapping = ACESFilmicToneMapping
    gl.toneMappingExposure = 0.95
    const timer = window.setTimeout(() => setSceneReady(true), 450)
    return () => window.clearTimeout(timer)
  }, [gl, setSceneReady])
  return null
}

export function SolarSystemScene() {
  const showOrbits = useSimulationStore((state) => state.showOrbits)
  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const customDistance = useSimulationStore((state) => state.customDistance)
  const quality = useSimulationStore((state) => state.quality)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  const noSun = useSimulationStore((state) => state.whatIf === 'no-sun')

  return (
    <>
      <SceneReady />
      <SimulationTicker />
      <CameraController />
      <ambientLight intensity={noSun ? 0.012 : 0.17} color="#91a4c7" />
      <hemisphereLight args={['#516688', '#08080d', noSun ? 0.015 : 0.16]} />
      <Nebula />
      <StarField />
      <Sun />
      {showOrbits && PLANETS.map((planet) => (
        <Orbit
          key={planet.id}
          body={planet}
          radius={getOrbitRadius(planet, scaleMode, customDistance)}
          color={planet.id === 'earth' ? '#5e9eb5' : '#698095'}
          opacity={planet.id === 'earth' ? 0.24 : 0.15}
        />
      ))}
      {PLANETS.map((planet) => <Planet key={planet.id} body={planet} />)}
      <AsteroidBelt />
      <Comet />
      <Spacecraft />
      {quality !== 'low' && !reducedMotion && (
        <EffectComposer multisampling={0}>
          <Bloom intensity={0.65} luminanceThreshold={1.05} luminanceSmoothing={0.42} mipmapBlur />
          <Vignette eskil={false} offset={0.16} darkness={0.52} />
        </EffectComposer>
      )}
    </>
  )
}
