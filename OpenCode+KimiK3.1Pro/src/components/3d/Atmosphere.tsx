import { AdditiveBlending, BackSide, Color, ShaderMaterial } from 'three'
import { useMemo } from 'react'

const vertexShader = /* glsl */ `
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vNormal = normalize(mat3(modelMatrix) * normal);
    vec4 worldPosition = modelMatrix * vec4(position, 1.0);
    vWorldPosition = worldPosition.xyz;
    gl_Position = projectionMatrix * viewMatrix * worldPosition;
  }
`

const fragmentShader = /* glsl */ `
  uniform vec3 uColor;
  uniform float uIntensity;
  varying vec3 vNormal;
  varying vec3 vWorldPosition;
  void main() {
    vec3 viewDirection = normalize(cameraPosition - vWorldPosition);
    float rim = pow(1.0 - abs(dot(viewDirection, normalize(vNormal))), 3.2);
    gl_FragColor = vec4(uColor * (1.1 + rim), rim * uIntensity);
  }
`

interface AtmosphereProps {
  color: string
  scale?: number
  intensity?: number
}

export function Atmosphere({ color, scale = 1.1, intensity = 0.65 }: AtmosphereProps) {
  const material = useMemo(() => new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: {
      uColor: { value: new Color(color) },
      uIntensity: { value: intensity },
    },
    transparent: true,
    depthWrite: false,
    side: BackSide,
    blending: AdditiveBlending,
  }), [color, intensity])

  return (
    <mesh scale={scale} material={material} raycast={() => null}>
      <sphereGeometry args={[1, 40, 24]} />
    </mesh>
  )
}
