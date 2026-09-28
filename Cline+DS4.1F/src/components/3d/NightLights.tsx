import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, ShaderMaterial, Vector3 } from 'three'
import type { Mesh } from 'three'
import { HIGH_DETAIL_SPHERE } from './geometry'
import { getTexture } from '../../utils/textures'
import type { NightLightsVisuals } from '../../data/visuals'

/**
 * City lights on the night side of Earth.
 *
 * The lights map is generated from the same land mask the continents came from,
 * so the glow only ever appears on land — and a soft terminator keeps it off the
 * daytime half of the planet.
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
  uniform vec3 uSunPosition;
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uOpacity;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 sunDirection = normalize(uSunPosition - vWorldPosition);
    float night = smoothstep(0.16, -0.14, dot(normalize(vWorldNormal), sunDirection));
    vec3 texel = texture2D(uMap, vUv).rgb;
    vec3 color = texel * uColor * uIntensity * night * uOpacity;
    float alpha = clamp(max(color.r, max(color.g, color.b)), 0.0, 1.0);
    gl_FragColor = vec4(color, alpha);
  }
`

interface NightLightsProps {
  radius: number
  visuals: NightLightsVisuals
  sunPosition: Vector3
  opacity?: number
}

export function NightLights({ radius, visuals, sunPosition, opacity = 1 }: NightLightsProps) {
  const meshRef = useRef<Mesh>(null)

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader,
        fragmentShader,
        uniforms: {
          uMap: { value: getTexture(visuals.textureId) },
          uSunPosition: { value: sunPosition.clone() },
          uColor: { value: new Color(visuals.color) },
          uIntensity: { value: visuals.intensity },
          uOpacity: { value: opacity },
        },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [visuals.color, visuals.intensity, visuals.textureId, sunPosition, opacity],
  )

  useFrame(() => {
    material.uniforms.uSunPosition.value.copy(sunPosition)
    material.uniforms.uOpacity.value = opacity
  })

  return <mesh ref={meshRef} geometry={HIGH_DETAIL_SPHERE} material={material} scale={radius * 1.002} />
}