import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, Color, Points, ShaderMaterial } from 'three'
import { useSimulationStore } from '../../store/simulationStore'

const vertexShader = /* glsl */ `
  attribute float aSize;
  attribute float aPhase;
  attribute vec3 aColor;
  uniform float uTime;
  uniform float uMotion;
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    float twinkle = 0.82 + sin(uTime * (0.35 + aPhase * 0.15) + aPhase * 19.0) * 0.18 * uMotion;
    gl_PointSize = clamp(aSize * twinkle * (230.0 / -viewPosition.z), 0.65, 4.5);
    gl_Position = projectionMatrix * viewPosition;
    vColor = aColor;
    vAlpha = twinkle;
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vColor;
  varying float vAlpha;
  void main() {
    float distanceToCenter = length(gl_PointCoord - vec2(0.5));
    float alpha = smoothstep(0.5, 0.06, distanceToCenter) * vAlpha;
    gl_FragColor = vec4(vColor, alpha);
  }
`

function randomGenerator(seed: number): () => number {
  return () => {
    seed = (seed * 1664525 + 1013904223) >>> 0
    return seed / 4294967296
  }
}

export function StarField() {
  const points = useRef<Points>(null)
  const quality = useSimulationStore((state) => state.quality)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  const screenWidth = useThree((state) => state.size.width)
  const count = quality === 'low' || screenWidth < 768 ? 2400 : 5200

  const { geometry, material } = useMemo(() => {
    const random = randomGenerator(72613)
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)
    const starColor = new Color()
    for (let index = 0; index < count; index += 1) {
      const radius = 125 + random() * 125
      const theta = random() * Math.PI * 2
      const cosPhi = random() * 2 - 1
      const sinPhi = Math.sqrt(1 - cosPhi * cosPhi)
      positions[index * 3] = radius * sinPhi * Math.cos(theta)
      positions[index * 3 + 1] = radius * cosPhi
      positions[index * 3 + 2] = radius * sinPhi * Math.sin(theta)
      const tone = random()
      starColor.set(tone > 0.85 ? '#b9d8ff' : tone < 0.12 ? '#ffdbb5' : '#f4f6ff')
      colors[index * 3] = starColor.r
      colors[index * 3 + 1] = starColor.g
      colors[index * 3 + 2] = starColor.b
      sizes[index] = random() > 0.965 ? 3.2 + random() * 2 : 0.8 + random() * 1.8
      phases[index] = random()
    }
    const shader = new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: { uTime: { value: 0 }, uMotion: { value: 1 } },
      transparent: true,
      depthWrite: false,
      blending: AdditiveBlending,
    })
    return {
      geometry: (() => {
        const result = new BufferGeometry()
        result.setAttribute('position', new BufferAttribute(positions, 3))
        result.setAttribute('aColor', new BufferAttribute(colors, 3))
        result.setAttribute('aSize', new BufferAttribute(sizes, 1))
        result.setAttribute('aPhase', new BufferAttribute(phases, 1))
        return result
      })(),
      material: shader,
    }
  }, [count])

  useFrame(({ clock }) => {
    material.uniforms.uTime.value = clock.elapsedTime
    material.uniforms.uMotion.value = reducedMotion ? 0 : 1
    if (points.current && !reducedMotion) points.current.rotation.y = clock.elapsedTime * 0.00035
  })

  return <points ref={points} geometry={geometry} material={material} frustumCulled={false} raycast={() => null} />
}

