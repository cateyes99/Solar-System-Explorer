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
  uniform float uUvOffset;
  varying vec2 vUv;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    float night = smoothstep(0.16, -0.14, dot(normalize(vWorldNormal), normalize(uSunPosition - vWorldPosition)));
    // A raw ShaderMaterial does not apply texture.offset, so the surface's
    // longitude shift has to be applied here by hand. The day map gets it from
    // its texture matrix; this layer must match it exactly or the city lights
    // land on the wrong side of the planet.
    vec3 texel = texture2D(uMap, vUv + vec2(uUvOffset, 0.0)).rgb;
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
  /** Longitude shift applied to the surface, in UV turns (matches the day map). */
  uvOffsetU?: number
}

export function NightLights({
  radius,
  visuals,
  sunPosition,
  opacity = 1,
  uvOffsetU = 0,
}: NightLightsProps) {
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
          uUvOffset: { value: uvOffsetU },
        },
        transparent: true,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [visuals.color, visuals.intensity, visuals.textureId, sunPosition, opacity, uvOffsetU],
  )

  useFrame(() => {
    material.uniforms.uSunPosition.value.copy(sunPosition)
    material.uniforms.uOpacity.value = opacity
  })

  return <mesh ref={meshRef} geometry={HIGH_DETAIL_SPHERE} material={material} scale={radius * 1.002} />
}