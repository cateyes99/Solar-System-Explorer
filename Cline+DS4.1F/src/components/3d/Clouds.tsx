import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, ShaderMaterial, Vector3 } from 'three'
import type { BufferGeometry, Mesh } from 'three'
import type { CloudVisuals } from '../../data/visuals'
import { clock } from '../../utils/simulationClock'
import { getTexture } from '../../utils/textures'

/**
 * Earth's cloud deck.
 *
 * The density model follows the real-time cloudscape pipeline (Schneider &
 * Vos, "The Real-Time Volumetric Cloudscapes of Horizon: Zero Dawn", GPU Pro 7),
 * adapted from a volume to the planet's cloud shell:
 *
 *  1. **Weather / coverage** — the real cloud map says *where* systems may live.
 *     It is applied as an erosion, so no cloud can appear where the map is clear.
 *  2. **Base shape** — a low-frequency fBm forms the cloud bodies.
 *  3. **Detail** — a higher-frequency fBm is *remapped* against the base to carve
 *     it (the "carving clay" step). Remapping, rather than multiplying, keeps the
 *     dense cores while fraying the edges into puffs and wisps — which is exactly
 *     what stops the result reading as a smooth water ripple.
 *  4. **Wind** — the noise field is advected along the wind so the detail streams
 *     across the deck instead of sitting still.
 *
 * Two motions are kept deliberately separate, and the layer is a child of the
 * spin group so it always turns with the planet:
 *
 *  - **The deck turns faster than the ground** (see `relativeSpinPerDay`).
 *  - **The shapes themselves evolve**, driven by the advected noise and gated by
 *    the "Cloud dynamics" slider: at 0 the density collapses back to the plain
 *    cloud map (frozen, but still drifting), at 1 it is fully sculpted.
 */
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vLocalDir;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
    // Object-space direction: fixed to the deck, so the weather pattern turns
    // with the clouds (and its latitude axis is the planet's spin axis).
    vLocalDir = normalize(position);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform vec3 uColor;
  uniform vec3 uSunPosition;
  uniform vec3 uObjectSunDir;
  uniform float uOpacity;
  uniform float uTime;
  uniform float uDynamics;
  uniform float uScale;
  uniform float uUvOffset;
  uniform float uCoverage;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vLocalDir;
  varying vec3 vWorldPosition;

  // 3D value noise, sampled along the deck's own direction: a solid field, so it
  // is continuous everywhere — no seam at longitude 0, nothing pinched at the
  // poles.
  float hash13(vec3 p) {
    p = fract(p * 0.1031);
    p += dot(p, p.zyx + 31.32);
    return fract((p.x + p.y) * p.z);
  }
  float noise3(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    vec3 u = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash13(i + vec3(0.0, 0.0, 0.0)), hash13(i + vec3(1.0, 0.0, 0.0)), u.x),
          mix(hash13(i + vec3(0.0, 1.0, 0.0)), hash13(i + vec3(1.0, 1.0, 0.0)), u.x), u.y),
      mix(mix(hash13(i + vec3(0.0, 0.0, 1.0)), hash13(i + vec3(1.0, 0.0, 1.0)), u.x),
          mix(hash13(i + vec3(0.0, 1.0, 1.0)), hash13(i + vec3(1.0, 1.0, 1.0)), u.x), u.y),
      u.z);
  }
  // Three octaves, each rotated so the noise lattice cannot line up.
  float fbm3(vec3 p) {
    const mat3 rot = mat3(0.00, 0.80, 0.60, -0.80, 0.36, -0.48, -0.60, -0.48, 0.64);
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 3; i++) {
      sum += amp * noise3(p);
      p = rot * p * 2.02;
      amp *= 0.5;
    }
    return sum / 0.875;
  }
  // Remap value from [low1, high1] to [low2, high2] — the erosion primitive the
  // cloudscape pipeline is built on.
  float remap(float value, float low1, float high1, float low2, float high2) {
    return low2 + (value - low1) / max(high1 - low1, 0.0001) * (high2 - low2);
  }

  void main() {
    vec3 dir = normalize(vWorldNormal);
    vec3 ldir = normalize(vLocalDir);

    // The coverage slider is one dial on how much of the sky the deck fills: a
    // high threshold lets only the strongest updrafts condense into scattered
    // wisps, a low one lets the whole field fill in. The erosion is relaxed as
    // coverage grows so the masses merge into a sheet instead of fraying apart,
    // and the blobs swell a little so dense skies overlap.
    float threshold = mix(0.6, 0.22, uCoverage);
    float erosion = mix(0.42, 0.14, uCoverage);
    float deckScale = uScale * mix(1.14, 0.88, uCoverage);

    // Wind-advected sample point. The *features* are drawn from this field, so as
    // the wind carries the sample point through the noise the cloud shapes drift
    // across the deck and morph and fray as they go — they are never pinned to a
    // painted texture.
    vec3 p = ldir * deckScale + vec3(uTime * 0.75, uTime * 0.24, -uTime * 0.58);

    // The cloud features themselves are fully procedural: a base shape plus a
    // finer octave, soft-thresholded into distinct cumulus-like masses. Once the
    // static map has faded out (see below) this is all that remains.
    float shape = fbm3(p);
    float detail = fbm3(p * 3.6 + 9.3);
    float clouds = smoothstep(threshold, threshold + 0.2, shape + (detail - 0.5) * erosion);

    // The real cloud map only has a say at the very bottom of the slider. Its
    // contribution is crossfaded away *completely* by 15%, after which the deck is
    // purely procedural. Leaving any of it in shows up as rigid "chunks" of the
    // old map drifting through the animated clouds, because the map's own
    // features never move.
    float mapBlend = smoothstep(0.0, 0.15, uDynamics);
    // Raw ShaderMaterial: texture.offset is not applied for us, so the surface's
    // longitude shift is added here to keep the cloud map in register.
    float weather = texture2D(uMap, vUv + vec2(uUvOffset, 0.0)).g;
    float cover = mix(weather, clouds, mapBlend);

    // --- Colour -----------------------------------------------------------
    // A cloud top is never a flat white. Four things shape its tone, and all of
    // them travel with the deck, so the tint keeps evolving as the shapes move:
    //
    //  - **Self-shadowing.** Reading the density a short way up-sun gives every
    //    mass a lit face and a shaded face instead of one flat tone.
    //  - **Optical depth.** Dense cores scatter nearly all the sunlight and read
    //    white; thin edges and wisps let the blue of the sky through and lean
    //    cool.
    //  - **The sun's angle.** Light raking across the deck near the terminator
    //    has crossed more air and warms toward sunrise orange, while the night
    //    side falls back to a cool ambient blue.
    //  - **The air mass.** A slow, large-scale field drifts subtly different hues
    //    between neighbouring systems.
    vec3 sunDirection = normalize(uSunPosition - vWorldPosition);
    float sunDot = dot(dir, sunDirection);
    float lit = smoothstep(-0.25, 0.4, sunDot);
    // Peaks on the terminator, where the light rakes across the cloud tops.
    float twilight = exp(-(sunDot * sunDot) / 0.05);

    float alpha = cover * uOpacity * (0.12 + 0.88 * lit);

    // The density a short step toward the sun: where it is thicker, this point
    // lies in the cloud's shadow. Following the sun keeps the shading correct as
    // the planet turns.
    float upSun = fbm3(p + uObjectSunDir * 0.34);
    float shade = mix(1.0, 0.7, smoothstep(0.36, 0.62, upSun));

    // Regional hue: a slow field that drifts with the weather, so a big
    // formation is tinted unevenly instead of reading as one flat white mass.
    float region = fbm3(ldir * (uScale * 0.32) + vec3(uTime * 0.10, uTime * 0.04, -uTime * 0.07) + 19.0);
    region = smoothstep(0.32, 0.72, region);

    // Dense, sunlit cloud is a warm white; thin or hazy cloud leans cool.
    vec3 warmTint = vec3(1.0, 0.978, 0.94);
    vec3 coolTint = vec3(0.88, 0.925, 1.0);
    vec3 tint = mix(warmTint, coolTint, clamp(region * 0.7 + (1.0 - cover) * 0.4, 0.0, 1.0));
    tint = mix(tint, vec3(1.0, 0.86, 0.7), twilight * 0.4); // sunrise / sunset warmth

    // Held near 1 so the warm/cool tint survives instead of clipping to white.
    float body = mix(0.84, 1.06, cover) * shade;

    vec3 color = uColor * tint * body * (0.24 + 0.76 * lit);
    // Night side: a little scattered sky light keeps the deck from going black.
    color += uColor * vec3(0.3, 0.38, 0.55) * (1.0 - lit) * (0.3 + 0.7 * cover);

    gl_FragColor = vec4(color, alpha);
  }
`

interface CloudsProps {
  geometry: BufferGeometry
  radius: number
  visuals: CloudVisuals
  sunPosition: Vector3
  /** 0…1 opacity multiplier from the Earth panel. */
  opacity: number
  /**
   * Extra rotation the deck turns through, in radians per simulated day, on top
   * of the planet's own spin. Positive = the clouds drift ahead of the surface.
   */
  relativeSpinPerDay: number
  /** 0…1 “Cloud dynamics”: scales the shape evolution only. */
  dynamics: number
  /** 0…1 cloud coverage: 0 = a few scattered wisps, 1 = a near-continuous sheet. */
  coverage: number
  reducedMotion: boolean
  /** Longitude shift applied to the surface, in UV turns (matches the day map). */
  uvOffsetU?: number
  /**
   * Extra height for the cloud shell, in planet radii, on top of the deck's own
   * 1.2%. Earth's surface is displaced by real relief, so the deck has to clear
   * the highest ground rather than the mean radius.
   */
  shellLift?: number
}

export function Clouds({
  geometry,
  radius,
  visuals,
  sunPosition,
  opacity,
  relativeSpinPerDay,
  dynamics,
  coverage,
  reducedMotion,
  uvOffsetU = 0,
  shellLift = 0,
}: CloudsProps) {
  const meshRef = useRef<Mesh>(null)

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uMap: { value: getTexture(visuals.textureId) },
          uColor: { value: new Color(visuals.color) },
          uSunPosition: { value: sunPosition.clone() },
          uObjectSunDir: { value: new Vector3(0, 1, 0) },
          uOpacity: { value: opacity },
          uTime: { value: 0 },
          uDynamics: { value: dynamics },
          uScale: { value: 2.7 },
          uUvOffset: { value: uvOffsetU },
          uCoverage: { value: coverage },
        },
        transparent: true,
        depthWrite: false,
      }),
    [visuals.textureId, visuals.color, sunPosition, uvOffsetU],
  )

  useEffect(() => () => material.dispose(), [material])

  // The shape-evolution clock runs in real seconds, so the clouds keep breathing
  // at a steady, visible pace even when the simulation is paused; it freezes for
  // anyone who asked for reduced motion. The relative spin, by contrast, is tied
  // to the simulation clock so it stays in step with the turning planet.
  const elapsed = useRef(0)
  const spun = useRef(0)
  const sunLocal = useRef(new Vector3())
  useFrame((_, delta) => {
    // The slider scales ONLY the shape evolution. The deck's own faster-than-
    // surface rotation is left alone, so at 0% the clouds still slip across the
    // ground while their density is frozen.
    if (!reducedMotion) elapsed.current += delta * dynamics
    spun.current += relativeSpinPerDay * clock.lastFrameDays
    if (meshRef.current) meshRef.current.rotation.y = spun.current
    material.uniforms.uTime.value = elapsed.current
    material.uniforms.uDynamics.value = dynamics
    material.uniforms.uCoverage.value = coverage
    material.uniforms.uOpacity.value = opacity
    material.uniforms.uSunPosition.value.copy(sunPosition)
    // The sun's direction in the deck's own space, so the shader can march a
    // step "up-sun" through the density field for self-shadowing.
    if (meshRef.current) {
      sunLocal.current.copy(sunPosition)
      meshRef.current.worldToLocal(sunLocal.current)
      material.uniforms.uObjectSunDir.value.copy(sunLocal.current).normalize()
    }
  })

  return (
    <mesh ref={meshRef} geometry={geometry} material={material} scale={radius * (1.012 + shellLift)} />
  )
}
