import { useMemo } from 'react'
import * as THREE from 'three'

const VERTEX = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  uniform float uPower;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    float rim = pow(1.0 - abs(dot(vNormal, vView)), uPower);
    gl_FragColor = vec4(uColor, 1.0) * rim * uIntensity;
  }
`

interface AtmosphereProps {
  radius: number
  color: string
  intensity?: number
  power?: number
}

/** Fresnel rim-glow shell rendered on the back side, giving bodies a soft halo. */
export function Atmosphere({
  radius,
  color,
  intensity = 1,
  power = 3.2,
}: AtmosphereProps): JSX.Element {
  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: {
          uColor: { value: new THREE.Color(color) },
          uIntensity: { value: intensity },
          uPower: { value: power },
        },
        transparent: true,
        blending: THREE.AdditiveBlending,
        side: THREE.BackSide,
        depthWrite: false,
      }),
    [color, intensity, power],
  )
  return (
    <mesh material={material} scale={radius}>
      <sphereGeometry args={[1, 48, 32]} />
    </mesh>
  )
}
