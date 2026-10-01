import { useEffect, useMemo, useRef } from 'react'
import type { MutableRefObject } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshStandardMaterial,
  PlaneGeometry,
  Quaternion,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import type { MoonDef, Planet } from '../../types'
import { getBodyTexture, getEarthClouds, getEarthNightTexture, getRingTexture } from '../../utils/textures'
import { bodyPosition, setBodyRadius } from '../../store/registry'
import { simClock } from '../../store/clock'
import { useAppStore } from '../../store/useAppStore'
import { FLATTENING, POLE_ELEMENTS } from '../../data/keplerian'
import { centuriesPastJ2000, equatorialToScene } from '../../utils/ephemeris'
import { clamp } from '../../utils/math'
import type { OrbitGeometry } from './orbitMath'
import { orbitPositionAt } from './orbitMath'
import { Atmosphere } from './Atmosphere'
import { Moons } from './Moons'

const SPHERE_W = 64
const SPHERE_H = 40

const UP_Y = new Vector3(0, 1, 0)
const _poleVector = new Vector3()

const RETICLE_VERT = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const RETICLE_FRAG = /* glsl */ `
  uniform vec3 uColor;
  uniform float uOpacity;
  uniform float uTime;
  varying vec2 vUv;

  void main() {
    vec2 p = vUv - vec2(0.5);
    float r = length(p) * 2.0;
    float angle = atan(p.y, p.x);

    // Four arc segments with gaps, plus small tick marks.
    float seg = abs(fract(angle / 1.5707963 + 0.5) - 0.5) * 2.0;
    float gap = smoothstep(0.62, 0.74, seg);
    float band = smoothstep(0.9, 0.93, r) * smoothstep(1.0, 0.97, r);
    float ring = band * gap;

    // Rotating dashes for a subtle targeting-lock feel.
    float dash = step(0.6, fract(angle * 3.0 - uTime * 0.35));
    ring += smoothstep(0.76, 0.79, r) * smoothstep(0.86, 0.83, r) * dash * 0.4;

    float alpha = ring * uOpacity;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(uColor, alpha);
  }
`

/** Thin billboarded targeting ring shown around the focused planet. */
function Reticle({
  radius,
  color,
  strengthRef,
}: {
  radius: number
  color: string
  strengthRef: MutableRefObject<number>
}) {
  const ref = useRef<Mesh>(null)
  const geometry = useMemo(() => new PlaneGeometry(1, 1), [])
  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uColor: { value: new Color(color) },
          uOpacity: { value: 0 },
          uTime: { value: 0 },
        },
        vertexShader: RETICLE_VERT,
        fragmentShader: RETICLE_FRAG,
        transparent: true,
        depthWrite: false,
        depthTest: false,
        blending: AdditiveBlending,
      }),
    [color],
  )

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame(({ camera, clock }) => {
    material.uniforms.uOpacity.value = strengthRef.current
    material.uniforms.uTime.value = clock.elapsedTime
    if (ref.current) {
      ref.current.quaternion.copy(camera.quaternion)
      ref.current.visible = strengthRef.current > 0.01
      const s = radius * 2.2
      ref.current.scale.set(s, s, s)
    }
  })

  return <mesh ref={ref} geometry={geometry} material={material} renderOrder={10} />
}

/**
 * One planet: photosphere, optional cloud shell, ring system, Fresnel
 * atmosphere and a targeting reticle. Every animation runs inside `useFrame`,
 * so the orrery never triggers a React render.
 */
export function Planet({
  planet,
  orbit,
  radius,
  moons,
  distanceExponent,
}: {
  planet: Planet
  orbit: OrbitGeometry
  radius: number
  moons: MoonDef[]
  distanceExponent: number
}) {
  const positionRef = useRef<Group>(null)
  const scaleRef = useRef<Group>(null)
  const spinRef = useRef<Group>(null)
  const cloudRef = useRef<Mesh>(null)
  const tiltRef = useRef<Group>(null)
  const atmosphereBoost = useRef(0)

  /**
   * Real planets are not spheres. Saturn is squashed by nearly a tenth, which
   * is one of the few planetary features visible on an ordinary photograph, so
   * the sphere is scaled along its own polar axis to match the published
   * flattening.
   */
  const flattening = FLATTENING[planet.id] ?? 0
  const polarScale = 1 - flattening

  const hoveredId = useAppStore((s) => s.hoveredId)
  const focusedId = useAppStore((s) => s.focusedId)
  const reducedMotion = useAppStore((s) => s.reducedMotion)
  const setHovered = useAppStore((s) => s.setHovered)
  const select = useAppStore((s) => s.select)
  const focus = useAppStore((s) => s.focus)

  const texture = useMemo(() => getBodyTexture(planet.id), [planet.id])
  const ringTexture = useMemo(() => getRingTexture(planet.id), [planet.id])
  // The night-lights and cloud layers are still painted procedurally, because
  // NASA publishes them as separate products and neither is needed to make the
  // planet itself read correctly.
  const nightTexture = useMemo(() => (planet.id === 'earth' ? getEarthNightTexture() : null), [planet.id])
  const cloudTexture = useMemo(() => (planet.id === 'earth' ? getEarthClouds() : null), [planet.id])

  const sphereGeometry = useMemo(() => new SphereGeometry(1, SPHERE_W, SPHERE_H), [])

  /**
   * The real direction of the north pole, as a quaternion for the tilt group.
   *
   * Previously the tilt was an arbitrary rotation about the scene's Z axis, which
   * made every planet lean the same way regardless of where it was in its orbit
   * or how its pole is actually oriented. Using the IAU pole means Earth's tilt
   * points the right way relative to the Sun, Uranus really does lie on its side,
   * and Saturn's 26.7° lean is the correct one for its position in space.
   */
  const poleQuaternion = useMemo(() => {
    const pole = POLE_ELEMENTS[planet.id]
    const target = new Quaternion()
    if (!pole) return target.identity()

    const t = centuriesPastJ2000(simClock.simulatedMs)
    let alphaDeg = pole.alpha + (pole.alphaDot ?? 0) * t
    let deltaDeg = pole.delta + (pole.deltaDot ?? 0) * t
    if (pole.oscillation) {
      const phase = ((pole.oscillation.phaseDeg + (360 / pole.oscillation.periodCenturies) * t) % 360) * (Math.PI / 180)
      alphaDeg += pole.oscillation.amplitudeDeg * Math.sin(phase)
      deltaDeg += pole.oscillation.amplitudeDeg * Math.cos(phase)
    }

    const alpha = alphaDeg * (Math.PI / 180)
    const delta = deltaDeg * (Math.PI / 180)
    equatorialToScene(
      new Vector3(Math.cos(delta) * Math.cos(alpha), Math.cos(delta) * Math.sin(alpha), Math.sin(delta)),
      _poleVector,
    )
    // The mesh's polar axis is its local +Y, so align +Y with the true pole.
    return target.setFromUnitVectors(UP_Y, _poleVector.normalize())
  }, [planet.id])

  useEffect(() => {
    if (tiltRef.current) tiltRef.current.quaternion.copy(poleQuaternion)
  }, [poleQuaternion])

  const material = useMemo(() => {
    const mat = new MeshStandardMaterial({
      map: texture,
      roughness: planet.surfaceKind === 'terran' ? 0.6 : 0.88,
      metalness: 0,
    })
    if (nightTexture) {
      mat.emissiveMap = nightTexture
      mat.emissive = new Color('#ffffff')
      mat.emissiveIntensity = 0.7
    }
    if (planet.surfaceKind === 'ice') mat.roughness = 0.48
    return mat
  }, [texture, nightTexture, planet.surfaceKind])

  const cloudMaterial = useMemo(
    () =>
      cloudTexture
        ? new MeshStandardMaterial({
            map: cloudTexture,
            transparent: true,
            opacity: 0.8,
            depthWrite: false,
            roughness: 1,
            metalness: 0,
          })
        : null,
    [cloudTexture],
  )

  /**
   * Rings are built as a hand-rolled strip: a `RingGeometry` has its UVs laid
   * out radially but not linearly across the band, which would smear the ring
   * detail we care about.
   */
  const ringGeometry = useMemo(() => {
    if (planet.ringStyle === 'none') return null
    const segments = 192
    const inner = planet.ringInnerFactor
    const outer = planet.ringOuterFactor
    const positions = new Float32Array((segments + 1) * 2 * 3)
    const uvs = new Float32Array((segments + 1) * 2 * 2)
    const indices: number[] = []

    for (let i = 0; i <= segments; i += 1) {
      const t = i / segments
      const r = inner + (outer - inner) * t
      const x = Math.cos(t * Math.PI * 2)
      const z = Math.sin(t * Math.PI * 2)
      const o = i * 6
      positions[o] = x * r
      positions[o + 1] = 0
      positions[o + 2] = z * r
      positions[o + 3] = x * r
      positions[o + 4] = 0
      positions[o + 5] = z * r
      const u = i * 4
      uvs[u] = t
      uvs[u + 1] = 0
      uvs[u + 2] = t
      uvs[u + 3] = 1
      if (i < segments) {
        const a = i * 2
        indices.push(a, a + 1, a + 2, a + 1, a + 3, a + 2)
      }
    }

    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(positions, 3))
    geo.setAttribute('uv', new BufferAttribute(uvs, 2))
    geo.setIndex(indices)
    geo.scale(radius, radius, radius)
    geo.computeVertexNormals()
    return geo
  }, [planet.ringStyle, planet.ringInnerFactor, planet.ringOuterFactor, radius])

  const ringMaterial = useMemo(() => {
    if (!ringTexture) return null
    return new MeshStandardMaterial({
      map: ringTexture,
      transparent: true,
      opacity: 0.95,
      side: DoubleSide,
      depthWrite: false,
      roughness: 1,
      metalness: 0,
    })
  }, [ringTexture])

  const reticleStrength = useRef(0)
  const worldPosition = useMemo(() => new Vector3(), [])

  useEffect(() => {
    setBodyRadius(planet.id, radius)
    return () => {
      sphereGeometry.dispose()
      material.dispose()
      cloudMaterial?.dispose()
      ringGeometry?.dispose()
      ringMaterial?.dispose()
    }
  }, [planet.id, radius, sphereGeometry, material, cloudMaterial, ringGeometry, ringMaterial])

  useFrame((_, delta) => {
    const pos = positionRef.current
    const scaler = scaleRef.current
    if (!pos || !scaler) return

    // --- orbital motion -------------------------------------------------
    // Position comes from the real JPL elements, so this is the planet's true
    // place in its true orbital plane at this instant.
    orbitPositionAt(orbit, simClock.simulatedMs, distanceExponent, worldPosition)
    pos.position.copy(worldPosition)

    // --- axial spin -----------------------------------------------------
    // The clock integrates rotation at each body's own clipped rate, so slow
    // rotators stay slow and fast ones stay watchable.
    const spinAngle = simClock.spin(planet.id, planet.rotationPeriodHours, reducedMotion ? 0.25 : 1)
    if (spinRef.current) spinRef.current.rotation.y = spinAngle
    // Clouds ride the same compressed clock, drifting slowly ahead of the ground.
    if (cloudRef.current) cloudRef.current.rotation.y = spinAngle + simClock.spinTurns(planet.id) * 0.06

    // --- hover emphasis -------------------------------------------------
    const hovered = hoveredId === planet.id
    const focused = focusedId === planet.id
    const targetScale = radius * (focused ? 1.03 : hovered ? 1.06 : 1)
    const next = scaler.scale.x + (targetScale - scaler.scale.x) * clamp(delta * 11, 0, 1)
    scaler.scale.setScalar(next)
    atmosphereBoost.current += ((hovered || focused ? 1 : 0) - atmosphereBoost.current) * clamp(delta * 9, 0, 1)

    // --- targeting reticle ---------------------------------------------
    const reticleGoal = focused || hovered ? (focused ? 0.85 : 0.42) : 0
    reticleStrength.current += (reticleGoal - reticleStrength.current) * clamp(delta * 6, 0, 1)

    pos.getWorldPosition(worldPosition)
    bodyPosition(planet.id).copy(worldPosition)
  })

  const onEnter = (event: { stopPropagation: () => void; clientX: number; clientY: number }) => {
    event.stopPropagation()
    setHovered(planet.id, { x: event.clientX, y: event.clientY })
  }

  return (
    <group>
      <group ref={positionRef}>
        <group ref={scaleRef}>
          <group ref={tiltRef}>
            <group ref={spinRef}>
              <mesh
                geometry={sphereGeometry}
                material={material}
                scale={[radius, radius * polarScale, radius]}
                onPointerOver={onEnter}
                onPointerOut={() => setHovered(null)}
                onClick={(event) => {
                  event.stopPropagation()
                  if (planet.id === 'earth') useAppStore.getState().greetEarth()
                  select(planet.id)
                }}
                onDoubleClick={(event) => {
                  event.stopPropagation()
                  focus(planet.id, 'follow')
                }}
              />
              {cloudMaterial && (
                <mesh
                  ref={cloudRef}
                  geometry={sphereGeometry}
                  material={cloudMaterial}
                  scale={[radius * 1.014, radius * 1.014 * polarScale, radius * 1.014]}
                  raycast={() => null}
                />
              )}
            </group>

            {ringGeometry && ringMaterial && <mesh geometry={ringGeometry} material={ringMaterial} />}

            {/* Moons ride inside the planet's tilted frame, so Earth's Moon is
                genuinely carried around by Earth's 23.4° axial tilt. */}
            {moons.length > 0 && (
              <Moons moons={moons} parentRadius={radius} parentDiameterKm={planet.diameterKm} />
            )}
          </group>

          {planet.hasAtmosphere && (
            <Atmosphere
              planetRadius={radius}
              color={planet.atmosphereColor}
              strength={planet.atmosphereStrength}
              worldPosition={worldPosition}
              boostRef={atmosphereBoost}
              flattening={flattening}
            />
          )}

          {/* The reticle is a camera-facing billboard, so it sits outside the tilted
            frame — otherwise it would inherit the pole orientation and turn with
            the planet instead of staying square to the screen. */}
          <Reticle radius={radius} color={planet.accentColor} strengthRef={reticleStrength} />
        </group>
      </group>
    </group>
  )
}