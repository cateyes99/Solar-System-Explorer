import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import {
  AdditiveBlending,
  BackSide,
  BufferGeometry,
  Float32BufferAttribute,
  ShaderMaterial,
} from 'three'
import type { Group, Mesh, Points } from 'three'
import type { QualityLevel } from '../../types'
import { createRandom, lerp } from '../../utils/random'
import { getTexture } from '../../utils/textures'

/**
 * A procedural sky: three depth layers of stars (different sizes, colours and
 * twinkle rates) plus a very soft nebula band.
 *
 * Each layer is a single draw call, and the stars sit hundreds of units away, so
 * they stay firmly in the background and never distract from the planets.
 */

const starVertexShader = /* glsl */ `
  attribute vec3 aColor;
  attribute float aSize;
  attribute float aPhase;
  uniform float uTime;
  uniform float uPixelRatio;
  uniform float uTwinkle;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vColor = aColor;
    vTwinkle = 1.0 - uTwinkle * 0.45 * (0.5 + 0.5 * sin(uTime * 1.6 + aPhase));
    vec4 viewPosition = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * viewPosition;
    gl_PointSize = clamp(aSize * uPixelRatio * (600.0 / max(-viewPosition.z, 1.0)), 0.6, 24.0);
  }
`

const starFragmentShader = /* glsl */ `
  uniform sampler2D uMap;
  uniform float uOpacity;
  uniform float uBrightness;
  varying vec3 vColor;
  varying float vTwinkle;

  void main() {
    vec4 sprite = texture2D(uMap, gl_PointCoord);
    float alpha = sprite.a * uOpacity * vTwinkle;
    if (alpha < 0.01) discard;
    gl_FragColor = vec4(vColor * uBrightness, alpha);
  }
`

interface StarLayerConfig {
  count: number
  innerRadius: number
  outerRadius: number
  sizeMin: number
  sizeMax: number
  opacity: number
  brightness: number
  seed: number
}

const LAYERS: StarLayerConfig[] = [
  {
    count: 1600,
    innerRadius: 900,
    outerRadius: 1150,
    sizeMin: 1.4,
    sizeMax: 4.2,
    opacity: 0.95,
    brightness: 1.15,
    seed: 1201,
  },
  {
    count: 2600,
    innerRadius: 1200,
    outerRadius: 1600,
    sizeMin: 0.9,
    sizeMax: 2.4,
    opacity: 0.8,
    brightness: 1,
    seed: 8821,
  },
  {
    count: 3200,
    innerRadius: 1650,
    outerRadius: 2200,
    sizeMin: 0.5,
    sizeMax: 1.4,
    opacity: 0.6,
    brightness: 0.85,
    seed: 5150,
  },
]

/** Star colours cluster around white and blue, with a few warm ones. */
function starColor(random: () => number): [number, number, number] {
  const roll = random()
  if (roll < 0.12) return [1, 0.86, 0.7]
  if (roll < 0.32) return [0.9, 0.95, 1]
  if (roll < 0.65) return [0.78, 0.86, 1]
  if (roll < 0.85) return [1, 0.98, 0.94]
  return [0.84, 0.9, 1]
}

function createStarGeometry(config: StarLayerConfig): BufferGeometry {
  const random = createRandom(config.seed)
  const positions = new Float32Array(config.count * 3)
  const colors = new Float32Array(config.count * 3)
  const sizes = new Float32Array(config.count)
  const phases = new Float32Array(config.count)

  for (let i = 0; i < config.count; i += 1) {
    // Uniform distribution over a spherical shell.
    const theta = random() * Math.PI * 2
    const cosPhi = random() * 2 - 1
    const sinPhi = Math.sqrt(1 - cosPhi * cosPhi)
    const radius = lerp(config.innerRadius, config.outerRadius, Math.cbrt(random()))
    positions[i * 3] = Math.cos(theta) * sinPhi * radius
    positions[i * 3 + 1] = cosPhi * radius
    positions[i * 3 + 2] = Math.sin(theta) * sinPhi * radius

    const color = starColor(random)
    colors[i * 3] = color[0]
    colors[i * 3 + 1] = color[1]
    colors[i * 3 + 2] = color[2]

    // Mostly small stars with a few bright ones, like a real sky.
    sizes[i] = config.sizeMin + Math.pow(random(), 2.4) * (config.sizeMax - config.sizeMin)
    phases[i] = random() * Math.PI * 2
  }

  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('aColor', new Float32BufferAttribute(colors, 3))
  geometry.setAttribute('aSize', new Float32BufferAttribute(sizes, 1))
  geometry.setAttribute('aPhase', new Float32BufferAttribute(phases, 1))
  return geometry
}

function StarLayer({ config, reducedMotion }: { config: StarLayerConfig; reducedMotion: boolean }) {
  const pointsRef = useRef<Points>(null)
  const geometry = useMemo(() => createStarGeometry(config), [config])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: starVertexShader,
        fragmentShader: starFragmentShader,
        uniforms: {
          uMap: { value: getTexture('star') },
          uTime: { value: 0 },
          uPixelRatio: { value: 1 },
          uOpacity: { value: config.opacity },
          uBrightness: { value: config.brightness },
          uTwinkle: { value: reducedMotion ? 0.15 : 1 },
        },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [config, reducedMotion],
  )

  const { size, viewport } = useThree()

  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta
    material.uniforms.uPixelRatio.value = Math.min(viewport.dpr, size.height > 800 ? 2 : 1.5)
  })

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
}

interface StarFieldProps {
  quality: QualityLevel
  reducedMotion: boolean
  showNebula: boolean
}

export function StarField({ quality, reducedMotion, showNebula }: StarFieldProps) {
  const groupRef = useRef<Group>(null)
  const nebulaMaterialRef = useRef<Mesh>(null)

  const layers = useMemo(() => {
    if (quality === 'high') return LAYERS
    if (quality === 'medium') {
      return LAYERS.map((layer) => ({ ...layer, count: Math.round(layer.count * 0.62) }))
    }
    return LAYERS.slice(0, 2).map((layer) => ({ ...layer, count: Math.round(layer.count * 0.4) }))
  }, [quality])

  // A very slow drift keeps the sky alive without ever pulling focus.
  useFrame((_, delta) => {
    if (!groupRef.current || reducedMotion) return
    groupRef.current.rotation.y += delta * 0.0035
    groupRef.current.rotation.x += delta * 0.0008
  })

  return (
    <group ref={groupRef}>
      {layers.map((config) => (
        <StarLayer key={config.seed} config={config} reducedMotion={reducedMotion} />
      ))}

      {showNebula ? (
        <mesh ref={nebulaMaterialRef} scale={2400} frustumCulled={false} renderOrder={-10}>
          <sphereGeometry args={[1, 32, 24]} />
          <meshBasicMaterial
            // The real Milky Way panorama, with its exposure lifted at load time
            // (`liftExposure`): a photograph of the night sky is mostly black until
            // the faint dust is brought up to where a dark-adapted eye sees it.
            map={getTexture('nebula')}
            side={BackSide}
            transparent
            opacity={0.85}
            depthWrite={false}
            toneMapped={false}
          />
        </mesh>
      ) : null}
    </group>
  )
}