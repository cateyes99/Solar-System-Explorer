import { Color, Vector2, Vector3 } from 'three'
import type { Texture } from 'three'
import type { SeafloorVisuals, TerrainVisuals } from '../../data/visuals'
import { EARTH_RADIUS_M, seafloorDepthRadius } from '../../utils/seawater'

/**
 * The solid Earth: land relief, and the seafloor the ocean sits on.
 *
 * Earth is the only body with an elevation model, so this is deliberately a
 * small, Earth-shaped module rather than a general terrain system. The surface
 * mesh carries the land (displaced up by the land DEM) *and* the seafloor
 * (displaced down by the bathymetry grid), and one shader serves both ocean
 * implementations (see `data/seawaterModes.ts`):
 *
 *  - **Surface** (the default): `uSeawaterOpacity` follows the panel slider, so
 *    the ocean fades in place — the floor sinks into view and its colour is
 *    revealed through a nominal, Beer's-law water column.
 *  - **Volumetric**: the floor is pinned fully drained (`uSeawaterOpacity` = 0)
 *    and a separate transparent water mesh (`water.ts` / `Ocean.tsx`) is drawn
 *    above it, so the slider only thins that layer.
 *
 * Because the two modes differ only in the value handed to that one uniform, the
 * shader is shared: at `uSeawaterOpacity` = 0 every seafloor term below reduces
 * exactly to "the floor, fully revealed".
 */

/**
 * The narrowest coastal apron the land relief fades over, in elevation-model
 * texels.
 *
 * The DEM is quantised to 8 bits over a 19 km texel grid, so its coastline is a
 * staircase, and the exaggeration (up to 160×) turns that staircase into a wall
 * standing at the water's edge: a vertex on the last land texel is pushed a
 * hundred-odd kilometres out while its seaward neighbour stays at sea level, and
 * the triangle between them is a pale fin that leans over the water. Band-limiting
 * the *height* cannot remove it, because the rise has to happen somewhere — the
 * only way out is to make it happen *gradually*: the rise is faded to zero at the
 * waterline and reaches its full value inland. About four texels (roughly 80 km)
 * is the floor; the shader widens the apron to a full mesh cell when the rung
 * being drawn is coarser than that (see `TERRAIN_VERTEX_DISPLACE`).
 */
export const TERRAIN_COAST_TAPER_TEXELS = 4

/**
 * The narrowest averaging kernel the displacement may use, in model texels.
 *
 * One mesh cell is the honest band limit for the *geometry*, but at the finest
 * rung a cell spans barely two texels of the model — not enough to average out
 * the DEM's own 8-bit staircase, which is what makes a coast read as a jagged
 * blade. Two texels is the floor that keeps the kernel above that staircase.
 */
export const TERRAIN_KERNEL_MIN_TEXELS = 2

export interface TerrainRelief {
  /**
   * How far the highest ground stands above the sea, as a fraction of the
   * planet's radius. This is the figure the shells around the surface — the
   * clouds, the haze, the city lights — have to clear.
   */
  peakRadius: number
  /** Displacement = texel × `scale` + `bias`, in object units (sphere radius 1). */
  scale: number
  bias: number
}

/**
 * Turns an elevation model plus a relief setting into the numbers the renderer
 * needs.
 *
 * The bias is chosen so that sea level lands exactly on the mean radius and only
 * land rises above it. The exaggeration is what makes any of this visible at all
 * — the true relief is 0.14% of Earth's radius, a fraction of a pixel on a globe
 * that fills the screen — and it is disclosed in the UI.
 */
export function terrainDisplacement(terrain: TerrainVisuals, relief: number): TerrainRelief {
  const exaggeration = terrain.maxExaggeration * Math.max(0, relief)
  const peakRadius = (terrain.peakElevationM / EARTH_RADIUS_M) * exaggeration
  const span = Math.max(terrain.peakTexel - terrain.seaLevelTexel, 1e-4)
  const scale = peakRadius / span
  return { peakRadius, scale, bias: -terrain.seaLevelTexel * scale }
}

export interface SeafloorRelief {
  /**
   * How far the deepest water lies below sea level, as a fraction of the
   * planet's radius. The seafloor's own relief slider sets it, independently of
   * the land's "Terrain relief", so the drained ocean can be dialled in alone.
   */
  maxDepthRadius: number
  /**
   * The depth fraction (0…1) of the deepest point **actually present** in the
   * map (`deepestTexel`), which is shallower than the encoding's ceiling. The
   * sea-level fill is measured against this, so 0% reaches the deepest floor
   * exactly rather than overshooting below it.
   */
  deepestFraction: number
}

/**
 * The seafloor's displacement numbers. The stored depth is a 0…1 *fraction* (the
 * shader inverts the map's square-root curve), so the object-space displacement
 * of a fragment is simply `−depthFraction × maxDepthRadius`.
 */
export function seafloorDisplacement(seafloor: SeafloorVisuals, relief: number): SeafloorRelief {
  return {
    maxDepthRadius: seafloorDepthRadius(
      seafloor.maxDepthMeters,
      seafloor.maxExaggeration,
      relief,
    ),
    // `depthFraction = (texel / maxTexel) ^ depthExponent`; evaluated at the map's
    // deepest texel this is the fraction the sea surface has to reach at 0%.
    deepestFraction: Math.pow(seafloor.deepestTexel / seafloor.maxTexel, seafloor.depthExponent),
  }
}

/**
 * The elevation and seafloor fields as a set of shader uniforms.
 *
 * They are held as plain `{ value }` objects so that a per-frame update is a
 * single assignment and never a shader rebuild, and they are shared with the
 * city lights so the two agree on where the ground is.
 */
export interface TerrainUniforms {
  map: Texture
  uniforms: {
    uTerrainMap: { value: Texture }
    uTerrainScale: { value: number }
    uTerrainBias: { value: number }
    uTerrainUvOffset: { value: number }
    /**
     * The surface mesh's own tessellation, as `widthSegments`/`heightSegments`.
     * `TERRAIN_HEIGHT_GLSL` turns it into the size of one mesh cell, so the
     * displacement is band-limited to what the mesh can actually hold. Kept live
     * by `Planet`, because Earth climbs a level of detail as it fills the view.
     */
    uTerrainMesh: { value: Vector2 }
    /** One texel of the elevation model, in map UV. */
    uTerrainTexel: { value: Vector2 }
    /**
     * The narrowest coastal apron, in elevation-model texels: the rise fades to
     * sea level over this distance from the waterline so the coast is a slope,
     * not a wall. The shader widens it to a full mesh cell on coarse rungs (see
     * `TERRAIN_VERTEX_DISPLACE`); 0 disables the taper and leaves the raw rise.
     */
    uTerrainCoastTaper: { value: number }
    /** The narrowest kernel any rung may use, in elevation-model texels. */
    uTerrainKernelTexels: { value: number }
    /* Seafloor (Earth only; inert while uBathyEnabled is 0) */
    uBathyMap: { value: Texture }
    uWaterMask: { value: Texture }
    uSeafloorRamp: { value: Texture }
    uSeafloorScale: { value: number }
    uSeafloorExponent: { value: number }
    /**
     * How opaque the surface's ocean is: 1 keeps the flat, photographic ocean
     * (every seafloor term is skipped), 0 shows the floor fully. It is the panel
     * slider in the "surface" mode and a pinned 0 in the "volumetric" mode.
     */
    uSeawaterOpacity: { value: number }
    uSeafloorRoughness: { value: number }
    uSeafloorBumpScale: { value: number }
    /** The reveal curve's exponent (`(1 − opacity) ^ gamma`). */
    uSeafloorRevealGamma: { value: number }
    /** Per-channel Beer–Lambert extinction (linear RGB). */
    uSeafloorAbsorption: { value: Vector3 }
    /** The colour the water column scatters toward. */
    uSeafloorWaterTint: { value: Color }
    uBathyEnabled: { value: number }
    /** 1 restores the old mirror-smooth land (the "Mountain Sheen" switch). */
    uMountainSheen: { value: number }
  }
}

/** The maps the seafloor needs, all shared with the rest of the scene. */
export interface SeafloorMaps {
  /** The grayscale depth field (0 = sea level, 255 = the deepest point). */
  bathymetry: Texture
  /** The water mask, carried in the red channel of the ocean roughness map. */
  waterMask: Texture
  /** The 1-D depth ramp. */
  ramp: Texture
}

/** A body's seafloor binding: what it looks like, its maps and its live dials. */
export interface SeafloorBinding {
  visuals: SeafloorVisuals
  maps: SeafloorMaps
  /** The seafloor-relief slider, 0…1. */
  relief: number
  /**
   * The surface's seawater opacity, 0…1. 1 leaves the flat photographic ocean
   * and 0 drains it. It is the panel slider in the "surface" mode and a pinned 0
   * in the "volumetric" mode, where the water layer carries the opacity.
   */
  opacity: number
  /** 1 when a real bathymetry map loaded, 0 when it is missing (feature off). */
  enabled: boolean
}

export function createTerrainUniforms(
  terrain: TerrainVisuals,
  map: Texture,
  relief: number,
  uvOffset: number,
  seafloor: SeafloorBinding | null = null,
  mountainSheen = false,
): TerrainUniforms {
  const start = terrainDisplacement(terrain, relief)
  const floor = seafloor ? seafloorDisplacement(seafloor.visuals, seafloor.relief) : null
  // One texel of the elevation model as uploaded — the demo can be finer on disk
  // than in memory, and the shader's kernels are measured against what it samples.
  const image = map.image as
    | { width?: number; height?: number; naturalWidth?: number; naturalHeight?: number }
    | undefined
  const mapWidth = image?.naturalWidth ?? image?.width ?? 2048
  const mapHeight = image?.naturalHeight ?? image?.height ?? 1024
  return {
    map,
    uniforms: {
      uTerrainMap: { value: map },
      uTerrainScale: { value: start.scale },
      uTerrainBias: { value: start.bias },
      uTerrainUvOffset: { value: uvOffset },
      // Written every render from the rung the surface is actually drawn on, so
      // the starting value never reaches the screen (see `Planet`).
      uTerrainMesh: { value: new Vector2(1, 1) },
      uTerrainTexel: { value: new Vector2(1 / mapWidth, 1 / mapHeight) },
      uTerrainCoastTaper: { value: TERRAIN_COAST_TAPER_TEXELS },
      uTerrainKernelTexels: { value: TERRAIN_KERNEL_MIN_TEXELS },
      uBathyMap: { value: seafloor?.maps.bathymetry ?? map },
      uWaterMask: { value: seafloor?.maps.waterMask ?? map },
      uSeafloorRamp: { value: seafloor?.maps.ramp ?? map },
      uSeafloorScale: { value: floor?.maxDepthRadius ?? 0 },
      uSeafloorExponent: { value: seafloor?.visuals.depthExponent ?? 2 },
      uSeawaterOpacity: { value: seafloor?.opacity ?? 1 },
      uSeafloorRoughness: { value: seafloor?.visuals.roughness ?? 1 },
      // The bump strength needs the planet's drawn radius, which only the caller
      // knows, so it is set alongside `material.bumpScale` (see `Planet.tsx`).
      uSeafloorBumpScale: { value: 0 },
      uSeafloorRevealGamma: { value: seafloor?.visuals.revealGamma ?? 1 },
      uSeafloorAbsorption: {
        value: seafloor
          ? new Vector3(...seafloor.visuals.absorption)
          : new Vector3(0, 0, 0),
      },
      uSeafloorWaterTint: { value: new Color(seafloor?.visuals.waterTint ?? '#000000') },
      uBathyEnabled: { value: seafloor?.enabled ? 1 : 0 },
      uMountainSheen: { value: mountainSheen ? 1 : 0 },
    },
  }
}

/**
 * The elevation the surface mesh can actually hold, at a map coordinate.
 *
 * The elevation model is far finer than the mesh: the finest rung puts one
 * vertex every ~50 km, while the map resolves a couple of texels inside that
 * cell. Reading the raw texel at a vertex therefore draws whatever happens to
 * sit under that one point, and at a coast that is a coin toss between a
 * mountain and the sea. Exaggerating the relief ~160× then draws the losing
 * toss as a blade: one vertex is pushed a few thousand metres out while its
 * neighbours stay at sea level, and the triangle between them stands up as a
 * near-radial fin smeared across the water. The same thing happens to a lesser
 * degree everywhere the ground has a sharp edge inside a cell, and the coarser
 * the rung, the worse it gets — which is why the blades are most obvious when
 * the globe is small on screen.
 *
 * The only question the mesh can answer is "how high is the ground *around*
 * this vertex?", so the field is averaged over one of the mesh's own cells
 * first. `cell` is that cell in UV (1 / the rung's segment counts), and the
 * nine taps are a box over it, the same footprint the mesh interpolates across.
 * A lone coastal texel then contributes a ninth of its height instead of all of
 * it, the ground rises over the cells that lead inland, and no single vertex can
 * become a blade. The bump map still reads the map at full resolution, so the
 * *shading* keeps every ridge the geometry cannot hold.
 *
 * The World map's overlay and the label placer read this same function, so the
 * borders, markers and names stay on the ground the mesh draws.
 *
 * `terrainLandnessAt` is the second half of the story: how far inland a point is,
 * as the fraction of land in a box of `radius` around it, read from the same
 * water mask the seafloor uses. The displacement is faded by it (see
 * `TERRAIN_VERTEX_DISPLACE`), which is what keeps the coast a slope rather than a
 * wall.
 */
export const TERRAIN_HEIGHT_GLSL = /* glsl */ `
float terrainHeightAt(sampler2D map, vec2 mapUv, vec2 cell) {
  vec2 o = cell * 0.5;
  float height = texture2D(map, mapUv).x
    + texture2D(map, mapUv + vec2(o.x, 0.0)).x
    + texture2D(map, mapUv - vec2(o.x, 0.0)).x
    + texture2D(map, mapUv + vec2(0.0, o.y)).x
    + texture2D(map, mapUv - vec2(0.0, o.y)).x
    + texture2D(map, mapUv + o).x
    + texture2D(map, mapUv - o).x
    + texture2D(map, mapUv + vec2(o.x, -o.y)).x
    + texture2D(map, mapUv + vec2(-o.x, o.y)).x;
  return height / 9.0;
}

// How far inland a map coordinate is: 0 in open water, 1 well inland, a ramp
// across the coast. The water mask is 1 on water and 0 on land, so the box
// average of *land* is a distance ramp whose width is the box.
float terrainLandnessAt(sampler2D mask, vec2 mapUv, vec2 radius) {
  float water = texture2D(mask, mapUv).r
    + texture2D(mask, mapUv + vec2(radius.x, 0.0)).r
    + texture2D(mask, mapUv - vec2(radius.x, 0.0)).r
    + texture2D(mask, mapUv + vec2(0.0, radius.y)).r
    + texture2D(mask, mapUv - vec2(0.0, radius.y)).r
    + texture2D(mask, mapUv + radius).r
    + texture2D(mask, mapUv - radius).r
    + texture2D(mask, mapUv + vec2(radius.x, -radius.y)).r
    + texture2D(mask, mapUv + vec2(-radius.x, radius.y)).r;
  return 1.0 - water / 9.0;
}
`

/** The uniform declarations a vertex shader needs to read the elevation model. */
export const TERRAIN_VERTEX_PARS = /* glsl */ `
uniform sampler2D uTerrainMap;
uniform sampler2D uWaterMask;
uniform float uTerrainScale;
uniform float uTerrainBias;
uniform float uTerrainUvOffset;
uniform vec2 uTerrainMesh;
uniform vec2 uTerrainTexel;
uniform float uTerrainCoastTaper;
uniform float uTerrainKernelTexels;
${TERRAIN_HEIGHT_GLSL}
`

/**
 * The land relief: the ground is pushed out along its own normal by the height
 * field, band-limited to what the mesh can hold (see `TERRAIN_HEIGHT_GLSL`), and
 * faded to sea level across the coastal apron. Sea level has a scale of zero, so
 * the oceans stay on the mean radius and only land moves.
 *
 * The taper is what keeps the waterline out of the picture. A rise that starts
 * abruptly at the shore is a wall however well it is averaged — and at 160×
 * exaggeration one texel of 8-bit coastline is a hundred-kilometre cliff leaning
 * over the sea. Fading the rise in from the waterline turns that cliff into the
 * foot of the slope, which is the shape a coastline has in the first place. It
 * also lowers nothing inland: the taper is exactly 1 once the box around a vertex
 * is all land.
 *
 * The apron is never narrower than one mesh cell (and never narrower than
 * `TERRAIN_COAST_TAPER_TEXELS`), because a cell is the shortest horizontal
 * distance over which the mesh can draw a slope. A fixed apron would be wide
 * enough at the finest rung and far too narrow at the coarse ones, where the cell
 * itself spans ten texels of the model.
 */
export const TERRAIN_VERTEX_DISPLACE = /* glsl */ `
{
  vec2 terrainUv = uv + vec2(uTerrainUvOffset, 0.0);
  vec2 terrainTexel = max(uTerrainTexel, vec2(1e-6));
  vec2 meshCell = vec2(1.0) / max(uTerrainMesh, vec2(1.0));
  // One cell of the rung being drawn, but never finer than the model's own
  // texel staircase (see TERRAIN_KERNEL_MIN_TEXELS).
  vec2 terrainCell = max(meshCell, terrainTexel * uTerrainKernelTexels);
  float terrainHeight = terrainHeightAt(uTerrainMap, terrainUv, terrainCell);
  float terrainRise = terrainHeight * uTerrainScale + uTerrainBias;
  // The apron, in model texels: one mesh cell, or the floor, whichever is wider.
  float taperTexels = max(
    uTerrainCoastTaper,
    max(meshCell.x / terrainTexel.x, meshCell.y / terrainTexel.y)
  );
  if (taperTexels > 0.0) {
    float landness = terrainLandnessAt(
      uWaterMask,
      terrainUv,
      terrainTexel * taperTexels
    );
    // 0 at the waterline, 1 once the whole box is inland. The mask's own soft
    // edge already spreads the coast over a couple of texels, so the ramp is a
    // little wider than the box.
    terrainRise *= smoothstep(0.5, 1.0, landness);
  }
  transformed += normalize(position) * terrainRise;
}
`

/** The seafloor's own vertex uniforms (shared by the surface material only). */
export const SEAFLOOR_VERTEX_PARS = /* glsl */ `
uniform sampler2D uBathyMap;
uniform float uSeafloorScale;
uniform float uSeafloorExponent;
uniform float uSeafloorRevealGamma;
uniform float uSeawaterOpacity;
uniform float uBathyEnabled;
varying vec2 vSeaUv;
`

/**
 * Sinks the ocean floor by the bathymetry, scaled by the seafloor-relief slider
 * and gated by the seawater opacity. At 100% opacity the term is exactly zero,
 * so the ocean is the same flat sphere it has always been; at 0% the floor drops
 * to its true (exaggerated) depth. The drop is also gated by the water mask, so
 * only water moves: land never does (the bathymetry is zero there), and neither do
 * the polar ice caps, which sit on deep ocean but are not water.
 *
 * The drop follows the same `(1 − opacity) ^ revealGamma` curve as the colour,
 * so the geometry and the shading always agree on how drained the ocean is. In
 * the "volumetric" mode `uSeawaterOpacity` is pinned to 0, which makes the term
 * the full drop — the floor simply always sits at the bottom of the water column.
 */
export const SEAFLOOR_VERTEX_DISPLACE = /* glsl */ `
vSeaUv = uv;
if (uBathyEnabled > 0.5 && uSeawaterOpacity < 0.999) {
  vec2 seaUv = uv + vec2(uTerrainUvOffset, 0.0);
  float bathyTexel = texture2D(uBathyMap, seaUv).r;
  float seaDepth = pow(bathyTexel, uSeafloorExponent);
  // Only genuine water sinks. The bathymetry grid knows the *sea floor*, not what
  // floats on it, so it also marks the ice-covered Arctic as deep ocean; the water
  // mask is 0 there (and over land), which keeps the sea ice — and the continents —
  // at sea level instead of dropping them to the floor.
  float water = texture2D(uWaterMask, seaUv).r;
  float drained = pow(1.0 - uSeawaterOpacity, uSeafloorRevealGamma);
  transformed += normalize(position) * (-seaDepth * uSeafloorScale * drained * water);
}
`

/** The seafloor's fragment uniforms and the shared "how much is revealed" term. */
export const SEAFLOOR_FRAGMENT_PARS = /* glsl */ `
uniform sampler2D uBathyMap;
uniform sampler2D uWaterMask;
uniform sampler2D uSeafloorRamp;
uniform float uSeafloorExponent;
uniform float uSeawaterOpacity;
uniform float uSeafloorRoughness;
uniform float uSeafloorBumpScale;
uniform float uSeafloorRevealGamma;
uniform vec3 uSeafloorAbsorption;
uniform vec3 uSeafloorWaterTint;
uniform float uBathyEnabled;
uniform float uTerrainUvOffset;
varying vec2 vSeaUv;

// The depth fraction at a seafloor UV: 0 at sea level, 1 at the deepest point.
float seafloorDepthAt(vec2 seaUv) {
  return pow(texture2D(uBathyMap, seaUv).r, uSeafloorExponent);
}

// Whether there is any real seafloor here at all. The water mask is soft at the
// coast, so it reaches several texels inland; without this gate the *colour*
// mix (below) would blend the ramp's pale shelf sand over dry land wherever that
// soft edge falls, drawing a bright outline around every coast and lake. Land
// has no depth in the bathymetry, so requiring a little depth keeps the blended
// edge on the water side. The first few metres are all the gate needs to reject.
float seafloorShelf(vec2 seaUv) {
  return smoothstep(0.0, 0.02, texture2D(uBathyMap, seaUv).r);
}

// How much of this pixel is ocean showing the floor through it: 0 on land and 0
// at 100% opacity, 1 where the water is fully drained. The revealGamma curve
// bends the middle of the slider (see SeafloorVisuals), and is exactly 0 and 1
// at the endpoints either way.
float seafloorReveal(vec2 seaUv) {
  float water = texture2D(uWaterMask, seaUv).r;
  return clamp(
    water * seafloorShelf(seaUv) * pow(1.0 - uSeawaterOpacity, uSeafloorRevealGamma),
    0.0,
    1.0
  );
}

// Beer–Lambert transmittance of the water column, per channel. The optical path
// grows toward the limb — a grazing view crosses far more water — and red is
// absorbed first, so the floor fades to a blue haze both with depth and at the
// edge of the disc. The coefficients are scaled for visibility, not calibrated.
vec3 seafloorTransmittance(vec2 seaUv) {
  float seaDepth = seafloorDepthAt(seaUv);
  float cosTheta = clamp(dot(normalize(vViewPosition), normalize(vNormal)), 0.12, 1.0);
  vec3 opticalDepth = uSeafloorAbsorption * seaDepth * uSeawaterOpacity / cosTheta;
  return exp(-opticalDepth);
}

// How much of the floor survives the water, as one 0…1 weight for the shading
// terms (the colour blend uses the full per-channel transmittance instead).
float seafloorVisibility(vec2 seaUv) {
  return clamp(dot(seafloorTransmittance(seaUv), vec3(0.2126, 0.7152, 0.0722)), 0.0, 1.0);
}
`

/**
 * Replaces the ocean's colour with the seafloor's as the water drains. Injected
 * after `map_fragment`, so the result is still lit and shaded normally. At 100%
 * opacity `reveal` is 0 and `diffuseColor` is untouched.
 */
export const SEAFLOOR_COLOR_BLEND = /* glsl */ `
if (uBathyEnabled > 0.5 && uSeawaterOpacity < 0.999) {
  vec2 seaUv = vSeaUv + vec2(uTerrainUvOffset, 0.0);
  vec3 transmittance = seafloorTransmittance(seaUv);
  vec3 seafloorColor = texture2D(uSeafloorRamp, vec2(seafloorDepthAt(seaUv), 0.5)).rgb;
  // What the eye actually receives: the floor, attenuated, plus the light the
  // water column itself scatters back toward the camera.
  vec3 throughWater = seafloorColor * transmittance + uSeafloorWaterTint * (1.0 - transmittance);
  diffuseColor.rgb = mix(diffuseColor.rgb, throughWater, seafloorReveal(seaUv));
}
`

/**
 * Fades the ocean's glassy sun glint out as the water drains: the floor is matte,
 * so its roughness takes over from the water's. Injected after
 * `roughnessmap_fragment`.
 */
export const SEAFLOOR_ROUGHNESS_BLEND = /* glsl */ `
if (uBathyEnabled > 0.5 && uSeawaterOpacity < 0.999) {
  vec2 seaUv = vSeaUv + vec2(uTerrainUvOffset, 0.0);
  roughnessFactor = mix(
    roughnessFactor,
    uSeafloorRoughness,
    seafloorReveal(seaUv) * seafloorVisibility(seaUv)
  );
}
`

/** The "Mountain Sheen" switch's own uniform (see `MOUNTAIN_SHEEN_ROUGHNESS`). */
export const MOUNTAIN_SHEEN_FRAGMENT_PARS = /* glsl */ `
uniform float uMountainSheen;
`

/**
 * Restores the old "mountain sheen": before the ocean-roughness map was fixed,
 * its water mask lived in the alpha channel, and the canvas premultiplied it.
 * Every land texel had alpha 0, so its green (the roughness three.js reads) was
 * uploaded as 0 — mirror-smooth land that catches a brilliant highlight when the
 * Sun grazes the mountains. The partial-alpha coast texels did *not* vanish, and
 * kept their matte green, drawing the pale rectangular frames around lakes and
 * coasts. This samples the same mask that now rides in the red channel and, when
 * the switch is on, multiplies the roughness by the old on/off result: 0 on land
 * (alpha 0), untouched everywhere the old map had any alpha at all. Injected
 * after `roughnessmap_fragment` and before the seafloor blend, so the drained
 * floor's own roughness is unchanged.
 */
export const MOUNTAIN_SHEEN_ROUGHNESS = /* glsl */ `
if (uMountainSheen > 0.5) {
  vec2 seaUv = vSeaUv + vec2(uTerrainUvOffset, 0.0);
  float water = texture2D(uWaterMask, seaUv).r;
  roughnessFactor *= step(1.0 / 255.0, water);
}
`

/**
 * Shades the fine seafloor relief the coarse mesh cannot hold. The mesh has only
 * a few hundred segments across the whole globe — nowhere near enough to carry a
 * fracture zone — so the depth field's screen-space slope tilts the surface
 * normal, exactly the way three.js's own bump map does for the land. Injected
 * after `normal_fragment_maps`; it reuses `perturbNormalArb` from the standard
 * material's bump-map support, which Earth always has (its land height map).
 */
export const SEAFLOOR_NORMAL_BUMP = /* glsl */ `
#ifdef USE_BUMPMAP
if (uBathyEnabled > 0.5 && uSeawaterOpacity < 0.999) {
  vec2 seaUv = vSeaUv + vec2(uTerrainUvOffset, 0.0);
  // The relief fades with the light that survives the water, so a deep or
  // grazing view of the floor is as smooth as it looks.
  float strength = seafloorReveal(seaUv) * seafloorVisibility(seaUv);
  if (strength > 0.002) {
    vec2 dSTdx = dFdx(seaUv);
    vec2 dSTdy = dFdy(seaUv);
    float h0 = seafloorDepthAt(seaUv);
    float hx = seafloorDepthAt(seaUv + dSTdx);
    float hy = seafloorDepthAt(seaUv + dSTdy);
    // The surface's *outward* relief is the negative of the stored depth.
    vec2 gradient = -vec2(hx - h0, hy - h0) * uSeafloorBumpScale;
    vec3 bumped = perturbNormalArb(-vViewPosition, normal, gradient, faceDirection);
    normal = normalize(mix(normal, bumped, strength));
  }
}
#endif
`
