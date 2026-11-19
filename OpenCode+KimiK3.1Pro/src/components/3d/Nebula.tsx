import { BackSide } from 'three'

const vertexShader = /* glsl */ `
  varying vec3 vDirection;
  void main() {
    vDirection = normalize(position);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  varying vec3 vDirection;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1, 311.7, 74.7))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i = floor(p); vec3 f = fract(p); f = f * f * (3.0 - 2.0 * f);
    return mix(mix(mix(hash(i), hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  void main() {
    vec3 d = normalize(vDirection);
    float band = pow(max(0.0, 1.0 - abs(d.y * 0.8 + d.x * 0.25)), 7.0);
    float cloud = noise(d * 5.0) * 0.6 + noise(d * 12.0) * 0.25;
    vec3 base = vec3(0.003, 0.006, 0.015);
    vec3 blue = vec3(0.014, 0.035, 0.075) * band * cloud;
    vec3 purple = vec3(0.032, 0.012, 0.055) * band * noise(d * 7.0 + 4.0) * 0.6;
    gl_FragColor = vec4(base + blue + purple, 1.0);
  }
`

export function Nebula() {
  return (
    <mesh scale={280} raycast={() => null}>
      <sphereGeometry args={[1, 40, 24]} />
      <shaderMaterial vertexShader={vertexShader} fragmentShader={fragmentShader} side={BackSide} depthWrite={false} />
    </mesh>
  )
}
