import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { useSimulation } from '../../store/simulationStore'
import { getGlowTexture } from '../../utils/textures'
import { registerBody } from '../../utils/registry'
import { useClickWithoutDrag } from '../../hooks/usePointerDragGuard'
import { audio } from '../../audio/audioEngine'
import { SunFlare } from './SunFlare'

const VERTEX = /* glsl */ `
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vView;
  void main() {
    vPos = position;
    vec4 worldPos = modelMatrix * vec4(position, 1.0);
    vNormal = normalize(mat3(modelMatrix) * normal);
    vView = normalize(cameraPosition - worldPos.xyz);
    gl_Position = projectionMatrix * viewMatrix * worldPos;
  }
`

const FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uBoost;
  varying vec3 vPos;
  varying vec3 vNormal;
  varying vec3 vView;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.17, 0.13));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }
  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x),
          mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
      mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x),
          mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y),
      f.z);
  }
  float fbm(vec3 p) {
    float sum = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 4; i++) {
      sum += amp * noise(p);
      p *= 2.1;
      amp *= 0.5;
    }
    return sum;
  }

  void main() {
    vec3 p = normalize(vPos);
    float n = fbm(p * 3.4 + vec3(uTime * 0.05, uTime * 0.03, -uTime * 0.04));
    float n2 = fbm(p * 8.0 - vec3(0.0, uTime * 0.08, 0.0));
    float heat = clamp(n * 0.75 + n2 * 0.35, 0.0, 1.0);
    vec3 c1 = vec3(0.98, 0.32, 0.02);
    vec3 c2 = vec3(1.0, 0.72, 0.20);
    vec3 c3 = vec3(1.0, 0.95, 0.72);
    vec3 col = mix(c1, c2, smoothstep(0.15, 0.6, heat));
    col = mix(col, c3, smoothstep(0.55, 0.95, heat));
    // Limb darkening: the edge looks a little cooler and softer.
    float limb = clamp(dot(vNormal, vView), 0.0, 1.0);
    col *= 0.62 + 0.55 * limb;
    col *= 1.55 + uBoost;
    gl_FragColor = vec4(col, 1.0);
  }
`

interface SunProps {
  radius: number
}

/** The Sun: animated procedural surface, corona, sunlight, and a flare easter egg. */
export function Sun({ radius }: SunProps): JSX.Element {
  const group = useRef<THREE.Group>(null)
  const surface = useRef<THREE.Mesh>(null)
  const corona = useRef<THREE.Sprite>(null)
  const boostTarget = useRef(0)
  const clickCount = useRef(0)
  const unregister = useRef<() => void>(() => {})
  const guard = useClickWithoutDrag()

  const material = useMemo(
    () =>
      new THREE.ShaderMaterial({
        vertexShader: VERTEX,
        fragmentShader: FRAGMENT,
        uniforms: { uTime: { value: 0 }, uBoost: { value: 0 } },
      }),
    [],
  )
  const coronaTex = useMemo(
    () => getGlowTexture('rgba(255,196,100,0.85)', 'rgba(255,120,30,0.30)', 'rgba(255,80,10,0)'),
    [],
  )
  const haloTex = useMemo(
    () => getGlowTexture('rgba(255,170,70,0.28)', 'rgba(255,130,45,0.10)', 'rgba(255,90,20,0)'),
    [],
  )

  const noSun = useSimulation((s) => s.whatIf.noSun)

  useEffect(() => {
    if (group.current) unregister.current = registerBody('sun', group.current)
    return () => {
      unregister.current()
      document.body.style.cursor = ''
    }
  }, [])

  useEffect(() => {
    if (group.current) group.current.visible = !noSun
  }, [noSun])

  useFrame((state, dt) => {
    const t = state.clock.elapsedTime
    material.uniforms.uTime.value = t
    material.uniforms.uBoost.value = THREE.MathUtils.damp(
      material.uniforms.uBoost.value as number,
      boostTarget.current,
      6,
      dt,
    )
    if (surface.current && !useSimulation.getState().reduceMotion) {
      surface.current.rotation.y += dt * 0.015
    }
    if (corona.current && !useSimulation.getState().reduceMotion) {
      const s = radius * (4.4 + Math.sin(t * 1.6) * 0.14)
      corona.current.scale.set(s, s, 1)
    }
  })

  const handleClick = (e: { stopPropagation: () => void }): void => {
    e.stopPropagation()
    if (!guard.wasClick(e as unknown as { clientX: number; clientY: number })) return
    clickCount.current += 1
    const store = useSimulation.getState()
    if (clickCount.current % 3 === 0) {
      store.triggerSunFlare()
      store.pushToast('Solar flare! The Sun sneezed 🌞', '☀️')
      audio.whoosh()
    } else {
      audio.blip(520)
    }
  }

  return (
    <group ref={group}>
      <mesh
        ref={surface}
        material={material}
        scale={radius}
        onPointerDown={guard.onPointerDown}
        onClick={handleClick}
        onPointerOver={(e) => {
          e.stopPropagation()
          boostTarget.current = 0.35
          useSimulation.getState().setHovered('sun')
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          boostTarget.current = 0
          useSimulation.getState().setHovered(null)
          document.body.style.cursor = ''
        }}
      >
        <sphereGeometry args={[1, 64, 48]} />
      </mesh>
      <sprite ref={corona} scale={radius * 4.4}>
        <spriteMaterial
          map={coronaTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.9}
        />
      </sprite>
      <sprite scale={radius * 10}>
        <spriteMaterial
          map={haloTex}
          transparent
          depthWrite={false}
          blending={THREE.AdditiveBlending}
          opacity={0.8}
        />
      </sprite>
      {/* The only real light source in the Solar System. */}
      <pointLight color="#fff3d8" intensity={2.6} decay={0} />
      <SunFlare radius={radius} />
    </group>
  )
}
