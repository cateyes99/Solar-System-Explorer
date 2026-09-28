import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, ShaderMaterial, Vector3 } from 'three'
import type { Mesh } from 'three'
import type { AtmosphereVisuals } from '../../data/visuals'
import { HIGH_DETAIL_SPHERE } from './geometry'

/**
 * Atmospheric glow, drawn as a slightly larger additive shell.
 *
 * The rim term is computed in view space (so it always hugs the silhouette) and
 * the haze is multiplied by a soft day/night terminator, which means Earth's
 * atmosphere fades out exactly where night begins.
 */
const vertexShader = /* glsl */ `
  varying vec3 vViewNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    vWorldNormal = normalize(mat3(modelMatrix) * normal);
    vViewNormal = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  uniform float uOpacity;
  uniform vec3 uSunPosition;
  varying vec3 vViewNormal;
  varying vec3 vWorldNormal;
  varying vec3 vWorldPosition;

  void main() {
    vec3 viewNormal = normalize(vViewNormal);
    // Rim term: 0 while we look straight at the shell, growing toward the limb.
    float rim = pow(clamp(0.74 - viewNormal.z, 0.0, 1.0), uPower);
    vec3 sunDirection = normalize(uSunPosition - vWorldPosition);
    float lit = smoothstep(-0.28, 0.6, dot(normalize(vWorldNormal), sunDirection));
    float alpha = rim * uIntensity * (lit * 0.86 + 0.14) * uOpacity;
    gl_FragColor = vec4(uColor * alpha, alpha);
  }
`

interface AtmosphereProps {
  radius: number
  visuals: AtmosphereVisuals
  /** Multiplier allows fades for focus changes and the "What If?" experiments. */
  opacity?: number
  sunPosition: Vector3
}

export function Atmosphere({ radius, visuals, opacity = 1, sunPosition }: AtmosphereProps) {
  const meshRef = useRef<Mesh>(null)

  const material = useMemo(() => {
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: new Color(visuals.color) },
        uIntensity: { value: visuals.intensity },
        uPower: { value: visuals.power },
        uOpacity: { value: opacity },
        uSunPosition: { value: sunPosition.clone() },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    })
  }, [visuals.color, visuals.intensity, visuals.power, sunPosition, opacity])

  const hazeMaterial = useMemo(() => {
    if (!visuals.hazeColor) return null
    return new ShaderMaterial({
      vertexShader,
      fragmentShader,
      uniforms: {
        uColor: { value: new Color(visuals.hazeColor) },
        uIntensity: { value: visuals.hazeIntensity ?? 0.3 },
        uPower: { value: Math.max(1.1, visuals.power - 1.6) },
        uOpacity: { value: opacity },
        uSunPosition: { value: sunPosition.clone() },
      },
      transparent: true,
      blending: AdditiveBlending,
      depthWrite: false,
    })
  }, [visuals.hazeColor, visuals.hazeIntensity, visuals.power, sunPosition, opacity])

  // The Sun barely moves, but keeping the uniform fresh costs nothing and keeps
  // the terminator correct in every scale mode.
  useFrame(() => {
    material.uniforms.uSunPosition.value.copy(sunPosition)
    material.uniforms.uOpacity.value = opacity
    if (hazeMaterial) {
      hazeMaterial.uniforms.uSunPosition.value.copy(sunPosition)
      hazeMaterial.uniforms.uOpacity.value = opacity
    }
  })

  return (
    <group ref={meshRef}>
      <mesh geometry={HIGH_DETAIL_SPHERE} material={material} scale={radius * 1.045} />
      {hazeMaterial ? (
        <mesh geometry={HIGH_DETAIL_SPHERE} material={hazeMaterial} scale={radius * 1.14} />
      ) : null}
    </group>
  )
}