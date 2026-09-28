import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { createStarSpriteTexture } from '../../utils/textures'
import { useSimulationStore } from '../../store/simulationStore'

const STAR_VERTEX_SHADER = /* glsl */ `
  attribute float aScale;
  attribute float aPhase;
  attribute float aSpeed;
  attribute vec3 color;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uTwinkleAmount;
  varying float vTwinkle;
  varying vec3 vColor;

  void main() {
    vColor = color;
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    float twinkle = (1.0 - uTwinkleAmount) + uTwinkleAmount * (0.55 + 0.45 * sin(uTime * aSpeed + aPhase));
    vTwinkle = twinkle;
    gl_Position = projectionMatrix * mvPosition;
    gl_PointSize = aScale * uPixelRatio * (300.0 / max(-mvPosition.z, 1.0)) * twinkle;
  }
`

const STAR_FRAGMENT_SHADER = /* glsl */ `
  uniform sampler2D uMap;
  varying float vTwinkle;
  varying vec3 vColor;

  void main() {
    vec4 tex = texture2D(uMap, gl_PointCoord);
    if (tex.a < 0.05) discard;
    gl_FragColor = vec4(vColor * tex.rgb, tex.a * vTwinkle);
  }
`

interface StarLayerConfig {
  count: number
  radius: number
  sizeRange: [number, number]
}

const LAYERS: StarLayerConfig[] = [
  { count: 2200, radius: 260, sizeRange: [1.4, 3.2] },
  { count: 3600, radius: 420, sizeRange: [1, 2.2] },
  { count: 4200, radius: 620, sizeRange: [0.6, 1.4] },
]

function buildLayer(config: StarLayerConfig, texture: THREE.Texture): THREE.Points {
  const { count, radius, sizeRange } = config
  const positions = new Float32Array(count * 3)
  const scales = new Float32Array(count)
  const phases = new Float32Array(count)
  const speeds = new Float32Array(count)
  const colors = new Float32Array(count * 3)

  for (let i = 0; i < count; i++) {
    const r = radius * (0.55 + Math.random() * 0.45)
    const theta = Math.random() * Math.PI * 2
    const phi = Math.acos(2 * Math.random() - 1)
    positions[i * 3] = r * Math.sin(phi) * Math.cos(theta)
    positions[i * 3 + 1] = r * Math.cos(phi)
    positions[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)

    scales[i] = sizeRange[0] + Math.random() * (sizeRange[1] - sizeRange[0])
    phases[i] = Math.random() * Math.PI * 2
    speeds[i] = 0.4 + Math.random() * 1.2

    const hueRoll = Math.random()
    if (hueRoll < 0.12) {
      colors[i * 3] = 0.68
      colors[i * 3 + 1] = 0.78
      colors[i * 3 + 2] = 1
    } else if (hueRoll < 0.24) {
      colors[i * 3] = 1
      colors[i * 3 + 1] = 0.88
      colors[i * 3 + 2] = 0.72
    } else {
      const tint = 0.85 + Math.random() * 0.15
      colors[i * 3] = tint
      colors[i * 3 + 1] = tint
      colors[i * 3 + 2] = tint
    }
  }

  const geometry = new THREE.BufferGeometry()
  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3))
  geometry.setAttribute('aScale', new THREE.BufferAttribute(scales, 1))
  geometry.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
  geometry.setAttribute('aSpeed', new THREE.BufferAttribute(speeds, 1))
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3))

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uTime: { value: 0 },
      uMap: { value: texture },
      uPixelRatio: { value: Math.min(typeof window !== 'undefined' ? window.devicePixelRatio : 1, 2) },
      uTwinkleAmount: { value: 1 },
    },
    vertexShader: STAR_VERTEX_SHADER,
    fragmentShader: STAR_FRAGMENT_SHADER,
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
  })

  return new THREE.Points(geometry, material)
}

/** Thousands of procedurally placed, twinkling stars across three depth layers. */
export function StarField() {
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)
  const starTexture = useMemo(() => createStarSpriteTexture(), [])
  const layers = useMemo(() => LAYERS.map((cfg) => buildLayer(cfg, starTexture)), [starTexture])
  const groupRef = useRef<THREE.Group>(null)

  useEffect(() => {
    return () => {
      layers.forEach((layer) => {
        layer.geometry.dispose()
        ;(layer.material as THREE.Material).dispose()
      })
      starTexture.dispose()
    }
  }, [layers, starTexture])

  useFrame((state, delta) => {
    for (const layer of layers) {
      const material = layer.material as THREE.ShaderMaterial
      material.uniforms.uTime.value = state.clock.elapsedTime
      material.uniforms.uTwinkleAmount.value = reducedMotion ? 0.15 : 1
    }
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y += delta * 0.0025
    }
  })

  return (
    <group ref={groupRef}>
      {layers.map((layer, i) => (
        <primitive key={i} object={layer} />
      ))}
    </group>
  )
}
