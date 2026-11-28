import { Vector2, Vector3 } from 'three'
import type { Texture } from 'three'
import type { EarthMapVisuals } from '../../data/earthMap'
import { TERRAIN_COAST_TAPER_TEXELS, TERRAIN_HEIGHT_GLSL, TERRAIN_KERNEL_MIN_TEXELS } from './terrain'

/**
 * The GLSL the World-map overlay shares between its lines and its markers.
 *
 * Three jobs, and the first two have to agree with the planet underneath:
 *
 *  - **Terrain.** The overlay is a set of unit-sphere directions, not a shell at
 *    a fixed height. Each vertex samples the same elevation model the surface is
 *    built from and pushes itself out by the same amount, so a border climbs the
 *    Andes instead of sinking into them — and because it reads the model in the
 *    shader, moving the "Terrain relief" slider is a uniform write rather than a
 *    geometry rebuild. The longitude/latitude → UV step inverts the sphere's own
 *    mapping (`lonLatToDirection` in `utils/geo.ts`), so the sampled texel is the
 *    one under that point.
 *
 *    It is not enough to sample the model at the point, though: the *ground the
 *    eye sees* is the surface mesh's own interpolation. A sphere carries a few
 *    hundred segments, so the mesh reads the model only at its grid corners and
 *    joins them with straight facets. A facet is a chord, and a chord cuts
 *    *below* a convex summit and *above* a concave valley — so a border drawn at
 *    the model's true height hangs above a peak (the summit the mesh never
 *    reaches) and buries itself in a valley. Both were visible from the day the
 *    overlay shipped. `earthMapGroundHeight` therefore reproduces the mesh's own
 *    arithmetic — snap to its grid, then interpolate across its triangle — so the
 *    line lands on the ground the mesh actually draws.
 *  - **Day and night.** The overlay is unlit geometry, so without this it would
 *    glow through the night side. `earthMapDay` fades it toward the terminator
 *    exactly as the city lights brighten there, keeping the globe's lighting
 *    honest.
 *  - **Depth.** Even lying exactly on the surface, the line and the ground are
 *    coplanar, and floating-point rounding alone would stipple the line away, so
 *    `earthMapLift` pulls each vertex toward the camera by a hair. The cost on
 *    screen is nil: moving a point along its own view ray is a uniform scaling of
 *    its view-space position, so its projection is untouched and only its depth
 *    changes.
 */
export const EARTH_MAP_PARS = /* glsl */ `
uniform sampler2D uEarthHeightMap;
uniform sampler2D uWaterMask;
uniform float uTerrainScale;
uniform float uTerrainBias;
uniform float uTerrainUvOffset;
uniform vec2 uTerrainTexel;
uniform float uTerrainCoastTaper;
uniform float uTerrainKernelTexels;
uniform vec2 uMeshSegments;
uniform vec3 uSunDirection;
uniform float uDayFade;
uniform float uCameraLift;
const float EARTH_MAP_PI = 3.141592653589793;

${TERRAIN_HEIGHT_GLSL}

// One grid corner's rise: the band-limited elevation, exaggerated, then faded to
// sea level across the coastal apron. Shared by the surface and the overlay so a
// border never floats above the ground the mesh draws.
float terrainRiseAt(
  sampler2D heightMap,
  sampler2D mask,
  vec2 mapUv,
  vec2 cell,
  vec2 taperRadius
) {
  float rise = terrainHeightAt(heightMap, mapUv, cell) * uTerrainScale + uTerrainBias;
  if (uTerrainCoastTaper > 0.0) {
    float landness = terrainLandnessAt(mask, mapUv, taperRadius);
    rise *= smoothstep(0.5, 1.0, landness);
  }
  return rise;
}

// The rise the surface mesh shows at a map coordinate, in sphere radii.
//
// The mesh samples the elevation model at the corners of its own grid — its uv
// runs 0…1 in even steps, and the surface shader reads the model at
// uv + uTerrainUvOffset — then interpolates those four corners across each
// triangle. Reproducing that here is what keeps the overlay on the ground instead
// of on the model: the two differ wherever the terrain curves. Each corner is read
// through the same band-limited sampler and the same coastal taper the surface
// uses (see TERRAIN_HEIGHT_GLSL and TERRAIN_VERTEX_DISPLACE), so the overlay
// also agrees with the relief's own smoothing and does not hang off a coastal
// blade the mesh no longer draws.
float earthMapGroundHeight(vec2 mapUv) {
  float columns = max(uMeshSegments.x, 1.0);
  float rows = max(uMeshSegments.y, 1.0);
  vec2 meshCell = vec2(1.0) / max(uMeshSegments, vec2(1.0));
  vec2 texel = max(uTerrainTexel, vec2(1e-6));
  vec2 cell = max(meshCell, texel * uTerrainKernelTexels);
  // The same apron the surface fades its rise over (see TERRAIN_VERTEX_DISPLACE).
  float taperTexels = max(
    uTerrainCoastTaper,
    max(meshCell.x / texel.x, meshCell.y / texel.y)
  );
  vec2 taperRadius = texel * taperTexels;
  // The point's position in the mesh's grid, measured in cells.
  float gu = (mapUv.x - uTerrainUvOffset) * columns;
  float gv = clamp((1.0 - mapUv.y) * rows, 0.0, rows - 1e-3);
  float iu = floor(gu);
  float iv = floor(gv);
  float au = gu - iu;
  float av = gv - iv;
  // The four grid corners, at the map coordinates the surface samples. Each is
  // turned into the same rise the surface draws there: texel → displacement, then
  // faded to sea level by how far inland the corner is.
  float u0 = iu / columns + uTerrainUvOffset;
  float u1 = (iu + 1.0) / columns + uTerrainUvOffset;
  float v0 = 1.0 - iv / rows;
  float v1 = 1.0 - (iv + 1.0) / rows;
  float hA = terrainRiseAt(uEarthHeightMap, uWaterMask, vec2(u1, v0), cell, taperRadius);
  float hB = terrainRiseAt(uEarthHeightMap, uWaterMask, vec2(u0, v0), cell, taperRadius);
  float hC = terrainRiseAt(uEarthHeightMap, uWaterMask, vec2(u0, v1), cell, taperRadius);
  float hD = terrainRiseAt(uEarthHeightMap, uWaterMask, vec2(u1, v1), cell, taperRadius);
  // SphereGeometry splits each quad along the B–D diagonal, and skips the
  // triangle that would be degenerate in the pole rows; match that split so the
  // interpolation is the mesh's, not merely a bilinear guess.
  bool northCap = iv < 0.5;
  bool southCap = iv > rows - 1.5;
  if (southCap || (!northCap && au >= av)) {
    // Triangle A-B-D (the au ≥ av half).
    return hA * (au - av) + hB * (1.0 - au) + hD * av;
  }
  // Triangle B-C-D (the au ≤ av half).
  return hB * (1.0 - av) + hC * (av - au) + hD * au;
}

vec3 earthMapDisplace(vec3 unitDir) {
  float theta = acos(clamp(unitDir.y, -1.0, 1.0));
  float phi = atan(unitDir.z, -unitDir.x);
  vec2 mapUv = vec2(phi / (2.0 * EARTH_MAP_PI) + uTerrainUvOffset, 1.0 - theta / EARTH_MAP_PI);
  return unitDir * (1.0 + earthMapGroundHeight(mapUv));
}

// Pulls a view-space point toward the camera by uCameraLift. The scale is held
// at a half so a camera flown right down onto the surface can never push a
// vertex through itself and out the back.
vec4 earthMapLift(vec4 viewPosition) {
  float distance = max(length(viewPosition.xyz), 1e-4);
  float scale = max(1.0 - uCameraLift / distance, 0.5);
  return vec4(viewPosition.xyz * scale, viewPosition.w);
}

float earthMapDay(vec3 unitDir) {
  float lit = smoothstep(-0.15, 0.28, dot(normalize(unitDir), uSunDirection));
  return mix(1.0, lit, uDayFade);
}
`

/** The uniforms `EARTH_MAP_PARS` declares, ready to attach to a material. */
export interface EarthMapUniforms {
  uEarthHeightMap: { value: Texture }
  /** The ocean's water mask (the red channel of the roughness map). */
  uWaterMask: { value: Texture }
  uTerrainScale: { value: number }
  uTerrainBias: { value: number }
  uTerrainUvOffset: { value: number }
  /** One texel of the elevation model, in map UV. */
  uTerrainTexel: { value: Vector2 }
  /** The coastal apron floor, in model texels (see `terrain.ts`). */
  uTerrainCoastTaper: { value: number }
  /** The narrowest elevation kernel, in model texels (see `terrain.ts`). */
  uTerrainKernelTexels: { value: number }
  /**
   * The surface mesh's own tessellation — `widthSegments`, `heightSegments` — so
   * `earthMapGroundHeight` can land on the same facets the mesh draws. Kept live
   * by `EarthMap`, because the planet climbs a level of detail as it fills the
   * view.
   */
  uMeshSegments: { value: Vector2 }
  uSunDirection: { value: Vector3 }
  uDayFade: { value: number }
  /**
   * How far the overlay is pulled toward the camera, in world units — just
   * enough to beat the coplanar ground's rounding. Sized by `EarthMap` from the
   * planet's drawn radius (see `data/earthMap.ts`).
   */
  uCameraLift: { value: number }
}

export function createEarthMapUniforms(
  heightMap: Texture,
  waterMask: Texture,
  uvOffsetU: number,
  visuals: EarthMapVisuals,
): EarthMapUniforms {
  // One texel of the elevation model as uploaded — the same figure the surface's
  // own displacement uses (see `createTerrainUniforms`).
  const image = heightMap.image as
    | { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number }
    | undefined
  const mapWidth = image?.naturalWidth ?? image?.width ?? 2048
  const mapHeight = image?.naturalHeight ?? image?.height ?? 1024
  return {
    uEarthHeightMap: { value: heightMap },
    uWaterMask: { value: waterMask },
    // The relief numbers are filled in by `EarthMap` and kept live there, so
    // moving the slider costs a uniform write and never a geometry rebuild.
    uTerrainScale: { value: 0 },
    uTerrainBias: { value: 0 },
    uTerrainUvOffset: { value: uvOffsetU },
    uTerrainTexel: { value: new Vector2(1 / mapWidth, 1 / mapHeight) },
    uTerrainCoastTaper: { value: TERRAIN_COAST_TAPER_TEXELS },
    uTerrainKernelTexels: { value: TERRAIN_KERNEL_MIN_TEXELS },
    // Filled in from the live surface mesh (see `EarthMap`).
    uMeshSegments: { value: new Vector2(1, 1) },
    // Filled in every frame from the live camera/rotation (see `EarthMap`).
    uSunDirection: { value: new Vector3(0, 0, 1) },
    uDayFade: { value: visuals.dayFade },
    // Filled in from the planet's drawn radius (see `EarthMap`).
    uCameraLift: { value: 0 },
  }
}
