import { useEffect, useMemo, useRef } from 'react'
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
} from 'three'
import type { CelestialBody } from '../../types'
import { orbitSamples } from '../../utils/astronomy'
import { scaleDistanceKm } from '../../utils/scale'
import { useSimulationStore } from '../../store/simulationStore'
import { BODY_VISUALS } from '../../data/visuals'

/**
 * The orbit path of a planet, drawn from its real semi-major axis and
 * eccentricity: slightly stretched ellipses, with the Sun at one focus.
 *
 * When a lesson or the cinematic tour asks for it, small arrows flow along the
 * path to show the direction of travel — "gravity keeps the planets moving".
 */

const ORBIT_SAMPLES = 256
const FLOW_ARROWS = 16

function buildOrbitPositions(
  body: CelestialBody,
  scaled: (km: number) => number,
  sampleCount: number,
): Float32Array {
  const samples = orbitSamples(body, sampleCount)
  const positions = new Float32Array(sampleCount * 3)
  for (let i = 0; i < sampleCount; i += 1) {
    const kmX = samples[i * 2]
    const kmY = samples[i * 2 + 1]
    const kmDistance = Math.hypot(kmX, kmY)
    const sceneDistance = scaled(kmDistance)
    const scale = kmDistance > 0 ? sceneDistance / kmDistance : 0
    positions[i * 3] = kmX * scale
    positions[i * 3 + 1] = 0
    // Same convention as the planet positions: -sin keeps the motion mirrored
    // correctly when looking down on the ecliptic from the north.
    positions[i * 3 + 2] = -kmY * scale
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
  const accent = useMemo(() => new Color(BODY_VISUALS[body.id]?.accent ?? '#8ab4ff'), [body.id])

  // Cheap machines get fewer ellipse segments and fewer direction arrows.
  const sampleCount = quality === 'low' ? 128 : ORBIT_SAMPLES
  const arrowCount = quality === 'high' ? FLOW_ARROWS : 10

  const geometry = useMemo(() => {
    const positions = buildOrbitPositions(body, (km) => scaleDistanceKm(km, scaleMode, customScale), sampleCount)
    const buffer = new BufferGeometry()
    buffer.setAttribute('position', new Float32BufferAttribute(positions, 3))
    buffer.computeBoundingSphere()
    return buffer
  }, [body, scaleMode, customScale, sampleCount])

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

  useFrame((_, delta) => {
    // Orbits belonging to the selected planet glow a little brighter.
    const store = useSimulationStore.getState()
    const emphasised = store.selectedId === body.id || store.hoveredId === body.id
    const target = emphasised ? 0.72 : 0.22
    opacity.current += (target - opacity.current) * Math.min(1, delta * 5)
    const lineMaterial = line.material as LineBasicMaterial
    lineMaterial.opacity = opacity.current

    const arrows = arrowsRef.current
    if (!arrows) return
    arrows.visible = showFlow
    if (!showFlow) return

    const positions = geometry.getAttribute('position') as Float32BufferAttribute
    const count = positions.count
    const step = Math.max(1, Math.floor(count / arrowCount))
    const time = performance.now() * 0.00006
    const dummy = new Object3D()
    for (let i = 0; i < arrowCount; i += 1) {
      const index = (i * step + Math.floor(time * count)) % count
      const next = (index + 2) % count
      const x = positions.getX(index)
      const z = positions.getZ(index)
      const nx = positions.getX(next)
      const nz = positions.getZ(next)
      dummy.position.set(x, 0, z)
      dummy.lookAt(nx, 0, nz)
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