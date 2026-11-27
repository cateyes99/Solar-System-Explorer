import { Vector2, Vector3 } from 'three'
import type { Texture } from 'three'
import type { EarthMapVisuals } from '../../data/earthMap'
import { TERRAIN_FIELD_UV_GLSL } from './terrainFields'

/**
 * The GLSL the World-map overlay shares between its lines and its markers.
 *
 * Terrain follows the actual surface facets, not a fresh height sample at the
 * overlay point. In Volumetric mode each grid corner reads the same active-LOD
 * filtered height and coast weight as the solid globe. The completed corner
 * relief is then interpolated, so the overlay cannot float above a coast that
 * the globe has deliberately lowered. Surface mode retains the original raw
 * DEM path. The remaining helpers handle day/night and a tiny depth-only lift.
 */
export const EARTH_MAP_PARS = /* glsl */ `
uniform sampler2D uEarthHeightMap;
uniform sampler2D uTerrainHeightField;
uniform sampler2D uTerrainCoastWeight;
uniform float uTerrainScale;
uniform float uTerrainBias;
uniform float uTerrainUvOffset;
uniform float uLayeredWater;
uniform vec2 uMeshSegments;
uniform vec3 uSunDirection;
uniform float uDayFade;
uniform float uCameraLift;
const float EARTH_MAP_PI = 3.141592653589793;
${TERRAIN_FIELD_UV_GLSL}

// Return filteredHeight × weight and weight at one real sphere-grid corner.
// Their two sums stay linear in the live scale and bias after interpolation.
vec2 earthMapVertexSample(vec2 sphereUv, vec2 mapUv) {
  if (uLayeredWater > 0.5) {
    vec2 fieldUv = terrainFieldUv(sphereUv, uMeshSegments);
    float height = texture2D(uTerrainHeightField, fieldUv).r;
    float weight = texture2D(uTerrainCoastWeight, fieldUv).r;
    return vec2(height * weight, weight);
  }
  return vec2(texture2D(uEarthHeightMap, mapUv).x, 1.0);
}

vec2 earthMapGroundSample(vec2 mapUv) {
  float columns = max(uMeshSegments.x, 1.0);
  float rows = max(uMeshSegments.y, 1.0);
  float gu = fract(mapUv.x - uTerrainUvOffset) * columns;
  float gv = clamp((1.0 - mapUv.y) * rows, 0.0, rows - 1e-3);
  float iu = floor(gu);
  float iv = floor(gv);
  float au = gu - iu;
  float av = gv - iv;
  float u0 = iu / columns;
  float u1 = (iu + 1.0) / columns;
  float v0 = 1.0 - iv / rows;
  float v1 = 1.0 - (iv + 1.0) / rows;
  bool northCap = iv < 0.5;
  bool southCap = iv > rows - 1.5;

  vec2 sphereA = vec2(u1, v0);
  vec2 sphereB = vec2(u0, v0);
  vec2 sphereC = vec2(u0, v1);
  vec2 sphereD = vec2(u1, v1);
  // These are the actual UV adjustments made by SphereGeometry at its poles.
  if (northCap) {
    sphereA.x += 0.5 / columns;
    sphereB.x += 0.5 / columns;
  }
  if (southCap) {
    sphereC.x -= 0.5 / columns;
    sphereD.x -= 0.5 / columns;
  }
  vec2 offset = vec2(uTerrainUvOffset, 0.0);
  vec2 hA = earthMapVertexSample(sphereA, sphereA + offset);
  vec2 hB = earthMapVertexSample(sphereB, sphereB + offset);
  vec2 hC = earthMapVertexSample(sphereC, sphereC + offset);
  vec2 hD = earthMapVertexSample(sphereD, sphereD + offset);

  // SphereGeometry uses B-C-D at the north cap, A-B-D at the south cap,
  // and splits ordinary quads along B-D.
  if (southCap || (!northCap && au >= av)) {
    return hA * (au - av) + hB * (1.0 - au) + hD * av;
  }
  return hB * (1.0 - av) + hC * (av - au) + hD * au;
}

vec3 earthMapDisplace(vec3 unitDir) {
  float theta = acos(clamp(unitDir.y, -1.0, 1.0));
  float phi = atan(unitDir.z, -unitDir.x);
  vec2 mapUv = vec2(phi / (2.0 * EARTH_MAP_PI) + uTerrainUvOffset, 1.0 - theta / EARTH_MAP_PI);
  vec2 ground = earthMapGroundSample(mapUv);
  return unitDir * (1.0 + ground.x * uTerrainScale + ground.y * uTerrainBias);
}

// Pulls a view-space point toward the camera without changing its projection.
vec4 earthMapLift(vec4 viewPosition) {
  float distance = max(length(viewPosition.xyz), 1e-4);
  float scale = max(1.0 - uCameraLift / distance, 0.5);
  return viewPosition * vec4(scale, scale, scale, 1.0);
}

float earthMapDay(vec3 unitDir) {
  float lit = smoothstep(-0.15, 0.28, dot(normalize(unitDir), uSunDirection));
  return mix(1.0, lit, uDayFade);
}
`

/** The uniforms `EARTH_MAP_PARS` declares, ready to attach to a material. */
export interface EarthMapUniforms {
  uEarthHeightMap: { value: Texture }
  uTerrainHeightField: { value: Texture }
  uTerrainCoastWeight: { value: Texture }
  uTerrainScale: { value: number }
  uTerrainBias: { value: number }
  uTerrainUvOffset: { value: number }
  uLayeredWater: { value: number }
  /** The exact surface tessellation, including its active LOD. */
  uMeshSegments: { value: Vector2 }
  uSunDirection: { value: Vector3 }
  uDayFade: { value: number }
  /** Small depth-only lift, in world units. */
  uCameraLift: { value: number }
}

export function createEarthMapUniforms(
  heightMap: Texture,
  uvOffsetU: number,
  visuals: EarthMapVisuals,
): EarthMapUniforms {
  return {
    uEarthHeightMap: { value: heightMap },
    uTerrainHeightField: { value: heightMap },
    uTerrainCoastWeight: { value: heightMap },
    uTerrainScale: { value: 0 },
    uTerrainBias: { value: 0 },
    uTerrainUvOffset: { value: uvOffsetU },
    uLayeredWater: { value: 0 },
    uMeshSegments: { value: new Vector2(1, 1) },
    uSunDirection: { value: new Vector3(0, 0, 1) },
    uDayFade: { value: visuals.dayFade },
    uCameraLift: { value: 0 },
  }
}
