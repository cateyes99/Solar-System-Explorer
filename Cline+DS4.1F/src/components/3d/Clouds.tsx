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
 *  - **The shapes themselves evolve.** The shader warps the coverage through a
 *    pair of noise fields sampled *on the sphere*, so every eddy is local and
 *    uncorrelated: no seam, no poles, and no global pattern for the eye to lock
 *    onto. The fields drift over time, so fronts curl and re-form.
 *
 * The warp is a pure displacement — it never accumulates — which is what stops
 * the deck from smearing into the long "combed" streaks a shearing offset would
 * produce given enough time.
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

  // 3D value noise. Sampling it along the sphere's own direction keeps the field
  // continuous everywhere — no seam at longitude 0, nothing pinched at the poles.
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
  // Two octaves: the fine octave breaks up the blobby grid of a single one, so
  // the eddies read as weather rather than as a lattice.
  float fbm3(vec3 p) {
    return 0.62 * noise3(p) + 0.38 * noise3(p * 2.03 + 19.1);
  }

  void main() {
    vec3 dir = normalize(vWorldNormal);
    vec3 base = dir * uScale;

    // Two independent warp fields drifting in different directions: the vector
    // displacement is never aligned, so no single cyclone can dominate.
    vec2 warp = vec2(
      fbm3(base + vec3(0.0, 0.0, uTime * 0.12)),
      fbm3(base + vec3(9.3, 4.1, -uTime * 0.10))
    ) - 0.5;

    vec2 uv = vUv + warp * uMorph;
    float cover = texture2D(uMap, uv).g;

    // Sunlight: bright on the day side, all but gone at night.
    vec3 sunDirection = normalize(uSunPosition - vWorldPosition);
    float lit = smoothstep(-0.25, 0.4, dot(dir, sunDirection));

    float alpha = cover * uOpacity * (0.12 + 0.88 * lit);
    vec3 color = uColor * (0.22 + 0.78 * lit);
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
  reducedMotion: boolean
}

export function Clouds({
  geometry,
  radius,
  visuals,
  sunPosition,
  opacity,
  relativeSpinPerDay,
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
          uMorph: { value: 0.055 },
          uScale: { value: 5.0 },
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
    if (!reducedMotion) elapsed.current += delta
    spun.current += relativeSpinPerDay * clock.lastFrameDays
    if (meshRef.current) meshRef.current.rotation.y = spun.current
    material.uniforms.uTime.value = elapsed.current
    material.uniforms.uOpacity.value = opacity
    material.uniforms.uSunPosition.value.copy(sunPosition)
  })

  return <mesh ref={meshRef} geometry={geometry} material={material} scale={radius * 1.012} />
}
