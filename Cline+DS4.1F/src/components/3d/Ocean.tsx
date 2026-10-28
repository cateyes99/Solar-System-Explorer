import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshStandardMaterial, RepeatWrapping } from 'three'
import type { BufferGeometry, Mesh, Texture } from 'three'
import type { WaterVisuals } from '../../data/visuals'
import { getTexture } from '../../utils/textures'
import { seaLevelDrop } from '../../utils/seawater'
import { waveParams } from '../../utils/waves'
import { useSimulationStore } from '../../store/simulationStore'
import {
  WATER_FRAGMENT_BODY,
  WATER_FRAGMENT_PARS,
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
 * it, and the water carries its own Beer's-law body colour, rippled normal map
 * and specular response (see `water.ts`).
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
   * When true the surface is held still: the ripples stop scrolling and the
   * coastal surf stops moving. The static look (amplitude, detail, foam) is left
   * as the slider set it, matching how the rest of the app calms its effects.
   */
  reducedMotion: boolean
}

export function Ocean({ radius, geometry, visuals, bathymetry, waterMask, depthExponent, uvOffset, maxDepthRadius, deepestFraction, reducedMotion }: OceanProps) {
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

  const normalMap = useMemo(() => {
    const map = getTexture(visuals.normalMapId)
    map.wrapS = RepeatWrapping
    map.wrapT = RepeatWrapping
    map.repeat.set(visuals.normalRepeat[0], visuals.normalRepeat[1])
    return map
  }, [visuals.normalMapId, visuals.normalRepeat])

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
      }),
    [visuals, waterMask, bathymetry, depthExponent, uvOffset],
  )

  const material = useMemo(() => {
    const water = new MeshStandardMaterial({
      map: getTexture('earth'),
      roughness: visuals.roughness,
      metalness: visuals.metalness,
      normalMap,
      transparent: true,
      depthWrite: false,
    })
    water.normalScale.set(visuals.normalScale, visuals.normalScale)
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
        // The second ripple layer needs the finished `normal` and the tangent
        // frame, so it goes in right after the standard normal-map chunk.
        .replace(
          '#include <normal_fragment_maps>',
          `#include <normal_fragment_maps>\n${WATER_FRAGMENT_WAVE_NORMAL}`,
        )
    }
    return water
  }, [visuals, waterMask, normalMap, uniforms])

  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    // The wave slider is read live (no React re-render): the intensity and the
    // sea-level/opacity sliders are all plain uniform writes, never a rebuild.
    const intensity = useSimulationStore.getState().earthWaveIntensity
    const params = waveParams(intensity)
    const step = Math.min(delta, 0.05)
    // Reduced motion holds the surface still — no scrolling, no surf pulse —
    // while keeping the static look the slider asked for.
    const speed = reducedMotion ? 0 : params.driftScale

    normalMap.offset.x = (normalMap.offset.x + visuals.drift[0] * speed * step) % 1
    normalMap.offset.y = (normalMap.offset.y + visuals.drift[1] * speed * step) % 1
    // The detail layer scrolls a different way, so the surface evolves rather
    // than sliding as one sheet. It only exists once the slider is high.
    const detail = visuals.wave
    const offset2 = uniforms.uniforms.uWaveOffset2.value
    if (detail) {
      offset2.x = (offset2.x + detail.detailDrift[0] * speed * step) % 1
      offset2.y = (offset2.y + detail.detailDrift[1] * speed * step) % 1
    }
    material.normalScale.set(params.normalScale, params.normalScale)
    uniforms.uniforms.uWaveBlend.value = params.variability
    uniforms.uniforms.uCoastal.value = params.coastal
    if (!reducedMotion) uniforms.uniforms.uWaveTime.value += step
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
