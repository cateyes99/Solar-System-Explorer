import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { RingGeometry, Vector3, type Group, type Mesh } from 'three'
import { BODIES } from '../../data/planets'
import type { PlanetId } from '../../data/types'
import { VISUALS } from '../../data/visuals'
import { createAtmosphereMaterial, createPlanetMaterial, createRingMaterial } from '../../graphics/materials'
import { bodyObjects, layoutState, simClock, sunGoneState } from '../../store/runtime'
import { useSimulationStore } from '../../store/simulationStore'
import { DEG, TAU, meanLongitude, orbitPoint } from '../../utils/astronomy'
import { Moon } from './Moon'
import { MAX_SPIN_RAD_PER_SEC, getSphere, hitMaterial, useTextures } from './shared'
import { useBodyInteraction } from './useBodyInteraction'

const ahead = new Vector3()

export function Planet({ id }: { id: PlanetId }) {
  const textures = useTextures()
  const body = BODIES[id]
  const visual = VISUALS[id]
  const orbitRef = useRef<Group>(null)
  const tiltRef = useRef<Group>(null)
  const spinRef = useRef<Mesh>(null)
  const cloudRef = useRef<Mesh>(null)
  const hitRef = useRef<Mesh>(null)
  const highlight = useRef(0)
  const sunlight = useRef(1)
  const interaction = useBodyInteraction(id)
  const twoMoons = useSimulationStore((s) => s.whatIf === 'two-moons')

  const materials = useMemo(() => {
    const surface = createPlanetMaterial({
      map: textures[id],
      aux: id === 'earth' ? textures.earthAux : undefined,
      ambient: visual.ambient,
      rimColor: visual.rim?.color,
      rimStrength: visual.rim?.strength,
    })
    const clouds = visual.clouds
      ? createPlanetMaterial({ map: textures.earthClouds, ambient: 0.015, transparent: true })
      : null
    const atmosphere = visual.atmosphere
      ? createAtmosphereMaterial(visual.atmosphere.color, visual.atmosphere.intensity)
      : null
    const rings =
      visual.rings === 'saturn'
        ? createRingMaterial(textures.saturnRings, 1.2, 2.3)
        : visual.rings === 'uranus'
          ? createRingMaterial(textures.uranusRings, 1.6, 2.05, 0.55)
          : null
    return { surface, clouds, atmosphere, rings }
  }, [id, textures, visual])

  const ringGeometry = useMemo(() => {
    if (visual.rings === 'saturn') return new RingGeometry(1.2, 2.3, 160, 1)
    if (visual.rings === 'uranus') return new RingGeometry(1.6, 2.05, 128, 1)
    return null
  }, [visual.rings])

  useEffect(
    () => () => {
      materials.surface.dispose()
      materials.clouds?.dispose()
      materials.atmosphere?.dispose()
      materials.rings?.dispose()
      ringGeometry?.dispose()
    },
    [materials, ringGeometry],
  )

  useEffect(() => {
    const group = orbitRef.current
    if (group) bodyObjects.set(id, group)
    return () => {
      bodyObjects.delete(id)
    }
  }, [id])

  useFrame((state, delta) => {
    const group = orbitRef.current
    const tilt = tiltRef.current
    const spin = spinRef.current
    if (!group || !tilt || !spin) return
    const s = useSimulationStore.getState()
    const layout = layoutState.current
    const r = layout.radius[id]
    const orbitRadius = layout.orbit[id]
    const days = simClock.days
    const orbit = body.orbit
    if (!orbit) return

    const released = sunGoneState.released.get(id)
    if (released) {
      const t = days - released.days
      group.position.set(released.x + released.vx * t, released.y + released.vy * t, released.z + released.vz * t)
    } else {
      const longitude = meanLongitude(body, days)
      orbitPoint(longitude, orbitRadius, orbit.inclinationDeg, orbit.ascendingNodeDeg, group.position)
      if (sunGoneState.active && sunGoneState.waveRadius >= orbitRadius) {
        // The news of the Sun's disappearance has arrived: continue in a straight line.
        const step = 0.001
        orbitPoint(longitude + step, orbitRadius, orbit.inclinationDeg, orbit.ascendingNodeDeg, ahead)
        const perDay = TAU / body.orbitalPeriodDays / step
        sunGoneState.released.set(id, {
          x: group.position.x,
          y: group.position.y,
          z: group.position.z,
          vx: (ahead.x - group.position.x) * perDay,
          vy: (ahead.y - group.position.y) * perDay,
          vz: (ahead.z - group.position.z) * perDay,
          days,
        })
      }
    }

    const dt = Math.min(delta, 0.1)
    const sunTarget = sunGoneState.released.has(id) ? 0 : 1
    sunlight.current += (sunTarget - sunlight.current) * Math.min(1, dt * 1.5)

    const highlightTarget = s.hoveredId === id ? 1 : s.selectedId === id && s.infoOpen ? 0.3 : 0
    highlight.current += (highlightTarget - highlight.current) * Math.min(1, dt * 8)
    tilt.scale.setScalar(r * (1 + highlight.current * 0.04))

    const stopped = id === 'earth' && s.whatIf === 'still-earth'
    if (!s.paused) {
      const rate = (s.daysPerSecond * TAU) / (body.rotationPeriodHours / 24)
      const step = stopped ? 0 : dt * Math.min(rate, MAX_SPIN_RAD_PER_SEC)
      spin.rotation.y += step
      if (cloudRef.current) cloudRef.current.rotation.y += stopped ? dt * 0.02 : step * 1.08
    }

    const u = materials.surface.uniforms
    u.uHighlight.value = highlight.current
    u.uSunlight.value = sunlight.current
    if (materials.clouds) materials.clouds.uniforms.uSunlight.value = sunlight.current
    if (materials.atmosphere) materials.atmosphere.uniforms.uSunlight.value = sunlight.current
    if (materials.rings) {
      materials.rings.uniforms.uSunlight.value = sunlight.current
      materials.rings.uniforms.uPlanetPos.value.copy(group.position)
      materials.rings.uniforms.uPlanetRadius.value = r
    }

    if (hitRef.current) {
      const camDistance = state.camera.position.distanceTo(group.position)
      hitRef.current.scale.setScalar(Math.max(r * (visual.rings === 'saturn' ? 1.7 : 1.15), camDistance * 0.02))
    }
  }, -1)

  const sphere = getSphere(visual.segments)
  return (
    <group ref={orbitRef}>
      <group ref={tiltRef} rotation={[-body.axialTiltDeg * DEG, 0, 0]}>
        <mesh ref={spinRef} geometry={sphere} material={materials.surface} />
        {materials.clouds && <mesh ref={cloudRef} geometry={sphere} material={materials.clouds} scale={1.012} />}
        {materials.atmosphere && visual.atmosphere && (
          <mesh geometry={sphere} material={materials.atmosphere} scale={visual.atmosphere.scale} />
        )}
        {ringGeometry && materials.rings && (
          <mesh geometry={ringGeometry} material={materials.rings} rotation={[-Math.PI / 2, 0, 0]} />
        )}
      </group>
      <mesh ref={hitRef} geometry={getSphere(12)} material={hitMaterial} {...interaction} />
      {id === 'earth' && <Moon variant="moon" />}
      {id === 'earth' && twoMoons && <Moon variant="second" />}
    </group>
  )
}
