import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, DoubleSide, MeshStandardMaterial } from 'three'
import type { Group, Mesh, MeshBasicMaterial } from 'three'
import type { CelestialBody, QualityLevel, SatelliteDefinition } from '../../types'
import { BODY_VISUALS } from '../../data/visuals'
import { MOON, satellitesOf } from '../../data/planets'
import { orbitalState, toSceneXZ } from '../../utils/astronomy'
import { clock } from '../../utils/simulationClock'
import { bodyRadius, scaleDistanceKm } from '../../utils/scale'
import { registerBody, unregisterBody } from '../../utils/bodyRegistry'
import { getTexture } from '../../utils/textures'
import { useSimulationStore } from '../../store/simulationStore'
import { HIGH_DETAIL_SPHERE, MEDIUM_DETAIL_SPHERE, LOW_DETAIL_SPHERE, createRingGeometry } from './geometry'
import { Atmosphere } from './Atmosphere'
import { NightLights } from './NightLights'
import { Rings } from './Rings'
import { Moon } from './Moon'
import { PlanetLabel } from './PlanetLabel'
import { SUN_POSITION } from './constants'

/** Our Moon is a real body with its own panel, so it needs a satellite record. */
const EARTHS_MOON: SatelliteDefinition = {
  id: 'moon',
  name: 'The Moon',
  parentId: 'earth',
  diameterKm: MOON.diameterKm,
  orbitalRadiusKm: MOON.semiMajorAxisKm,
  orbitalPeriodDays: MOON.orbitalPeriodDays,
  color: MOON.color,
  note: 'Earth’s only natural satellite, 384,400 km away.',
}

/** A guest moon for the "What if Earth had two moons?" experiment. */
const GUEST_MOON: SatelliteDefinition = {
  id: 'guest-moon',
  name: 'Guest Moon',
  parentId: 'earth',
  diameterKm: 1_100,
  orbitalRadiusKm: 176_000,
  orbitalPeriodDays: 11.4,
  color: '#cfd8e3',
  note: 'A hypothetical second moon, much smaller and much closer than ours.',
}

const MOON_INCLINATIONS: Record<string, number> = {
  phobos: 1.1,
  deimos: 1.8,
  io: 0.4,
  europa: 0.9,
  ganymede: 0.6,
  callisto: 1.2,
  titan: 0.6,
  titania: 0.9,
  triton: 8,
}

interface PlanetProps {
  body: CelestialBody
  quality: QualityLevel
  reducedMotion: boolean
  showLabels: boolean
}

export function Planet({ body, quality, reducedMotion, showLabels }: PlanetProps) {
  const orbitRef = useRef<Group>(null)
  const tiltRef = useRef<Group>(null)
  const spinRef = useRef<Group>(null)
  const cloudsRef = useRef<Mesh>(null)
  const detailRef = useRef<Group>(null)
  const focusRingRef = useRef<Mesh>(null)
  const focusRingMaterialRef = useRef<MeshBasicMaterial>(null)

  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const customScale = useSimulationStore((state) => state.customScale)
  const whatIfId = useSimulationStore((state) => state.whatIfId)
  const setHovered = useSimulationStore((state) => state.setHovered)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const focusBody = useSimulationStore((state) => state.focusBody)
  const registerDiscovery = useSimulationStore((state) => state.registerDiscovery)
  const showToast = useSimulationStore((state) => state.showToast)

  const visuals = BODY_VISUALS[body.id]
  const sizeMultiplier = whatIfId === 'earth-jupiter-size' && body.id === 'earth' ? 11 : 1
  const radius = bodyRadius(body, scaleMode, customScale) * sizeMultiplier
  const spinFrozen = whatIfId === 'no-rotation' && body.id === 'earth'
  /**
   * Polar flattening, straight from the IAU figure for the body. It is applied to
   * the planet's own spin group, so the squash happens along the rotation axis:
   * Jupiter (6.5%) and Saturn (9.8%) stop being spheres and read as the fast
   * spinning giants they really are, while the Moon (0.12%) stays round.
   */
  const flattening = visuals.flattening ?? 0
  const flattenScale = useMemo<[number, number, number]>(() => [1, 1 - flattening, 1], [flattening])
  const highlight = useRef(0)
  const ringOpacity = useRef(0)

  const surfaceMaterial = useMemo(() => {
    const texture = getTexture(visuals.textureId)
    texture.offset.x = visuals.textureOffsetU
    return new MeshStandardMaterial({
      map: texture,
      // Real maps double as relief: a darker texel sits lower than a bright one.
      bumpMap: visuals.bumpScale ? texture : null,
      bumpScale: visuals.bumpScale ?? 0,
      roughness: visuals.roughness,
      metalness: visuals.metalness,
      // Earth varies its roughness across the surface — glassy ocean, dusty land —
      // which is what produces the sun glint on water.
      roughnessMap: visuals.roughnessMapId ? getTexture(visuals.roughnessMapId) : null,
      emissive: new Color(visuals.accent),
      emissiveIntensity: 0,
    })
  }, [visuals])

  const cloudsMaterial = useMemo(() => {
    if (!visuals.clouds) return null
    // The shipped cloud map is a photographic black-and-white layer with no alpha
    // channel: white where the sky is cloudy, black where it is clear. Feeding it
    // in as the alpha map (three reads its green channel) turns that coverage into
    // clouds, instead of painting a grey veil over the whole planet.
    return new MeshStandardMaterial({
      alphaMap: getTexture(visuals.clouds.textureId),
      transparent: true,
      opacity: visuals.clouds.opacity,
      depthWrite: false,
      roughness: 0.9,
      metalness: 0,
      color: visuals.clouds.color,
    })
  }, [visuals.clouds])

  const focusRingGeometry = useMemo(() => {
    const outer = Math.max(radius * visuals.focusRingScale, radius + 0.12)
    return createRingGeometry(outer * 0.965, outer)
  }, [radius, visuals.focusRingScale])

  useEffect(() => () => surfaceMaterial.dispose(), [surfaceMaterial])
  useEffect(() => () => cloudsMaterial?.dispose(), [cloudsMaterial])
  useEffect(() => () => focusRingGeometry.dispose(), [focusRingGeometry])

  // The camera controller and the HUD look planets up by id.
  useEffect(() => {
    const object = orbitRef.current
    if (!object) return
    registerBody(body.id, object)
    return () => unregisterBody(body.id, object)
  }, [body.id])

  const satellites = useMemo(() => {
    const list: SatelliteDefinition[] = []
    if (body.id === 'earth') list.push(EARTHS_MOON)
    list.push(...satellitesOf(body.id))
    if (whatIfId === 'two-moons' && body.id === 'earth') list.push(GUEST_MOON)
    return list
  }, [body.id, whatIfId])

  const detailThreshold = quality === 'low' ? 0.014 : 0.006

  useFrame((state, delta) => {
    const orbit = orbitRef.current
    if (!orbit) return
    const step = Math.min(delta, 0.05)

    // --- Position on the (slightly elliptical) orbit ----------------------
    const days = clock.daysSinceJ2000
    const orbitState = orbitalState(body, days)
    const distance = scaleDistanceKm(orbitState.distanceKm, scaleMode, customScale)
    const scene = toSceneXZ(distance, orbitState.angleRad)
    orbit.position.set(scene.x, 0, scene.z)

    // --- Axial rotation ---------------------------------------------------
    if (spinRef.current && !spinFrozen && body.rotationPeriodHours !== 0) {
      const frameDays = clock.lastFrameDays
      spinRef.current.rotation.y += (frameDays * 24 / body.rotationPeriodHours) * Math.PI * 2
      if (cloudsRef.current && visuals.clouds) {
        cloudsRef.current.rotation.y = spinRef.current.rotation.y * visuals.clouds.speed
      }
    }

    // --- Level of detail --------------------------------------------------
    // Reading state directly keeps hover and selection from re-rendering React.
    const store = useSimulationStore.getState()
    const isHovered = store.hoveredId === body.id
    const isSelected = store.selectedId === body.id
    const cameraDistance = state.camera.position.distanceTo(orbit.position)
    const apparentSize = (radius * 2) / Math.max(cameraDistance, 0.001)
    if (detailRef.current) {
      detailRef.current.visible = apparentSize > detailThreshold
    }

    // --- Hover / selection emphasis ---------------------------------------
    const highlightTarget = isSelected ? 0.3 : isHovered ? 0.2 : 0
    highlight.current += (highlightTarget - highlight.current) * Math.min(1, step * 8)
    surfaceMaterial.emissiveIntensity = highlight.current

    const ringTarget = isSelected ? 0.55 : isHovered ? 0.3 : 0
    ringOpacity.current += (ringTarget - ringOpacity.current) * Math.min(1, step * 7)
    if (focusRingMaterialRef.current) {
      focusRingMaterialRef.current.opacity = ringOpacity.current
    }
    if (focusRingRef.current) {
      focusRingRef.current.visible = ringOpacity.current > 0.012
      const pulse = reducedMotion ? 1 : 1 + Math.sin(performance.now() * 0.0022) * 0.03
      focusRingRef.current.scale.setScalar(pulse)
    }
  })

  const sphereGeometry =
    quality === 'low' ? LOW_DETAIL_SPHERE : quality === 'medium' ? MEDIUM_DETAIL_SPHERE : HIGH_DETAIL_SPHERE

  const handleClick = (): void => {
    selectBody(body.id)
    focusBody(body.id, 'planet', 6)
    if (body.id === 'earth') {
      showToast('Hello, Earth! You are standing on me right now.', 'fun')
      registerDiscovery('hello-earth')
    }
  }

  return (
    <group ref={orbitRef}>
      <group ref={tiltRef} rotation={[0, 0, body.axialTiltDeg * (Math.PI / 180)]}>
        <group ref={spinRef} scale={flattenScale}>
          <mesh
            geometry={sphereGeometry}
            material={surfaceMaterial}
            scale={radius}
            onPointerOver={(event) => {
              event.stopPropagation()
              setHovered(body.id)
            }}
            onPointerOut={() => setHovered(null)}
            onClick={(event) => {
              event.stopPropagation()
              handleClick()
            }}
            onDoubleClick={(event) => {
              event.stopPropagation()
              focusBody(body.id, 'follow', 5)
            }}
          />

          {cloudsMaterial ? (
            <mesh ref={cloudsRef} geometry={sphereGeometry} material={cloudsMaterial} scale={radius * 1.012} />
          ) : null}
        </group>

        {visuals.rings ? <Rings radius={radius} visuals={visuals.rings} opacity={1} /> : null}

        {/* Atmosphere and city lights hug the same flattened figure as the planet
            itself, so a squashed giant does not wear a round haze. They are hidden
            automatically when the body shrinks to a distant dot. */}
        <group ref={detailRef} scale={flattenScale}>
          {visuals.atmosphere ? (
            <Atmosphere radius={radius} visuals={visuals.atmosphere} sunPosition={SUN_POSITION} />
          ) : null}
          {visuals.nightLights ? (
            <NightLights radius={radius} visuals={visuals.nightLights} sunPosition={SUN_POSITION} />
          ) : null}
        </group>
      </group>

      {/* Selection ring, drawn flat on the ecliptic so it reads as an orbit marker. */}
      <mesh ref={focusRingRef} geometry={focusRingGeometry} rotation={[-Math.PI / 2, 0, 0]} visible={false}>
        <meshBasicMaterial
          ref={focusRingMaterialRef}
          color={visuals.accent}
          transparent
          opacity={0}
          blending={AdditiveBlending}
          side={DoubleSide}
          depthWrite={false}
          toneMapped={false}
        />
      </mesh>

      <group>
        {satellites.map((satellite) => (
          <Moon
            key={satellite.id}
            satellite={satellite}
            parentId={body.id}
            parentRadius={radius}
            quality={quality}
            bodyId={satellite.id === 'moon' ? 'moon' : undefined}
            nameOverride={satellite.id === 'guest-moon' ? satellite.name : undefined}
            inclinationDeg={MOON_INCLINATIONS[satellite.id] ?? 0}
          />
        ))}
      </group>

      {showLabels ? (
        <PlanetLabel
          bodyId={body.id}
          name={body.name}
          accent={visuals.accent}
          offset={Math.max(radius * 1.7, radius + 0.22)}
        />
      ) : null}
    </group>
  )
}