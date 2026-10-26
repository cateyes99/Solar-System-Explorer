import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, DoubleSide, MeshStandardMaterial } from 'three'
import type { Group, Mesh, MeshBasicMaterial } from 'three'
import type { CelestialBody, QualityLevel, SatelliteDefinition } from '../../types'
import { BODY_VISUALS } from '../../data/visuals'
import { MOON, satellitesOf } from '../../data/planets'
import { orbitalPositionKm } from '../../utils/astronomy'
import { clock } from '../../utils/simulationClock'
import { bodyRadius, orbitRadiusFor, sceneFromEclipticKm } from '../../utils/scale'
import { registerBody, unregisterBody } from '../../utils/bodyRegistry'
import { getTexture, hasTexture } from '../../utils/textures'
import { useSimulationStore } from '../../store/simulationStore'
import { useTranslation } from '../../i18n'
import { useContent } from '../../i18n/content'
import { smoothstep } from '../../utils/random'
import { atmosphereOpacityFromSlider } from '../../utils/atmosphere'
import {
  SPHERE_LODS,
  sphereTierForApparentSize,
  terrainTierForApparentSize,
  createRingGeometry,
} from './geometry'
import {
  SEAFLOOR_COLOR_BLEND,
  SEAFLOOR_FRAGMENT_PARS,
  SEAFLOOR_NORMAL_BUMP,
  SEAFLOOR_ROUGHNESS_BLEND,
  SEAFLOOR_VERTEX_DISPLACE,
  SEAFLOOR_VERTEX_PARS,
  TERRAIN_VERTEX_DISPLACE,
  TERRAIN_VERTEX_PARS,
  createTerrainUniforms,
  seafloorDisplacement,
  terrainDisplacement,
  type SeafloorBinding,
} from './terrain'
import { Atmosphere } from './Atmosphere'
import { Clouds } from './Clouds'
import { NightLights } from './NightLights'
import { Rings } from './Rings'
import { Moon } from './Moon'
import { PlanetLabel } from './PlanetLabel'
import { SUN_POSITION, WIDE_VIEW_FADE_IN_RADII, WIDE_VIEW_FADE_OUT_RADII } from './constants'

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
  // Mean elements of the Moon's orbit about the Earth at J2000.0: the orbit is
  // inclined 5.145°, with its node at 125.08°, perigee at 318.15° and the Moon
  // 135.27° past perigee at the epoch.
  orbitalEccentricity: MOON.orbitalEccentricity,
  orbitalInclinationDeg: MOON.orbitalInclinationDeg,
  longitudeOfAscendingNodeDeg: MOON.longitudeOfAscendingNodeDeg,
  argumentOfPeriapsisDeg: MOON.longitudeOfPeriapsisDeg - MOON.longitudeOfAscendingNodeDeg,
  meanAnomalyJ2000Deg: MOON.meanLongitudeJ2000Deg - MOON.longitudeOfPeriapsisDeg,
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

interface PlanetProps {
  body: CelestialBody
  quality: QualityLevel
  reducedMotion: boolean
  showLabels: boolean
}

export function Planet({ body, quality, reducedMotion, showLabels }: PlanetProps) {
  const { t } = useTranslation()
  const content = useContent()
  const orbitRef = useRef<Group>(null)
  const tiltRef = useRef<Group>(null)
  const spinRef = useRef<Group>(null)
  const nightSpinRef = useRef<Group>(null)
  const detailRef = useRef<Group>(null)
  const focusRingRef = useRef<Mesh>(null)
  const focusRingMaterialRef = useRef<MeshBasicMaterial>(null)

  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const customScale = useSimulationStore((state) => state.customScale)
  const orbitModel = useSimulationStore((state) => state.orbitModel)
  const whatIfId = useSimulationStore((state) => state.whatIfId)
  // Only Earth's atmosphere is adjustable. Every other world keeps the full haze
  // and — because the selector returns a constant 1 for them — never re-renders
  // when the Earth slider moves.
  const rawAtmosphere = useSimulationStore((state) =>
    body.id === 'earth' ? state.earthAtmosphereOpacity : 1,
  )
  // Earth's slider is a 0…1 haze level; the shader wants an opacity multiplier
  // (see utils/atmosphere.ts). Every other world keeps the full base atmosphere.
  const atmosphereOpacity = body.id === 'earth' ? atmosphereOpacityFromSlider(rawAtmosphere) : 1
  // Earth's clouds have their own opacity slider (0 = no clouds, 1 = full deck).
  // No other world has a cloud layer, so the selector stays 1 for them and they
  // never re-render on a drag.
  const cloudOpacitySetting = useSimulationStore((state) =>
    body.id === 'earth' ? state.earthCloudOpacity : 1,
  )
  const cloudDynamics = useSimulationStore((state) =>
    body.id === 'earth' ? state.earthCloudDynamics : 1,
  )
  const cloudCoverage = useSimulationStore((state) =>
    body.id === 'earth' ? state.earthCloudCoverage : 0.5,
  )
  // How much of the real elevation model is applied. Only a body that has one
  // reads it, so every other world keeps the constant 0 and never re-renders.
  const terrainRelief = useSimulationStore((state) =>
    body.id === 'earth' ? state.earthTerrainRelief : 0,
  )
  // The seafloor has its own relief dial and its own seawater-opacity dial. Like
  // the others, the selectors return inert constants for every other world, so
  // only Earth re-renders when these move.
  const seafloorRelief = useSimulationStore((state) =>
    body.id === 'earth' ? state.earthSeafloorRelief : 0,
  )
  const seawaterOpacity = useSimulationStore((state) =>
    body.id === 'earth' ? state.earthSeawaterOpacity : 1,
  )
  const setHovered = useSimulationStore((state) => state.setHovered)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const focusBody = useSimulationStore((state) => state.focusBody)
  const registerDiscovery = useSimulationStore((state) => state.registerDiscovery)
  const showToast = useSimulationStore((state) => state.showToast)

  const visuals = BODY_VISUALS[body.id]
  // The cloud deck is scaled by the panel's opacity slider: 0% clears the clouds
  // away entirely, 100% leaves the full shipped deck.
  const cloudOpacity = (visuals.clouds?.opacity ?? 1) * cloudOpacitySetting
  const sizeMultiplier = whatIfId === 'earth-jupiter-size' && body.id === 'earth' ? 11 : 1
  const radius = bodyRadius(body, scaleMode, customScale, orbitModel) * sizeMultiplier
  /**
   * The planet's own distance from the Sun, in scene units. Only the real-spacing
   * view needs it: there the planets are drawn far smaller than their orbits, so
   * it is handed to the moons to keep each family inside its own lane.
   */
  const orbitRadius = orbitRadiusFor(body, scaleMode, customScale, orbitModel)
  const spinFrozen = whatIfId === 'no-rotation' && body.id === 'earth'
  /**
   * The cloud deck turns through this much *more* than the planet does each
   * simulated day, so it visibly slips eastward over the surface. It is a
   * multiple of the planet's own spin rate, so it stays in step with the clock
   * (and stops when the planet is held still).
   */
  const cloudRelativeSpinPerDay =
    spinFrozen || body.rotationPeriodHours === 0 || !visuals.clouds
      ? 0
      : ((Math.PI * 2 * 24) / body.rotationPeriodHours) * visuals.clouds.speed
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

  // The sphere rung follows how large the body is on screen (see geometry.ts):
  // a distant speck needs few segments, a world filling the view needs many.
  // A displaced surface climbs two rungs further, because relief needs vertices
  // to live in and a sphere fine enough to keep a circle round is nowhere near
  // fine enough to hold a mountain range.
  const [sphereTier, setSphereTier] = useState(0)
  const sphereTierRef = useRef(0)
  const maxSphereTier = visuals.terrain
    ? quality === 'low'
      ? 3
      : quality === 'medium'
        ? 4
        : 5
    : quality === 'low'
      ? 2
      : 3

  /**
   * The relief numbers for this frame's relief setting. `peakRadius` is what
   * everything around the surface has to clear; `scale`/`bias` are the pair the
   * material and the city lights apply to the height map.
   */
  const terrain = useMemo(
    () => (visuals.terrain ? terrainDisplacement(visuals.terrain, terrainRelief) : null),
    [visuals.terrain, terrainRelief],
  )
  /**
   * The bump strength, which is not the same number as the displacement scale:
   * three.js measures the shading slope against the surface's *view-space*
   * position, so the height it compares against has to be in view-space units
   * too. The mesh's own scale turns the object-space displacement into those
   * units. (Because both sides scale with the planet, the shading looks the
   * same whether Earth is drawn large or small.)
   */
  const bumpScale = terrain ? radius * terrain.scale : 0

  /**
   * The elevation model's shader uniforms. They are built once per body and
   * shared with the city lights, so the glow lies on exactly the ground the
   * surface is displaced to.
   */
  const terrainUniforms = useMemo(() => {
    if (!visuals.terrain) return null
    const state = useSimulationStore.getState()
    // The seafloor is bound once and then dialled through its uniforms, so the
    // sliders never rebuild the material or recompile the shader. A body without
    // a bathymetry map simply gets `null` and the shader stays inert.
    const seafloor: SeafloorBinding | null = visuals.seafloor
      ? {
          visuals: visuals.seafloor,
          maps: {
            bathymetry: getTexture(visuals.seafloor.bathymetryMapId),
            // The water mask rides in the ocean roughness map's alpha channel.
            waterMask: getTexture('earthRoughness'),
            ramp: getTexture(visuals.seafloor.rampMapId),
          },
          relief: state.earthSeafloorRelief,
          opacity: state.earthSeawaterOpacity,
          enabled: hasTexture(visuals.seafloor.bathymetryMapId),
        }
      : null
    return createTerrainUniforms(
      visuals.terrain,
      getTexture(visuals.terrain.heightMapId),
      state.earthTerrainRelief,
      visuals.textureOffsetU,
      seafloor,
    )
  }, [visuals])

  const surfaceMaterial = useMemo(() => {
    const texture = getTexture(visuals.textureId)
    // The surface is aligned by shifting its maps in longitude. The albedo and
    // the ocean-roughness map are read by the standard material, which applies a
    // texture's `offset` for us. The cloud deck and the city lights are custom
    // shaders that sample their maps directly, so they cannot use `offset` — they
    // are handed the same shift as a uniform instead (see `uvOffsetU` below).
    texture.offset.x = visuals.textureOffsetU
    if (visuals.roughnessMapId) getTexture(visuals.roughnessMapId).offset.x = visuals.textureOffsetU
    const material = new MeshStandardMaterial({
      map: texture,
      roughness: visuals.roughness,
      metalness: visuals.metalness,
      // Earth varies its roughness across the surface — glassy ocean, dusty land —
      // which is what produces the sun glint on water.
      roughnessMap: visuals.roughnessMapId ? getTexture(visuals.roughnessMapId) : null,
      emissive: new Color(visuals.accent),
      emissiveIntensity: 0,
    })

    if (visuals.terrain && terrainUniforms) {
      // The real thing: the ground is genuinely three-dimensional.
      //
      //  - **Shading** comes from the material's own bump map reading the same
      //    elevation model. three.js takes the slope from the map's screen-space
      //    gradient, so the relief is lit even where the mesh is too coarse to
      //    hold it — which is what keeps the mountains visible from orbit.
      //  - **Geometry** is displaced a few lines further down the vertex shader.
      //    It is injected by hand rather than left to `material.displacementMap`
      //    so that the surface and the city lights share one set of uniforms and
      //    one definition of where the ground is.
      const heightMap = terrainUniforms.map
      heightMap.offset.x = visuals.textureOffsetU
      material.bumpMap = heightMap
      material.bumpScale = radius * terrainUniforms.uniforms.uTerrainScale.value
      material.onBeforeCompile = (shader) => {
        Object.assign(shader.uniforms, terrainUniforms.uniforms)
        shader.vertexShader = shader.vertexShader
          .replace(
            '#include <common>',
            `#include <common>\n${TERRAIN_VERTEX_PARS}\n${SEAFLOOR_VERTEX_PARS}`,
          )
          .replace(
            '#include <begin_vertex>',
            `#include <begin_vertex>\n${TERRAIN_VERTEX_DISPLACE}\n${SEAFLOOR_VERTEX_DISPLACE}`,
          )
        // The seafloor's colour and roughness blends only ever *add* to the
        // standard shader: while the seawater is opaque (`uSeawaterOpacity` = 1)
        // both branches are skipped and the surface is byte-for-byte what it was.
        shader.fragmentShader = shader.fragmentShader
          .replace('#include <common>', `#include <common>\n${SEAFLOOR_FRAGMENT_PARS}`)
          .replace('#include <map_fragment>', `#include <map_fragment>\n${SEAFLOOR_COLOR_BLEND}`)
          .replace(
            '#include <roughnessmap_fragment>',
            `#include <roughnessmap_fragment>\n${SEAFLOOR_ROUGHNESS_BLEND}`,
          )
          .replace(
            '#include <normal_fragment_maps>',
            `#include <normal_fragment_maps>\n${SEAFLOOR_NORMAL_BUMP}`,
          )
      }
    } else {
      // Everything else keeps the old trick: a real map doubles as relief,
      // because a darker texel sits lower than a bright one.
      material.bumpMap = visuals.bumpScale ? texture : null
      material.bumpScale = visuals.bumpScale ?? 0
    }
    return material
  }, [visuals, terrainUniforms])

  // Relief is a live uniform, so moving the slider — or the scale preset, which
  // changes how large the planet is drawn — retunes the mountains without
  // rebuilding (and recompiling) the surface material.
  useEffect(() => {
    if (!terrain || !terrainUniforms) return
    terrainUniforms.uniforms.uTerrainScale.value = terrain.scale
    terrainUniforms.uniforms.uTerrainBias.value = terrain.bias
    surfaceMaterial.bumpScale = bumpScale
  }, [surfaceMaterial, terrain, terrainUniforms, bumpScale])

  // The two seafloor dials are live uniforms too: dragging either slider is a
  // couple of number writes, never a material rebuild. `uBathyEnabled` is
  // re-checked so a late-arriving (or missing) bathymetry map is handled.
  useEffect(() => {
    if (!terrainUniforms || !visuals.seafloor) return
    const { uniforms } = terrainUniforms
    const floor = seafloorDisplacement(visuals.seafloor, seafloorRelief)
    uniforms.uSeawaterOpacity.value = seawaterOpacity
    uniforms.uSeafloorScale.value = floor.maxDepthRadius
    // Like the land's `material.bumpScale`, the seafloor's bump strength is the
    // object-space depth scaled by the planet's drawn radius.
    uniforms.uSeafloorBumpScale.value = radius * floor.maxDepthRadius
    uniforms.uBathyEnabled.value = hasTexture(visuals.seafloor.bathymetryMapId) ? 1 : 0
  }, [terrainUniforms, visuals.seafloor, seawaterOpacity, seafloorRelief, radius])

  const focusRingGeometry = useMemo(() => {
    const outer = Math.max(radius * visuals.focusRingScale, radius + 0.12)
    return createRingGeometry(outer * 0.965, outer)
  }, [radius, visuals.focusRingScale])

  useEffect(() => () => surfaceMaterial.dispose(), [surfaceMaterial])
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
    const ecliptic = orbitalPositionKm(body, days, orbitModel === 'realistic')
    const scene = sceneFromEclipticKm(
      ecliptic.x,
      ecliptic.y,
      ecliptic.z,
      scaleMode,
      customScale,
      orbitModel,
    )
    orbit.position.set(scene.x, scene.y, scene.z)

    // --- Axial rotation ---------------------------------------------------
    if (spinRef.current && !spinFrozen && body.rotationPeriodHours !== 0) {
      const frameDays = clock.lastFrameDays
      spinRef.current.rotation.y += (frameDays * 24 / body.rotationPeriodHours) * Math.PI * 2
    }
    // City lights are painted on the ground, so they have to turn with it. They
    // live outside the spin group (so they can share the level-of-detail fade
    // with the atmosphere), so their own wrapper is kept in lockstep here.
    if (nightSpinRef.current && spinRef.current) {
      nightSpinRef.current.rotation.y = spinRef.current.rotation.y
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
    // Match the sphere's tessellation to the body's apparent size so a close-up
    // silhouette stays round — and, for a displaced surface, so the terrain has
    // enough vertices to be there at all. Only a threshold crossing re-renders.
    const wantedTier = visuals.terrain
      ? terrainTierForApparentSize(apparentSize, maxSphereTier, sphereTierRef.current)
      : sphereTierForApparentSize(apparentSize, maxSphereTier, sphereTierRef.current)
    if (wantedTier !== sphereTierRef.current) {
      sphereTierRef.current = wantedTier
      setSphereTier(wantedTier)
    }

    // --- Hover emphasis ---------------------------------------------------
    // The glow is a pointing aid, not a badge: it answers "the pointer is on
    // this world" and nothing else. Letting selection keep it lit made a
    // selected world sit there looking luminous — worst of all on Earth, whose
    // accent is a bright cyan that washes the land and the clouds into a glass
    // ball — until some other body was clicked. Selection still has its own
    // cues: the ecliptic marker below, the brighter orbit path, the emphasised
    // label and the highlighted button in the bottom bar.
    const highlightTarget = isHovered ? 0.2 : 0
    highlight.current += (highlightTarget - highlight.current) * Math.min(1, step * 8)
    surfaceMaterial.emissiveIntensity = highlight.current

    // The marker is a distance cue: it answers "this world is selected" while the
    // world is a distant disc. It lies flat in the ecliptic, so on the way in its
    // near arc ends up between the camera and the planet and would slice a bright
    // line across the face of a close-up, so it fades out on approach.
    const radiiAway = cameraDistance / Math.max(radius, 0.001)
    const markerFade = smoothstep(WIDE_VIEW_FADE_OUT_RADII, WIDE_VIEW_FADE_IN_RADII, radiiAway)
    const ringTarget = (isSelected ? 0.55 : isHovered ? 0.3 : 0) * markerFade
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

  const sphereGeometry = SPHERE_LODS[sphereTier]

  const handleClick = (): void => {
    selectBody(body.id)
    focusBody(body.id, 'planet', 6)
    if (body.id === 'earth') {
      showToast(t('toast.helloEarth'), 'fun')
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

          {visuals.clouds ? (
            <Clouds
              // The deck is a smooth shell, not a displaced surface: it is the
              // weather *above* the ground, so it keeps the round sphere and is
              // simply lifted clear of the highest terrain instead of following it.
              geometry={sphereGeometry}
              radius={radius}
              visuals={visuals.clouds}
              sunPosition={SUN_POSITION}
              opacity={cloudOpacity}
              relativeSpinPerDay={cloudRelativeSpinPerDay}
              dynamics={cloudDynamics}
              coverage={cloudCoverage}
              reducedMotion={reducedMotion}
              uvOffsetU={visuals.textureOffsetU}
              shellLift={terrain?.peakRadius ?? 0}
            />
          ) : null}
        </group>

        {visuals.rings ? <Rings radius={radius} visuals={visuals.rings} opacity={1} /> : null}

        {/* Atmosphere and city lights hug the same flattened figure as the planet
            itself, so a squashed giant does not wear a round haze. They are hidden
            automatically when the body shrinks to a distant dot. */}
        <group ref={detailRef} scale={flattenScale}>
          {visuals.atmosphere ? (
            <Atmosphere
              radius={radius}
              visuals={visuals.atmosphere}
              sunPosition={SUN_POSITION}
              opacity={atmosphereOpacity}
              shellLift={terrain?.peakRadius ?? 0}
            />
          ) : null}
          {visuals.nightLights ? (
            <group ref={nightSpinRef}>
              <NightLights
                radius={radius}
                visuals={visuals.nightLights}
                sunPosition={SUN_POSITION}
                uvOffsetU={visuals.textureOffsetU}
                // The lights are painted on the ground, so they ride the same
                // displaced surface as the terrain instead of hovering over it.
                geometry={sphereGeometry}
                terrain={terrainUniforms}
              />
            </group>
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
            parentOrbitRadius={
              scaleMode === 'distances' && orbitModel === 'realistic' ? orbitRadius : undefined
            }
            quality={quality}
            bodyId={satellite.id === 'moon' ? 'moon' : undefined}
            nameOverride={satellite.id === 'guest-moon' ? satellite.name : undefined}
          />
        ))}
      </group>

      {showLabels ? (
        <PlanetLabel
          bodyId={body.id}
          name={content.bodyById[body.id]?.name ?? body.name}
          accent={visuals.accent}
          offset={Math.max(radius * 1.7, radius + 0.22)}
        />
      ) : null}
    </group>
  )
}