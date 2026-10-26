import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshStandardMaterial, RepeatWrapping } from 'three'
import type { BufferGeometry, Mesh, Texture } from 'three'
import type { WaterVisuals } from '../../data/visuals'
import { getTexture } from '../../utils/textures'
import { useSimulationStore } from '../../store/simulationStore'
import {
  WATER_FRAGMENT_BODY,
  WATER_FRAGMENT_PARS,
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
}

export function Ocean({ radius, geometry, visuals, bathymetry, waterMask, depthExponent, uvOffset }: OceanProps) {
  const meshRef = useRef<Mesh>(null)
  const opacity = useSimulationStore((state) => state.earthSeawaterOpacity)

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
    }
    return water
  }, [visuals, waterMask, normalMap, uniforms])

  useEffect(() => () => material.dispose(), [material])

  useFrame((_, delta) => {
    // The ripples drift so the surface stays alive; the slider is a live uniform,
    // never a material rebuild.
    normalMap.offset.x = (normalMap.offset.x + visuals.drift[0] * delta) % 1
    normalMap.offset.y = (normalMap.offset.y + visuals.drift[1] * delta) % 1
    uniforms.uniforms.uWaterAlpha.value = waterAlpha(opacity, visuals.revealGamma)
  })

  return (
    <mesh
      ref={meshRef}
      geometry={geometry}
      material={material}
      scale={radius}
      renderOrder={1}
      // The water is a visual layer only: keep it out of pointer picking so the
      // planet underneath still receives hover and click.
      raycast={() => null}
    />
  )
}
