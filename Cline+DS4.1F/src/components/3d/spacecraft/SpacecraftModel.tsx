import {
  AdditiveBlending,
  BoxGeometry,
  CircleGeometry,
  ConeGeometry,
  CylinderGeometry,
  LatheGeometry,
  Quaternion,
  SphereGeometry,
  TorusGeometry,
  Vector2,
  Vector3,
} from 'three'
import type { Material, Mesh, Sprite, SpriteMaterial } from 'three'
import type { RefObject } from 'react'
import { getTexture } from '../../../utils/textures'
import type { SpacecraftMaterials } from './spacecraftResources'

/**
 * The spacecraft model.
 *
 * A next-generation robotic deep-space probe, built the way a real one is: a
 * slim faceted bus under brushed-titanium panelling and gold multi-layer
 * insulation, two deployable solar wings on booms, a ribbed high-gain dish on a
 * mast, a magnetometer boom, star trackers and status lights, and a cluster of
 * ion thrusters at the tail. It is assembled from shared primitives and a few
 * lathed profiles so the whole thing costs a handful of geometries.
 *
 * Local frame: **+Z is forward** (the nose), matching how the flight model aims
 * the ship with `lookAt`.
 */

/* ------------------------------------------------------------------ *
 * Shared geometry
 * ------------------------------------------------------------------ */

const BOX = new BoxGeometry(1, 1, 1)
const CYL = new CylinderGeometry(1, 1, 1, 18)
const CYL_FACETED = new CylinderGeometry(1, 1, 1, 8)
const CONE = new ConeGeometry(1, 1, 20)
const SPHERE = new SphereGeometry(1, 20, 14)
/** The main plasma disc; `engineRef` scales this, so it starts small. */
const PLASMA = new CircleGeometry(0.14, 32)
const RING = new TorusGeometry(1, 0.05, 8, 40)

/** The sleek ogive bus, revolved around Y then rotated to lie along Z. */
const HULL = new LatheGeometry(
  (
    [
      [0.3, -1.3],
      [0.34, -1.25],
      [0.4, -1.1],
      [0.45, -0.85],
      [0.47, -0.5],
      [0.47, 0.0],
      [0.45, 0.4],
      [0.41, 0.8],
      [0.34, 1.1],
      [0.24, 1.32],
      [0.12, 1.5],
      [0.03, 1.62],
    ] as const
  ).map(([radius, y]) => new Vector2(radius, y)),
  32,
)

/** A shallow parabolic dish (radius 0.5, focal length 0.4). */
const DISH = new LatheGeometry(
  Array.from({ length: 14 }, (_, i) => {
    const radius = (i / 13) * 0.5
    return new Vector2(radius, (radius * radius) / (4 * 0.4))
  }),
  40,
)

/** A truncated cone that hugs the tapering aft hull, in gold insulation. */
const MLI_TAIL = new CylinderGeometry(0.478, 0.318, 0.82, 24)

/** A curved thruster bell: throat at +Y, wide mouth at -Y. */
const NOZZLE = new LatheGeometry(
  (
    [
      [0.05, 0.12],
      [0.06, 0.06],
      [0.09, 0.0],
      [0.13, -0.06],
      [0.17, -0.14],
    ] as const
  ).map(([radius, y]) => new Vector2(radius, y)),
  22,
)

/* ------------------------------------------------------------------ *
 * Small helpers
 * ------------------------------------------------------------------ */

interface StrutProps {
  from: [number, number, number]
  to: [number, number, number]
  radius: number
  material: Material
}

/** A cylinder stretched between two points: booms, struts and antennas. */
function Strut({ from, to, radius, material }: StrutProps) {
  const start = new Vector3(from[0], from[1], from[2])
  const end = new Vector3(to[0], to[1], to[2])
  const direction = end.clone().sub(start)
  const length = direction.length()
  const position = start.clone().add(end).multiplyScalar(0.5)
  const quaternion = new Quaternion().setFromUnitVectors(new Vector3(0, 1, 0), direction.normalize())
  return <mesh geometry={CYL} material={material} position={position} quaternion={quaternion} scale={[radius, length, radius]} />
}

interface SolarWingProps {
  materials: SpacecraftMaterials
  side: 1 | -1
}

/** One deployable solar wing: a boom, a framed cell panel and a dark substrate. */
function SolarWing({ materials, side }: SolarWingProps) {
  const boom = 0.36
  const width = 0.82
  const depth = 0.5
  const center = boom + width / 2
  return (
    <group position={[side * 0.42, 0, -0.2]} rotation={[0, 0, side * 0.1]}>
      <mesh
        geometry={CYL}
        material={materials.dark}
        rotation={[0, 0, Math.PI / 2]}
        position={[side * (boom / 2), 0, 0]}
        scale={[0.03, boom, 0.03]}
      />
      <mesh geometry={BOX} material={materials.dark} position={[side * center, 0, 0]} scale={[width + 0.06, 0.03, depth + 0.06]} />
      <mesh geometry={BOX} material={materials.solar} position={[side * center, 0.023, 0]} scale={[width, 0.012, depth]} />
      <mesh geometry={BOX} material={materials.solar} position={[side * center, -0.023, 0]} scale={[width, 0.012, depth]} />
      <mesh geometry={BOX} material={materials.dark} position={[side * center, 0, depth / 2 + 0.03]} scale={[width + 0.06, 0.05, 0.04]} />
      <mesh geometry={BOX} material={materials.dark} position={[side * center, 0, -depth / 2 - 0.03]} scale={[width + 0.06, 0.05, 0.04]} />
      <mesh geometry={BOX} material={materials.dark} position={[side * (center + width / 2 + 0.03), 0, 0]} scale={[0.04, 0.05, depth + 0.06]} />
      <mesh geometry={BOX} material={materials.dark} position={[side * (center - width / 2 - 0.03), 0, 0]} scale={[0.04, 0.05, depth + 0.06]} />
    </group>
  )
}

export interface SpacecraftModelProps {
  materials: SpacecraftMaterials
  engineRef: RefObject<Mesh | null>
  plumeRef: RefObject<Sprite | null>
  plumeMaterialRef: RefObject<SpriteMaterial | null>
}

export function SpacecraftModel({ materials, engineRef, plumeRef, plumeMaterialRef }: SpacecraftModelProps) {
  return (
    <group>
      {/* --- Bus ---------------------------------------------------------- */}
      <mesh geometry={HULL} material={materials.hull} rotation={[Math.PI / 2, 0, 0]} />

      {/* Dark heat-shield nose cap and a forward sensor. */}
      <mesh geometry={CONE} material={materials.dark} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, 1.47]} scale={[0.24, 0.3, 0.24]} />
      <mesh geometry={SPHERE} material={materials.glass} position={[0, 0, 1.64]} scale={0.045} />

      {/* Dorsal spine and ventral keel. */}
      <mesh geometry={BOX} material={materials.dark} position={[0, 0.44, 0.0]} scale={[0.15, 0.14, 1.4]} />
      <mesh geometry={BOX} material={materials.dark} position={[0, -0.44, -0.1]} scale={[0.13, 0.12, 1.2]} />

      {/* Gold MLI over the tapering engine section. */}
      <mesh geometry={MLI_TAIL} material={materials.mli} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -0.9]} />

      {/* --- Solar arrays ------------------------------------------------- */}
      <SolarWing materials={materials} side={1} />
      <SolarWing materials={materials} side={-1} />

      {/* --- High-gain dish on a mast ------------------------------------- */}
      <Strut from={[0, 0.42, 0.3]} to={[0, 0.98, 0.4]} radius={0.035} material={materials.dark} />
      <group position={[0, 0.98, 0.4]} rotation={[Math.PI / 2 - 0.22, 0, 0]}>
        <mesh geometry={DISH} material={materials.dish} />
        <mesh geometry={RING} material={materials.dark} rotation={[Math.PI / 2, 0, 0]} position={[0, 0.156, 0]} scale={0.5} />
        <mesh geometry={CONE} material={materials.mli} rotation={[Math.PI, 0, 0]} position={[0, 0.4, 0]} scale={[0.05, 0.14, 0.05]} />
        <Strut from={[0.5, 0.156, 0]} to={[0, 0.4, 0]} radius={0.008} material={materials.dark} />
        <Strut from={[-0.25, 0.156, 0.43]} to={[0, 0.4, 0]} radius={0.008} material={materials.dark} />
        <Strut from={[-0.25, 0.156, -0.43]} to={[0, 0.4, 0]} radius={0.008} material={materials.dark} />
      </group>

      {/* --- Radiators, tanks and avionics -------------------------------- */}
      <mesh geometry={BOX} material={materials.radiator} position={[0.43, -0.29, -0.35]} rotation={[0, 0, 0.35]} scale={[0.5, 0.02, 0.62]} />
      <mesh geometry={BOX} material={materials.radiator} position={[-0.43, -0.29, -0.35]} rotation={[0, 0, -0.35]} scale={[0.5, 0.02, 0.62]} />
      <mesh geometry={CYL} material={materials.mli} rotation={[Math.PI / 2, 0, 0]} position={[0.5, 0.05, -0.72]} scale={[0.1, 0.6, 0.1]} />
      <mesh geometry={CYL} material={materials.mli} rotation={[Math.PI / 2, 0, 0]} position={[-0.5, 0.05, -0.72]} scale={[0.1, 0.6, 0.1]} />
      <mesh geometry={BOX} material={materials.dark} position={[0, 0.5, -0.5]} scale={[0.3, 0.16, 0.5]} />
      <mesh geometry={BOX} material={materials.radiator} position={[0, -0.5, -0.5]} scale={[0.26, 0.12, 0.44]} />

      {/* --- Star trackers ------------------------------------------------ */}
      <mesh geometry={CYL} material={materials.dark} rotation={[1.2, 0, 0]} position={[0.16, 0.34, 0.95]} scale={[0.06, 0.14, 0.06]} />
      <mesh geometry={SPHERE} material={materials.glass} position={[0.16, 0.42, 1.02]} scale={0.05} />
      <mesh geometry={CYL} material={materials.dark} rotation={[1.2, 0, 0]} position={[-0.16, 0.34, 0.95]} scale={[0.06, 0.14, 0.06]} />
      <mesh geometry={SPHERE} material={materials.glass} position={[-0.16, 0.42, 1.02]} scale={0.05} />

      {/* --- Antennas and handrails --------------------------------------- */}
      <Strut from={[0.2, 0.3, -1.0]} to={[0.62, 0.9, -1.5]} radius={0.008} material={materials.dark} />
      <mesh geometry={SPHERE} material={materials.dark} position={[0.62, 0.9, -1.5]} scale={0.025} />
      <Strut from={[-0.2, 0.3, -1.0]} to={[-0.7, 0.66, -1.42]} radius={0.008} material={materials.dark} />
      <mesh geometry={SPHERE} material={materials.dark} position={[-0.7, 0.66, -1.42]} scale={0.025} />
      <Strut from={[0.43, 0.22, 0.3]} to={[0.43, 0.22, -0.4]} radius={0.007} material={materials.dark} />
      <Strut from={[-0.43, 0.22, 0.3]} to={[-0.43, 0.22, -0.4]} radius={0.007} material={materials.dark} />

      {/* --- Magnetometer boom -------------------------------------------- */}
      <Strut from={[0.05, -0.4, -0.9]} to={[0.22, -1.35, -1.95]} radius={0.012} material={materials.dark} />
      <mesh geometry={BOX} material={materials.mli} position={[0.22, -1.35, -1.95]} scale={[0.06, 0.06, 0.1]} />

      {/* --- Ion thruster cluster ----------------------------------------- */}
      <mesh geometry={CYL_FACETED} material={materials.dark} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -1.27]} scale={[0.33, 0.18, 0.33]} />
      <mesh geometry={NOZZLE} material={materials.dark} rotation={[Math.PI / 2, 0, 0]} position={[0, 0, -1.34]} scale={1.15} />
      {[0, 1, 2, 3].map((index) => {
        const angle = (index * Math.PI) / 2 + Math.PI / 4
        return (
          <mesh
            key={index}
            geometry={NOZZLE}
            material={materials.dark}
            rotation={[Math.PI / 2, 0, 0]}
            position={[Math.cos(angle) * 0.19, Math.sin(angle) * 0.19, -1.32]}
            scale={0.6}
          />
        )
      })}
      <mesh geometry={RING} material={materials.accent} position={[0, 0, -1.3]} scale={0.3} />
      <mesh ref={engineRef} geometry={PLASMA} material={materials.engine} rotation={[0, Math.PI, 0]} position={[0, 0, -1.44]} />

      {/* --- Exhaust plume ------------------------------------------------ */}
      <sprite ref={plumeRef} position={[0, 0, -1.9]} scale={[1.4, 1.4, 1]}>
        <spriteMaterial
          ref={plumeMaterialRef}
          map={getTexture('glow')}
          color="#7ce6ff"
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
          opacity={0.2}
          toneMapped={false}
        />
      </sprite>
    </group>
  )
}
