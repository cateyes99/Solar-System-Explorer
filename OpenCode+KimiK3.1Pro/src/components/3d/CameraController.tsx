import { useRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { BODY_DATA, PLANETS } from '../../data/planets'
import { TOUR_STOPS } from '../../data/tour'
import { useSimulationStore } from '../../store/simulationStore'
import { getBodyPosition } from '../../utils/bodyRegistry'
import { getBodyRadius, getOrbitRadius } from '../../utils/scale'

const targetPosition = new Vector3()
const desiredPosition = new Vector3()
const bodyDelta = new Vector3()
const offset = new Vector3()

export function CameraController() {
  const controls = useRef<OrbitControlsImpl>(null)
  const lastRequest = useRef(-1)
  const previousBodyPosition = useRef<Vector3 | null>(null)
  const transitionOffset = useRef(new Vector3(10, 6, 14))
  const transitioning = useRef(true)
  const userInteracting = useRef(false)
  const { camera } = useThree()
  const selectedBody = useSimulationStore((state) => state.selectedBody)
  const cameraMode = useSimulationStore((state) => state.cameraMode)
  const cameraRequest = useSimulationStore((state) => state.cameraRequest)
  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const customSize = useSimulationStore((state) => state.customSize)
  const customDistance = useSimulationStore((state) => state.customDistance)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  const tourActive = useSimulationStore((state) => state.tourActive)
  const tourStep = useSimulationStore((state) => state.tourStep)
  const setTourPaused = useSimulationStore((state) => state.setTourPaused)

  const tourBody = tourActive ? TOUR_STOPS[tourStep]?.body : undefined
  const focusedBody = cameraMode === 'spacecraft'
    ? 'spacecraft'
    : tourActive
      ? tourBody
      : cameraMode === 'system' ? null : selectedBody

  useFrame(({ clock }, delta) => {
    const control = controls.current
    if (!control) return
    const requestChanged = lastRequest.current !== cameraRequest
    if (requestChanged) {
      lastRequest.current = cameraRequest
      transitioning.current = true
      previousBodyPosition.current = null
    }

    const outerOrbit = Math.max(...PLANETS.map((planet) => getOrbitRadius(planet, scaleMode, customDistance)))
    const systemPosition = new Vector3(0, outerOrbit * 1.07, outerOrbit * 1.62)
    let hasTarget = false

    if (focusedBody) {
      const position = getBodyPosition(focusedBody, targetPosition)
      if (position) {
        hasTarget = true
        const data = focusedBody === 'spacecraft' ? null : BODY_DATA[focusedBody]
        const radius = data ? getBodyRadius(data, scaleMode, customSize) : 0.5
        if (focusedBody === 'earth' && useSimulationStore.getState().whatIf === 'giant-earth') {
          // The destination offset remains generous enough for the hypothetical larger Earth.
          transitionOffset.current.setScalar(Math.max(7, radius * 2.2))
        }
        const ringFactor = focusedBody === 'saturn' ? 1.5 : 1
        const distance = focusedBody === 'spacecraft'
          ? 11
          : Math.max(focusedBody === 'moon' ? 2.2 : 4, radius * 5.2 * ringFactor)

        if (requestChanged) {
          const angle = tourActive ? tourStep * 0.83 + 0.5 : 0.55
          transitionOffset.current.set(
            Math.cos(angle) * distance * 0.72,
            distance * (focusedBody === 'saturn' ? 0.34 : 0.42),
            Math.sin(angle) * distance * 0.72 + distance * 0.65,
          )
        }

        if (previousBodyPosition.current) {
          bodyDelta.copy(position).sub(previousBodyPosition.current)
          if (!transitioning.current && !userInteracting.current) camera.position.add(bodyDelta)
        } else {
          bodyDelta.set(0, 0, 0)
        }
        previousBodyPosition.current = position.clone()

        if (transitioning.current) {
          desiredPosition.copy(position).add(transitionOffset.current)
        } else {
          offset.copy(camera.position).sub(control.target)
          desiredPosition.copy(position).add(offset)
        }
      }
    }

    if (!hasTarget) {
      targetPosition.set(0, 0, 0)
      desiredPosition.copy(systemPosition)
      previousBodyPosition.current = null
      if (!focusedBody && !transitioning.current && !requestChanged) {
        control.update()
        return
      }
    }

    if (userInteracting.current && !tourActive) {
      transitioning.current = false
      control.update()
      return
    }

    const damping = reducedMotion ? 9 : tourActive ? 1.25 : 2.25
    const amount = 1 - Math.exp(-delta * damping)
    if (transitioning.current || hasTarget || tourActive) {
      camera.position.lerp(desiredPosition, amount)
      control.target.lerp(targetPosition, amount * 1.15)
    }

    if (tourActive && focusedBody && !transitioning.current && !reducedMotion) {
      const drift = Math.sin(clock.elapsedTime * 0.12) * delta * 0.08
      camera.position.sub(targetPosition).applyAxisAngle(new Vector3(0, 1, 0), drift).add(targetPosition)
    }

    control.autoRotate = cameraMode === 'follow' && !tourActive && !reducedMotion && !transitioning.current
    control.autoRotateSpeed = 0.32
    control.update()

    if (transitioning.current
      && camera.position.distanceTo(desiredPosition) < Math.max(0.035, transitionOffset.current.length() * 0.008)
      && control.target.distanceTo(targetPosition) < 0.04) {
      transitioning.current = false
    }
  })

  return (
    <OrbitControls
      ref={controls}
      makeDefault
      enableDamping
      dampingFactor={0.065}
      rotateSpeed={0.55}
      zoomSpeed={0.8}
      panSpeed={0.65}
      minDistance={0.8}
      maxDistance={280}
      maxPolarAngle={Math.PI * 0.94}
      onStart={() => {
        userInteracting.current = true
        transitioning.current = false
        if (tourActive) setTourPaused(true)
      }}
      onEnd={() => { userInteracting.current = false }}
    />
  )
}
