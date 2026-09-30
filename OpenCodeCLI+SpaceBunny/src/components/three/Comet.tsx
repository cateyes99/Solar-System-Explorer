import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  IcosahedronGeometry,
  Mesh,
  MeshBasicMaterial,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import { orbitRadiusUnits } from '../../utils/scale'
import { simClock } from '../../store/clock'
import { bodyPosition, setBodyRadius } from '../../store/registry'
import { useAppStore } from '../../store/useAppStore'
import { createGlowMaterial } from './materials'
import { createGlowSprite } from '../../utils/textures'

/** A long, highly eccentric orbit that carries the comet across the system. */
const COMET = {
  perihelionAU: 0.6,
  aphelionAU: 34,
  periodDays: 9_500,
  e: 0.83,
  inclinationDeg: 21,
}

const TAIL_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const TAIL_FRAG = /* glsl */ `
  uniform vec3 uColorHead;
  uniform vec3 uColorTail;
  uniform float uStrength;
  varying vec2 vUv;

  void main() {
    // uv.y runs from the nucleus (0) out to the tip of the tail (1).
    float fade = pow(1.0 - vUv.y, 1.7);
    float streak = smoothstep(0.0, 0.12, vUv.y);
    vec3 color = mix(uColorTail, uColorHead, fade);
    float alpha = fade * streak * uStrength;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color, alpha);
  }
`

/**
 * A single long-period comet — mostly an easter egg, but also a genuine member
 * of the outer Solar System. Clicking it is a small discovery.
 */
export function Comet({ distanceExponent }: { distanceExponent: number }) {
  const groupRef = useRef<Group>(null)
  const nucleusRef = useRef<Mesh>(null)
  const comaRef = useRef<Mesh>(null)
  const tailRef = useRef<Mesh>(null)

  const findComet = useAppStore((s) => s.findComet)
  const setHovered = useAppStore((s) => s.setHovered)
  const reducedMotion = useAppStore((s) => s.reducedMotion)

  const perihelion = orbitRadiusUnits(COMET.perihelionAU, distanceExponent)
  const aphelion = orbitRadiusUnits(COMET.aphelionAU, distanceExponent)
  const a = (perihelion + aphelion) / 2
  const b = a * Math.sqrt(1 - COMET.e ** 2)

  const nucleusGeometry = useMemo(() => new IcosahedronGeometry(1, 1), [])
  const nucleusMaterial = useMemo(
    () => new MeshBasicMaterial({ color: new Color('#dff1ff'), toneMapped: false }),
    [],
  )
  const comaGeometry = useMemo(() => new SphereGeometry(1, 20, 14), [])
  const comaMaterial = useMemo(
    () => createGlowMaterial(createGlowSprite('#eaffff', '#5fd4ff'), '#bff0ff'),
    [],
  )

  // A tapered triangle that points along local +Z (away from the Sun).
  const tailGeometry = useMemo(() => {
    const geo = new BufferGeometry()
    const positions = new Float32Array([0, 0, 0, -1, 1, 1, 1, 1, 1])
    const uvs = new Float32Array([0.5, 0, 0, 1, 1, 1])
    geo.setAttribute('position', new BufferAttribute(positions, 3))
    geo.setAttribute('uv', new BufferAttribute(uvs, 2))
    geo.setIndex([0, 1, 2])
    return geo
  }, [])

  const tailMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uColorHead: { value: new Color('#eafaff') },
          uColorTail: { value: new Color('#3f8cff') },
          uStrength: { value: 0.9 },
        },
        vertexShader: TAIL_VERT,
        fragmentShader: TAIL_FRAG,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        blending: AdditiveBlending,
      }),
    [],
  )

  const nucleusRadius = Math.max(0.08, a * 0.0022)

  useEffect(() => {
    setBodyRadius('comet', nucleusRadius)
    bodyPosition('comet').set(0, 0, 0)
    return () => {
      nucleusGeometry.dispose()
      nucleusMaterial.dispose()
      comaGeometry.dispose()
      comaMaterial.dispose()
      tailGeometry.dispose()
      tailMaterial.dispose()
    }
  }, [nucleusRadius, nucleusGeometry, nucleusMaterial, comaGeometry, comaMaterial, tailGeometry, tailMaterial])

  const local = useMemo(() => new Vector3(), [])
  const world = useMemo(() => new Vector3(), [])
  const antiSun = useMemo(() => new Vector3(), [])

  useFrame(({ camera }) => {
    const group = groupRef.current
    if (!group) return

    const angle = ((simClock.simDays / COMET.periodDays) % 1) * Math.PI * 2
    local.set(a * (Math.cos(angle) - COMET.e), 0, b * Math.sin(angle))
    group.position.copy(local)
    group.rotation.set(
      (COMET.inclinationDeg * Math.PI) / 180,
      (COMET.inclinationDeg * Math.PI) / 180,
      0,
    )

    group.getWorldPosition(world)
    bodyPosition('comet').copy(world)

    // The coma and tail brighten dramatically near perihelion.
    const distance = world.length()
    const heat = Math.max(0, Math.min(1, (1 - distance / (a * 1.4)) * 1.5))
    const intensity = 0.1 + heat * heat * 0.8

    if (comaRef.current) {
      comaRef.current.quaternion.copy(camera.quaternion)
      const s = nucleusRadius * (3.5 + heat * 5)
      comaRef.current.scale.set(s, s, s)
      comaMaterial.uniforms.uIntensity.value = intensity
    }

    // Tails always point directly away from the Sun.
    antiSun.copy(world).negate().normalize()
    if (tailRef.current) {
      const length = a * (0.03 + heat * 0.16)
      const width = nucleusRadius * (3 + heat * 4)
      tailRef.current.scale.set(width, width, length)
      tailRef.current.lookAt(antiSun)
      tailMaterial.uniforms.uStrength.value = reducedMotion ? 0.3 : 0.18 + heat * 0.5
    }
  })

  return (
    <group ref={groupRef}>
      <mesh
        ref={nucleusRef}
        geometry={nucleusGeometry}
        material={nucleusMaterial}
        scale={nucleusRadius}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered('comet', { x: event.clientX, y: event.clientY })
        }}
        onPointerOut={() => setHovered(null)}
        onClick={(event) => {
          event.stopPropagation()
          findComet()
          useAppStore.getState().select('comet')
        }}
      />
      <mesh ref={comaRef} geometry={comaGeometry} material={comaMaterial} renderOrder={3} />
      <mesh ref={tailRef} geometry={tailGeometry} material={tailMaterial} renderOrder={3} />
    </group>
  )
}