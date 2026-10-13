import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Color, ShaderMaterial, Vector3 } from 'three'
import type { BufferGeometry, Mesh } from 'three'
import type { CloudVisuals } from '../../data/visuals'
import { clock } from '../../utils/simulationClock'
import { getTexture } from '../../utils/textures'

/**
 * Earth's cloud deck — a living layer, not a painted shell.
 *
 * Two motions are kept deliberately separate:
 *
 *  - **The deck turns faster than the ground.** The mesh is a child of the spin
 *    group, and it is given its own extra rotation, so the clouds visibly slip
 *    eastward over the surface (see `relativeSpinPerDay`).
 *  - **The shapes themselves evolve.** The coverage is displaced by a two-level
 *    fractal-Brownian-motion domain warp — an fBm offsetting an fBm offsetting
 *    the sample — evaluated along the sphere's own direction. That is the classic
 *    recipe for eddies, filaments and fronts rather than a field of soft blobs,
 *    and because it is a solid 3D field it is continuous everywhere: no seam, no
 *    poles, and nothing global for the eye to lock onto.
 *
 * The warp is a pure, bounded displacement, and the sample point is advected
 * along a slowly curving path so it keeps meeting fresh noise. Nothing
 * accumulates, so the deck can never smear into the long "combed" streaks a
 * shearing offset would produce, however long it runs.
 */
const vertexShader = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vUv = uv;
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
  uniform float uOpacity;
  uniform float uTime;
  uniform float uMorph;
  uniform float uScale;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  // 3D value noise, sampled along the sphere's own direction. Being a solid 3D
  // field it is continuous everywhere — no seam at longitude 0, nothing pinched
  // at the poles — which is exactly where 2D equirectangular noise gives itself
  // away.
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
  // Fractal Brownian motion: three octaves, each rotated so the noise lattice
  // cannot line up and read as a grid, then normalised back to 0…1.
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

  void main() {
    vec3 dir = normalize(vWorldNormal);

    // Advection: walk the sample point through the field along a slowly curving
    // path, so it keeps meeting fresh noise and the motion never loops.
    vec3 drift = vec3(sin(uTime * 0.033) * 1.1, cos(uTime * 0.024) * 1.1, uTime * 0.05);
    vec3 p = dir * uScale + drift;

    // Domain warping: an fBm that offsets an fBm that offsets the sample. The two
    // levels are what turn a soft noise field into eddies, filaments and fronts —
    // and because the displacement is bounded and local, it never shears the map
    // into streaks.
    vec3 q = vec3(fbm3(p), fbm3(p + vec3(5.1, 1.7, 9.3)), 0.0);
    vec2 r = vec2(
      fbm3(p + 3.4 * q + vec3(1.3, 8.7, 2.1)),
      fbm3(p + 3.4 * q + vec3(7.9, 2.2, 6.4))
    );

    vec2 uv = vUv + (r - 0.5) * uMorph;
    float cover = texture2D(uMap, uv).g;

    // Sunlight: bright on the day side, all but gone at night.
    vec3 sunDirection = normalize(uSunPosition - vWorldPosition);
    float lit = smoothstep(-0.25, 0.4, dot(dir, sunDirection));

    float alpha = cover * uOpacity * (0.12 + 0.88 * lit);
    vec3 color = uColor * (0.22 + 0.78 * lit);
    gl_FragColor = vec4(color, alpha);
  }
`

/** How far the coverage is displaced at full “Cloud dynamics”, in UV units. */
const MORPH_AMOUNT = 0.16

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
  /** 0…1 “Cloud dynamics” from the Earth panel: scales the shape evolution only. */
  dynamics: number
  reducedMotion: boolean
}

export function Clouds({
  geometry,
  radius,
  visuals,
  sunPosition,
  opacity,
  relativeSpinPerDay,
  dynamics,
  reducedMotion,
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
          uOpacity: { value: opacity },
          uTime: { value: 0 },
          uMorph: { value: MORPH_AMOUNT },
          uScale: { value: 4.5 },
        },
        transparent: true,
        depthWrite: false,
      }),
    [visuals.textureId, visuals.color, sunPosition],
  )

  useEffect(() => () => material.dispose(), [material])

  // The shape-evolution clock runs in real seconds, so the clouds keep breathing
  // at a steady, visible pace even when the simulation is paused. It freezes for
  // anyone who asked for reduced motion. The relative spin, by contrast, is tied
  // to the simulation clock so it stays in step with the turning planet.
  const elapsed = useRef(0)
  const spun = useRef(0)
  useFrame((_, delta) => {
    // The slider scales ONLY the shape evolution. The deck's own faster-than-
    // surface rotation is left alone, so at 0% the clouds still slip across the
    // ground — their shapes are simply frozen (and the warp collapses to nothing,
    // which restores the plain, untouched cloud map of the original layer).
    if (!reducedMotion) elapsed.current += delta * dynamics
    spun.current += relativeSpinPerDay * clock.lastFrameDays
    if (meshRef.current) meshRef.current.rotation.y = spun.current
    material.uniforms.uTime.value = elapsed.current
    material.uniforms.uMorph.value = MORPH_AMOUNT * dynamics
    material.uniforms.uOpacity.value = opacity
    material.uniforms.uSunPosition.value.copy(sunPosition)
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} scale={radius * 1.012} />
}
