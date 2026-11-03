import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshStandardMaterial, RepeatWrapping } from 'three'
import type { BufferGeometry, Mesh, Texture, Vector3 } from 'three'
import { oceanColourFor } from '../../data/oceanColours'
import type { WaterVisuals } from '../../data/visuals'
import { getTexture } from '../../utils/textures'
import { seaLevelDrop } from '../../utils/seawater'
import { rippleParams, spectralWaveParams } from '../../utils/waves'
import { useSimulationStore } from '../../store/simulationStore'
import {
  WATER_FRAGMENT_BODY,
  WATER_FRAGMENT_PARS,
  WATER_FRAGMENT_SKY_REFLECTION,
  WATER_FRAGMENT_WAVE_NORMAL,
  WATER_VERTEX_PARS,
  WATER_VERTEX_UV,
  createWaterUniforms,
  waterAlpha,
} from './water'

/**
 * Earth's ocean surface.
 *
 * A genuinely transparent liquid layer sitting at sea level on top of the
 * seafloor mesh. Because the two are separate surfaces at different radii, the
 * floor is seen *through* the water with real parallax rather than as a fade of
 * it, and the water carries its own Beer's-law body colour and a wave field
 * (see `water.ts`) that the scene's lighting turns into travelling glints.
 *
 * The wave field comes from whichever style the panel's switcher selects (see
 * `data/waveStyles.ts`): the living, procedural **spectral** sea, or the original
 * tiling **ripples** normal map. The choice is a shader uniform, so switching
 * never rebuilds the material.
 *
 * The material is a `MeshStandardMaterial` so it inherits the scene's lighting
 * and tone mapping; `renderOrder` keeps it under the clouds and haze.
 */
interface OceanProps {
  radius: number
  geometry: BufferGeometry
  visuals: WaterVisuals
  /** The seafloor's depth field, for Beer's law. */
  bathymetry: Texture
  /** The ocean roughness map, whose alpha channel is the water mask. */
  waterMask: Texture
  depthExponent: number
  uvOffset: number
  /**
   * How deep the deepest water lies below sea level, as a fraction of the
   * planet's radius (the seafloor's own relief dial). It is what the sea surface
   * drops through, so at 0% fill the surface reaches the deepest trench.
   */
  maxDepthRadius: number
  /**
   * The depth fraction (0…1) of the deepest point actually present in the map.
   * The sea-level fill is measured against it, so the surface reaches the deepest
   * floor exactly at 0% (see `SeafloorRelief`).
   */
  deepestFraction: number
  /**
   * When true the surface is held still: the wave field stops advecting, the
   * ripples stop scrolling and the coastal surf stops moving. The static look
   * (amplitude, chop, foam) is left as the slider set it, matching how the rest
   * of the app calms its effects.
   */
  reducedMotion: boolean
  /**
   * The Sun's world position. The Fresnel sky reflection is gated by the same
   * soft day/night term the atmosphere shell uses, so it needs the Sun's
   * position to fade out on the night side rather than glowing there.
   */
  sunPosition: Vector3
}

export function Ocean({ radius, geometry, visuals, bathymetry, waterMask, depthExponent, uvOffset, maxDepthRadius, deepestFraction, reducedMotion, sunPosition }: OceanProps) {
  const meshRef = useRef<Mesh>(null)
  const opacity = useSimulationStore((state) => state.earthSeawaterOpacity)
  const seaLevel = useSimulationStore((state) => state.earthSeaLevel)
  /**
   * How far the surface has dropped, as a depth fraction of the map's deepest
   * point (0…1). The sphere itself shrinks by the same amount (below), and the
   * shader uses it to expose the floor above the new waterline — so the two
   * always agree on where the sea is. A flat sea has nothing to drain, so the
   * control is inert when there is no depth.
   */
  const drop = maxDepthRadius > 0 ? seaLevelDrop(seaLevel) * deepestFraction : 0
  const surfaceScale = radius * (1 - drop * maxDepthRadius)

  /**
   * The tiling ripple map of the "ripples" style. It is attached to the material
   * whatever style is active — the spectral branch simply ignores it — so that
   * switching styles is a uniform write rather than a shader rebuild. The base
   * layer scrolls by mutating the texture's own offset (three.js folds that into
   * the normal-map UV transform), and the detail layer scrolls a separate uniform
   * offset in the shader.
   */
  const normalMap = useMemo(() => {
    const ripple = visuals.ripple
    if (!ripple) return null
    const map = getTexture(ripple.normalMapId)
    map.wrapS = RepeatWrapping
    map.wrapT = RepeatWrapping
    map.repeat.set(ripple.normalRepeat[0], ripple.normalRepeat[1])
    return map
  }, [visuals.ripple])

  const uniforms = useMemo(
    () =>
      createWaterUniforms({
        visuals,
        waterMask,
        bathymetry,
        depthExponent,
        uvOffset,
        opacity: useSimulationStore.getState().earthSeawaterOpacity,
        // Initialised once; `useFrame` below keeps it (and the opacity) live, so
        // dragging either slider never rebuilds the material.
        seaLevelDrop:
          maxDepthRadius > 0
            ? seaLevelDrop(useSimulationStore.getState().earthSeaLevel) * deepestFraction
            : 0,
        // The active body colour; `useFrame` keeps it live as the switcher moves.
        colour: oceanColourFor(useSimulationStore.getState().earthOceanColour),
      }),
    [visuals, waterMask, bathymetry, depthExponent, uvOffset],
  )

  const material = useMemo(() => {
    // The material always carries the ripple normal map: it is the base layer of
    // the "ripples" style, and the spectral style resets `normal` to the
    // geometric one so it costs only the (unused) fetch. The day map still
    // supplies the ocean's real colour, which Beer's law then attenuates.
    const water = new MeshStandardMaterial({
      map: getTexture('earth'),
      // Each wave style has its own roughness; this is the default style's, and
      // `useFrame` keeps it in step with whichever style is active.
      roughness: visuals.wave?.roughness ?? visuals.ripple?.roughness ?? 0.18,
      metalness: visuals.metalness,
      normalMap,
      transparent: true,
      depthWrite: false,
    })
    if (visuals.ripple) {
      water.normalScale.set(visuals.ripple.normalScale, visuals.ripple.normalScale)
    }
    water.onBeforeCompile = (shader) => {
      Object.assign(shader.uniforms, uniforms.uniforms)
      shader.vertexShader = shader.vertexShader
        .replace('#include <common>', `#include <common>\n${WATER_VERTEX_PARS}`)
        .replace('#include <begin_vertex>', `#include <begin_vertex>\n${WATER_VERTEX_UV}`)
      shader.fragmentShader = shader.fragmentShader
        .replace(
          '#include <normal_pars_fragment>',
          `#include <normal_pars_fragment>\n${WATER_FRAGMENT_PARS}`,
        )
        .replace('#include <map_fragment>', `#include <map_fragment>\n${WATER_FRAGMENT_BODY}`)
        // Both wave styles need the *geometric* normal the standard chunk started
        // from (the spectral field is built from the smooth sphere; the ripple
        // style fades its mapped normal back toward it), so it is saved just
        // before the normal-map chunk.
        .replace(
          '#include <normal_fragment_maps>',
          `vec3 waterGeoNormal = normal;\n#include <normal_fragment_maps>\n${WATER_FRAGMENT_WAVE_NORMAL}`,
        )
        // The Fresnel sky reflection is added to the finished specular lighting,
        // so it goes in right after the light accumulation and before the output.
        .replace(
          '#include <lights_fragment_end>',
          `#include <lights_fragment_end>\n${WATER_FRAGMENT_SKY_REFLECTION}`,
        )
    }
    return water
  }, [visuals, waterMask, normalMap, uniforms])

  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    // The wave style, the intensity and the sea-level/opacity sliders are read
    // live (no React re-render): every one of them is a plain uniform or material
    // write, never a rebuild.
    const store = useSimulationStore.getState()
    const style = store.earthWaveStyle
    const intensity = store.earthWaveIntensity
    const step = Math.min(delta, 0.05)
    // The Sun barely moves, but keeping the uniform fresh costs nothing and keeps
    // the sky reflection's day/night term correct in every scale mode.
    uniforms.uniforms.uWaterSunPosition.value.copy(sunPosition)
    // The "Sky reflection" slider scales the surface's tuned Fresnel strength:
    // 100% is the shipped sheen, 0% leaves only the body colour and the glint.
    uniforms.uniforms.uWaterSkyStrength.value =
      (visuals.surface?.skyStrength ?? 0) * store.earthSkyReflection
    // The "Ocean colour" switcher writes the body colour straight into its
    // uniforms, so changing preset never rebuilds the material.
    const colour = oceanColourFor(store.earthOceanColour)
    uniforms.uniforms.uWaterAbsorption.value.set(
      colour.absorption[0],
      colour.absorption[1],
      colour.absorption[2],
    )
    uniforms.uniforms.uWaterTint.value.set(colour.waterTint)
    // Tell the shader which branch to take (0 = spectral, 1 = ripples), and give
    // the surface that style's own specular roughness.
    uniforms.uniforms.uWaveStyle.value = style === 'ripples' ? 1 : 0
    const roughness = style === 'ripples' ? visuals.ripple?.roughness : visuals.wave?.roughness
    if (roughness !== undefined) material.roughness = roughness

    if (style === 'ripples') {
      const params = rippleParams(intensity)
      // Reduced motion holds the surface still — no scrolling, no surf pulse —
      // while keeping the static look the slider asked for.
      const speed = reducedMotion ? 0 : params.driftScale
      const ripple = visuals.ripple
      if (normalMap && ripple) {
        normalMap.offset.x = (normalMap.offset.x + ripple.drift[0] * speed * step) % 1
        normalMap.offset.y = (normalMap.offset.y + ripple.drift[1] * speed * step) % 1
      }
      // The detail layer scrolls a different way, so the surface evolves rather
      // than sliding as one sheet. It only exists once the slider is high.
      const offset2 = uniforms.uniforms.uWaveOffset2.value
      if (ripple) {
        offset2.x = (offset2.x + ripple.detailDrift[0] * speed * step) % 1
        offset2.y = (offset2.y + ripple.detailDrift[1] * speed * step) % 1
      }
      material.normalScale.set(params.normalScale, params.normalScale)
      uniforms.uniforms.uWaveBlend.value = params.variability
      uniforms.uniforms.uCoastal.value = params.coastal
      // The view/distance fade only applies to the base ripples above the
      // baseline, so the shipped default is never faded.
      uniforms.uniforms.uWaveFadeStrength.value = ripple ? params.fadeStrength : 0
      if (!reducedMotion) uniforms.uniforms.uWaveTime.value += step
    } else {
      const params = spectralWaveParams(intensity)
      const wave = visuals.wave
      uniforms.uniforms.uWaveStrength.value = (wave?.maxStrength ?? 0) * params.amplitude
      uniforms.uniforms.uWaveChop.value = (wave?.maxChop ?? 0) * params.variability
      uniforms.uniforms.uCoastal.value = params.coastal
      // The "Ring detail" slider, 0…1: 0 is the normal ring size and 1 the
      // finest, so it maps onto the shader's 0…10 shear range.
      uniforms.uniforms.uWaveSwellDetail.value = (wave?.swellDetailMax ?? 10) * store.earthSwellDetail
      // Reduced motion freezes the field; the slider's speed scales it otherwise.
      if (!reducedMotion) uniforms.uniforms.uWaveTime.value += step * params.speed
    }

    // The radius is the surface's *drawn* size, so the distance fade stays
    // scale-invariant as the planet grows and shrinks with the scale presets.
    uniforms.uniforms.uWaveRadius.value = surfaceScale
    uniforms.uniforms.uWaterAlpha.value = waterAlpha(opacity, visuals.revealGamma)
    uniforms.uniforms.uSeaLevelDrop.value = drop
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      // The surface is a sphere; lowering the sea level shrinks it toward the
      // deepest floor point, so at 100% it sits at sea level and at 0% it has
      // reached the trench and discards itself entirely.
      scale={surfaceScale}
      renderOrder={1}
      // The water is a visual layer only: keep it out of pointer picking so the
      // planet underneath still receives hover and click.
      raycast={() => null}
    />
  )
}
