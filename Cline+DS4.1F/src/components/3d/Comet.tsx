import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferGeometry, Float32BufferAttribute, MeshStandardMaterial } from 'three'
import type { Group, Mesh, PointsMaterial, Sprite, SpriteMaterial } from 'three'
import { COMET_CLINE } from '../../data/planets'
import { orbitalState, toSceneXZ } from '../../utils/astronomy'
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
 * Comet Cline-1: a little ball of ice on a very stretched orbit, with a tail that
 * always points away from the Sun.
 *
 * Finding it is Easter egg number two — the comet is easy to miss, and clicking
 * it unlocks its story.
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

interface CometProps {
  reducedMotion: boolean
  showLabels: boolean
}

export function Comet({ reducedMotion, showLabels }: CometProps) {
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

  const tailGeometry = useMemo(() => createTailGeometry(), [])
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        map: getTexture('comet'),
        color: '#dff6ff',
        roughness: 0.85,
        metalness: 0,
        emissive: '#4fd8ff',
        emissiveIntensity: 0.35,
      }),
    [],
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
    registerBody('comet', object)
    return () => unregisterBody('comet', object)
  }, [])

  useFrame((_, delta) => {
    const group = groupRef.current
    if (!group) return
    const days = clock.daysSinceJ2000
    const state = orbitalState(COMET_CLINE, days)
    const distance = scaleDistanceKm(state.distanceKm, scaleMode, customScale)
    const scene = toSceneXZ(distance, state.angleRad)
    group.position.set(scene.x, 0, scene.z)
    // +Z then points at the Sun, so the tail (built along -Z) trails behind.
    group.lookAt(0, 0, 0)

    if (nucleusRef.current && !reducedMotion) {
      nucleusRef.current.rotation.y += delta * 0.35
    }

    // A comet's tail grows and brightens as it approaches the Sun.
    const au = state.distanceKm / 149_597_870.7
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

  const discovered = discoveries.includes('comet')

  return (
    <group ref={groupRef}>
      <mesh
        ref={nucleusRef}
        geometry={LOW_DETAIL_SPHERE}
        material={material}
        scale={0.32}
        onPointerOver={(event) => {
          event.stopPropagation()
          setHovered('comet')
        }}
        onPointerOut={() => setHovered(null)}
        onClick={(event) => {
          event.stopPropagation()
          selectBody('comet')
          focusBody('comet', 'planet', 9)
          audio.play('arrive')
          if (!discovered) {
            registerDiscovery('comet')
            showToast('You found Comet Cline-1! A dusty snowball with a glowing tail.', 'fun')
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
            color="#a9ecff"
            toneMapped={false}
          />
        </points>
      </group>

      {showLabels ? (
        <PlanetLabel bodyId="comet" name="Comet Cline-1" accent="#bff4ff" offset={1.1} />
      ) : null}
    </group>
  )
}