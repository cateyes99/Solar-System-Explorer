import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, MeshStandardMaterial } from 'three'
import type { Group, Mesh, PointsMaterial, Sprite, SpriteMaterial } from 'three'
import type { CelestialBody } from '../../types'
import type { CometVisuals } from '../../data/visuals'
import { BODY_VISUALS } from '../../data/visuals'
import { AU_KM, orbitalState, toSceneXZ } from '../../utils/astronomy'
import { clock } from '../../utils/simulationClock'
import { scaleDistanceKm } from '../../utils/scale'
import { createRandom } from '../../utils/random'
import { getTexture } from '../../utils/textures'
import { registerBody, unregisterBody } from '../../utils/bodyRegistry'
import { useSimulationStore } from '../../store/simulationStore'
import { audio } from '../../utils/audio'
import { LOW_DETAIL_SPHERE } from './geometry'
import { PlanetLabel } from './PlanetLabel'

/**
 * A comet: a little ball of ice on a very stretched orbit, with a tail that
 * always points away from the Sun.
 *
 * There are two of them. Comet Cline-1 is the friendly, bright snowball that
 * turns up in the middle of the scene; Halley's Comet is the famous visitor on a
 * huge retrograde ellipse that spends most of its life far beyond Neptune.
 * Finding either one and clicking it unlocks its story.
 */
const TAIL_PARTICLES = 240

function createTailGeometry(): BufferGeometry {
  const random = createRandom(606)
  const positions = new Float32Array(TAIL_PARTICLES * 3)
  for (let i = 0; i < TAIL_PARTICLES; i += 1) {
    // Local -Z is the anti-sun direction once the comet has looked at the Sun.
    const along = -Math.pow(random(), 0.7)
    const spread = 0.06 + Math.pow(random(), 2) * 0.42
    positions[i * 3] = (random() - 0.5) * spread
    positions[i * 3 + 1] = (random() - 0.5) * spread
    positions[i * 3 + 2] = along
  }
  const geometry = new BufferGeometry()
  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  return geometry
}

/** Fallback look if a comet were ever defined without its own recipe. */
const DEFAULT_COMET_LOOK: CometVisuals = {
  nucleusColor: '#dff6ff',
  emissiveColor: '#4fd8ff',
  emissiveIntensity: 0.35,
  tailColor: '#a9ecff',
}

interface CometProps {
  body: CelestialBody
  reducedMotion: boolean
  showLabels: boolean
}

export function Comet({ body, reducedMotion, showLabels }: CometProps) {
  const groupRef = useRef<Group>(null)
  const tailRef = useRef<Group>(null)
  const spriteMaterialRef = useRef<SpriteMaterial>(null)
  const tailMaterialRef = useRef<PointsMaterial>(null)
  const haloRef = useRef<Sprite>(null)
  const nucleusRef = useRef<Mesh>(null)

  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const customScale = useSimulationStore((state) => state.customScale)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const focusBody = useSimulationStore((state) => state.focusBody)
  const setHovered = useSimulationStore((state) => state.setHovered)
  const registerDiscovery = useSimulationStore((state) => state.registerDiscovery)
  const showToast = useSimulationStore((state) => state.showToast)
  const discoveries = useSimulationStore((state) => state.discoveries)

  const visuals = BODY_VISUALS[body.id]
  // Every comet ships a `comet` recipe; fall back to the bright default if one is ever missing.
  const look = visuals.comet ?? DEFAULT_COMET_LOOK

  const tailGeometry = useMemo(() => createTailGeometry(), [])
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        map: getTexture(visuals.textureId),
        color: look.nucleusColor,
        roughness: visuals.roughness,
        metalness: visuals.metalness,
        emissive: look.emissiveColor,
        emissiveIntensity: look.emissiveIntensity,
      }),
    [visuals.textureId, visuals.roughness, visuals.metalness, look],
  )

  useEffect(
    () => () => {
      tailGeometry.dispose()
      material.dispose()
    },
    [tailGeometry, material],
  )

  useEffect(() => {
    const object = groupRef.current
    if (!object) return
    registerBody(body.id, object)
    return () => unregisterBody(body.id, object)
  }, [body.id])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    const days = clock.daysSinceJ2000
    const state = orbitalState(body, days)
    const distance = scaleDistanceKm(state.distanceKm, scaleMode, customScale)
    const scene = toSceneXZ(distance, state.angleRad)
    group.position.set(scene.x, 0, scene.z)
    // +Z then points at the Sun, so the tail (built along -Z) trails behind.
    group.lookAt(0, 0, 0)

    if (nucleusRef.current && !reducedMotion) {
      nucleusRef.current.rotation.y += delta * 0.35
    }

    // A comet's tail grows and brightens as it approaches the Sun.
    const au = state.distanceKm / AU_KM
    const activity = Math.min(1, Math.max(0.15, 1.35 - au / 2.2))
    if (tailRef.current) {
      tailRef.current.scale.set(1 + activity * 0.7, 1 + activity * 0.7, 9 + activity * 26)
    }
    if (tailMaterialRef.current) tailMaterialRef.current.opacity = 0.12 + activity * 0.42
    if (spriteMaterialRef.current) spriteMaterialRef.current.opacity = 0.4 + activity * 0.5
    if (haloRef.current) {
      const shimmer = reducedMotion ? 1 : 1 + Math.sin(performance.now() * 0.0013) * 0.06
      const size = 2.4 * shimmer * (0.8 + activity)
      haloRef.current.scale.set(size, size, 1)
    }
  })

  const discovered = discoveries.includes(body.id)

  return (
    <group ref={groupRef}>
      <mesh
        ref={nucleusRef}
        geometry={LOW_DETAIL_SPHERE}
        material={material}
        scale={0.32}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered(body.id)
        }}
        onPointerOut={() => setHovered(null)}
        onClick={(event) => {
          event.stopPropagation()
          selectBody(body.id)
          focusBody(body.id, 'planet', 9)
          audio.play('arrive')
          if (!discovered) {
            registerDiscovery(body.id)
            showToast(body.discoveryToast ?? `You found ${body.name}!`, 'fun')
          }
        }}
      />

      <sprite ref={haloRef} scale={[2.4, 2.4, 1]}>
        <spriteMaterial
          ref={spriteMaterialRef}
          map={getTexture('comet')}
          blending={AdditiveBlending}
          transparent
          depthWrite={false}
          opacity={0.7}
          toneMapped={false}
        />
      </sprite>

      <group ref={tailRef}>
        <points geometry={tailGeometry} frustumCulled={false}>
          <pointsMaterial
            ref={tailMaterialRef}
            map={getTexture('glow')}
            size={0.55}
            sizeAttenuation
            blending={AdditiveBlending}
            transparent
            depthWrite={false}
            opacity={0.35}
            color={look.tailColor}
            toneMapped={false}
          />
        </points>
      </group>

      {showLabels ? (
        <PlanetLabel bodyId={body.id} name={body.name} accent={visuals.accent} offset={1.1} />
      ) : null}
    </group>
  )
}