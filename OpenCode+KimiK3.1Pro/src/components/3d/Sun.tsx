import { useEffect, useMemo, useRef, useState } from 'react'
import { Html } from './HtmlLabel'
import { useFrame } from '@react-three/fiber'
import type { ThreeEvent } from '@react-three/fiber'
import {
  AdditiveBlending,
  Group,
  MathUtils,
  Mesh,
  PointLight,
  ShaderMaterial,
  Sprite,
  SpriteMaterial,
} from 'three'
import { SUN } from '../../data/planets'
import { createGlowTexture } from '../../graphics/proceduralTextures'
import { useSimulationStore } from '../../store/simulationStore'
import { registerBody } from '../../utils/bodyRegistry'
import { getBodyRadius } from '../../utils/scale'

const vertexShader = /* glsl */ `
  varying vec3 vPosition;
  varying vec3 vNormal;
  void main() {
    vPosition = position;
    vNormal = normal;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const fragmentShader = /* glsl */ `
  uniform float uTime;
  uniform float uAlive;
  varying vec3 vPosition;
  varying vec3 vNormal;
  float hash(vec3 p) { return fract(sin(dot(p, vec3(127.1,311.7,74.7))) * 43758.5453); }
  float noise(vec3 p) {
    vec3 i=floor(p), f=fract(p); f=f*f*(3.0-2.0*f);
    return mix(mix(mix(hash(i),hash(i+vec3(1,0,0)),f.x),mix(hash(i+vec3(0,1,0)),hash(i+vec3(1,1,0)),f.x),f.y),mix(mix(hash(i+vec3(0,0,1)),hash(i+vec3(1,0,1)),f.x),mix(hash(i+vec3(0,1,1)),hash(i+vec3(1,1,1)),f.x),f.y),f.z);
  }
  float fbm(vec3 p) {
    float value=0.0; float amp=0.55;
    for(int i=0;i<5;i++){value+=noise(p)*amp;p=p*2.03+3.1;amp*=0.48;}
    return value;
  }
  void main() {
    vec3 p=normalize(vPosition);
    float flow=fbm(p*4.2+vec3(uTime*.055,-uTime*.035,uTime*.025));
    float cells=fbm(p*13.0+flow*2.0-uTime*.02);
    float rim=pow(1.0-abs(dot(normalize(vNormal),vec3(0.0,0.0,1.0))),2.0);
    vec3 dark=vec3(1.0,.12,.008);
    vec3 orange=vec3(1.0,.42,.025);
    vec3 hot=vec3(1.0,.91,.48);
    vec3 color=mix(dark,orange,smoothstep(.25,.72,flow));
    color=mix(color,hot,smoothstep(.55,.9,cells+flow*.22));
    color*=1.25+cells*.9;
    color=mix(vec3(.12,.018,.008)*(flow+.2),color,uAlive);
    gl_FragColor=vec4(color,1.0);
  }
`

export function Sun() {
  const group = useRef<Group>(null)
  const surface = useRef<Mesh>(null)
  const light = useRef<PointLight>(null)
  const flare = useRef<Sprite>(null)
  const flareStrength = useRef(0)
  const [hovered, setHovered] = useState(false)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const customSize = useSimulationStore((state) => state.customSize)
  const noSun = useSimulationStore((state) => state.whatIf === 'no-sun')
  const selected = useSimulationStore((state) => state.selectedBody === 'sun')
  const selectBody = useSimulationStore((state) => state.selectBody)
  const registerSunClick = useSimulationStore((state) => state.registerSunClick)
  const showToast = useSimulationStore((state) => state.showToast)
  const glowTexture = useMemo(() => createGlowTexture(), [])
  const material = useMemo(() => new ShaderMaterial({
    vertexShader,
    fragmentShader,
    uniforms: { uTime: { value: 0 }, uAlive: { value: 1 } },
  }), [])
  const radius = getBodyRadius(SUN, scaleMode, customSize)

  useEffect(() => {
    if (group.current) return registerBody('sun', group.current)
  }, [])
  useEffect(() => () => {
    glowTexture.dispose()
    material.dispose()
  }, [glowTexture, material])

  useFrame(({ clock }, delta) => {
    material.uniforms.uTime.value = clock.elapsedTime * (reducedMotion ? 0.08 : 1)
    material.uniforms.uAlive.value = MathUtils.damp(material.uniforms.uAlive.value, noSun ? 0 : 1, 3, delta)
    if (group.current) {
      const size = MathUtils.damp(group.current.scale.x, radius, 4, delta)
      group.current.scale.setScalar(size)
    }
    if (surface.current && !reducedMotion) surface.current.rotation.y += delta * 0.018
    if (light.current) light.current.intensity = MathUtils.damp(light.current.intensity, noSun ? 0 : 180, 2.5, delta)
    if (flare.current) {
      flareStrength.current = MathUtils.damp(flareStrength.current, 0, 1.8, delta)
      const strength = flareStrength.current
      flare.current.scale.setScalar(5 + strength * 7)
      ;(flare.current.material as SpriteMaterial).opacity = strength * 0.75
    }
  })

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    selectBody('sun')
    const clicks = registerSunClick()
    if (clicks >= 3) {
      flareStrength.current = 1
      showToast('Solar flare! The Sun releases huge bursts of energy and particles.', 'sun')
    }
  }

  return (
    <group ref={group} scale={radius}>
      <pointLight ref={light} color="#fff1d6" intensity={180} decay={1.2} distance={0} />
      <sprite scale={[5.4, 5.4, 1]} raycast={() => null}>
        <spriteMaterial map={glowTexture} transparent opacity={noSun ? 0 : 0.5} depthWrite={false} blending={AdditiveBlending} />
      </sprite>
      <sprite ref={flare} scale={[5, 5, 1]} raycast={() => null}>
        <spriteMaterial map={glowTexture} transparent opacity={0} depthWrite={false} blending={AdditiveBlending} />
      </sprite>
      <mesh
        ref={surface}
        material={material}
        onClick={handleClick}
        onDoubleClick={(event) => { event.stopPropagation(); selectBody('sun', true) }}
        onPointerOver={(event) => { event.stopPropagation(); setHovered(true); document.body.style.cursor = 'pointer' }}
        onPointerOut={() => { setHovered(false); document.body.style.cursor = 'default' }}
      >
        <sphereGeometry args={[1, 64, 48]} />
      </mesh>
      {selected && (
        <mesh rotation={[Math.PI / 2, 0, 0]} raycast={() => null}>
          <ringGeometry args={[1.18, 1.2, 96]} />
          <meshBasicMaterial color="#ffc773" transparent opacity={0.7} depthWrite={false} />
        </mesh>
      )}
      {hovered && (
        <Html center position={[0, 1.45, 0]} zIndexRange={[30, 0]} style={{ pointerEvents: 'none' }}>
          <div className="planet-tooltip planet-tooltip--sun"><strong>The Sun</strong><span>Our star · Click to discover</span></div>
        </Html>
      )}
    </group>
  )
}
