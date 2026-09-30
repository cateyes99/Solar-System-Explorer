import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimStore } from '../../store/simulationStore'
import { getSceneTextures } from '../../utils/sceneTextures'

/**
 * Procedural star field: thousands of stars across three depth layers with
 * size, colour and twinkle variation — animated entirely in the shader.
 */

const LAYERS = [
  { count: 3800, min: 1200, max: 1700, size: [7, 16] as const },
  { count: 3200, min: 1700, max: 2400, size: [5, 11] as const },
  { count: 2600, min: 2400, max: 3200, size: [4, 8] as const },
]

const STAR_COLORS: THREE.Color[] = [
  new THREE.Color('#ffffff'),
  new THREE.Color('#cfe0ff'),
  new THREE.Color('#ffe7c4'),
  new THREE.Color('#bcd6ff'),
  new THREE.Color('#fff4d6'),
]

interface StarLayerProps {
  count: number
  min: number
  max: number
  sizeRange: readonly [number, number]
  map: THREE.Texture
  pixelRatio: number
  twinkle: number
}

function StarLayer({ count, min, max, sizeRange, map, pixelRatio, twinkle }: StarLayerProps) {
  const materialRef = useRef<THREE.ShaderMaterial>(null)

  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    const colors = new Float32Array(count * 3)

    for (let i = 0; i < count; i++) {
      // Uniform distribution over a spherical shell
      const u = Math.random() * 2 - 1
      const theta = Math.random() * Math.PI * 2
      const radius = min + Math.random() * (max - min)
      const s = Math.sqrt(1 - u * u)
      positions[i * 3] = radius * s * Math.cos(theta)
      positions[i * 3 + 1] = radius * u
      positions[i * 3 + 2] = radius * s * Math.sin(theta)

      // Bright, rare stars; many faint ones
      const bright = Math.pow(Math.random(), 2.6)
      sizes[i] = sizeRange[0] + bright * (sizeRange[1] - sizeRange[0])
      phases[i] = Math.random() * Math.PI * 2

      const color = STAR_COLORS[Math.floor(Math.random() * STAR_COLORS.length)]
      const tint = 0.75 + bright * 0.45
      colors[i * 3] = Math.min(1, color.r * tint)
      colors[i * 3 + 1] = Math.min(1, color.g * tint)
      colors[i * 3 + 2] = Math.min(1, color.b * tint)
    }

    const geo = new THREE.BufferGeometry()
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3))
    geo.setAttribute('aSize', new THREE.BufferAttribute(sizes, 1))
    geo.setAttribute('aPhase', new THREE.BufferAttribute(phases, 1))
    geo.setAttribute('aColor', new THREE.BufferAttribute(colors, 3))
    geo.boundingSphere = new THREE.Sphere(new THREE.Vector3(), max)
    return geo
  }, [count, min, max, sizeRange])

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uMap: { value: map },
      uTwinkle: { value: twinkle },
      uPixelRatio: { value: pixelRatio },
    }),
    [map, pixelRatio, twinkle],
  )

  useFrame((_, delta) => {
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value += delta
    }
  })

  return (
    <points geometry={geometry} frustumCulled={false}>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        transparent
        depthWrite={false}
        blending={THREE.AdditiveBlending}
        vertexShader={`
          attribute float aSize;
          attribute float aPhase;
          attribute vec3 aColor;
          uniform float uTime;
          uniform float uTwinkle;
          uniform float uPixelRatio;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            vColor = aColor;
            vec4 mv = modelViewMatrix * vec4(position, 1.0);
            float tw = 0.72 + 0.28 * sin(uTime * (0.5 + aPhase * 0.6) + aPhase * 12.0);
            float blink = mix(1.0, tw, uTwinkle);
            gl_PointSize = aSize * uPixelRatio * (520.0 / max(-mv.z, 1.0)) * blink;
            gl_Position = projectionMatrix * mv;
            vAlpha = 0.9 * mix(1.0, tw * 1.05, uTwinkle);
          }
        `}
        fragmentShader={`
          uniform sampler2D uMap;
          varying vec3 vColor;
          varying float vAlpha;
          void main() {
            float a = texture2D(uMap, gl_PointCoord).a * vAlpha;
            if (a < 0.01) discard;
            gl_FragColor = vec4(vColor, a);
          }
        `}
      />
    </points>
  )
}

export function StarField() {
  const groupRef = useRef<THREE.Group>(null)
  const reducedMotion = useSimStore((s) => s.reducedMotion)
  const textures = getSceneTextures()
  const pixelRatio = Math.min(window.devicePixelRatio || 1, 2)
  const twinkle = reducedMotion ? 0 : 1

  useFrame((_, delta) => {
    if (groupRef.current && !reducedMotion) {
      groupRef.current.rotation.y += delta * 0.004
      groupRef.current.rotation.x += delta * 0.0012
    }
  })

  return (
    <group ref={groupRef}>
      {LAYERS.map((layer, index) => (
        <StarLayer
          key={index}
          count={layer.count}
          min={layer.min}
          max={layer.max}
          sizeRange={layer.size}
          map={textures.star}
          pixelRatio={pixelRatio}
          twinkle={twinkle}
        />
      ))}
    </group>
  )
}
