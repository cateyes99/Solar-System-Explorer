import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { PLANETS } from '../../data/planets'
import { buildScale, orbitalPosition, SUN_RADIUS } from '../../utils/scale'
import { simClock } from '../../utils/clock'
import { useSimulationStore, TOUR_STAGES } from '../../store/simulationStore'

const SYSTEM_VIEW_POS = new THREE.Vector3(0, 90, 170)
const tmpVec = new THREE.Vector3()
const tmpTarget = new THREE.Vector3()

/**
 * Handles smooth cinematic camera moves:
 * - focus on selected planet
 * - follow mode
 * - guided cinematic tour
 * - return to full-system view
 */
export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const { camera } = useThree()

  const selectedId = useSimulationStore((s) => s.selectedPlanetId)
  const cameraMode = useSimulationStore((s) => s.cameraMode)
  const scaleMode = useSimulationStore((s) => s.scaleMode)
  const customSize = useSimulationStore((s) => s.customSize)
  const customDistance = useSimulationStore((s) => s.customDistance)
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)
  const tourActive = useSimulationStore((s) => s.tourActive)
  const tourIndex = useSimulationStore((s) => s.tourIndex)
  const tourPaused = useSimulationStore((s) => s.tourPaused)
  const setTourIndex = useSimulationStore((s) => s.setTourIndex)
  const stopTour = useSimulationStore((s) => s.stopTour)

  const scaled = useMemo(
    () => buildScale(PLANETS, scaleMode, customSize, customDistance),
    [scaleMode, customSize, customDistance],
  )

  const tourClock = useRef({ t: 0, started: false })
  const desiredPos = useRef(SYSTEM_VIEW_POS.clone())
  const desiredTarget = useRef(new THREE.Vector3(0, 0, 0))

  const planetPos = (id: string): THREE.Vector3 => {
    const body = scaled.find((b) => b.planet.id === id)
    if (!body) return tmpVec.set(0, 0, 0)
    const [x, y, z] = orbitalPosition(body.orbitRadius, body.planet.orbitalPeriodDays, simClock.days)
    return tmpVec.set(x, y, z)
  }

  const planetRadius = (id: string): number => {
    const body = scaled.find((b) => b.planet.id === id)
    return body ? body.radius : 2
  }

  // Recompute desired camera goal whenever selection/tour changes
  useEffect(() => {
    tourClock.current = { t: 0, started: false }
  }, [selectedId, cameraMode, tourIndex, tourActive])

  useFrame((_, rawDelta) => {
    const controls = controlsRef.current
    if (!controls) return
    const delta = Math.min(rawDelta, 0.1)
    const ease = reducedMotion ? 1 : 1 - Math.pow(0.001, delta) // smooth exponential approach

    if (tourActive) {
      const stage = TOUR_STAGES[tourIndex]
      if (!stage) { stopTour(); return }
      if (!tourPaused) tourClock.current.t += delta
      const { t } = tourClock.current

      if (stage.targetId === 'system') {
        desiredTarget.current.set(0, 0, 0)
        desiredPos.current.copy(SYSTEM_VIEW_POS)
      } else if (stage.targetId === 'sun') {
        desiredTarget.current.set(0, 0, 0)
        desiredPos.current.set(SUN_RADIUS * 3.2, SUN_RADIUS * 1.4, SUN_RADIUS * 3.2)
      } else {
        const p = planetPos(stage.targetId)
        desiredTarget.current.copy(p)
        const r = planetRadius(stage.targetId)
        desiredPos.current.set(p.x + r * 4.5, p.y + r * 2.2, p.z + r * 4.5)
      }

      if (t > stage.duration + stage.hold) {
        if (tourIndex + 1 >= TOUR_STAGES.length) stopTour()
        else setTourIndex(tourIndex + 1)
      }
    } else if (cameraMode === 'system' || !selectedId) {
      desiredTarget.current.set(0, 0, 0)
      // keep user-controlled position; only drift back when just switched
      desiredPos.current.copy(camera.position)
    } else if (cameraMode === 'planet') {
      const p = planetPos(selectedId)
      desiredTarget.current.copy(p)
      // keep current distance direction but aim at planet
      desiredPos.current.copy(camera.position)
    } else if (cameraMode === 'follow') {
      const p = planetPos(selectedId)
      const r = planetRadius(selectedId)
      const offset = tmpTarget.copy(camera.position).sub(controls.target)
      if (offset.length() < 0.01) offset.set(r * 5, r * 2.5, r * 5)
      desiredTarget.current.copy(p)
      desiredPos.current.copy(p).add(offset)
    }

    // In system/planet mode, let the user drive; only lerp when a transition just began
    if (tourActive || cameraMode === 'follow') {
      camera.position.lerp(desiredPos.current, ease)
      controls.target.lerp(desiredTarget.current, ease)
    } else if (cameraMode === 'planet' && selectedId) {
      // glide toward a nice viewing distance, then hand control back
      const p = planetPos(selectedId)
      const r = planetRadius(selectedId)
      const dist = camera.position.distanceTo(p)
      if (dist > r * 8) {
        tmpTarget.copy(p).add(new THREE.Vector3(r * 4, r * 2, r * 4))
        camera.position.lerp(tmpTarget, ease * 0.6)
        controls.target.lerp(p, ease)
      } else {
        controls.target.lerp(p, ease)
      }
    }
    controls.update()
  })

  return (
    <OrbitControls
      ref={controlsRef}
      enablePan
      enableZoom
      enableRotate
      enableDamping={!reducedMotion}
      dampingFactor={0.08}
      minDistance={4}
      maxDistance={600}
      makeDefault
    />
  )
}
