import { useEffect, useMemo, useRef } from 'react'
import { useFrame, type ThreeEvent } from '@react-three/fiber'
import * as THREE from 'three'
import type { Body } from '../../data/planets'
import { useSimStore } from '../../store/simulationStore'
import { useScale } from '../../hooks/useScale'
import { getSceneTextures } from '../../utils/sceneTextures'
import { bodyPositions, simClock } from '../../utils/simClock'
import { axialRotation, orbitalPosition } from '../../utils/astronomy'
import { playBlip } from '../../utils/audio'
import type { SceneTextures } from '../../utils/textures'

const ATMOSPHERE_VERTEX = /* glsl */ `
  varying vec3 vNormalView;
  void main() {
    vNormalView = normalize(normalMatrix * normal);
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const ATMOSPHERE_FRAGMENT = /* glsl */ `
  uniform vec3 uColor;
  uniform float uStrength;
  varying vec3 vNormalView;
  void main() {
    float intensity = pow(0.68 - dot(vNormalView, vec3(0.0, 0.0, 1.0)), 2.6);
    intensity = clamp(intensity, 0.0, 1.0) * uStrength;
    gl_FragColor = vec4(uColor, 1.0) * intensity;
  }
`

interface AtmosphereDef {
  color: string
  strength: number
}

const ATMOSPHERES: Partial<Record<Body['id'], AtmosphereDef>> = {
  venus: { color: '#f3d9a4', strength: 0.55 },
  earth: { color: '#4ea3ff', strength: 1.0 },
  mars: { color: '#e07a4f', strength: 0.4 },
  jupiter: { color: '#e6b98a', strength: 0.35 },
  saturn: { color: '#e8d3a0', strength: 0.3 },
  uranus: { color: '#9fe9ee', strength: 0.45 },
  neptune: { color: '#5f8dff', strength: 0.55 },
}

const TEXTURE_KEYS: Partial<Record<Body['id'], keyof SceneTextures>> = {
  mercury: 'mercury',
  venus: 'venus',
  earth: 'earth',
  mars: 'mars',
  jupiter: 'jupiter',
  saturn: 'saturn',
  uranus: 'uranus',
  neptune: 'neptune',
}

/** Slightly softer lighting response for the gas giants. */
const ROUGHNESS: Partial<Record<Body['id'], number>> = {
  mercury: 1,
  venus: 0.95,
  earth: 0.72,
  mars: 1,
  jupiter: 0.92,
  saturn: 0.95,
  uranus: 0.9,
  neptune: 0.9,
}

/**
 * Saturn / Uranus rings. RingGeometry UVs are remapped so the texture runs
 * radially across the ring, which is what makes the banding read correctly.
 */
function PlanetRings({
  inner,
  outer,
  color,
  opacity,
}: {
  inner: number
  outer: number
  color: string
  opacity: number
}) {
  const textures = getSceneTextures()
  const geometry = useMemo(() => {
    const geo = new THREE.RingGeometry(inner, outer, 160, 1)
    const positions = geo.attributes.position
    const uvs = geo.attributes.uv
    const vertex = new THREE.Vector3()
    for (let i = 0; i < positions.count; i++) {
      vertex.fromBufferAttribute(positions, i)
      const radius = vertex.length()
      const u = (radius - inner) / (outer - inner)
      uvs.setXY(i, u, 0.5)
    }
    uvs.needsUpdate = true
    return geo
  }, [inner, outer])

  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh
      geometry={geometry}
      rotation={[-Math.PI / 2, 0, 0]}
      raycast={() => {}}
      renderOrder={1}
    >
      <meshBasicMaterial
        map={textures.rings}
        color={color}
        transparent
        opacity={opacity}
        side={THREE.DoubleSide}
        depthWrite={false}
      />
    </mesh>
  )
}

export function Planet({ body }: { body: Body }) {
  const scale = useScale()
  const textures = getSceneTextures()
  const store = useSimStore

  const selectedId = useSimStore((s) => s.selectedId)
  const reducedMotion = useSimStore((s) => s.reducedMotion)
  const earthAsJupiter = useSimStore((s) => s.whatIf.earthAsJupiter)
  const earthStopped = useSimStore((s) => s.whatIf.earthStopped)

  const groupRef = useRef<THREE.Group>(null)
  const spinRef = useRef<THREE.Mesh>(null)
  const cloudRef = useRef<THREE.Mesh>(null)
  const atmosphereRef = useRef<THREE.ShaderMaterial>(null)
  const earthToastShown = useRef(false)
  const emphasis = useRef(1)

  const isEarth = body.id === 'earth'
  const textureKey = TEXTURE_KEYS[body.id]
  const texture = textureKey ? textures[textureKey] : null
  const atmosphere = ATMOSPHERES[body.id]

  const trueRadius = useMemo(() => {
    if (isEarth && earthAsJupiter) {
      const jupiter = 139_820
      return Math.max(0.2, scale.planetRadius(jupiter))
    }
    return Math.max(0.16, scale.planetRadius(body.diameterKm))
  }, [scale, body.diameterKm, isEarth, earthAsJupiter])

  const rings = useMemo(() => {
    if (!body.hasRings) return null
    if (body.id === 'saturn') {
      return { inner: trueRadius * 1.24, outer: trueRadius * 2.3, color: '#f4e6c8', opacity: 0.95 }
    }
    return { inner: trueRadius * 1.5, outer: trueRadius * 1.95, color: '#bfeef2', opacity: 0.4 }
  }, [body.hasRings, body.id, trueRadius])

  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    const days = simClock.days

    // --- orbital motion -------------------------------------------------
    const state = orbitalPosition(body.elements, days)
    const orbitR = scale.orbitRadius(state.distanceAu)
    const x = Math.cos(state.angle) * orbitR
    const z = Math.sin(state.angle) * orbitR
    const target = bodyPositions[body.id]
    if (target) target.set(x, 0, z)
    if (groupRef.current) groupRef.current.position.set(x, 0, z)

    // --- axial spin -------------------------------------------------------
    if (spinRef.current) {
      const spin = reducedMotion ? 0 : axialRotation(body, days)
      spinRef.current.rotation.y = isEarth && earthStopped ? 0 : spin
    }
    if (cloudRef.current && !reducedMotion) {
      cloudRef.current.rotation.y = axialRotation(body, days) * 1.15
    }

    // --- hover / selection emphasis --------------------------------------
    const simState = store.getState()
    const hovered = simState.hoveredId === body.id
    const selected = simState.selectedId === body.id
    const targetEmphasis = hovered ? 1.09 : selected ? 1.05 : 1
    emphasis.current = THREE.MathUtils.damp(emphasis.current, targetEmphasis, 7, dt)
    if (groupRef.current) {
      groupRef.current.scale.setScalar(trueRadius * emphasis.current)
    }
    if (spinRef.current) {
      const material = spinRef.current.material as THREE.MeshStandardMaterial
      const targetEmissive = hovered ? 0.22 : selected ? 0.12 : 0.055
      material.emissiveIntensity = THREE.MathUtils.damp(
        material.emissiveIntensity,
        targetEmissive,
        8,
        dt,
      )
    }
    if (atmosphereRef.current) {
      const def = atmosphere ?? { color: '#ffffff', strength: 0 }
      atmosphereRef.current.uniforms.uStrength.value = THREE.MathUtils.damp(
        atmosphereRef.current.uniforms.uStrength.value,
        def.strength * (hovered ? 1.7 : 1),
        8,
        dt,
      )
    }
  })

  useEffect(() => {
    if (isEarth && selectedId === 'earth' && !earthToastShown.current) {
      earthToastShown.current = true
      store.getState().showToast('Hello, Earth! 🌍 This is our home.', 'fun')
    }
  }, [selectedId, isEarth, store])

  const handleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    store.getState().focusBody(body.id)
    playBlip(700, 0.08)
  }

  const handleDoubleClick = (event: ThreeEvent<MouseEvent>) => {
    event.stopPropagation()
    store.getState().followBody(body.id)
    playBlip(940, 0.1)
  }

  const tilt = (body.axialTiltDeg * Math.PI) / 180

  return (
    <group ref={groupRef}>
      <group rotation={[0, 0, tilt]}>
        <mesh
          ref={spinRef}
          onClick={handleClick}
          onDoubleClick={handleDoubleClick}
          onPointerOver={(event) => {
            event.stopPropagation()
            store.getState().setHovered(body.id)
            document.body.style.cursor = 'pointer'
          }}
          onPointerOut={() => {
            store.getState().setHovered(null)
            document.body.style.cursor = ''
          }}
        >
          <sphereGeometry args={[1, 56, 40]} />
          <meshStandardMaterial
            map={texture ?? undefined}
            color={texture ? '#ffffff' : body.color}
            roughness={ROUGHNESS[body.id] ?? 0.9}
            metalness={0}
            emissive={body.color}
            emissiveIntensity={0.055}
          />
        </mesh>

        {/* Cloud layer (Earth) */}
        {isEarth && (
          <mesh ref={cloudRef} raycast={() => {}} scale={1.016}>
            <sphereGeometry args={[1, 40, 28]} />
            <meshStandardMaterial
              alphaMap={textures.clouds}
              transparent
              opacity={0.72}
              depthWrite={false}
              color="#ffffff"
              roughness={1}
            />
          </mesh>
        )}

        {/* Atmospheric rim glow */}
        {atmosphere && (
          <mesh scale={1.045} raycast={() => {}}>
            <sphereGeometry args={[1, 40, 28]} />
            <shaderMaterial
              ref={atmosphereRef}
              vertexShader={ATMOSPHERE_VERTEX}
              fragmentShader={ATMOSPHERE_FRAGMENT}
              uniforms={{
                uColor: { value: new THREE.Color(atmosphere.color) },
                uStrength: { value: atmosphere.strength },
              }}
              transparent
              side={THREE.BackSide}
              depthWrite={false}
              blending={THREE.AdditiveBlending}
            />
          </mesh>
        )}

        {rings && (
          <PlanetRings
            inner={rings.inner}
            outer={rings.outer}
            color={rings.color}
            opacity={rings.opacity}
          />
        )}
      </group>
    </group>
  )
}
