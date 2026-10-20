import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useSimulation } from '../../store/simulationStore'
import { mulberry32 } from '../../utils/noise'

const VERTEX = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute float aSpeed;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uTwinkle;
  varying float vBrightness;
  varying vec3 vColor;
  void main() {
    vColor = aColor;
    float twinkle = 1.0 - uTwinkle * (0.5 + 0.5 * sin(uTime * aSpeed + aPhase));
    vBrightness = twinkle;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    gl_PointSize = clamp(aSize * twinkle * (320.0 / -mvPosition.z), 1.0, 7.0);
    gl_Position = projectionMatrix * mvPosition;
  }
`

const FRAGMENT = /* glsl */ `
  varying float vBrightness;
  varying vec3 vColor;
  void main() {
    float d = length(gl_PointCoord - vec2(0.5));
    float alpha = smoothstep(0.5, 0.08, d) * vBrightness;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor, alpha);
  }
`

interface LayerSpec {
  count: number
  radius: number
  size: number
  seed: number
}

const LAYERS: LayerSpec[] = [
  { count: 2400, radius: 540, size: 1.1, seed: 1 },
  { count: 1300, radius: 470, size: 1.9, seed: 2 },
  { count: 420, radius: 420, size: 3.0, seed: 3 },
]

function starColor(rnd: () => number): [number, number, number] {
  const t = rnd()
  const brightness = 0.75 + rnd() * 0.25
  if (t < 0.12) return [0.68 * brightness, 0.8 * brightness, brightness]
  if (t > 0.9) return [brightness, 0.85 * brightness, 0.68 * brightness]
  return [brightness, brightness, brightness]
}

function buildLayer(spec: LayerSpec): {
  geometry: THREE.BufferGeometry
  material: THREE.ShaderMaterial
} {
  const rnd = mulberry32(spec.seed * 7919)
  const positions = new Float32Array(spec.count * 3)
  const colors = new Float32Array(spec.count * 3)
  const sizes = new Float32Array(spec.count)
  const phases = new Float32Array(spec.count)
  const speeds = new Float32Array(spec.count)
  for (let i = 0; i < spec.count; i++) {
    // Uniform point on a sphere shell.
    const u = rnd() * Math.PI * 2
    const z = rnd() * 2 - 1
    const r = Math.sqrt(1 - z * z)
    const dist = spec.radius * (0.88 + rnd() * 0.24)
    positions[i * 3] = Math.cos(u) * r * dist
    positions[i * 3 + 1] = z * dist
    positions[i * 3 + 2] = Math.sin(u) * r * dist
    const c = starColor(rnd)
    colors[i * 3] = c[0]
    colors[i * 3 + 1] = c[1]
    colors[i * 3 + 2] = c[2]
    sizes[i] = spec.size * (0.6 + rnd() * 0.8)
    phases[i] = rnd() * Math.PI * 2
    speeds[i] = 0.4 + rnd() * 2.4
  }
  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
  const material = new THREE.ShaderMaterial({
    vertexShader: VERTEX,
    fragmentShader: FRAGMENT,
    uniforms: {
      uTime: { value: 0 },
      uTwinkle: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })
  return { geometry, material }
}

/** Procedural star field: thousands of twinkling stars in three depth layers. */
export function StarField(): JSX.Element {
  const layers = useMemo(() => LAYERS.map(buildLayer), [])
  const group = useRef<THREE.Group>(null)
  const reduceMotion = useSimulation((s) => s.reduceMotion)

  useEffect(() => {
    layers.forEach((l) => {
      l.material.uniforms.uTwinkle.value = reduceMotion ? 0 : 1
    })
  }, [layers, reduceMotion])

  useFrame((state) => {
    const t = state.clock.elapsedTime
    layers.forEach((l) => {
      l.material.uniforms.uTime.value = t
    })
  })

  return (
    <group ref={group} frustumCulled={false}>
      {layers.map((l, i) => (
        <points key={i} geometry={l.geometry} material={l.material} frustumCulled={false} />
      ))}
    </group>
  )
}
