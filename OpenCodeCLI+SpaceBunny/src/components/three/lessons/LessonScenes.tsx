import { useEffect, useMemo, useRef } from 'react'
import type { ReactNode } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import {
  AdditiveBlending,
  BufferAttribute,
  BufferGeometry,
  Color,
  ConeGeometry,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  Points,
  ShaderMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import { PLANETS, SUN } from '../../../data/planets'
import { getBodyTexture, getCoronaTexture, getEarthClouds } from '../../../utils/textures'
import { createGlowMaterial } from '../materials'
import { mulberry32 } from '../../../utils/math'
import { circularSpeed } from '../../../utils/gravity'
import { lessonRadius } from '../../../utils/scale'

function useSharedSphere(segments = 40): SphereGeometry {
  return useMemo(() => new SphereGeometry(1, segments, Math.round(segments / 2)), [segments])
}

function useCorona() {
  return useMemo(() => getCoronaTexture(), [])
}

function useBodyMap(id: 'sun' | 'earth' | 'moon') {
  return useMemo(() => getBodyTexture(id), [id])
}

/** A glowing billboard helper shared by several lessons. */
function Glow({
  size,
  color,
  texture,
  intensity = 1,
  position = [0, 0, 0],
}: {
  size: number
  color: string
  texture: ReturnType<typeof getCoronaTexture>
  intensity?: number
  position?: [number, number, number]
}) {
  const geometry = useMemo(() => new SphereGeometry(1, 16, 12), [])
  const material = useMemo(() => createGlowMaterial(texture, color), [texture, color])
  material.uniforms.uIntensity.value = intensity

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  return <mesh geometry={geometry} material={material} scale={size} position={position} />
}

/** A small caption anchored to a point in a lesson scene. */
function SceneTag({
  position,
  children,
  tone = 'cyan',
}: {
  position: [number, number, number]
  children: ReactNode
  tone?: 'cyan' | 'warm' | 'plain'
}) {
  const colour = tone === 'warm' ? 'text-amber-200' : tone === 'cyan' ? 'text-cyan-200' : 'text-white/80'
  return (
    <Html position={position} center zIndexRange={[15, 0]} style={{ pointerEvents: 'none' }}>
      <div
        className={`whitespace-nowrap text-[11px] font-semibold tracking-[0.16em] uppercase ${colour} [text-shadow:0_1px_6px_rgba(0,0,0,0.95)]`}
      >
        {children}
      </div>
    </Html>
  )
}

/* ======================================================================== */
/*                          Lesson 1 — the Sun                              */
/* ======================================================================== */

/** Hydrogen blobs spiral into the core and heat up as they fall. */
function FusionStream({ burst }: { burst: number }) {
  const pointsRef = useRef<Points>(null)
  const count = 900

  const geometry = useMemo(() => {
    const rand = mulberry32(4711)
    const positions = new Float32Array(count * 3)
    const seeds = new Float32Array(count)
    for (let i = 0; i < count; i += 1) {
      const a = rand() * Math.PI * 2
      const r = 1.6 + rand() * 5.2
      positions[i * 3] = Math.cos(a) * r
      positions[i * 3 + 1] = (rand() - 0.5) * 1.4
      positions[i * 3 + 2] = Math.sin(a) * r
      seeds[i] = rand()
    }
    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(positions, 3))
    geo.setAttribute('aSeed', new BufferAttribute(seeds, 1))
    return geo
  }, [count])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uTime: { value: 0 },
          uBurst: { value: 0 },
          uPixelRatio: { value: Math.min(2, window.devicePixelRatio || 1) },
        },
        vertexShader: /* glsl */ `
          attribute float aSeed;
          uniform float uTime;
          uniform float uBurst;
          uniform float uPixelRatio;
          varying float vHeat;
          void main() {
            vec3 p = position;
            float speed = 0.14 + aSeed * 0.12;
            float pull = mod(uTime * speed + aSeed, 1.0);
            p.xz *= mix(1.0, 0.14, pull);
            p.y *= mix(1.0, 0.45, pull);
            p += normalize(p + vec3(0.001)) * uBurst * (1.0 - pull) * 1.8;
            vHeat = 1.0 - pull;
            vec4 mv = modelViewMatrix * vec4(p, 1.0);
            gl_Position = projectionMatrix * mv;
            gl_PointSize = (3.0 + vHeat * 9.0) * uPixelRatio * (1.0 / max(0.4, -mv.z * 0.06));
          }
        `,
        fragmentShader: /* glsl */ `
          varying float vHeat;
          void main() {
            vec2 uv = gl_PointCoord - vec2(0.5);
            float d = length(uv);
            if (d > 0.5) discard;
            float core = smoothstep(0.5, 0.0, d);
            vec3 cold = vec3(0.35, 0.65, 1.0);
            vec3 hot = vec3(1.0, 0.86, 0.45);
            gl_FragColor = vec4(mix(cold, hot, vHeat), core * (0.3 + vHeat * 0.7));
          }
        `,
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  )

  useEffect(() => {
    material.uniforms.uBurst.value = 1.8
  }, [burst, material])

  useEffect(
    () => () => {
      geometry.dispose()
      material.dispose()
    },
    [geometry, material],
  )

  useFrame((_, delta) => {
    material.uniforms.uTime.value += delta
    material.uniforms.uBurst.value = Math.max(0, material.uniforms.uBurst.value - delta * 1.5)
    if (pointsRef.current) pointsRef.current.rotation.y += delta * 0.12
  })

  return <points ref={pointsRef} geometry={geometry} material={material} />
}

export function SunLesson({ burst }: { burst: number }) {
  const sunMap = useBodyMap('sun')
  const corona = useCorona()
  const sphere = useSharedSphere(48)
  const material = useMemo(
    () => new MeshBasicMaterial({ map: sunMap, toneMapped: false, color: '#fff4d6' }),
    [sunMap],
  )
  const coreRef = useRef<Mesh>(null)

  useEffect(
    () => () => {
      sphere.dispose()
      material.dispose()
    },
    [sphere, material],
  )

  useFrame((state) => {
    if (!coreRef.current) return
    coreRef.current.rotation.y += 0.006
    coreRef.current.scale.setScalar(3.1 * (1 + Math.sin(state.clock.elapsedTime * 1.4) * 0.03))
  })

  return (
    <group>
      <mesh ref={coreRef} geometry={sphere} material={material} scale={3.1} />
      <Glow size={7.4} color="#ffbb63" texture={corona} intensity={0.9} />
      <Glow size={15} color="#ff8a2b" texture={corona} intensity={0.26} />
      <FusionStream burst={burst} />
      <SceneTag position={[0, 4.6, 0]} tone="warm">
        15 million °C core
      </SceneTag>
      <SceneTag position={[7, 0.4, 0]} tone="cyan">
        hydrogen falls inwards
      </SceneTag>
      <SceneTag position={[-6.4, -2.4, 0]} tone="plain">
        600 million tonnes every second
      </SceneTag>
    </group>
  )
}

/* ======================================================================== */
/*                        Lesson 2 — planet sizes                           */
/* ======================================================================== */

const ROW_SPACING = 5.8

export function SizesLesson({ pick, onPick }: { pick: string[]; onPick: (id: string) => void }) {
  const sphere = useSharedSphere(40)
  const materials = useMemo(
    () =>
      new Map(
        PLANETS.map((planet) => [
          planet.id,
          new MeshBasicMaterial({ map: getBodyTexture(planet.id), toneMapped: false }),
        ]),
      ),
    [],
  )

  useEffect(
    () => () => {
      sphere.dispose()
      materials.forEach((m) => m.dispose())
    },
    [sphere, materials],
  )

  return (
    <group>
      {PLANETS.map((planet, index) => {
        const radius = lessonRadius(planet.diameterKm)
        const chosen = pick.includes(planet.id)
        return (
          <group key={planet.id} position={[(index - 3.5) * ROW_SPACING, 0, 0]}>
            <mesh
              geometry={sphere}
              material={materials.get(planet.id)!}
              scale={radius}
              onClick={(event) => {
                event.stopPropagation()
                onPick(planet.id)
              }}
              onPointerOver={(event) => {
                event.stopPropagation()
                document.body.style.cursor = 'pointer'
              }}
              onPointerOut={() => {
                document.body.style.cursor = ''
              }}
            />
            {planet.ringStyle !== 'none' && (
              <mesh rotation={[-Math.PI / 2.8, 0, 0]}>
                <ringGeometry args={[radius * 1.35, radius * 2.05, 56]} />
                <meshBasicMaterial color="#e9d6a8" side={DoubleSide} transparent opacity={0.85} />
              </mesh>
            )}
            <SceneTag position={[0, radius + 0.9, 0]} tone={chosen ? 'warm' : 'cyan'}>
              {planet.name}
            </SceneTag>
          </group>
        )
      })}
    </group>
  )
}

/* ======================================================================== */
/*                   Lesson 3 — how far away the planets are                 */
/* ======================================================================== */

const MAX_AU = 30.07

/** Converts an orbital distance in AU to a position on the distance road. */
function roadPosition(au: number): number {
  return (Math.log(1 + au) / Math.log(1 + MAX_AU) - 0.5) * 46
}

export function DistancesLesson() {
  const sphere = useSharedSphere(32)
  const materials = useMemo(
    () =>
      new Map(
        PLANETS.map((planet) => [
          planet.id,
          new MeshBasicMaterial({ map: getBodyTexture(planet.id), toneMapped: false }),
        ]),
      ),
    [],
  )

  useEffect(
    () => () => {
      sphere.dispose()
      materials.forEach((m) => m.dispose())
    },
    [sphere, materials],
  )

  const sunRadius = lessonRadius(SUN.diameterKm) * 0.5

  return (
    <group rotation={[-0.1, 0, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -3.4, 0]}>
        <planeGeometry args={[50, 8]} />
        <meshBasicMaterial color="#0a1024" transparent opacity={0.6} />
      </mesh>

      {Array.from({ length: MAX_AU + 1 }, (_, au) => {
        const x = roadPosition(au)
        const major = au % 5 === 0
        return (
          <group key={au} position={[x, -3.4, 0]}>
            <mesh>
              <boxGeometry args={[0.035, major ? 0.8 : 0.34, 0.035]} />
              <meshBasicMaterial color={major ? '#5f8ad6' : '#2f4a80'} />
            </mesh>
            {major && (
              <SceneTag position={[0, -1.1, 0]} tone="plain">
                {au} AU
              </SceneTag>
            )}
          </group>
        )
      })}

      <group position={[0, 0.4, 2]}>
        <mesh geometry={sphere} scale={sunRadius}>
          <meshBasicMaterial color="#ffd27a" toneMapped={false} />
        </mesh>
        <SceneTag position={[0, sunRadius + 0.7, 0]} tone="warm">
          The Sun
        </SceneTag>
      </group>

      {PLANETS.map((planet) => {
        const radius = lessonRadius(planet.diameterKm) * 0.5
        return (
          <group key={planet.id} position={[roadPosition(planet.semiMajorAxisAU), 0.6, 0]}>
            <mesh geometry={sphere} material={materials.get(planet.id)!} scale={radius} />
            <SceneTag position={[0, radius + 0.6, 0]} tone="cyan">
              {planet.name}
            </SceneTag>
          </group>
        )
      })}
    </group>
  )
}

/* ======================================================================== */
/*                           Lesson 4 — gravity                              */
/* ======================================================================== */

/**
 * Builds a radial "gravity well": a dish that drops away steeply near the
 * centre and flattens out towards the rim. An explicit grid rather than a
 * deformed sphere, so the funnel profile stays readable from any angle.
 */
function makeWellGeometry(maxRadius: number, depth: number): BufferGeometry {
  const rings = 44
  const segments = 72
  const positions = new Float32Array((rings + 1) * (segments + 1) * 3)
  const uvs = new Float32Array((rings + 1) * (segments + 1) * 2)
  const indices: number[] = []

  for (let i = 0; i <= rings; i += 1) {
    const t = i / rings
    const r = Math.pow(t, 1.35) * maxRadius
    const y = -depth * Math.exp(-t * 3.4)
    for (let j = 0; j <= segments; j += 1) {
      const a = (j / segments) * Math.PI * 2
      const o = (i * (segments + 1) + j) * 3
      positions[o] = Math.cos(a) * r
      positions[o + 1] = y
      positions[o + 2] = Math.sin(a) * r
      const u = (i * (segments + 1) + j) * 2
      uvs[u] = j / segments
      uvs[u + 1] = t
      if (i < rings && j < segments) {
        const a0 = i * (segments + 1) + j
        const b0 = a0 + segments + 1
        indices.push(a0, b0, a0 + 1, b0, b0 + 1, a0 + 1)
      }
    }
  }

  const geo = new BufferGeometry()
  geo.setAttribute('position', new BufferAttribute(positions, 3))
  geo.setAttribute('uv', new BufferAttribute(uvs, 2))
  geo.setIndex(indices)
  geo.computeVertexNormals()
  return geo
}

const WELL_VERT = /* glsl */ `
  varying float vDepth;
  varying vec2 vUv;
  void main() {
    vDepth = uv.y;
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`

const WELL_FRAG = /* glsl */ `
  uniform vec3 uColorLow;
  uniform vec3 uColorHigh;
  uniform float uStrength;
  varying float vDepth;
  varying vec2 vUv;

  void main() {
    // Steep close in, flattening far away — the shape of a real gravity well.
    float funnel = pow(1.0 - vDepth, 2.2);
    // Concentric rings make the depth readable at a glance.
    float rings = smoothstep(0.42, 0.5, fract(vDepth * 9.0)) * 0.17;
    float spokes = smoothstep(0.86, 0.5, abs(fract(vUv.x * 18.0) - 0.5) * 2.0) * 0.06;
    vec3 color = mix(uColorHigh, uColorLow, vDepth);
    float alpha = (funnel * 0.6 + rings + spokes) * uStrength;
    if (alpha < 0.004) discard;
    gl_FragColor = vec4(color, alpha);
  }
`

const START_RADIUS = 9.5

export function GravityLesson({ mass, speedFactor }: { mass: number; speedFactor: number }) {
  const sphere = useSharedSphere(36)
  const corona = useCorona()
  const centralRadius = 0.85 + mass * 1.25
  const isBlackHole = mass > 2.4
  const mu = 34 * (0.15 + mass * 0.85)

  const wellGeometry = useMemo(() => makeWellGeometry(11, 3.6), [])

  const wellMaterial = useMemo(
    () =>
      new ShaderMaterial({
        uniforms: {
          uColorLow: { value: new Color('#16307a') },
          uColorHigh: { value: isBlackHole ? new Color('#c07bff') : new Color('#66e3ff') },
          uStrength: { value: 1 },
        },
        vertexShader: WELL_VERT,
        fragmentShader: WELL_FRAG,
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
        blending: AdditiveBlending,
      }),
    [isBlackHole],
  )

  const bodyMaterial = useMemo(
    () =>
      isBlackHole
        ? new MeshBasicMaterial({ color: '#0a0620', toneMapped: false })
        : new MeshBasicMaterial({ map: getBodyTexture('sun'), toneMapped: false }),
    [isBlackHole],
  )

  const probeMaterial = useMemo(
    () => new MeshBasicMaterial({ color: '#7ff0ff', toneMapped: false }),
    [],
  )

  useEffect(
    () => () => {
      sphere.dispose()
      wellGeometry.dispose()
      wellMaterial.dispose()
      bodyMaterial.dispose()
      probeMaterial.dispose()
    },
    [sphere, wellGeometry, wellMaterial, bodyMaterial, probeMaterial],
  )

  const probeRef = useRef<Group>(null)
  const position = useRef(new Vector3(START_RADIUS, 0, 0))
  const velocity = useRef(new Vector3())
  const resetTimer = useRef(0)
  const acceleration = useMemo(() => new Vector3(), [])

  // Re-launch the probe whenever the controls change.
  useEffect(() => {
    position.current.set(START_RADIUS, 0, 0)
    const v = circularSpeed(mu, START_RADIUS) * speedFactor
    velocity.current.set(0, 0, v)
    resetTimer.current = 0
  }, [mu, speedFactor])

  useFrame((_, rawDelta) => {
    const probe = probeRef.current
    if (!probe) return
    const delta = Math.min(rawDelta, 0.02)

    const r = position.current.length()
    if (r < centralRadius * 1.02) {
      // Crashed — pause on the surface for a moment then try again.
      resetTimer.current += delta
      probe.position.copy(position.current).setLength(centralRadius * 1.02)
      if (resetTimer.current > 1.2) {
        position.current.set(START_RADIUS, 0, 0)
        velocity.current.set(0, 0, circularSpeed(mu, START_RADIUS) * speedFactor)
        resetTimer.current = 0
      }
      return
    }
    if (r > 46) {
      // Escaped — park it far away and wait for the child to change a slider.
      probe.position.copy(position.current)
      return
    }

    // Symplectic-ish Euler; plenty accurate at this scale and very stable.
    acceleration.copy(position.current).multiplyScalar(-mu / (r * r * r))
    velocity.current.addScaledVector(acceleration, delta)
    position.current.addScaledVector(velocity.current, delta)
    probe.position.copy(position.current)

    wellMaterial.uniforms.uStrength.value = 0.55 + mass * 0.4
  })

  return (
    <group>
      {/* The well sits below the orbital plane, like a real gravity well diagram. */}
      <mesh
        geometry={wellGeometry}
        material={wellMaterial}
        position={[0, -0.1, 0]}
        scale={0.85 + mass * 0.16}
      />
      <mesh geometry={sphere} material={bodyMaterial} scale={centralRadius} />
      {isBlackHole && <Glow size={centralRadius * 3.4} color="#a97bff" texture={corona} intensity={0.7} />}
      <group ref={probeRef}>
        <mesh geometry={sphere} material={probeMaterial} scale={0.26} />
        <SceneTag position={[0, 0.7, 0]} tone="cyan">
          test particle
        </SceneTag>
      </group>
      <SceneTag position={[0, centralRadius + 1.2, 0]} tone="warm">
        {isBlackHole ? 'Black hole' : 'Star'}
      </SceneTag>
    </group>
  )
}

/* ======================================================================== */
/*                    Lessons 5 & 6 — day, night and seasons                */
/* ======================================================================== */

export function EarthLessonScene({
  showSeasons,
  seasonAngle,
}: {
  showSeasons: boolean
  seasonAngle: number
}) {
  const sphere = useSharedSphere(56)
  const earthMap = useBodyMap('earth')
  const sunMap = useBodyMap('sun')
  const clouds = useMemo(() => getEarthClouds(), [])
  const corona = useCorona()

  const earthMaterial = useMemo(() => new MeshBasicMaterial({ map: earthMap, toneMapped: false }), [earthMap])
  const cloudMaterial = useMemo(
    () => new MeshBasicMaterial({ map: clouds, transparent: true, opacity: 0.55, toneMapped: false }),
    [clouds],
  )
  const sunMaterial = useMemo(() => new MeshBasicMaterial({ map: sunMap, toneMapped: false }), [sunMap])

  useEffect(
    () => () => {
      sphere.dispose()
      earthMaterial.dispose()
      cloudMaterial.dispose()
      sunMaterial.dispose()
    },
    [sphere, earthMaterial, cloudMaterial, sunMaterial],
  )

  if (showSeasons) {
    return (
      <group>
        <mesh geometry={sphere} material={sunMaterial} scale={2.2} />
        <Glow size={7} color="#ffb45c" texture={corona} intensity={0.85} />
        <pointLight intensity={3} distance={0} decay={0} color="#fff2d4" />

        <group position={[Math.cos(seasonAngle) * 10, 0, Math.sin(seasonAngle) * 10]}>
          {/* The axis keeps pointing the same way in space as Earth orbits. */}
          <group rotation={[0, 0, 0.409]}>
            <mesh geometry={sphere} material={earthMaterial} scale={1.5} />
            <mesh geometry={sphere} material={cloudMaterial} scale={1.53} />
            <mesh position={[0, 2.5, 0]}>
              <cylinderGeometry args={[0.035, 0.035, 5, 8]} />
              <meshBasicMaterial color="#7dd3fc" />
            </mesh>
            <mesh position={[0, 5.1, 0]} rotation={[0, 0, 0]}>
              <coneGeometry args={[0.16, 0.42, 10]} />
              <meshBasicMaterial color="#7dd3fc" />
            </mesh>
          </group>
        </group>

        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[9.94, 10.06, 128]} />
          <meshBasicMaterial color="#3f6ab5" transparent opacity={0.5} side={DoubleSide} />
        </mesh>
        <SceneTag position={[0, 3.4, 0]} tone="warm">
          The Sun
        </SceneTag>
      </group>
    )
  }

  return (
    <group>
      <ambientLight intensity={0.12} />
      <group rotation={[0, 0, 0.409]}>
        <mesh geometry={sphere} material={earthMaterial} scale={3} />
        <mesh geometry={sphere} material={cloudMaterial} scale={3.04} />
      </group>
      <mesh position={[-13, 2, 4]}>
        <sphereGeometry args={[1.2, 32, 24]} />
        <meshBasicMaterial color="#ffe3ad" toneMapped={false} />
      </mesh>
      <Glow size={4.2} color="#ffb45c" texture={corona} intensity={0.8} position={[-13, 2, 4]} />
      <pointLight position={[-13, 2, 4]} intensity={2.8} distance={0} decay={0} color="#fff3d8" />
      <SceneTag position={[0, -4.2, 0]} tone="warm">
        daylight
      </SceneTag>
      <SceneTag position={[0, -4.2, 5.6]} tone="plain">
        night — still half of us
      </SceneTag>
    </group>
  )
}

/* ======================================================================== */
/*                         Lesson 7 — moon phases                            */
/* ======================================================================== */

export function MoonPhasesLesson({ angle }: { angle: number }) {
  const sphere = useSharedSphere(48)
  const earthMap = useBodyMap('earth')
  const moonMap = useBodyMap('moon')
  const corona = useCorona()

  const earthMaterial = useMemo(() => new MeshBasicMaterial({ map: earthMap, toneMapped: false }), [earthMap])
  const moonMaterial = useMemo(() => new MeshBasicMaterial({ map: moonMap, toneMapped: false }), [moonMap])

  useEffect(
    () => () => {
      sphere.dispose()
      earthMaterial.dispose()
      moonMaterial.dispose()
    },
    [sphere, earthMaterial, moonMaterial],
  )

  const orbit = 7.6

  return (
    <group>
      {/* The Sun sits far to the left so the Moon's lit half really does face it. */}
      <mesh position={[-26, 0, 0]}>
        <sphereGeometry args={[2.4, 32, 24]} />
        <meshBasicMaterial color="#ffd88f" toneMapped={false} />
      </mesh>
      <Glow size={10} color="#ffb45c" texture={corona} intensity={0.7} position={[-26, 0, 0]} />
      <pointLight position={[-26, 0, 0]} intensity={6} distance={0} decay={0} color="#fff4de" />
      <SceneTag position={[-26, 4, 0]} tone="warm">
        Sun
      </SceneTag>

      <mesh geometry={sphere} material={earthMaterial} scale={2.2} />

      <group position={[Math.cos(angle) * orbit, 0, Math.sin(angle) * orbit]}>
        <mesh geometry={sphere} material={moonMaterial} scale={0.66} />
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[orbit - 0.02, orbit + 0.02, 96]} />
        <meshBasicMaterial color="#4d6fa8" transparent opacity={0.45} side={DoubleSide} />
      </mesh>
    </group>
  )
}

/* ======================================================================== */
/*                            Lesson 8 — orbits                              */
/* ======================================================================== */

export function OrbitsLesson({ paused }: { paused: boolean }) {
  const sphere = useSharedSphere(32)
  const sunMap = useBodyMap('sun')
  const earthMap = useBodyMap('earth')
  const sunMaterial = useMemo(() => new MeshBasicMaterial({ map: sunMap, toneMapped: false }), [sunMap])
  const earthMaterial = useMemo(() => new MeshBasicMaterial({ map: earthMap, toneMapped: false }), [earthMap])
  const blueArrow = useMemo(() => new MeshBasicMaterial({ color: '#7ff0ff', toneMapped: false }), [])
  const orangeArrow = useMemo(() => new MeshBasicMaterial({ color: '#ff9d6b', toneMapped: false }), [])
  const cone = useMemo(() => new ConeGeometry(0.18, 1, 14), [])

  useEffect(
    () => () => {
      sphere.dispose()
      sunMaterial.dispose()
      earthMaterial.dispose()
      blueArrow.dispose()
      orangeArrow.dispose()
      cone.dispose()
    },
    [sphere, sunMaterial, earthMaterial, blueArrow, orangeArrow, cone],
  )

  const orbitR = 9
  const angle = useRef(0.4)
  const pointRef = useRef<Group>(null)
  const tangentRef = useRef<Mesh>(null)
  const pullRef = useRef<Mesh>(null)

  useFrame((_, delta) => {
    if (!paused) angle.current += delta * 0.5
    const a = angle.current
    const px = Math.cos(a) * orbitR
    const pz = Math.sin(a) * orbitR

    pointRef.current?.position.set(px, 0, pz)
    // Tangent to the orbit: how far sideways the planet wants to travel.
    tangentRef.current?.position.set(px, 1.1, pz)
    tangentRef.current?.rotation.set(Math.PI / 2, 0, -a + Math.PI / 2)
    // Straight at the Sun: the pull it can never escape.
    pullRef.current?.position.set(px * 0.45, 1.1, pz * 0.45)
    pullRef.current?.rotation.set(Math.PI / 2, 0, -a + Math.PI)
  })

  return (
    <group>
      <mesh geometry={sphere} material={sunMaterial} scale={2} />
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[orbitR - 0.03, orbitR + 0.03, 128]} />
        <meshBasicMaterial color="#3f6ab5" transparent opacity={0.5} side={DoubleSide} />
      </mesh>

      <group ref={pointRef}>
        <mesh geometry={sphere} material={earthMaterial} scale={0.62} />
      </group>
      <mesh ref={tangentRef} geometry={cone} material={blueArrow} />
      <mesh ref={pullRef} geometry={cone} material={orangeArrow} />

      <SceneTag position={[4.4, 2, 5]} tone="cyan">
        speed carries it forward
      </SceneTag>
      <SceneTag position={[-2.4, 2, 5]} tone="warm">
        gravity pulls it in
      </SceneTag>
      <SceneTag position={[0, -1.6, -4.2]} tone="plain">
        sideways + falling = orbit
      </SceneTag>
    </group>
  )
}