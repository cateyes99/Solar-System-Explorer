import { Color, Vector2, Vector3 } from 'three'
import type { Texture } from 'three'
import type { WaterVisuals } from '../../data/visuals'

/**
 * The ocean surface's shader plumbing.
 *
 * The water is a **separate, genuinely transparent mesh** at sea level, drawn
 * over the seafloor mesh (`terrain.ts`), which sits at the bottom of the water
 * column. The GPU blends the two layers by the water's own alpha, so at 50% you
 * are looking through a real liquid surface at a real floor, with the parallax
 * that comes from their being at different radii.
 *
 * The material is a `MeshStandardMaterial`, so the water gets the scene's proper
 * PBR lighting and a specular response from its roughness. These chunks add the
 * three things that are specific to this app:
 *
 *  - **A wave field**, in whichever of the two models the panel's switcher
 *    selects (see `data/waveStyles.ts`). The **"spectral"** model is not a
 *    texture: a height field evaluated from the sphere's own direction
 *    (`vWaveDir`), so there is no map to seam at longitude 0, nothing pinched at
 *    the poles, and nothing to slide. A **directional spectrum** of plane waves —
 *    the real-time ocean-rendering "sum of sines" model — gives the swell, its
 *    directions fanned around a **globe-wide wind field** so each region differs;
 *    a shared **crest warp** offsets every component's phase so the wavefronts
 *    wander instead of closing into rings at each plane wave's pole; each
 *    component is gathered around its own pole into a discrete **wave source**,
 *    and is a **transient system** that fades in and out and respawns elsewhere,
 *    so the sources are never still; 3D noise advected through time gives the
 *    chop; and the waves disperse as they travel. The **"ripples"** model is the
 *    original tiling normal map, slid across the surface as a base layer plus a
 *    finer, differently-scrolling detail layer. Either way the surface normal is
 *    tilted, and the standard material lights it — which is what puts a
 *    travelling glint on the water.
 *  - **Beer's-law body colour**, so a shallow shelf keeps the bright day-map
 *    blue while the abyss falls away through teal to navy.
 *  - **Per-fragment alpha** from the water mask, so the sea fades out across the
 *    coast instead of ending at a hard line.
 */

export interface WaterUniforms {
  uniforms: {
    uWaterMask: { value: Texture }
    uBathyMap: { value: Texture }
    uSeafloorExponent: { value: number }
    uUvOffset: { value: number }
    uWaterAlpha: { value: number }
    /**
     * How far the sea surface has dropped, as a fraction of the ocean's full
     * depth (see `utils/seawater.ts`). It is the geometry counterpart of
     * `uWaterAlpha`: the mesh is also scaled to match, and this value both trims
     * the Beer's-law path to the remaining column and exposes the floor above
     * the new waterline.
     */
    uSeaLevelDrop: { value: number }
    uWaterAbsorption: { value: Vector3 }
    uWaterTint: { value: Color }
    /**
     * Which wave model draws the surface: 0 = the procedural "spectral" field,
     * 1 = the tiling "ripples" normal map. Both are compiled into the shader and
     * the choice is a uniform, so switching styles never rebuilds the material
     * (see `data/waveStyles.ts`).
     */
    uWaveStyle: { value: number }
    /**
     * The shared animation clock. In the spectral style it is advanced by the
     * slider's speed and drives the whole field; in the ripples style it
     * advances in real seconds and drives only the coastal surf pulse.
     */
    uWaveTime: { value: number }
    /* The procedural wave field (the "spectral" style; see `utils/waves.ts`) */
    /** How far the field tilts the surface normal, 0…1+. */
    uWaveStrength: { value: number }
    /** The fine chop's share of the height field. */
    uWaveChop: { value: number }
    /**
     * How far the chop's cells wander from their uniform drift, in cell-widths.
     * 0 keeps the old rigid slide; higher lets neighbouring cells drift in
     * different directions, so the fine texture churns instead of sliding.
     */
    uWaveChopFlow: { value: number }
    /**
     * How fast the chop's flow turns over: 1 is the shipped rate, 0 freezes the
     * flow (the cells still drift uniformly, just without eddying).
     */
    uWaveChopFlowRate: { value: number }
    /**
     * How fast the whole chop pattern travels, as a multiple of the shipped
     * rate: 1 is shipped, 100 is a hundred times faster, 0 freezes it. It scales
     * both the uniform drift and the flow's turnover.
     */
    uWaveChopDrift: { value: number }
    /** The swell spectrum's overall amplitude. */
    uWaveSwell: { value: number }
    /**
     * A multiplier on the swell (the directional spectrum's ring/crest pattern):
     * 0 removes it entirely, leaving only the fine chop; 1 is the shipped look.
     */
    uWaveSwellIntensity: { value: number }
    /**
     * How far the swell's crests are carried by the travel flow, in wavelengths.
     * 0 pins them to their poles (the old, fixed-ring look); higher lets the
     * rings wander in varying directions and at varying speeds.
     */
    uWaveSwellFlow: { value: number }
    /** How fast that travel flow evolves: 1 is the shipped rate. */
    uWaveSwellFlowRate: { value: number }
    /**
     * The travel flow's spatial frequency, relative to `uWaveScale`. Smaller =
     * larger, smoother flow cells, which let a big uWaveSwellFlow carry the
     * crests coherently instead of tearing them.
     */
    uWaveSwellFlowScale: { value: number }
    /**
     * A steady march on top of the flow, in wavelengths per wave-clock second:
     * 0 leaves just the flow's out-and-back sweep; higher makes the crests keep
     * travelling one way. The lifecycle bounds the accumulation.
     */
    uWaveSwellDrift: { value: number }
    /**
     * A static shear that scrunches the crests finer and denser, in the same
     * units as the drift: 0 is the normal ring size, higher makes them
     * progressively smaller and more numerous.
     */
    uWaveSwellDetail: { value: number }
    /** How many times the base wave pattern is tiled across the globe. */
    uWaveScale: { value: number }
    /** The crest warp's spatial frequency, relative to `uWaveScale` (useful 0.2–3). */
    uWaveWarpScale: { value: number }
    /** How far the crest warp bends each component's phase (useful 0–1.5). */
    uWaveWarpAmount: { value: number }
    /** The globe-wide wind field's scale (higher = smaller; useful 1–12). */
    uWaveWindScale: { value: number }
    /** How far the local wind bends each swell's direction (useful 0–1.5). */
    uWaveWindAmount: { value: number }
    /**
     * The fine wind octave's frequency, as a multiple of `uWaveWindScale`
     * (useful 1.5–6; inert while `uWaveWindAmount` is 0).
     */
    uWaveWindDetail: { value: number }
    /**
     * The base lifetime of one transient swell system, in wave-clock seconds.
     * Each spectrum component fades in, holds, fades out and respawns on a fresh
     * axis on this cadence; <= 0 switches the lifecycle off and leaves every
     * source where it is.
     */
    uWaveLife: { value: number }
    /** The fraction of a lifetime spent fading in and out (useful 0.1–0.5). */
    uWaveLifeFade: { value: number }
    /**
     * How tightly each swell system is gathered around its own pole, so it reads
     * as a discrete wave source rather than a wave that covers the whole globe.
     * 0 is the old, global spectrum; higher tightens the source (useful 0–3).
     */
    uWaveSourceFalloff: { value: number }
    /**
     * How far ahead in the respawn spiral the next source spawns — the stride of
     * the 32-slot Fibonacci spiral. Higher throws the new source further from the
     * old one. Forced odd; see `respawnStride` in `data/visuals.ts` for the
     * measured distances and which values to prefer.
     */
    uWaveRespawnStride: { value: number }
    /* The tiling ripple normal map (the "ripples" style) */
    /** The detail layer's UV scale (a finer repeat of the same ripple map). */
    uWaveRepeat2: { value: Vector2 }
    /** The detail layer's scrolling UV offset, advanced each frame. */
    uWaveOffset2: { value: Vector2 }
    /** The detail layer's normal strength. */
    uWaveScale2: { value: number }
    /** The detail layer's blend weight, 0…1 (the slider's variability). */
    uWaveBlend: { value: number }
    /** How strongly the view/distance fade applies to the base ripples, 0…1. */
    uWaveFadeStrength: { value: number }
    /* Shared by both wave styles */
    /** The planet's drawn radius, for the scale-invariant distance fade. */
    uWaveRadius: { value: number }
    /** The view-angle fade range (facing cosines; see `WaterVisuals`). */
    uWaveLimbFade: { value: Vector2 }
    /** The distance fade range (multiples of the radius). */
    uWaveDistanceFade: { value: Vector2 }
    /** The coastal surf strength, 0…1 (the slider's coastal interaction). */
    uCoastal: { value: number }
    /** The colour the breaking surf is tinted with. */
    uFoamColor: { value: Color }
  }
}

export interface WaterBinding {
  visuals: WaterVisuals
  /** The ocean roughness map; its **alpha** channel is the water mask. */
  waterMask: Texture
  /** The depth field, for Beer's law. */
  bathymetry: Texture
  depthExponent: number
  uvOffset: number
  /** The seawater-opacity slider, 0…1. */
  opacity: number
  /** How far the sea surface has dropped, 0…1 (see `utils/seawater.ts`). */
  seaLevelDrop: number
}

/**
 * The water layer's alpha for a slider value: `1 − (1 − opacity) ^ gamma`.
 * 100% → 1 (a fully opaque ocean), 0% → 0 (gone), and a mid slider already shows
 * most of the floor. It is a presentation curve — the panel note says the slider
 * is not a model of real underwater visibility.
 */
export function waterAlpha(opacity: number, revealGamma: number): number {
  const clamped = opacity < 0 ? 0 : opacity > 1 ? 1 : opacity
  return 1 - Math.pow(1 - clamped, revealGamma)
}

export function createWaterUniforms(binding: WaterBinding): WaterUniforms {
  return {
    uniforms: {
      uWaterMask: { value: binding.waterMask },
      uBathyMap: { value: binding.bathymetry },
      uSeafloorExponent: { value: binding.depthExponent },
      uUvOffset: { value: binding.uvOffset },
      uWaterAlpha: { value: waterAlpha(binding.opacity, binding.visuals.revealGamma) },
      uSeaLevelDrop: { value: binding.seaLevelDrop },
      uWaterAbsorption: { value: new Vector3(...binding.visuals.absorption) },
      uWaterTint: { value: new Color(binding.visuals.waterTint) },
      // 0 = spectral (the default); `Ocean.tsx` writes 1 for the ripples style.
      uWaveStyle: { value: 0 },
      // Inert until the slider is raised: a flat field, no chop, no surf.
      uWaveTime: { value: 0 },
      uWaveStrength: { value: 0 },
      uWaveChop: { value: 0 },
      uWaveChopFlow: { value: binding.visuals.wave?.chopFlow ?? 0 },
      uWaveChopFlowRate: { value: binding.visuals.wave?.chopFlowRate ?? 1 },
      uWaveChopDrift: { value: binding.visuals.wave?.chopDrift ?? 1 },
      uWaveSwell: { value: binding.visuals.wave?.swell ?? 0.26 },
      uWaveSwellIntensity: { value: binding.visuals.wave?.swellIntensity ?? 1 },
      uWaveSwellFlow: { value: binding.visuals.wave?.swellFlow ?? 0 },
      uWaveSwellFlowRate: { value: binding.visuals.wave?.swellFlowRate ?? 1 },
      uWaveSwellFlowScale: { value: binding.visuals.wave?.swellFlowScale ?? 0.25 },
      uWaveSwellDrift: { value: binding.visuals.wave?.swellDrift ?? 0 },
      uWaveSwellDetail: { value: binding.visuals.wave?.swellDetail ?? 0 },
      uWaveScale: { value: binding.visuals.wave?.scale ?? 1 },
      uWaveWarpScale: { value: binding.visuals.wave?.warpScale ?? 1 },
      uWaveWarpAmount: { value: binding.visuals.wave?.warpAmount ?? 0.7 },
      uWaveWindScale: { value: binding.visuals.wave?.windScale ?? 3.5 },
      uWaveWindAmount: { value: binding.visuals.wave?.windAmount ?? 0.85 },
      uWaveWindDetail: { value: binding.visuals.wave?.windDetail ?? 3 },
      uWaveLife: { value: binding.visuals.wave?.life ?? 0 },
      uWaveLifeFade: { value: binding.visuals.wave?.lifeFade ?? 0.3 },
      uWaveSourceFalloff: { value: binding.visuals.wave?.sourceFalloff ?? 0 },
      uWaveRespawnStride: { value: binding.visuals.wave?.respawnStride ?? 11 },
      // The ripples style: the base layer is the material's own normal map; the
      // detail layer is the same map at a finer repeat, scrolled separately.
      uWaveRepeat2: {
        value: new Vector2(
          (binding.visuals.ripple?.normalRepeat[0] ?? 9) *
            (binding.visuals.ripple?.detailRepeatScale ?? 1),
          (binding.visuals.ripple?.normalRepeat[1] ?? 5) *
            (binding.visuals.ripple?.detailRepeatScale ?? 1),
        ),
      },
      uWaveOffset2: { value: new Vector2(0, 0) },
      uWaveScale2: { value: binding.visuals.ripple?.detailNormalScale ?? 0 },
      // Zero until the slider is dragged up: the detail layer and the fade are
      // invisible at the baseline, so the shipped look is preserved exactly.
      uWaveBlend: { value: 0 },
      uWaveFadeStrength: { value: 0 },
      uWaveRadius: { value: 1 },
      uWaveLimbFade: { value: new Vector2(...binding.visuals.limbFade) },
      uWaveDistanceFade: { value: new Vector2(...binding.visuals.distanceFade) },
      uCoastal: { value: 0 },
      uFoamColor: { value: new Color(binding.visuals.foamColor) },
    },
  }
}

/**
 * The vertex side: the surface's own UV (for the water mask and the depth field)
 * and the object-space direction, which the wave field is evaluated from. The
 * `vWaveBasis*` varyings are the object→view rotation (each column normalised,
 * so the planet's scale drops out) and let the fragment tilt the *view-space*
 * normal by a gradient measured in object space.
 */
export const WATER_VERTEX_PARS = /* glsl */ `
varying vec2 vSeaUv;
varying vec3 vWaveDir;
varying vec3 vWaveBasisX;
varying vec3 vWaveBasisY;
varying vec3 vWaveBasisZ;
`

export const WATER_VERTEX_UV = /* glsl */ `
vSeaUv = uv;
vWaveDir = normalize(position);
vWaveBasisX = normalize(normalMatrix[0]);
vWaveBasisY = normalize(normalMatrix[1]);
vWaveBasisZ = normalize(normalMatrix[2]);
`

export const WATER_FRAGMENT_PARS = /* glsl */ `
uniform sampler2D uWaterMask;
uniform sampler2D uBathyMap;
uniform float uSeafloorExponent;
uniform float uUvOffset;
uniform float uWaterAlpha;
uniform float uSeaLevelDrop;
uniform vec3 uWaterAbsorption;
uniform vec3 uWaterTint;
uniform float uWaveStyle;
uniform float uWaveTime;
uniform float uWaveStrength;
uniform float uWaveChop;
uniform float uWaveChopFlow;
uniform float uWaveChopFlowRate;
uniform float uWaveChopDrift;
uniform float uWaveSwell;
uniform float uWaveSwellIntensity;
uniform float uWaveSwellFlow;
uniform float uWaveSwellFlowRate;
uniform float uWaveSwellFlowScale;
uniform float uWaveSwellDrift;
uniform float uWaveSwellDetail;
uniform float uWaveScale;
uniform float uWaveWarpScale;
uniform float uWaveWarpAmount;
uniform float uWaveWindScale;
uniform float uWaveWindAmount;
uniform float uWaveWindDetail;
uniform float uWaveLife;
uniform float uWaveLifeFade;
uniform float uWaveSourceFalloff;
uniform float uWaveRespawnStride;
uniform vec2 uWaveRepeat2;
uniform vec2 uWaveOffset2;
uniform float uWaveScale2;
uniform float uWaveBlend;
uniform float uWaveFadeStrength;
uniform float uWaveRadius;
uniform vec2 uWaveLimbFade;
uniform vec2 uWaveDistanceFade;
uniform float uCoastal;
uniform vec3 uFoamColor;
varying vec2 vSeaUv;
varying vec3 vWaveDir;
varying vec3 vWaveBasisX;
varying vec3 vWaveBasisY;
varying vec3 vWaveBasisZ;

// 3D value noise, sampled along the sphere's own direction: a solid field, so it
// is continuous everywhere — no seam at longitude 0, nothing pinched at the
// poles. (The same primitive the cloud deck is built from.)
float waveHash(vec3 p) {
  p = fract(p * 0.1031);
  p += dot(p, p.zyx + 31.32);
  return fract((p.x + p.y) * p.z);
}
float waveNoise(vec3 p) {
  vec3 i = floor(p);
  vec3 f = fract(p);
  vec3 u = f * f * (3.0 - 2.0 * f);
  return mix(
    mix(mix(waveHash(i + vec3(0.0, 0.0, 0.0)), waveHash(i + vec3(1.0, 0.0, 0.0)), u.x),
        mix(waveHash(i + vec3(0.0, 1.0, 0.0)), waveHash(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
    mix(mix(waveHash(i + vec3(0.0, 0.0, 1.0)), waveHash(i + vec3(1.0, 0.0, 1.0)), u.x),
        mix(waveHash(i + vec3(0.0, 1.0, 1.0)), waveHash(i + vec3(1.0, 1.0, 1.0)), u.x), u.y),
    u.z);
}
/**
 * How well a wave of angular frequency omega (radians of phase per unit of
 * arc) is resolved at this pixel. It is 1 while the wave spans several pixels
 * and eases to 0 as it shrinks toward the pixel grid — the standard screen-space
 * LOD that keeps a fine sea from breaking into moiré. footprint is the arc
 * length one pixel covers.
 */
float waveLod(float omega, float footprint) {
  float pixelsPerWave = 6.2831853 / max(omega * footprint, 1e-6);
  return smoothstep(2.0, 5.0, pixelsPerWave);
}

// Three octaves, each rotated so the noise lattice cannot line up, and each
// faded by its own LOD so the finest detail drops away before it can alias.
float waveFbmLod(vec3 p, float scale, float footprint) {
  const mat3 rot = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);
  float sum = 0.0;
  float amp = 0.5;
  float cycles = scale;
  for (int i = 0; i < 3; i++) {
    sum += amp * waveLod(6.2831853 * cycles, footprint) * waveNoise(p);
    p = rot * p * 2.02;
    cycles *= 2.02;
    amp *= 0.5;
  }
  return sum / 0.875;
}

/**
 * The fine chop alone, as a height field. The swells are added analytically by
 * the caller — their gradient is exact — so only the noise chop, which has no
 * analytic derivative, needs the finite-difference treatment.
 *
 * It is 3D noise advected through time: organic, seamless, and free of the ring
 * a plane wave leaves at its own pole. uWaveScale multiplies its frequency, so
 * the caller shrinks the sample step to match (see the normal chunk).
 */
float oceanChop(vec3 dir, float footprint) {
  float s = uWaveScale;
  // The chop runs on its own clock: uWaveChopDrift speeds the whole pattern up
  // (or down) without touching the swell, so the cells can travel as fast as the
  // eye needs. It scales both the uniform drift and the flow below.
  float ct = uWaveTime * uWaveChopDrift;
  // A slow, irregular flow that carries the cells. It is a low-frequency noise
  // field (0.3·s, so it varies over a few cells), itself drifting through time,
  // so neighbouring cells are pushed in different directions and the pattern
  // churns instead of sliding as one rigid sheet. uWaveChopFlow is the wander
  // in cell-widths; 0 leaves just the uniform drift below. uWaveChopFlowRate
  // scales how fast the flow itself turns over — 0.021 per wave-clock second at
  // the shipped rate of 1 — and the three axes use slightly different rates
  // (0.86, 1.0, 1.14) so it eddies rather than sliding as one body.
  float flowRate = uWaveChopFlowRate * 0.021;
  vec3 flow = vec3(
    waveNoise(dir * s * 0.3 + vec3(0.0, 0.0, ct * flowRate)),
    waveNoise(dir * s * 0.3 + vec3(ct * flowRate * 0.86, 0.0, 0.0) + 31.0),
    waveNoise(dir * s * 0.3 + vec3(0.0, ct * flowRate * 1.14, 0.0) + 57.0)) - 0.5;
  vec3 q = dir * s + flow * uWaveChopFlow
         + vec3(ct * 0.05, ct * 0.04, -ct * 0.045) * sqrt(s);
  return (waveFbmLod(q, s, footprint) - 0.5) * (0.5 + uWaveChop);
}

/**
 * How much of the waves survive at this fragment: 1 facing the camera and close,
 * easing to 0 at the limb and as the globe shrinks into the distance. The view
 * angle is the cosine between the surface normal and the line of sight
 * (vViewPosition points from the fragment to the camera in view space), and the
 * distance is measured in planet radii, which makes it scale-invariant. Both
 * keep fine chop from smearing at the limb or shimmering on a distant globe.
 */
float waterRippleFade(vec3 viewNormal) {
  float facing = clamp(dot(normalize(vViewPosition), viewNormal), 0.0, 1.0);
  float limb = smoothstep(uWaveLimbFade.x, uWaveLimbFade.y, facing);
  float radii = length(vViewPosition) / max(uWaveRadius, 1e-5);
  float near = 1.0 - smoothstep(uWaveDistanceFade.x, uWaveDistanceFade.y, radii);
  return limb * near;
}
`

/**
 * Injected after `map_fragment`, so `diffuseColor` already holds the day map's
 * own ocean colour — the water keeps the planet's real hue and simply attenuates
 * it with depth. The alpha is the water mask (1 over open water, fading out
 * across the coast) times the slider's alpha.
 *
 * The sea-level drop trims the water column: `waterDepth` becomes the *filled*
 * depth, so the Beer's-law tint is measured through the water that is actually
 * there, and anything above the new waterline (where the floor now stands proud
 * of the lowered surface) is discarded, exposing the seafloor mesh beneath.
 */
export const WATER_FRAGMENT_BODY = /* glsl */ `
{
  vec2 seaUv = vSeaUv + vec2(uUvOffset, 0.0);
  float waterMask = texture2D(uWaterMask, seaUv).a;
  if (waterMask * uWaterAlpha < 0.004) discard;
  // The depth fraction under this pixel, minus how far the surface has dropped:
  // 0 exactly at the waterline, 1 where the column is still at full depth.
  float waterDepth = pow(texture2D(uBathyMap, seaUv).r, uSeafloorExponent) - uSeaLevelDrop;
  // Above the waterline the floor is exposed; the opaque seafloor mesh already
  // covers these pixels, so the water steps aside.
  if (waterDepth <= 0.0) discard;
  // Beer's law, per channel: the water body absorbs its own colour with depth,
  // so a shallow shelf stays the bright day-map blue while the abyss falls away
  // through teal to navy — driven by the real depth under each pixel.
  vec3 transmittance = exp(-uWaterAbsorption * waterDepth);
  diffuseColor.rgb = diffuseColor.rgb * transmittance + uWaterTint * (1.0 - transmittance);
  diffuseColor.a = waterMask * uWaterAlpha;
  // The coastal surf: a soft band on the *water* side of the shore, gated to the
  // shallows, brightened by an animated foam term. It is invisible in a gentle
  // sea and only appears as the "Wave intensity" slider is raised (see
  // utils/waves.ts). It is pure shading — the land never moves.
  if (uCoastal > 0.002) {
    float shoreBand = smoothstep(0.06, 0.42, waterMask) * (1.0 - smoothstep(0.42, 0.9, waterMask));
    float shallow = 1.0 - smoothstep(0.0, 0.16, waterDepth);
    float foam = uCoastal * shoreBand * shallow;
    // A slow pulse reads as surf rolling in and drawing back.
    foam *= 0.6 + 0.4 * sin(waterMask * 24.0 - uWaveTime * 2.1);
    // The surf fades out with the waves, so it cannot smear into a bright ring
    // at the limb or on a distant globe.
    foam *= waterRippleFade(normalize(vNormal));
    foam = clamp(foam, 0.0, 1.0);
    diffuseColor.rgb = mix(diffuseColor.rgb, uFoamColor, foam * 0.7);
    diffuseColor.a = min(1.0, diffuseColor.a + foam * 0.35);
  }
}
`

/**
 * The surface normal of whichever wave style is active, injected after
 * `normal_fragment_maps`.
 *
 * Both styles are compiled into the shader side by side and selected by the
 * `uWaveStyle` uniform, so the panel's switcher never rebuilds the material.
 *
 * **The "spectral" style (0)** is the sea built the way real-time ocean
 * rendering builds it: a **directional spectrum** of plane waves summed in the
 * "sum of sines" model (Tessendorf 2001; GPU Gems 1, ch. 1). Eight components
 * are spread in direction around a **globe-wide wind field**, so every region
 * carries a different wave system — different angles, different strengths —
 * instead of one uniform pattern. Each component's wavenumber follows a
 * JONSWAP-like falloff, its amplitude comes from the spectrum, and it travels at
 * its own deep-water phase speed (omega proportional to sqrt(k)), so the sea
 * disperses the way a real one does.
 *
 * A plane wave on a sphere is a set of concentric circles on a fixed axis, so a
 * plain sum of sines reads as a handful of stationary "point sources", each
 * emitting rings. The spectrum is shaped so those sources behave. Every
 * component's phase is offset by a shared low-frequency **crest warp**, so the
 * wavefronts wander and interleave instead of closing into clean circles. The
 * wind carries a **fine octave**, so neighbouring regions get different axes.
 * The component is gathered around its own pole (`uWaveSourceFalloff`), so it
 * reads as a discrete source with a home region. And, most directly, it is a
 * **transient swell system**: it fades in, holds, fades out and respawns — far
 * from where it died, stepping through a Fibonacci spiral of well-spread axes
 * (`uWaveLife`) — so the sources come and go the way real wave climate does
 * instead of sitting still forever. The per-component `poleFade` then dims
 * whatever residual centre is left.
 *
 * The swell gradient is computed **analytically** (`A k cos(phase) K_tangent`),
 * which is exact and cheap; only the noise chop — which has no analytic
 * derivative — is differenced across the tangent plane. The gradient is carried
 * into view space by the per-vertex basis, the view/distance fade eases the tilt
 * away at the limb and with distance, and the whole thing collapses to a flat
 * normal at 0% intensity, so the surface is completely still.
 *
 * **The "ripples" style (1)** is the original tiling normal map. The material's
 * own `normalMap` is the base ripple layer (already applied by the standard
 * chunk above, with the slider's `normalScale`); here it is eased back toward
 * the smooth surface at the limb and with distance, then a second, finer copy of
 * the *same* map — sampled at a different scale and scrolled a different way —
 * is blended in, so the surface evolves instead of sliding as one rigid sheet.
 *
 * The material always carries the ripple normal map, so `normalMap` and `tbn`
 * exist even while the spectral style is active; that branch simply resets
 * `normal` to the geometric one it started from and ignores the map.
 */
export const WATER_FRAGMENT_WAVE_NORMAL = /* glsl */ `
{
  if (uWaveStyle > 0.5) {
    // --- The tiling ripple normal map (the "ripples" style) ------------------
    // The base ripple layer is the material's own normal map, already applied by
    // the standard chunk above. Ease it back toward the smooth surface at the
    // limb and with distance, which is what stops a finely tiled map smearing or
    // shimmering there. At the baseline uWaveFadeStrength is 0, so this is
    // exactly the base normal.
    float rippleFade = waterRippleFade(waterGeoNormal);
    normal = normalize(mix(waterGeoNormal, normal, mix(1.0, rippleFade, uWaveFadeStrength)));
    #ifdef USE_NORMALMAP_TANGENTSPACE
    if (uWaveBlend > 0.002) {
      // The detail layer is the *same* ripple map sampled at a different scale
      // and scrolled a different way (its offset is advanced in Ocean.tsx).
      // The two tangent-space normals are blended by adding them and
      // re-normalising — the standard scrolling-normal-map technique.
      vec2 waveUv2 = vSeaUv * uWaveRepeat2 + uWaveOffset2;
      vec3 waveN2 = texture2D(normalMap, waveUv2).xyz * 2.0 - 1.0;
      waveN2.xy *= uWaveScale2;
      normal = normalize(normal + normalize(tbn * waveN2) * (uWaveBlend * rippleFade));
    }
    #endif
  } else {
    // --- The procedural wave field (the "spectral" style) --------------------
    // Reset to the geometric normal: the standard chunk above has already
    // replaced 'normal' with the ripple map, which this style ignores — the
    // field is built from the smooth sphere.
    normal = waterGeoNormal;
    vec3 nObj = normalize(vWaveDir);
    // A stable tangent frame on the sphere; the up swap avoids a degenerate
    // cross product at the poles.
    vec3 up = abs(nObj.y) < 0.99 ? vec3(0.0, 1.0, 0.0) : vec3(1.0, 0.0, 0.0);
    vec3 tObj = normalize(cross(nObj, up));
    vec3 bObj = cross(nObj, tObj);

    // The arc length one pixel covers: the screen-space LOD needs it to fade any
    // wave that has shrunk toward the pixel grid.
    float footprint = max(length(dFdx(vWaveDir)), length(dFdy(vWaveDir)));

    // --- The globe-wide wind -------------------------------------------------
    // A smooth direction and strength over the whole planet, so the spectrum below
    // is turned and scaled differently in every region (real wave climate is
    // strongly regional). A second, finer octave rides on top, so the wave axis
    // changes over a few hundred km rather than a whole ocean basin — that is what
    // keeps neighbouring seas from sharing one axis and converging on fixed
    // centres. The constant bias keeps the direction well-defined.
    vec3 windRaw = vec3(
      waveNoise(nObj * uWaveWindScale + 11.0),
      waveNoise(nObj * uWaveWindScale + 37.0),
      waveNoise(nObj * uWaveWindScale + 71.0)) - 0.5;
    vec3 windFine = vec3(
      waveNoise(nObj * uWaveWindScale * uWaveWindDetail + 101.0),
      waveNoise(nObj * uWaveWindScale * uWaveWindDetail + 131.0),
      waveNoise(nObj * uWaveWindScale * uWaveWindDetail + 167.0)) - 0.5;
    vec3 windDir = normalize(windRaw + windFine * 0.7 + vec3(0.25, 0.35, 0.15));
    float windStrength = 0.45 + 0.55 * waveNoise(nObj * uWaveWindScale * 0.6 + 5.0);

    // --- The crest warp ------------------------------------------------------
    // A low-frequency field that offsets every component's phase, so the wavefronts
    // wander and interleave instead of closing into rings around each component's
    // own pole (a plane wave on a sphere is concentric circles on a fixed axis —
    // the "point source" look). Sampled once and shared: it is the phase offset
    // that bends the crests, so one field serves the whole spectrum. Two octaves,
    // so the wandering is organic rather than one clean bend.
    float warp = waveNoise(nObj * uWaveScale * uWaveWarpScale + 3.0) - 0.5
               + (waveNoise(nObj * uWaveScale * uWaveWarpScale * 2.03 + 19.0) - 0.5) * 0.5;

    // --- The swell's travel --------------------------------------------------
    // A slow, evolving flow that carries the crests across the surface, so the
    // rings wander in varying directions instead of only pulsing out of their
    // fixed poles. It is a low-frequency noise field (0.25·s), itself drifting
    // through time, and each component's phase is displaced along its own
    // wavefronts by it — in wavelengths — so neighbouring crests travel at
    // different speeds and on different paths. uWaveSwellFlow 0 leaves the old
    // fixed-pole behaviour; uWaveSwellFlowRate scales how fast it evolves.
    float swellFlowRate = uWaveSwellFlowRate * 0.03;
    vec3 swellFlow = vec3(
      waveNoise(nObj * uWaveScale * uWaveSwellFlowScale + vec3(0.0, 0.0, uWaveTime * swellFlowRate)),
      waveNoise(nObj * uWaveScale * uWaveSwellFlowScale + vec3(uWaveTime * swellFlowRate * 0.83, 0.0, 0.0) + 41.0),
      waveNoise(nObj * uWaveScale * uWaveSwellFlowScale + vec3(0.0, uWaveTime * swellFlowRate * 1.17, 0.0) + 67.0)) - 0.5;

    // --- The swell's drift ---------------------------------------------------
    // A steady march on top of the flow: the crests are displaced along their own
    // wavefronts at a rate that varies slowly across the globe, so they keep
    // travelling in their own directions instead of sweeping out and back.
    // uWaveSwellDrift is the rate, in wavelengths per wave-clock second, and the
    // displacement accumulates over the system's *current generation* (see the
    // age variable below) — so it resets whenever the axis jumps, and the shear
    // stays bounded.
    // The direction is a second low-frequency noise field, so neighbouring
    // regions march different ways.
    vec3 swellDrift = vec3(
      waveNoise(nObj * uWaveScale * uWaveSwellFlowScale + 91.0),
      waveNoise(nObj * uWaveScale * uWaveSwellFlowScale + 123.0),
      waveNoise(nObj * uWaveScale * uWaveSwellFlowScale + 157.0)) - 0.5;

    // --- The swell spectrum: an analytic gradient ----------------------------
    // For h = A sin(k dot(n,K) + phase), the tangent-plane gradient is
    // A k cos(phase) * K_tangent. The components differ in direction, length
    // and amplitude, and each carries its own phase, so they never march in step.
    vec3 swellGrad = vec3(0.0);
    for (int i = 0; i < 8; i++) {
      float fi = float(i);
      // Wavenumber: a JONSWAP-like falloff, so the long swell carries the energy.
      // The band is kept fairly narrow so most components stay above the LOD
      // cutoff and actually reach the screen; the noise chop covers the fine end.
      float kBase = 4.5 * pow(1.2, fi);
      float k = kBase * uWaveScale;

      // --- The swell system's life ------------------------------------------
      // Each component is its own transient wave system: it fades in, holds, then
      // fades out and respawns on a fresh random axis somewhere else. That turns
      // the spectrum's fixed poles from permanent "point sources" into sources
      // that come and go the way real wave climate does. The schedule is a pure
      // function of the wave clock and the component index — no CPU state — and
      // the envelope is exactly zero when the axis jumps, so a respawn never pops.
      // uWaveLife <= 0 switches the lifecycle off and pins every axis in place.
      float env = 1.0;
      // How long this system has been alive in its current generation — the clock
      // the drift accumulates on, so it resets when the axis jumps.
      float age = uWaveTime;
      vec3 K0 = vec3(0.0, 1.0, 0.0);
      if (uWaveLife > 0.0) {
        // A staggered lifetime per component, so they do not all turn over at once.
        float period = uWaveLife * (0.55 + 0.9 * waveHash(vec3(fi + 0.5, 23.0, 41.0)));
        float life = uWaveTime / period + waveHash(vec3(fi + 0.5, 29.0, 47.0));
        float gen = floor(life);
        float f = fract(life);
        age = f * period;
        float fadeFrac = clamp(uWaveLifeFade, 0.01, 0.49);
        env = smoothstep(0.0, fadeFrac, f) * smoothstep(0.0, fadeFrac, 1.0 - f);
        // Where the source respawns. A fresh random axis all too often lands right
        // back on top of the one that just faded, so the new source would seem not
        // to move at all. Instead, step through a fixed Fibonacci spiral of 32
        // well-spread directions, by uWaveRespawnStride slots per generation, so
        // consecutive respawns land far apart. The stride is forced odd (coprime to
        // 32) so every slot is visited before any repeats; the per-component offset
        // keeps the eight systems out of phase, and a small hash jitter stops a slot
        // from looking stamped when it comes round again. See respawnStride in
        // data/visuals.ts for how far each stride throws and which values to use.
        float stride = 2.0 * floor(clamp(uWaveRespawnStride, 1.0, 31.0) * 0.5) + 1.0;
        float slot = mod(gen * stride + fi * 5.0, 32.0);
        float sz = 1.0 - 2.0 * (slot + 0.5) / 32.0;
        float sr = sqrt(max(0.0, 1.0 - sz * sz));
        float st = slot * 2.39996323; // the golden angle, for even spacing
        vec3 axisBase = vec3(sr * cos(st), sz, sr * sin(st));
        vec3 jitter = vec3(
          waveHash(vec3(fi + 0.5, gen + 1.0, 5.0)),
          waveHash(vec3(fi + 0.5, gen + 1.0, 9.0)),
          waveHash(vec3(fi + 0.5, gen + 1.0, 13.0))) * 2.0 - 1.0;
        K0 = normalize(axisBase + jitter * 0.15);
      } else {
        // The fixed fan of the plain spectrum: directions spread around the wind.
        float spread = (waveHash(vec3(fi + 0.5, 3.0, 7.0)) - 0.5) * 2.1;
        K0 = normalize(vec3(cos(0.6 + spread), 0.3, sin(0.6 + spread)));
      }

      vec3 K = normalize(K0 + uWaveWindAmount * windDir);
      vec3 KTangent = K - dot(K, nObj) * nObj;
      // Fade the component out where its wavefronts would collapse into a ring at
      // its own pole (where K lines up with the surface normal). Topology forces
      // every smooth phase field on a sphere to have such points; the crest warp
      // has already broken the rings, and this just cleans up the residual centre.
      float poleFade = smoothstep(0.22, 0.5, length(KTangent));
      // Gather the system around its own pole, so it reads as a discrete wave
      // source with a home region rather than a wave that covers the whole globe.
      // It is the cosine of the angle to the axis, so no acos is needed: 1 at the
      // source and ~0 at the far side. uWaveSourceFalloff 0 leaves it global.
      float sourceFalloff = exp(-(1.0 - dot(nObj, K)) * uWaveSourceFalloff);
      // Amplitude: the spectral energy at that wavenumber, scaled by the local wind,
      // the system's own life envelope, and how close we are to its source.
      float amp = uWaveSwell * uWaveSwellIntensity * windStrength / (1.0 + fi * 0.9)
                * waveLod(k, footprint) * poleFade * env * sourceFalloff;
      // Deep-water dispersion: omega proportional to sqrt(k), so long waves travel
      // faster than short ones and the sea spreads out instead of pulsing.
      float omega = sqrt(k) * 0.22;
      // The shared warp offsets this component's phase, scaled by kBase so every
      // component wanders by the same fraction of its own wavelength (uWaveScale
      // cancels: kBase is k without it).
      float phase = k * dot(nObj, K) - omega * uWaveTime
                  + waveHash(vec3(fi + 0.5, 11.0, 5.0)) * 6.2831853
                  + warp * uWaveWarpAmount * kBase
                  + dot(swellFlow, KTangent) * k * uWaveSwellFlow
                  // A static shear on the same field: uWaveSwellDetail scrunches the
                  // crests finer and denser (the drift term is the moving version).
                  + dot(swellDrift, KTangent) * k * (uWaveSwellDrift * age + uWaveSwellDetail);
      swellGrad += (amp * kBase * cos(phase)) * KTangent;
    }

    // --- The fine chop: a finite-difference gradient -------------------------
    // The step shrinks with the waves so the differences still resolve them
    // exactly, and the gradient is renormalised by the same factor, so
    // uWaveStrength means the same tilt at any wave scale.
    float e = 0.012 / uWaveScale;
    float c0 = oceanChop(nObj, footprint);
    float ct = oceanChop(normalize(nObj + tObj * e), footprint);
    float cb = oceanChop(normalize(nObj + bObj * e), footprint);
    vec3 chopGrad = ((ct - c0) * tObj + (cb - c0) * bObj) / (e * uWaveScale);

    vec3 gObj = swellGrad + chopGrad;
    vec3 gView = vWaveBasisX * gObj.x + vWaveBasisY * gObj.y + vWaveBasisZ * gObj.z;
    float fade = waterRippleFade(normal);
    normal = normalize(normal - gView * (uWaveStrength * fade));
  }
}
`
