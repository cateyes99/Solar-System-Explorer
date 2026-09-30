import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  AdditiveBlending,
  Color,
  DoubleSide,
  Group,
  Mesh,
  MeshBasicMaterial,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
} from 'three'
import { PLANET_BY_ID } from '../../../data/planets'
import type { WhatIfId } from '../../../types'
import { getBodyTexture, getCoronaTexture, getEarthClouds } from '../../../utils/textures'
import { createGlowMaterial } from '../materials'
import { lessonRadius } from '../../../utils/scale'

function useSphere(segments = 44): SphereGeometry {
  return useMemo(() => new SphereGeometry(1, segments, Math.round(segments / 2)), [segments])
}

/* -------------------------------------------------------------------------- */
/*                     What if Earth had two moons?                          */
/* -------------------------------------------------------------------------- */

/**
 * A second moon on a wider, inclined orbit. The two paths are shown so the
 * child can see how a second moon would tug on Earth's rotation.
 */
function TwoMoonsScene() {
  const sphere = useSphere(48)
  const earthMap = useMemo(() => getBodyTexture('earth'), [])
  const clouds = useMemo(() => getEarthClouds(), [])
  const moonMap = useMemo(() => getBodyTexture('moon'), [])

  const earthMaterial = useMemo(() => new MeshStandardMaterial({ map: earthMap, roughness: 0.65 }), [earthMap])
  const cloudMaterial = useMemo(
    () => new MeshStandardMaterial({ map: clouds, transparent: true, opacity: 0.7, depthWrite: false }),
    [clouds],
  )
  const lunaMaterial = useMemo(
    () => new MeshStandardMaterial({ map: moonMap, color: new Color('#e8e3d8'), roughness: 0.95 }),
    [moonMap],
  )
  const secondMaterial = useMemo(
    () => new MeshStandardMaterial({ color: new Color('#9fb6d8'), roughness: 0.9 }),
    [],
  )

  useEffect(
    () => () => {
      sphere.dispose()
      earthMaterial.dispose()
      cloudMaterial.dispose()
      lunaMaterial.dispose()
      secondMaterial.dispose()
    },
    [sphere, earthMaterial, cloudMaterial, lunaMaterial, secondMaterial],
  )

  const earthRef = useRef<Group>(null)
  const lunaRef = useRef<Group>(null)
  const secondRef = useRef<Group>(null)
  const t = useRef(0)

  useFrame((_, delta) => {
    t.current += delta
    if (earthRef.current) earthRef.current.rotation.y += delta * 0.3
    if (lunaRef.current) lunaRef.current.rotation.y = -t.current * 0.9
    if (secondRef.current) secondRef.current.rotation.y = -t.current * 0.42
  })

  const lunaOrbit = 6.4
  const secondOrbit = 11.4

  return (
    <group>
      <ambientLight intensity={0.5} />
      <pointLight position={[-40, 8, 18]} intensity={4.4} distance={0} decay={0} color="#fff3d8" />

      <group ref={earthRef}>
        <mesh geometry={sphere} material={earthMaterial} scale={2.4} />
        <mesh geometry={sphere} material={cloudMaterial} scale={2.44} />
      </group>

      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[lunaOrbit - 0.02, lunaOrbit + 0.02, 96]} />
        <meshBasicMaterial color="#6fa8ff" transparent opacity={0.5} side={DoubleSide} />
      </mesh>
      <group ref={lunaRef}>
        <group position={[lunaOrbit, 0, 0]}>
          <mesh geometry={sphere} material={lunaMaterial} scale={0.6} />
        </group>
      </group>

      <group rotation={[0.62, 0, 0.28]}>
        <mesh rotation={[-Math.PI / 2, 0, 0]}>
          <ringGeometry args={[secondOrbit - 0.02, secondOrbit + 0.02, 96]} />
          <meshBasicMaterial color="#ffb37a" transparent opacity={0.5} side={DoubleSide} />
        </mesh>
        <group ref={secondRef}>
          <group position={[secondOrbit, 0, 0]}>
            <mesh geometry={sphere} material={secondMaterial} scale={0.9} />
          </group>
        </group>
      </group>
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/*                  What if Earth were the size of Jupiter?                  */
/* -------------------------------------------------------------------------- */

function EarthAsJupiterScene() {
  const sphere = useSphere(48)
  const earthMap = useMemo(() => getBodyTexture('earth'), [])
  const jupiterMap = useMemo(() => getBodyTexture('jupiter'), [])
  const clouds = useMemo(() => getEarthClouds(), [])

  const earthMaterial = useMemo(() => new MeshStandardMaterial({ map: earthMap, roughness: 0.65 }), [earthMap])
  const cloudMaterial = useMemo(
    () => new MeshStandardMaterial({ map: clouds, transparent: true, opacity: 0.6, depthWrite: false }),
    [clouds],
  )
  const jupiterMaterial = useMemo(() => new MeshStandardMaterial({ map: jupiterMap, roughness: 0.85 }), [jupiterMap])

  useEffect(
    () => () => {
      sphere.dispose()
      earthMaterial.dispose()
      cloudMaterial.dispose()
      jupiterMaterial.dispose()
    },
    [sphere, earthMaterial, cloudMaterial, jupiterMaterial],
  )

  const jupiterRadius = lessonRadius(PLANET_BY_ID.jupiter.diameterKm) * 2.1
  const aRef = useRef<Group>(null)
  const bRef = useRef<Group>(null)

  useFrame((_, delta) => {
    if (aRef.current) aRef.current.rotation.y += delta * 0.25
    if (bRef.current) bRef.current.rotation.y += delta * 0.22
  })

  return (
    <group>
      <ambientLight intensity={0.55} />
      <pointLight position={[6, 8, 12]} intensity={4} distance={0} decay={0} color="#fff3d8" />

      <group ref={aRef} position={[-jupiterRadius - 1.6, 0, 0]}>
        <mesh geometry={sphere} material={jupiterMaterial} scale={jupiterRadius} />
      </group>
      <group ref={bRef} position={[jupiterRadius + 1.6, 0, 0]}>
        <mesh geometry={sphere} material={earthMaterial} scale={jupiterRadius} />
        <mesh geometry={sphere} material={cloudMaterial} scale={jupiterRadius * 1.015} />
      </group>
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/*                     What if the Sun disappeared?                          */
/* -------------------------------------------------------------------------- */

/**
 * The planets keep their sideways speed, so they sail off in straight lines
 * while an expanding shell shows how long light takes to get anywhere.
 */
function NoSunScene() {
  const sphere = useSphere(40)
  const materials = useMemo(
    () =>
      new Map(
        Object.values(PLANET_BY_ID).map((planet) => [
          planet.id,
          new MeshStandardMaterial({ map: getBodyTexture(planet.id), roughness: 0.85 }),
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

  const shellRef = useRef<Mesh>(null)
  const shellMaterial = useMemo(
    () =>
      new MeshBasicMaterial({
        color: new Color('#ff7a3c'),
        transparent: true,
        opacity: 0,
        wireframe: true,
        side: DoubleSide,
        blending: AdditiveBlending,
        depthWrite: false,
      }),
    [],
  )
  const shellGeometry = useMemo(() => new SphereGeometry(1, 28, 18), [])

  useEffect(
    () => () => {
      shellMaterial.dispose()
      shellGeometry.dispose()
    },
    [shellMaterial, shellGeometry],
  )

  const elapsed = useRef(0)
  const planetOffsets = useMemo(
    () =>
      Object.values(PLANET_BY_ID).map((planet, index) => {
        const au = planet.semiMajorAxisAU
        return {
          id: planet.id,
          radius: 2 + Math.pow(au, 0.62) * 1.5,
          angle: index * 0.9,
          velocity: 2.4 / Math.sqrt(au),
          radiusScale: lessonRadius(planet.diameterKm) * 0.34,
        }
      }),
    [],
  )
  const drift = useRef(planetOffsets.map(() => 0))
  const tangent = useMemo(() => new Vector3(), [])
  const groups = useRef<Group[]>([])

  useFrame((_, delta) => {
    elapsed.current += delta
    planetOffsets.forEach((item, index) => {
      // Once the Sun is gone nothing bends the path: straight lines forever.
      const angle = item.angle + (item.velocity * delta) / item.radius
      const group = groups.current[index]
      if (!group) return
      const x = Math.cos(angle) * item.radius
      const z = Math.sin(angle) * item.radius
      tangent.set(-Math.sin(angle), 0, Math.cos(angle))
      // Carry on along the tangent: that is what "no more gravity" looks like.
      drift.current[index] += item.velocity * 0.9 * delta
      const d = drift.current[index]
      group.position.set(x + tangent.x * d, 0, z + tangent.z * d)
      group.lookAt(x + tangent.x * (d + 10), 0, z + tangent.z * (d + 10))
    })

    // The light shell keeps expanding: nothing new arrives from the Sun.
    const wave = elapsed.current * 6
    if (shellRef.current) {
      shellRef.current.scale.setScalar(Math.max(0.001, wave))
      shellMaterial.opacity = wave > 1 ? Math.max(0, 0.32 - elapsed.current * 0.03) : 0
    }
  })

  return (
    <group>
      <ambientLight intensity={0.22} color="#6f8fd8" />
      {planetOffsets.map((item, index) => (
        <group
          key={item.id}
          ref={(node) => {
            if (node) groups.current[index] = node
          }}
        >
          <mesh geometry={sphere} material={materials.get(item.id)!} scale={item.radiusScale} />
        </group>
      ))}
      <mesh ref={shellRef} geometry={shellGeometry} material={shellMaterial} />
    </group>
  )
}

/* -------------------------------------------------------------------------- */
/*                     What if Earth stopped rotating?                       */
/* -------------------------------------------------------------------------- */

function NoRotationScene() {
  const sphere = useSphere(56)
  const earthMap = useMemo(() => getBodyTexture('earth'), [])
  const clouds = useMemo(() => getEarthClouds(), [])
  const corona = useMemo(() => getCoronaTexture(), [])

  const earthMaterial = useMemo(() => new MeshStandardMaterial({ map: earthMap, roughness: 0.62 }), [earthMap])
  const cloudMaterial = useMemo(
    () => new MeshStandardMaterial({ map: clouds, transparent: true, opacity: 0.55, depthWrite: false }),
    [clouds],
  )

  useEffect(
    () => () => {
      sphere.dispose()
      earthMaterial.dispose()
      cloudMaterial.dispose()
    },
    [sphere, earthMaterial, cloudMaterial],
  )

  const glowGeometry = useMemo(() => new SphereGeometry(1, 24, 16), [])
  const glowMaterial = useMemo(() => createGlowMaterial(corona, '#ff8a3c'), [corona])

  useEffect(
    () => () => {
      glowGeometry.dispose()
      glowMaterial.dispose()
    },
    [glowGeometry, glowMaterial],
  )

  return (
    <group>
      <ambientLight intensity={0.28} />
      <mesh geometry={sphere} material={earthMaterial} scale={2.8} rotation={[0, 0, 0.409]} />
      <mesh geometry={sphere} material={cloudMaterial} scale={2.85} rotation={[0, 0, 0.409]} />
      <mesh position={[-14, 3, 6]}>
        <sphereGeometry args={[1.4, 32, 24]} />
        <meshBasicMaterial color="#ffe3ad" toneMapped={false} />
      </mesh>
      <mesh geometry={glowGeometry} material={glowMaterial} scale={6.4} position={[-14, 3, 6]} />
      <pointLight position={[-14, 3, 6]} intensity={3.4} distance={0} decay={0} color="#fff3d8" />
    </group>
  )
}

/* -------------------------------------------------------------------------- */

/** Router for the four hypothetical scenarios. */
export function WhatIfScene({ scenario }: { scenario: WhatIfId }) {
  return (
    <group>
      {scenario === 'two-moons' && <TwoMoonsScene />}
      {scenario === 'earth-jupiter' && <EarthAsJupiterScene />}
      {scenario === 'no-sun' && <NoSunScene />}
      {scenario === 'no-rotation' && <NoRotationScene />}
    </group>
  )
}