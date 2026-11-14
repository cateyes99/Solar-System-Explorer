import { Vector2, Vector3 } from 'three'
import type { Texture } from 'three'
import type { EarthMapVisuals } from '../../data/earthMap'

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
uniform float uTerrainScale;
uniform float uTerrainBias;
uniform float uTerrainUvOffset;
uniform vec2 uMeshSegments;
uniform vec3 uSunDirection;
uniform float uDayFade;
uniform float uCameraLift;
const float EARTH_MAP_PI = 3.141592653589793;

// The height the surface mesh shows at a map coordinate.
//
// The mesh samples the elevation model at the corners of its own grid — its uv
// runs 0…1 in even steps, and the surface shader reads the model at
// uv + uTerrainUvOffset — then interpolates those four corner heights across
// each triangle. Reproducing that here is what keeps the overlay on the ground
// instead of on the model: the two differ wherever the terrain curves.
float earthMapGroundHeight(vec2 mapUv) {
  float columns = max(uMeshSegments.x, 1.0);
  float rows = max(uMeshSegments.y, 1.0);
  // The point's position in the mesh's grid, measured in cells.
  float gu = (mapUv.x - uTerrainUvOffset) * columns;
  float gv = clamp((1.0 - mapUv.y) * rows, 0.0, rows - 1e-3);
  float iu = floor(gu);
  float iv = floor(gv);
  float au = gu - iu;
  float av = gv - iv;
  // The four grid corners, at the map coordinates the surface samples.
  float u0 = iu / columns + uTerrainUvOffset;
  float u1 = (iu + 1.0) / columns + uTerrainUvOffset;
  float v0 = 1.0 - iv / rows;
  float v1 = 1.0 - (iv + 1.0) / rows;
  float hA = texture2D(uEarthHeightMap, vec2(u1, v0)).x;
  float hB = texture2D(uEarthHeightMap, vec2(u0, v0)).x;
  float hC = texture2D(uEarthHeightMap, vec2(u0, v1)).x;
  float hD = texture2D(uEarthHeightMap, vec2(u1, v1)).x;
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
  float height = earthMapGroundHeight(mapUv);
  return unitDir * (1.0 + height * uTerrainScale + uTerrainBias);
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
  uTerrainScale: { value: number }
  uTerrainBias: { value: number }
  uTerrainUvOffset: { value: number }
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
    // Filled in from the live surface mesh (see `EarthMap`).
    uMeshSegments: { value: new Vector2(1, 1) },
    // Filled in every frame from the live camera/rotation (see `EarthMap`).
    uSunDirection: { value: new Vector3(0, 0, 1) },
    uDayFade: { value: visuals.dayFade },
    // Filled in from the planet's drawn radius (see `EarthMap`).
    uCameraLift: { value: 0 },
  }
}
