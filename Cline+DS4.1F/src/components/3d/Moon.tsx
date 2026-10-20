import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { BufferGeometry, Float32BufferAttribute, Line, LineBasicMaterial, MeshStandardMaterial, Vector3 } from 'three'
import type { ColorRepresentation, Group, Mesh } from 'three'
import type { BodyId, FocusTargetId, QualityLevel, SatelliteDefinition } from '../../types'
import { BODY_VISUALS } from '../../data/visuals'
import { clock } from '../../utils/simulationClock'
import { registerBody, unregisterBody } from '../../utils/bodyRegistry'
import { satelliteOrbitRadius, satelliteRadius } from '../../utils/scale'
import { satellitePosition, satelliteOrbitPath, type SatelliteOrbit } from '../../utils/astronomy'
import { hashString } from '../../utils/random'
import { getTexture } from '../../utils/textures'
import { useSimulationStore } from '../../store/simulationStore'
import { useTranslation } from '../../i18n'
import { useContent } from '../../i18n/content'
import { SPHERE_LODS, sphereTierForApparentSize } from './geometry'

/**
 * A moon orbiting its parent planet.
 *
 * Moons are deliberately rendered as cheap low-detail spheres with solid
 * colours — except our own Moon, which gets its cratered texture and a full
 * information panel.
 *
 * Their paths are real Keplerian orbits, though: each one carries its measured
 * inclination, node, eccentricity, argument of periapsis and J2000 mean anomaly,
 * so Titan leans over with Saturn's spin, Titania stands almost upright beside
 * tipped-over Uranus, Triton circles Neptune the wrong way, and every moon starts
 * the simulation at the place it really occupied on 1 January 2000.
 */
interface MoonProps {
  satellite: SatelliteDefinition
  parentId: BodyId
  parentRadius: number
  /**
   * The parent's own distance from the Sun, in scene units. Supplied only by the
   * real-spacing view, where it caps the moon's orbit so a family cannot spill
   * into the next planet's lane.
   */
  parentOrbitRadius?: number
  quality: QualityLevel
  /** Set for our Moon, so the camera can focus on it and the panel can open. */
  bodyId?: FocusTargetId
  /** Used by the "two moons" experiment to add a visitor. */
  nameOverride?: string
  colorOverride?: ColorRepresentation
  periodOverrideDays?: number
}

export function Moon({
  satellite,
  parentId,
  parentRadius,
  parentOrbitRadius,
  quality,
  bodyId,
  nameOverride,
  colorOverride,
  periodOverrideDays,
}: MoonProps) {
  const { t } = useTranslation()
  const content = useContent()
  const orbitRef = useRef<Group>(null)
  const meshRef = useRef<Mesh>(null)
  // The sphere rung follows how large the moon is on screen (see geometry.ts).
  const [sphereTier, setSphereTier] = useState(0)
  const sphereTierRef = useRef(0)
  const maxSphereTier = quality === 'low' ? 2 : 3
  const worldPos = useRef(new Vector3())
  const setHovered = useSimulationStore((state) => state.setHovered)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const focusBody = useSimulationStore((state) => state.focusBody)
  const showToast = useSimulationStore((state) => state.showToast)
  const showOrbits = useSimulationStore((state) => state.showOrbits)
  const orbitModel = useSimulationStore((state) => state.orbitModel)

  const visualRadius = satelliteRadius(satellite, parentRadius)
  const periodDays = periodOverrideDays ?? satellite.orbitalPeriodDays
  // Seeded from the parent and the moon's own id, so every family is spread
  // around its planet instead of lining up at the same angle.
  const phase = useMemo(
    () => hashString(`${parentId}:${satellite.id}`) * Math.PI * 2,
    [parentId, satellite.id],
  )

  /**
   * The moon's real orbit: measured eccentricity, inclination and node, with its
   * semi-major axis compressed to the scene's moon-orbit radius. When the data
   * has a J2000 mean anomaly it is used; otherwise the seeded phase stands in.
   *
   * The educational model drops the measured node and starting angle, leaving
   * the moons evenly spread around their planets — the tidier picture the scene
   * showed before the real elements were added.
   */
  const orbit = useMemo<SatelliteOrbit>(
    () => ({
      semiMajor: satelliteOrbitRadius(
        satellite,
        parentRadius,
        orbitModel === 'realistic' ? parentOrbitRadius : undefined,
      ),
      eccentricity: satellite.orbitalEccentricity ?? 0,
      inclinationDeg: satellite.orbitalInclinationDeg ?? 0,
      ascendingNodeDeg:
        orbitModel === 'realistic' ? (satellite.longitudeOfAscendingNodeDeg ?? 0) : 0,
      argumentOfPeriapsisDeg: satellite.argumentOfPeriapsisDeg ?? 0,
      meanAnomaly0Deg:
        orbitModel === 'realistic'
          ? (satellite.meanAnomalyJ2000Deg ?? phase * (180 / Math.PI))
          : phase * (180 / Math.PI),
      periodDays,
    }),
    [satellite, parentRadius, parentOrbitRadius, periodDays, phase, orbitModel],
  )

  const orbitGeometry = useMemo(() => {
    const samples = satelliteOrbitPath(orbit, quality === 'low' ? 64 : 128)
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(samples, 3))
    geometry.computeBoundingSphere()
    return geometry
  }, [orbit, quality])

  const orbitLine = useMemo(() => {
    const material = new LineBasicMaterial({
      color: colorOverride ?? satellite.color,
      transparent: true,
      opacity: 0.22,
      depthWrite: false,
    })
    const object = new Line(orbitGeometry, material)
    object.frustumCulled = false
    return object
  }, [orbitGeometry, colorOverride, satellite.color])

  useEffect(
    () => () => {
      orbitGeometry.dispose()
      ;(orbitLine.material as LineBasicMaterial).dispose()
    },
    [orbitGeometry, orbitLine],
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

  useFrame((state) => {
    const group = orbitRef.current
    if (!group) return
    const position = satellitePosition(orbit, clock.daysSinceJ2000)
    group.position.set(position.x, position.y, position.z)
    // Tidally locked, like every large moon in the real Solar System: the same
    // face always turns toward the planet at the origin of this group.
    const mesh = meshRef.current
    if (mesh) {
      mesh.rotation.y = -Math.atan2(-position.z, position.x)
      // Keep the sphere's tessellation matched to how large the moon is on
      // screen, so a moon zoomed in until it fills the view stays round.
      mesh.getWorldPosition(worldPos.current)
      const cameraDistance = state.camera.position.distanceTo(worldPos.current)
      const apparentSize = (visualRadius * 2) / Math.max(cameraDistance, 0.001)
      const wantedTier = sphereTierForApparentSize(apparentSize, maxSphereTier, sphereTierRef.current)
      if (wantedTier !== sphereTierRef.current) {
        sphereTierRef.current = wantedTier
        setSphereTier(wantedTier)
      }
    }
  })

  const geometry = SPHERE_LODS[sphereTier]

  return (
    <group>
      {showOrbits ? <primitive object={orbitLine} /> : null}
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
              showToast(
                t('toast.satellite', {
                  name: nameOverride ?? content.satellites.find((entry) => entry.id === satellite.id)?.name ?? satellite.name,
                  note: content.satellites.find((entry) => entry.id === satellite.id)?.note ?? satellite.note,
                }),
                'fun',
              )
            }
          }}
        />
      </group>
    </group>
  )
}
