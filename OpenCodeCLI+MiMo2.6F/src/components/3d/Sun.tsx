import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import { useSimStore } from '../../store/simulationStore'
import { useScale } from '../../hooks/useScale'
import { getSceneTextures } from '../../utils/sceneTextures'
import { playBlip } from '../../utils/audio'
/** Animated granulation shader — the Sun's surface boils continuously. */
const SUN_VERTEX = /* glsl */ `
  varying vec3 vNormalView;
  varying vec3 vPos;
  void main() {
    vPos = position;
    vNormalView = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const SUN_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uFlare;
  varying vec3 vNormalView;
  varying vec3 vPos;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.1, 0.17, 0.23));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 x) {
    vec3 i = floor(x);
    vec3 f = fract(x);
    f = f * f * (3.0 - 2.0 * f);
    float n000 = hash(i);
    float n100 = hash(i + vec3(1.0, 0.0, 0.0));
    float n010 = hash(i + vec3(0.0, 1.0, 0.0));
    float n110 = hash(i + vec3(1.0, 1.0, 0.0));
    float n001 = hash(i + vec3(0.0, 0.0, 1.0));
    float n101 = hash(i + vec3(1.0, 0.0, 1.0));
    float n011 = hash(i + vec3(0.0, 1.0, 1.0));
    float n111 = hash(i + vec3(1.0, 1.0, 1.0));
    return mix(
      mix(mix(n000, n100, f.x), mix(n010, n110, f.x), f.y),
      mix(mix(n001, n101, f.x), mix(n011, n111, f.x), f.y),
      f.z
    );
  }

  float fbm(vec3 p) {
    float value = 0.0;
    float amplitude = 0.5;
    for (int i = 0; i < 5; i++) {
      value += amplitude * noise(p);
      p *= 2.03;
      amplitude *= 0.5;
    }
    return value;
  }

  void main() {
    vec3 dir = normalize(vPos);
    float t = uTime * 0.06;
    float granulation = fbm(dir * 4.5 + vec3(0.0, t, t * 0.6)) * 0.7
                      + fbm(dir * 11.0 - vec3(t * 1.4, 0.0, t)) * 0.45;

    vec3 deep = vec3(0.95, 0.24, 0.03);
    vec3 mid = vec3(1.0, 0.58, 0.11);
    vec3 hot = vec3(1.0, 0.93, 0.68);

    vec3 color = mix(deep, mid, smoothstep(0.32, 0.6, granulation));
    color = mix(color, hot, smoothstep(0.6, 0.86, granulation));

    // Limb glow: edges read hotter, like looking through the corona
    float rim = pow(1.0 - abs(dot(normalize(vNormalView), vec3(0.0, 0.0, 1.0))), 2.2);
    color += vec3(1.0, 0.55, 0.2) * rim * 0.45;
    color *= 1.0 + uFlare * 0.7;

    gl_FragColor = vec4(color, 1.0);
  }
`

const FLARE_SLOTS: { angle: number; height: number; size: number }[] = [
  { angle: 0.4, height: 0.25, size: 0.42 },
  { angle: 2.3, height: -0.4, size: 0.3 },
  { angle: 4.1, height: 0.6, size: 0.36 },
  { angle: 5.5, height: -0.15, size: 0.26 },
]

export function Sun() {
  const scale = useScale()
  const textures = getSceneTextures()
  const store = useSimStore
  const sunGone = useSimStore((s) => s.whatIf.sunGone)
  const reducedMotion = useSimStore((s) => s.reducedMotion)

  const meshRef = useRef<THREE.Mesh>(null)
  const lightRef = useRef<THREE.PointLight>(null)
  const flareRefs = useRef<(THREE.Sprite | null)[]>([])
  const materialRef = useRef<THREE.ShaderMaterial>(null)
  const flareAmount = useRef(0)
  const clickCount = useRef(0)

  const [flaresVisible, setFlaresVisible] = useState(false)

  const uniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uFlare: { value: 0 },
    }),
    [],
  )

  // Easter egg: rapid clicks release a solar flare
  const flareToken = useSimStore((s) => s.sunFlareLevel)
  useEffect(() => {
    if (flareToken > 0) {
      flareAmount.current = 1
      setFlaresVisible(true)
    }
  }, [flareToken])

  const radius = scale.sunRadius

  useFrame((state, delta) => {
    const dt = Math.min(delta, 0.1)
    const simState = store.getState()
    // Hover / selection feedback: the Sun warms up and brightens slightly.
    const hoverBoost =
      simState.hoveredId === 'sun' ? 1.14 : simState.selectedId === 'sun' ? 1.07 : 1
    if (materialRef.current) {
      materialRef.current.uniforms.uTime.value = reducedMotion
        ? 0
        : state.clock.elapsedTime
      flareAmount.current = Math.max(0, flareAmount.current - dt * 0.5)
      materialRef.current.uniforms.uFlare.value = flareAmount.current
      if (flareAmount.current === 0 && flaresVisible) setFlaresVisible(false)
    }

    if (meshRef.current) {
      meshRef.current.rotation.y += dt * (reducedMotion ? 0 : 0.02)
    }

    if (lightRef.current) {
      lightRef.current.intensity =
        92 * (1 + flareAmount.current * 0.5) * hoverBoost * (sunGone ? 0 : 1)
      lightRef.current.visible = !sunGone
    }

    // Pulsing limb flares
    const t = state.clock.elapsedTime
    flareRefs.current.forEach((sprite, index) => {
      if (!sprite) return
      const slot = FLARE_SLOTS[index]
      const pulse = 0.6 + Math.sin(t * 1.7 + index * 2.1) * 0.4
      const boost = (1 + flareAmount.current * 2.2) * hoverBoost
      const size = radius * slot.size * (0.75 + pulse * 0.5) * boost
      sprite.scale.set(size, size, 1)
      const material = sprite.material as THREE.SpriteMaterial
      material.opacity =
        (0.25 + pulse * 0.3 + flareAmount.current * 0.4) * (sunGone ? 0 : 1)
    })
  })

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    clickCount.current += 1
    store.getState().select('sun')
    store.getState().focusBody('sun')
    playBlip(880, 0.1)
    if (clickCount.current % 3 === 0) {
      store.getState().triggerSunFlare()
      store.getState().showToast('Solar flare! The Sun just released a burst of energy.', 'fun')
      store.getState().setWhatIf('sunGone', false)
    } else if (clickCount.current % 3 === 1) {
      store.getState().showToast('Hello, Sun! You are a middle-aged yellow star.', 'fun')
    }
  }

  return (
    <group position={[0, 0, 0]}>
      <mesh
        ref={meshRef}
        onClick={handleClick}
        onPointerOver={(event) => {
          event.stopPropagation()
          store.getState().setHovered('sun')
          document.body.style.cursor = 'pointer'
        }}
        onPointerOut={() => {
          store.getState().setHovered(null)
          document.body.style.cursor = ''
        }}
        scale={radius}
        visible={!sunGone}
      >
        <sphereGeometry args={[1, 64, 48]} />
        <shaderMaterial
          ref={materialRef}
          uniforms={uniforms}
          vertexShader={SUN_VERTEX}
          fragmentShader={SUN_FRAGMENT}
        />
      </mesh>

      {/* Corona + glow billboards */}
      <sprite scale={radius * 6.2} visible={!sunGone}>
        <spriteMaterial
          map={textures.glow}
          transparent
          opacity={0.7}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>
      <sprite scale={radius * 2.9} visible={!sunGone}>
        <spriteMaterial
          map={textures.glow}
          transparent
          opacity={0.92}
          depthWrite={false}
          blending={THREE.AdditiveBlending}
        />
      </sprite>

      {/* Solar flares around the limb */}
      {FLARE_SLOTS.map((slot, index) => {
        const x = Math.cos(slot.angle) * radius
        const z = Math.sin(slot.angle) * radius
        const y = slot.height * radius
        return (
          <sprite
            key={index}
            position={[x, y, z]}
            ref={(el) => {
              flareRefs.current[index] = el
            }}
            visible={!sunGone}
          >
            <spriteMaterial
              map={textures.glow}
              transparent
              opacity={0.4}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </sprite>
        )
      })}

      <pointLight
        ref={lightRef}
        intensity={92}
        decay={1}
        distance={0}
        color="#fff2d8"
        visible={!sunGone}
      />
    </group>
  )
}
