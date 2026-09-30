import { useEffect, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import * as THREE from 'three'
import { useSimStore } from '../../store/simulationStore'
import { BODY_BY_ID } from '../../data/planets'
import { TOUR_STAGES } from '../../data/tour'
import { useScale } from '../../hooks/useScale'
import type { ScaleConfig } from '../../utils/scale'
import { getBodyPosition } from '../../utils/simClock'
import { HOME_CAMERA, homeDistanceScale } from '../../utils/scale'

const ORIGIN = new THREE.Vector3(0, 0, 0)
const UP = new THREE.Vector3(0, 1, 0)
const _endPos = new THREE.Vector3()
const _endTarget = new THREE.Vector3()
const _prevTarget = new THREE.Vector3()
const _offset = new THREE.Vector3()
const _velocity = new THREE.Vector3()
const _desired = new THREE.Vector3()

const clamp01 = (v: number) => (v < 0 ? 0 : v > 1 ? 1 : v)
const smootherstep = (t: number) => t * t * t * (t * (t * 6 - 15) + 10)

/** Visual radius of a body under the current scale mode. */
function bodyRadius(id: string, scale: ScaleConfig): number {
  if (id === 'sun') return scale.sunRadius
  const body = BODY_BY_ID[id]
  if (!body) return 2
  if (id === 'earth' && useSimStore.getState().whatIf.earthAsJupiter) {
    return scale.planetRadius(139_820)
  }
  if (id === 'moon') return scale.planetRadius(3_475)
  return Math.max(0.16, scale.planetRadius(body.diameterKm))
}

interface FlightState {
  active: boolean
  t: number
  duration: number
  fromPos: THREE.Vector3
  fromTarget: THREE.Vector3
  offsetDir: THREE.Vector3
  dist: number
}

/**
 * Single owner of the camera: manual flights, planet focus/follow,
 * the cinematic tour, and interaction capture for OrbitControls.
 * Mounted last inside the scene so it reads body positions written this frame.
 */
export function CameraRig() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const scale = useScale()

  /** Keeps the whole system in frame on narrow / portrait viewports. */
  const homeScale = homeDistanceScale(size.width / Math.max(1, size.height))

  const cameraMode = useSimStore((s) => s.cameraMode)
  const cameraTargetId = useSimStore((s) => s.cameraTargetId)
  const homeRequest = useSimStore((s) => s.homeRequest)
  const reducedMotion = useSimStore((s) => s.reducedMotion)

  const flight = useRef<FlightState>({
    active: false,
    t: 0,
    duration: 1.8,
    fromPos: new THREE.Vector3(),
    fromTarget: new THREE.Vector3(),
    offsetDir: new THREE.Vector3(0, 0.35, 1),
    dist: 60,
  })
  const tourStage = useRef({ index: -1, elapsed: 0, fromPos: new THREE.Vector3(), fromTarget: new THREE.Vector3() })
  const interacting = useRef(false)
  const previousTarget = useRef(new THREE.Vector3())

  // --- Begin a smooth flight whenever the camera mode/target changes -------
  const modeKey = `${cameraMode}|${cameraTargetId ?? ''}|${homeRequest}`
  useEffect(() => {
    const controls = controlsRef.current
    const f = flight.current
    if (cameraMode === 'tour' || cameraMode === 'spacecraft') {
      f.active = false
      return
    }
    f.active = true
    f.t = 0
    f.duration = reducedMotion ? 0.35 : 1.8
    f.fromPos.copy(camera.position)
    f.fromTarget.copy(controls ? controls.target : ORIGIN)

    if (cameraMode === 'focus' || cameraMode === 'follow') {
      const id = cameraTargetId ?? 'sun'
      const targetPos = getBodyPosition(id)
      const radius = bodyRadius(id, scale)
      const dir = f.fromPos.clone().sub(targetPos)
      if (dir.lengthSq() < 1e-6) dir.set(0, 0.4, 1)
      f.offsetDir.copy(dir.normalize())
      f.dist = Math.max(radius * (cameraMode === 'follow' ? 6.5 : 7.5), radius + 2.5)
    }
  }, [modeKey, cameraMode, cameraTargetId, reducedMotion, scale, camera])

  // --- Cinematic tour -------------------------------------------------------
  const runTourStage = (dt: number, controls: OrbitControlsImpl): boolean => {
    const state = useSimStore.getState()
    const st = tourStage.current

    if (st.index !== state.tour.stageIndex) {
      st.index = state.tour.stageIndex
      st.elapsed = 0
      st.fromPos.copy(camera.position)
      st.fromTarget.copy(controls.target)
    }

    if (st.index >= TOUR_STAGES.length) {
      state.stopTour()
      state.viewSystem()
      return false
    }

    const stage = TOUR_STAGES[st.index]
    const radius = bodyRadius(stage.id, scale)
    const isSystem = stage.id === 'system'
    const bodyPos = isSystem ? ORIGIN : getBodyPosition(stage.id)

    const distance = isSystem ? 300 * homeScale : Math.max(radius * stage.distanceFactor, radius + 2.2)
    const horizontal = Math.cos(stage.elevation) * distance
    _endPos.set(
      bodyPos.x + Math.cos(stage.azimuth) * horizontal,
      bodyPos.y + Math.sin(stage.elevation) * distance,
      bodyPos.z + Math.sin(stage.azimuth) * horizontal,
    )
    _endTarget.copy(bodyPos)

    if (!state.tour.paused) st.elapsed += dt

    const flyDuration = reducedMotion ? 0.4 : Math.max(stage.duration * 0.5, 1.4)
    const progress = clamp01(st.elapsed / flyDuration)

    if (progress < 1) {
      const eased = smootherstep(progress)
      camera.position.lerpVectors(st.fromPos, _endPos, eased)
      controls.target.lerpVectors(st.fromTarget, _endTarget, eased)
    } else {
      // Glide with the body, then slowly orbit for a cinematic hold
      _prevTarget.copy(controls.target)
      controls.target.lerp(_endTarget, 1 - Math.exp(-3.5 * dt))
      _offset.copy(controls.target).sub(_prevTarget)
      camera.position.add(_offset)

      if (!state.tour.paused && !reducedMotion) {
        _offset.copy(camera.position).sub(controls.target).applyAxisAngle(UP, dt * 0.07)
        camera.position.copy(controls.target).add(_offset)
      }
    }

    if (st.elapsed >= stage.duration) {
      if (st.index >= TOUR_STAGES.length - 1) {
        state.stopTour()
        state.viewSystem()
        return false
      }
      state.setTourStage(st.index + 1)
    }
    return true
  }

  // --- Per-frame camera update ----------------------------------------------
  useFrame((_, delta) => {
    const dt = Math.min(delta, 0.1)
    const controls = controlsRef.current
    if (!controls) return

    const state = useSimStore.getState()

    if (state.cameraMode === 'tour') {
      runTourStage(dt, controls)
      return
    }
    if (state.cameraMode === 'spacecraft') {
      // The spacecraft drives the camera while flying
      return
    }

    const targetId = state.cameraTargetId ?? 'sun'
    const isSystem = state.cameraMode === 'system' || !state.cameraTargetId
    const targetPos = isSystem ? ORIGIN : getBodyPosition(targetId)
    const radius = isSystem ? 0 : bodyRadius(targetId, scale)

    if (isSystem) {
      _endTarget.set(0, 0, 0)
      _endPos.set(
        HOME_CAMERA.position[0] * homeScale,
        HOME_CAMERA.position[1] * homeScale,
        HOME_CAMERA.position[2] * homeScale,
      )
    } else {
      _endTarget.copy(targetPos)
      if (state.cameraMode === 'follow') {
        // Trail behind the planet's direction of travel
        _velocity.copy(targetPos).sub(previousTarget.current)
        if (_velocity.lengthSq() > 1e-8) {
          flight.current.offsetDir
            .copy(_velocity)
            .normalize()
            .multiplyScalar(-0.85)
            .addScaledVector(UP, 0.42)
            .normalize()
        }
        flight.current.dist = Math.max(radius * 6.5, radius + 2.5)
      }
      _endPos.copy(targetPos).addScaledVector(flight.current.offsetDir, flight.current.dist)
    }
    previousTarget.current.copy(targetPos)

    const f = flight.current
    if (f.active) {
      f.t += dt / f.duration
      const eased = smootherstep(clamp01(f.t))
      camera.position.lerpVectors(f.fromPos, _endPos, eased)
      controls.target.lerpVectors(f.fromTarget, _endTarget, eased)
      if (f.t >= 1) f.active = false
      return
    }

    // After arrival: keep the target glued to the body (OrbitControls then
    // preserves the camera's offset automatically as the body moves).
    controls.target.lerp(_endTarget, 1 - Math.exp(-4 * dt))

    if (state.cameraMode === 'follow' && !interacting.current) {
      _desired.copy(targetPos).addScaledVector(flight.current.offsetDir, flight.current.dist)
      camera.position.lerp(_desired, 1 - Math.exp(-3 * dt))
    }
  })

  const enabled = cameraMode !== 'tour' && cameraMode !== 'spacecraft'

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enabled={enabled}
      enableDamping
      dampingFactor={0.06}
      enablePan
      panSpeed={0.7}
      zoomSpeed={0.8}
      rotateSpeed={0.65}
      minDistance={0.7}
      maxDistance={1800}
      minPolarAngle={0.06}
      maxPolarAngle={Math.PI - 0.06}
      onStart={() => {
        interacting.current = true
      }}
      onEnd={() => {
        interacting.current = false
        const controls = controlsRef.current
        if (!controls) return
        _offset.copy(camera.position).sub(controls.target)
        const distance = _offset.length()
        if (distance > 1e-3) {
          flight.current.offsetDir.copy(_offset).normalize()
          flight.current.dist = distance
        }
      }}
    />
  )
}
