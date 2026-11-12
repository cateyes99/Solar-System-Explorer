import { Vector3 } from 'three'
import type { Texture } from 'three'
import type { EarthMapVisuals } from '../../data/earthMap'

/**
 * The GLSL the World-map overlay shares between its lines and its markers.
 *
 * Two jobs, and both have to agree with the planet underneath:
 *
 *  - **Terrain.** The overlay is a set of unit-sphere directions, not a shell at
 *    a fixed height. Each vertex samples the same elevation model the surface
 *    mesh is displaced by and pushes itself out by the same amount, so a border
 *    climbs the Andes instead of sinking into them — and because it reads the
 *    model in the shader, moving the "Terrain relief" slider is a uniform write
 *    rather than a geometry rebuild. The longitude/latitude → UV step inverts
 *    the sphere's own mapping (`lonLatToDirection` in `utils/geo.ts`), so the
 *    sampled texel is the one under that point.
 *  - **Day and night.** The overlay is unlit geometry, so without this it would
 *    glow through the night side. `earthMapDay` fades it toward the terminator
 *    exactly as the city lights brighten there, keeping the globe's lighting
 *    honest.
 */
export const EARTH_MAP_PARS = /* glsl */ `
uniform sampler2D uEarthHeightMap;
uniform float uTerrainScale;
uniform float uTerrainBias;
uniform float uTerrainUvOffset;
uniform vec3 uSunDirection;
uniform float uDayFade;
const float EARTH_MAP_PI = 3.141592653589793;

vec3 earthMapDisplace(vec3 unitDir) {
  float theta = acos(clamp(unitDir.y, -1.0, 1.0));
  float phi = atan(unitDir.z, -unitDir.x);
  vec2 heightUv = vec2(phi / (2.0 * EARTH_MAP_PI) + uTerrainUvOffset, 1.0 - theta / EARTH_MAP_PI);
  float height = texture2D(uEarthHeightMap, heightUv).x;
  return unitDir * (1.0 + height * uTerrainScale + uTerrainBias);
}

float earthMapDay(vec3 unitDir) {
  float lit = smoothstep(-0.15, 0.28, dot(normalize(unitDir), uSunDirection));
  return mix(1.0, lit, uDayFade);
}
`

/** The uniforms `EARTH_MAP_PARS` declares, ready to attach to a material. */
export interface EarthMapUniforms {
  uEarthHeightMap: { value: Texture }
  uTerrainScale: { value: number }
  uTerrainBias: { value: number }
  uTerrainUvOffset: { value: number }
  uSunDirection: { value: Vector3 }
  uDayFade: { value: number }
}

export function createEarthMapUniforms(
  heightMap: Texture,
  uvOffsetU: number,
  visuals: EarthMapVisuals,
): EarthMapUniforms {
  return {
    uEarthHeightMap: { value: heightMap },
    // The relief numbers are filled in by `EarthMap` and kept live there, so
    // moving the slider costs a uniform write and never a geometry rebuild.
    uTerrainScale: { value: 0 },
    uTerrainBias: { value: 0 },
    uTerrainUvOffset: { value: uvOffsetU },
    // Filled in every frame from the live camera/rotation (see `EarthMap`).
    uSunDirection: { value: new Vector3(0, 0, 1) },
    uDayFade: { value: visuals.dayFade },
  }
}
