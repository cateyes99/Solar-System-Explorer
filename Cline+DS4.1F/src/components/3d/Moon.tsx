import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { MeshStandardMaterial } from 'three'
import type { ColorRepresentation, Group, Mesh } from 'three'
import type { BodyId, FocusTargetId, QualityLevel, SatelliteDefinition } from '../../types'
import { BODY_VISUALS } from '../../data/visuals'
import { clock } from '../../utils/simulationClock'
import { registerBody, unregisterBody } from '../../utils/bodyRegistry'
import { satelliteOrbitRadius, satelliteRadius } from '../../utils/scale'
import { hashString } from '../../utils/random'
import { getTexture } from '../../utils/textures'
import { useSimulationStore } from '../../store/simulationStore'
import { LOW_DETAIL_SPHERE, MEDIUM_DETAIL_SPHERE } from './geometry'

/**
 * A moon orbiting its parent planet.
 *
 * Moons are deliberately rendered as cheap low-detail spheres with solid
 * colours — except our own Moon, which gets its cratered texture and a full
 * information panel.
 */
interface MoonProps {
  satellite: SatelliteDefinition
  parentId: BodyId
  parentRadius: number
  quality: QualityLevel
  /** Set for our Moon, so the camera can focus on it and the panel can open. */
  bodyId?: FocusTargetId
  /** Used by the "two moons" experiment to add a visitor. */
  nameOverride?: string
  colorOverride?: ColorRepresentation
  periodOverrideDays?: number
  /** Slight orbital tilt, in degrees, so the family does not look flat. */
  inclinationDeg?: number
}

export function Moon({
  satellite,
  parentId,
  parentRadius,
  quality,
  bodyId,
  nameOverride,
  colorOverride,
  periodOverrideDays,
  inclinationDeg = 0,
}: MoonProps) {
  const orbitRef = useRef<Group>(null)
  const meshRef = useRef<Mesh>(null)
  const setHovered = useSimulationStore((state) => state.setHovered)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const focusBody = useSimulationStore((state) => state.focusBody)
  const showToast = useSimulationStore((state) => state.showToast)

  const visualRadius = satelliteRadius(satellite, parentRadius)
  const orbitRadius = satelliteOrbitRadius(satellite, parentRadius)
  const periodDays = periodOverrideDays ?? satellite.orbitalPeriodDays
  // Seeded from the parent and the moon's own id, so every family is spread
  // around its planet instead of lining up at the same angle.
  const phase = useMemo(
    () => hashString(`${parentId}:${satellite.id}`) * Math.PI * 2,
    [parentId, satellite.id],
  )

  /**
   * Our Moon is the one satellite with a real map and measured figures of its own.
   * Its polar flattening is 0.12% — about four kilometres — which is invisible at
   * this size, but it is a measured number, so it is applied rather than rounded
   * away, exactly as the planets' IAU figures are.
   */
  const moonMarking = bodyId === 'moon' ? BODY_VISUALS.moon : null
  const flattening = moonMarking?.flattening ?? 0
  const meshScale = useMemo<[number, number, number]>(
    () => [visualRadius, visualRadius * (1 - flattening), visualRadius],
    [visualRadius, flattening],
  )

  const material = useMemo(() => {
    // Our own Moon is a real body with a real map, so it gets the same measured
    // recipe the planets use — its own albedo and its own relief. Every other moon
    // stays a cheap low-detail sphere in its own flat colour.
    const map = moonMarking ? getTexture(moonMarking.textureId) : null
    return new MeshStandardMaterial({
      map,
      // A real map doubles as relief: a darker texel sits lower than a bright one.
      bumpMap: moonMarking?.bumpScale ? map : null,
      bumpScale: moonMarking?.bumpScale ?? 0,
      color: moonMarking ? '#ffffff' : (colorOverride ?? satellite.color),
      roughness: moonMarking?.roughness ?? 0.96,
      metalness: 0,
    })
  }, [moonMarking, colorOverride, satellite.color])

  useEffect(() => () => material.dispose(), [material])

  // Only register moons the camera is allowed to focus on.
  useEffect(() => {
    if (!bodyId || !orbitRef.current) return
    const object = orbitRef.current
    registerBody(bodyId, object)
    return () => unregisterBody(bodyId, object)
  }, [bodyId])

  useFrame(() => {
    const orbit = orbitRef.current
    if (!orbit) return
    const days = clock.daysSinceJ2000
    const angle = phase + (days / periodDays) * Math.PI * 2
    orbit.position.set(Math.cos(angle) * orbitRadius, 0, -Math.sin(angle) * orbitRadius)
    // Tidally locked, like every large moon in the real Solar System.
    if (meshRef.current) meshRef.current.rotation.y = -angle
  })

  const geometry = quality === 'low' ? LOW_DETAIL_SPHERE : MEDIUM_DETAIL_SPHERE

  return (
    <group rotation={[0, 0, inclinationDeg * (Math.PI / 180)]}>
      <group ref={orbitRef}>
        <mesh
          ref={meshRef}
          geometry={geometry}
          material={material}
          scale={meshScale}
          onPointerOver={(event) => {
            event.stopPropagation()
            setHovered(bodyId ?? null)
          }}
          onPointerOut={() => setHovered(null)}
          onClick={(event) => {
            event.stopPropagation()
            if (bodyId) {
              selectBody(bodyId)
              focusBody(bodyId, 'planet', 7)
            } else {
              showToast(`${nameOverride ?? satellite.name}: ${satellite.note}`, 'fun')
            }
          }}
        />
      </group>
    </group>
  )
}