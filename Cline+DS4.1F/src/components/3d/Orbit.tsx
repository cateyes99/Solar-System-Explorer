import { useEffect, useMemo, useRef, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  BufferGeometry,
  Color,
  ConeGeometry,
  Float32BufferAttribute,
  InstancedMesh,
  Line,
  LineBasicMaterial,
  MeshBasicMaterial,
  Object3D,
  Vector3,
} from 'three'
import type { CelestialBody, CustomScale, ScaleMode } from '../../types'
import { orbitPathKm } from '../../utils/astronomy'
import { bodyRadius, sceneFromEclipticKm } from '../../utils/scale'
import { clock } from '../../utils/simulationClock'
import { useSimulationStore } from '../../store/simulationStore'
import { getBodyWorldPosition } from '../../utils/bodyRegistry'
import { smoothstep } from '../../utils/random'
import { BODY_VISUALS } from '../../data/visuals'
import { WIDE_VIEW_FADE_IN_RADII, WIDE_VIEW_FADE_OUT_RADII } from './constants'

/**
 * The orbit path of a planet, drawn from its real orbital elements: the true
 * (slightly stretched) ellipse, lifted off the ecliptic by the body's measured
 * inclination and node, so Mercury and Pluto weave above and below the rest and
 * Halley's Comet rounds the Sun the wrong way.
 *
 * The path is drawn for the simulated date, so the secular drift of the elements
 * is reflected in the ellipse on screen. Rebuilding it every frame would be
 * wasteful for a change that is invisible over a human lifetime, so it is only
 * rebuilt when the simulated date crosses into a new century.
 *
 * When a lesson or the cinematic tour asks for it, small arrows flow along the
 * path to show the direction of travel — "gravity keeps the planets moving".
 */

const ORBIT_SAMPLES = 256
const FLOW_ARROWS = 16
const DAYS_PER_CENTURY = 36_525

function buildOrbitPositions(
  body: CelestialBody,
  mode: ScaleMode,
  custom: CustomScale,
  sampleCount: number,
  days: number,
): Float32Array {
  const samples = orbitPathKm(body, sampleCount, days)
  const positions = new Float32Array(sampleCount * 3)
  for (let i = 0; i < sampleCount; i += 1) {
    const point = sceneFromEclipticKm(
      samples[i * 3],
      samples[i * 3 + 1],
      samples[i * 3 + 2],
      mode,
      custom,
    )
    positions[i * 3] = point.x
    positions[i * 3 + 1] = point.y
    positions[i * 3 + 2] = point.z
  }
  return positions
}

interface OrbitProps {
  body: CelestialBody
  showFlow: boolean
  quality: 'low' | 'medium' | 'high'
}

export function Orbit({ body, showFlow, quality }: OrbitProps) {
  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const customScale = useSimulationStore((state) => state.customScale)
  const arrowsRef = useRef<InstancedMesh>(null)
  const opacity = useRef(0.24)
  /** Scratch for this body's position, so the fade allocates nothing per frame. */
  const ownPosition = useRef(new Vector3())
  const accent = useMemo(() => new Color(BODY_VISUALS[body.id]?.accent ?? '#8ab4ff'), [body.id])
  /** Visual radius in scene units: the approach fade is measured in planet radii. */
  const radius = useMemo(() => bodyRadius(body, scaleMode, customScale), [body, scaleMode, customScale])

  // The century the path is currently drawn for. It only changes when the
  // simulated date crosses a century boundary, which is when the secular drift
  // of the elements becomes worth redrawing.
  const centuryRef = useRef(Math.floor(clock.daysSinceJ2000 / DAYS_PER_CENTURY))
  const [epochCentury, setEpochCentury] = useState(centuryRef.current)

  // Cheap machines get fewer ellipse segments and fewer direction arrows.
  const sampleCount = quality === 'low' ? 128 : ORBIT_SAMPLES
  const arrowCount = quality === 'high' ? FLOW_ARROWS : 10

  const geometry = useMemo(() => {
    const positions = buildOrbitPositions(body, scaleMode, customScale, sampleCount, epochCentury * DAYS_PER_CENTURY)
    const buffer = new BufferGeometry()
    buffer.setAttribute('position', new Float32BufferAttribute(positions, 3))
    buffer.computeBoundingSphere()
    return buffer
  }, [body, scaleMode, customScale, sampleCount, epochCentury])

  const line = useMemo(() => {
    const material = new LineBasicMaterial({
      color: accent,
      transparent: true,
      opacity: opacity.current,
      depthWrite: false,
    })
    const object = new Line(geometry, material)
    object.frustumCulled = false
    return object
  }, [geometry, accent])

  useEffect(
    () => () => {
      geometry.dispose()
      line.material.dispose()
    },
    [geometry, line],
  )

  const arrowGeometry = useMemo(() => new ConeGeometry(1, 2.4, 6), [])
  const arrowMaterial = useMemo(
    () => new MeshBasicMaterial({ color: accent, transparent: true, opacity: 0.75, depthWrite: false }),
    [accent],
  )

  useEffect(() => () => arrowGeometry.dispose(), [arrowGeometry])

  useFrame((state, delta) => {
    // Redraw the path only when the simulated date has crossed into a new
    // century: the secular drift is far too slow to see frame to frame.
    const century = Math.floor(clock.daysSinceJ2000 / DAYS_PER_CENTURY)
    if (century !== centuryRef.current) {
      centuryRef.current = century
      setEpochCentury(century)
    }

    // Orbits belonging to the selected planet glow a little brighter.
    const store = useSimulationStore.getState()
    const emphasised = store.selectedId === body.id || store.hoveredId === body.id
    // A path is a distance cue as well: this body's own ellipse passes exactly
    // through the body, so near it the line runs between the camera and the
    // planet and would draw itself straight across the disc. It fades out on
    // approach, along with the arrows that ride on it.
    const planet = getBodyWorldPosition(body.id, ownPosition.current)
    const radiiAway = planet
      ? state.camera.position.distanceTo(planet) / Math.max(radius, 0.001)
      : Number.POSITIVE_INFINITY
    const approach = smoothstep(WIDE_VIEW_FADE_OUT_RADII, WIDE_VIEW_FADE_IN_RADII, radiiAway)
    const target = (emphasised ? 0.72 : 0.22) * approach
    opacity.current += (target - opacity.current) * Math.min(1, delta * 5)
    const lineMaterial = line.material as LineBasicMaterial
    lineMaterial.opacity = opacity.current

    arrowMaterial.opacity = 0.75 * approach

    const arrows = arrowsRef.current
    if (!arrows) return
    arrows.visible = showFlow && approach > 0.02
    if (!arrows.visible) return

    const positions = geometry.getAttribute('position') as Float32BufferAttribute
    const count = positions.count
    const step = Math.max(1, Math.floor(count / arrowCount))
    const time = performance.now() * 0.00006
    const dummy = new Object3D()
    for (let i = 0; i < arrowCount; i += 1) {
      const index = (i * step + Math.floor(time * count)) % count
      const next = (index + 2) % count
      const x = positions.getX(index)
      const y = positions.getY(index)
      const z = positions.getZ(index)
      const nx = positions.getX(next)
      const ny = positions.getY(next)
      const nz = positions.getZ(next)
      dummy.position.set(x, y, z)
      dummy.lookAt(nx, ny, nz)
      // The cone points along +Y by default, so tip it onto the direction of travel.
      dummy.rotateX(Math.PI / 2)
      dummy.scale.setScalar(0.16)
      dummy.updateMatrix()
      arrows.setMatrixAt(i, dummy.matrix)
    }
    arrows.instanceMatrix.needsUpdate = true
  })

  return (
    <group>
      <primitive object={line} />
      {showFlow ? (
        <instancedMesh
          ref={arrowsRef}
          args={[arrowGeometry, arrowMaterial, arrowCount]}
          visible={false}
          frustumCulled={false}
        />
      ) : null}
    </group>
  )
}