import { useEffect, useRef, type ComponentRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import * as THREE from 'three'
import { useSimulationStore, type FocusTarget } from '../../store/simulationStore'
import { usePlanetFocus } from '../../hooks/usePlanetFocus'
import { getBody } from '../../utils/bodyRegistry'
import { getPlanet } from '../../data/planets'
import { planetSceneRadius, sunSceneRadius, moonSceneRadius, type ScaleMode, type CustomScaleSettings } from '../../utils/scale'
import { TOUR_STEPS } from '../../data/tour'

type OrbitControlsRef = ComponentRef<typeof OrbitControls>

const DEFAULT_VIEW_DISTANCE = 130
const ZERO = new THREE.Vector3(0, 0, 0)

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

interface FlightState {
  active: boolean
  fromPos: THREE.Vector3
  fromTarget: THREE.Vector3
  startTime: number
  duration: number
}

function createFlightState(): FlightState {
  return { active: false, fromPos: new THREE.Vector3(), fromTarget: new THREE.Vector3(), startTime: 0, duration: 1.4 }
}

function viewDistanceFor(targetId: Exclude<FocusTarget, null>, scaleMode: ScaleMode, customScale: CustomScaleSettings): number {
  if (targetId === 'sun') return sunSceneRadius(scaleMode, customScale) * 4.2
  if (targetId === 'moon') {
    const earthRadius = planetSceneRadius(getPlanet('earth'), scaleMode, customScale)
    return moonSceneRadius(earthRadius) * 6 + 2
  }
  const radius = planetSceneRadius(getPlanet(targetId), scaleMode, customScale)
  return Math.max(radius * 4.5, radius + 4)
}

/**
 * Owns all camera behavior: free orbit/zoom/pan in explore mode, smooth
 * "homing" flights when a body is selected (self-correcting toward the live,
 * still-orbiting target), a chase camera in Spacecraft Mode, and a scripted
 * cinematic tour. OrbitControls stays mounted throughout; it is simply
 * disabled while the tour or spacecraft chase-cam are driving the camera.
 */
export function CameraController() {
  const { camera } = useThree()
  const controlsRef = useRef<OrbitControlsRef>(null)
  const { selectedId, focusRadius, getFocusObject } = usePlanetFocus()

  const scaleMode = useSimulationStore((s) => s.scaleMode)
  const customScale = useSimulationStore((s) => s.customScale)
  const cameraMode = useSimulationStore((s) => s.cameraMode)
  const reducedMotion = useSimulationStore((s) => s.reducedMotion)
  const isSpacecraftMode = useSimulationStore((s) => s.isSpacecraftMode)
  const isTourActive = useSimulationStore((s) => s.isTourActive)

  const flight = useRef(createFlightState())
  const lastTargetPos = useRef(new THREE.Vector3())
  const offsetDir = useRef(new THREE.Vector3(0.55, 0.35, 0.85).normalize())
  const prevSelectedId = useRef<FocusTarget>(null)
  const prevCameraMode = useRef(cameraMode)

  const tourFlight = useRef(createFlightState())
  const tourElapsed = useRef(0)
  const prevTourStep = useRef(-1)

  // Start a new homing flight whenever the explore-mode selection changes.
  useEffect(() => {
    if (isSpacecraftMode || isTourActive) return
    const changed = prevSelectedId.current !== selectedId || prevCameraMode.current !== cameraMode
    prevSelectedId.current = selectedId
    prevCameraMode.current = cameraMode
    if (!changed) return

    const controls = controlsRef.current
    if (!controls) return

    const currentDir = camera.position.clone().sub(controls.target)
    if (currentDir.lengthSq() > 0.0001) offsetDir.current.copy(currentDir.normalize())

    flight.current.fromPos.copy(camera.position)
    flight.current.fromTarget.copy(controls.target)
    flight.current.startTime = performance.now()
    flight.current.duration = reducedMotion ? 0.35 : 1.5
    flight.current.active = true
  }, [selectedId, cameraMode, isSpacecraftMode, isTourActive, camera, reducedMotion])

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (!controls) return

    if (isSpacecraftMode) {
      controls.enabled = false
      const ship = getBody('spacecraft')
      if (ship) {
        const shipPos = new THREE.Vector3()
        ship.getWorldPosition(shipPos)
        const shipQuat = new THREE.Quaternion()
        ship.getWorldQuaternion(shipQuat)
        const behind = new THREE.Vector3(0, 1.1, 3.4).applyQuaternion(shipQuat)
        const desiredCamPos = shipPos.clone().add(behind)
        const lerpFactor = reducedMotion ? 1 : 1 - Math.pow(0.001, delta)
        camera.position.lerp(desiredCamPos, lerpFactor)
        controls.target.lerp(shipPos, lerpFactor)
      }
      controls.update()
      return
    }

    if (isTourActive) {
      controls.enabled = false
      const store = useSimulationStore.getState()
      const step = TOUR_STEPS[store.tourStepIndex]
      if (!step) return

      if (prevTourStep.current !== store.tourStepIndex) {
        prevTourStep.current = store.tourStepIndex
        tourElapsed.current = 0
        tourFlight.current.fromPos.copy(camera.position)
        tourFlight.current.fromTarget.copy(controls.target)
        tourFlight.current.startTime = performance.now()
        tourFlight.current.duration = reducedMotion ? 0.5 : 2.4
        tourFlight.current.active = true
      }

      const desiredTarget = new THREE.Vector3()
      let desiredDistance = DEFAULT_VIEW_DISTANCE
      if (step.targetId) {
        const focusObject = getBody(step.targetId)
        if (focusObject) {
          focusObject.getWorldPosition(desiredTarget)
          desiredDistance = viewDistanceFor(step.targetId, scaleMode, customScale)
        }
      }

      const slowSpin = performance.now() * 0.00006
      const dir = new THREE.Vector3(Math.cos(slowSpin) * 0.85, 0.3, Math.sin(slowSpin) * 0.85).normalize()
      const desiredPos = desiredTarget.clone().addScaledVector(dir, desiredDistance)

      if (tourFlight.current.active) {
        const elapsed = (performance.now() - tourFlight.current.startTime) / 1000
        const t = Math.min(elapsed / tourFlight.current.duration, 1)
        const eased = easeInOutCubic(t)
        camera.position.lerpVectors(tourFlight.current.fromPos, desiredPos, eased)
        controls.target.lerpVectors(tourFlight.current.fromTarget, desiredTarget, eased)
        if (t >= 1) tourFlight.current.active = false
      } else {
        camera.position.copy(desiredPos)
        controls.target.copy(desiredTarget)
      }
      controls.update()

      if (!store.isTourPaused) {
        tourElapsed.current += delta
        if (tourElapsed.current > step.duration) {
          const next = store.tourStepIndex + 1
          if (next >= TOUR_STEPS.length) store.exitTour()
          else store.setTourStepIndex(next)
        }
      }
      return
    }

    controls.enabled = true

    const desiredTarget = selectedId ? new THREE.Vector3() : ZERO.clone()
    let desiredDistance = DEFAULT_VIEW_DISTANCE

    if (selectedId) {
      const focusObject = getFocusObject()
      if (focusObject) {
        focusObject.getWorldPosition(desiredTarget)
        desiredDistance = Math.max(focusRadius * 4.2, focusRadius + 3.5)
      }
    }

    if (flight.current.active) {
      const elapsed = (performance.now() - flight.current.startTime) / 1000
      const t = Math.min(elapsed / flight.current.duration, 1)
      const eased = easeInOutCubic(t)
      const desiredPos = desiredTarget.clone().addScaledVector(offsetDir.current, desiredDistance)
      camera.position.lerpVectors(flight.current.fromPos, desiredPos, eased)
      controls.target.lerpVectors(flight.current.fromTarget, desiredTarget, eased)
      if (t >= 1) {
        flight.current.active = false
        lastTargetPos.current.copy(desiredTarget)
      }
    } else {
      const deltaMove = desiredTarget.clone().sub(lastTargetPos.current)
      if (deltaMove.lengthSq() > 0) {
        camera.position.add(deltaMove)
        controls.target.add(deltaMove)
      }
      lastTargetPos.current.copy(desiredTarget)
    }

    controls.update()
  })

  return (
    <OrbitControls
      ref={controlsRef}
      camera={camera}
      enableDamping
      dampingFactor={0.08}
      minDistance={1.2}
      maxDistance={2400}
      rotateSpeed={0.5}
      zoomSpeed={0.85}
      panSpeed={0.6}
      makeDefault
    />
  )
}
