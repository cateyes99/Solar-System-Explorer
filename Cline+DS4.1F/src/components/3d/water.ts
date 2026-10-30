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
 *  - **A living wave field.** Not a texture: a height field evaluated from the
 *    sphere's own direction (`vWaveDir`), so there is no map to seam at
 *    longitude 0, nothing pinched at the poles, and nothing to slide. A
 *    **directional spectrum** of plane waves — the real-time ocean-rendering
 *    "sum of sines" model — gives the swell, its directions fanned around a
 *    **globe-wide wind field** so each region differs; 3D noise advected through
 *    time gives the chop; and the waves disperse as they travel. The surface
 *    normal is tilted from the field's tangent-plane gradient, and the standard
 *    material lights it — which is what puts a travelling glint on the water.
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
    /* The procedural wave field (see `utils/waves.ts`) */
    /** The field's clock, in real seconds, advanced by the slider's speed. */
    uWaveTime: { value: number }
    /** How far the field tilts the surface normal, 0…1+. */
    uWaveStrength: { value: number }
    /** The fine chop's share of the height field. */
    uWaveChop: { value: number }
    /** The swell spectrum's overall amplitude. */
    uWaveSwell: { value: number }
    /** How many times the base wave pattern is tiled across the globe. */
    uWaveScale: { value: number }
    /** The spatial scale of the globe-wide wind field (higher = smaller). */
    uWaveWindScale: { value: number }
    /** How far the local wind bends each swell's direction. */
    uWaveWindAmount: { value: number }
    /** The planet's drawn radius, for the scale-invariant distance fade. */
    uWaveRadius: { value: number }
    /** The view-angle fade range (facing cosines; see `WaterWaveVisuals`). */
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
      // Inert until the slider is raised: a flat field, no chop, no surf.
      uWaveTime: { value: 0 },
      uWaveStrength: { value: 0 },
      uWaveChop: { value: 0 },
      uWaveSwell: { value: binding.visuals.wave?.swell ?? 0.26 },
      uWaveScale: { value: binding.visuals.wave?.scale ?? 1 },
      uWaveWindScale: { value: binding.visuals.wave?.windScale ?? 3.5 },
      uWaveWindAmount: { value: binding.visuals.wave?.windAmount ?? 0.85 },
      uWaveRadius: { value: 1 },
      uWaveLimbFade: { value: new Vector2(...(binding.visuals.wave?.limbFade ?? [0.05, 0.35])) },
      uWaveDistanceFade: {
        value: new Vector2(...(binding.visuals.wave?.distanceFade ?? [30, 80])),
      },
      uCoastal: { value: 0 },
      uFoamColor: { value: new Color(binding.visuals.wave?.foamColor ?? '#ffffff') },
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
uniform float uWaveTime;
uniform float uWaveStrength;
uniform float uWaveChop;
uniform float uWaveSwell;
uniform float uWaveScale;
uniform float uWaveWindScale;
uniform float uWaveWindAmount;
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
  vec3 q = dir * s + vec3(uWaveTime * 0.05, uWaveTime * 0.04, -uWaveTime * 0.045) * sqrt(s);
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
 * The wave field's surface normal, injected after `normal_fragment_maps` (which
 * is a no-op here, since the water has no normal map).
 *
 * The sea is built the way real-time ocean rendering builds it: a **directional
 * spectrum** of plane waves summed in the "sum of sines" model (Tessendorf 2001;
 * GPU Gems 1, ch. 1). Six components are spread in direction around a
 * **globe-wide wind field**, so every region carries a different wave system —
 * different angles, different strengths — instead of one uniform pattern. Each
 * component's wavenumber follows a JONSWAP-like falloff, its amplitude comes from
 * the spectrum, and it travels at its own deep-water phase speed (omega
 * proportional to sqrt(k)), so the sea disperses the way a real one does. A
 * directional spectrum also dissolves the "bullseye" a single plane wave leaves
 * at its own pole, because the six ring systems interfere with each other.
 *
 * The swell gradient is computed **analytically** (`A k cos(phase) K_tangent`),
 * which is exact and cheap; only the noise chop — which has no analytic
 * derivative — is differenced across the tangent plane. The gradient is carried
 * into view space by the per-vertex basis, the view/distance fade eases the tilt
 * away at the limb and with distance, and the whole thing collapses to a flat
 * normal at 0% intensity, so the surface is completely still.
 */
export const WATER_FRAGMENT_WAVE_NORMAL = /* glsl */ `
{
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
  // strongly regional). It is low-frequency, so one sample per fragment serves
  // the whole sea. The constant bias keeps the direction well-defined.
  vec3 windRaw = vec3(
    waveNoise(nObj * uWaveWindScale + 11.0),
    waveNoise(nObj * uWaveWindScale + 37.0),
    waveNoise(nObj * uWaveWindScale + 71.0)) - 0.5;
  vec3 windDir = normalize(windRaw + vec3(0.25, 0.35, 0.15));
  float windStrength = 0.45 + 0.55 * waveNoise(nObj * uWaveWindScale * 0.6 + 5.0);

  // --- The swell spectrum: an analytic gradient ----------------------------
  // For h = A sin(k dot(n,K) + phase), the tangent-plane gradient is
  // A k cos(phase) * K_tangent. The six components differ in direction, length
  // and amplitude, and each carries its own phase, so they never march in step.
  vec3 swellGrad = vec3(0.0);
  for (int i = 0; i < 8; i++) {
    float fi = float(i);
    // Wavenumber: a JONSWAP-like falloff, so the long swell carries the energy.
    // The band is kept fairly narrow so most components stay above the LOD
    // cutoff and actually reach the screen; the noise chop covers the fine end.
    float kBase = 4.5 * pow(1.2, fi);
    float k = kBase * uWaveScale;
    // Direction: a fan around the local wind, which bends it per region. The
    // spread is about ±60°, in the range real directional spectra show.
    float spread = (waveHash(vec3(fi + 0.5, 3.0, 7.0)) - 0.5) * 2.1;
    vec3 K0 = normalize(vec3(cos(0.6 + spread), 0.3, sin(0.6 + spread)));
    vec3 K = normalize(K0 + uWaveWindAmount * windDir);
    vec3 KTangent = K - dot(K, nObj) * nObj;
    // Fade the component out where its wavefronts would collapse into a ring at
    // its own pole (where K lines up with the surface normal). Topology forces
    // every smooth phase field on a sphere to have such points; fading them is
    // what keeps the "bullseye" out of the picture.
    float poleFade = smoothstep(0.22, 0.5, length(KTangent));
    // Amplitude: the spectral energy at that wavenumber, scaled by the local wind.
    float amp = uWaveSwell * windStrength / (1.0 + fi * 0.9) * waveLod(k, footprint) * poleFade;
    // Deep-water dispersion: omega proportional to sqrt(k), so long waves travel
    // faster than short ones and the sea spreads out instead of pulsing.
    float omega = sqrt(k) * 0.22;
    float phase = k * dot(nObj, K) - omega * uWaveTime
                + waveHash(vec3(fi + 0.5, 11.0, 5.0)) * 6.2831853;
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
`
