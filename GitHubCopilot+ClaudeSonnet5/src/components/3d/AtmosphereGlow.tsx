import { useEffect, useMemo } from 'react'
import * as THREE from 'three'

const VERTEX_SHADER = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vNormal = normalize(normalMatrix * normal);
    vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
    vViewPosition = -mvPosition.xyz;
    gl_Position = projectionMatrix * mvPosition;
  }
`

const FRAGMENT_SHADER = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  varying vec3 vNormal;
  varying vec3 vViewPosition;

  void main() {
    vec3 viewDir = normalize(vViewPosition);
    float rim = pow(1.0 - max(dot(viewDir, normalize(vNormal)), 0.0), uPower);
    gl_FragColor = vec4(uColor, rim * uIntensity);
  }
`

interface AtmosphereGlowProps {
  radius: number
  color: string
  intensity?: number
  power?: number
  thickness?: number
}

/** A view-angle-dependent (Fresnel) rim glow shell simulating a thin atmosphere. */
export function AtmosphereGlow({ radius, color, intensity = 0.9, power = 2.4, thickness = 0.12 }: AtmosphereGlowProps) {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uIntensity: { value: intensity },
          uPower: { value: power },
        },
        vertexShader: VERTEX_SHADER,
        fragmentShader: FRAGMENT_SHADER,
        transparent: true,
        depthWrite: false,
        side: THREE.BackSide,
        blending: THREE.AdditiveBlending,
      }),
    [color, intensity, power],
  )

  useEffect(() => () => material.dispose(), [material])

  return (
    <mesh scale={1 + thickness}>
      <sphereGeometry args={[radius, 48, 48]} />
      <primitive object={material} attach="material" />
    </mesh>
  )
}
