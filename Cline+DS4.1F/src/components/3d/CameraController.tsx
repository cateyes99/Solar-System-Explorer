import { useEffect, useRef } from 'react'
import type { ComponentRef } from 'react'
import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { useSimulationStore } from '../../store/simulationStore'
import { getBodyWorldPosition } from '../../utils/bodyRegistry'
import { spacecraft } from '../../utils/spacecraftSim'
import { visualRadiusOf } from '../../utils/scale'
import { clamp } from '../../utils/random'
import type { FocusTargetId } from '../../types'

/**
 * The camera.
 *
 * A standard, comfortable orbit camera (rotate, zoom, pan) that can also be
 * taken for a ride: selecting a planet flies the camera there with cinematic
 * easing, and "follow" mode keeps the chosen body centred while it travels
 * around the Sun. Following moves the camera and its look-at point together, so
 * the body stays pinned to the same spot on screen however fast it orbits.
 * Nothing ever teleports; when the user grabs the view mid-flight the flight is
 * cancelled immediately.
 */

interface Pose {
  position: Vector3
  target: Vector3
}

/** The hero shot: the whole family, seen slightly from above and to the side. */
const SYSTEM_VIEW: Pose = {
  position: new Vector3(18, 44, 96),
  target: new Vector3(0, 0, 0),
}

function easeInOutCubic(t: number): number {
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2
}

/**
 * How fast the view drifts back to centre the followed body when it has been left
 * off-centre by a pan, or by a flight that ended while the body kept travelling.
 * Slow enough to be a glide rather than a tug, fast enough to feel automatic.
 */
const RECENTRE_RATE = 2.5

/**
 * Where the chase camera sits relative to the ship, in the ship's own frame: a
 * little above and behind the nose (its local +Z). Normalised when used.
 */
const CHASE_LOCAL_OFFSET = new Vector3(0, 0.34, -0.94)

/**
 * How quickly the chase camera eases round behind the nose. Slow enough that a
 * turn swings the view rather than whipping it, fast enough to keep up.
 */
const CHASE_RATE = 4.5

/**
 * Where auto framing flies the camera to when the chase camera engages: a close
 * view that frames the whole ship (the same distance the focus flight uses).
 */
const CHASE_FRAMING_DISTANCE = 5

export function CameraController() {
  const controlsRef = useRef<ComponentRef<typeof OrbitControls>>(null)
  const tween = useRef<{
    from: Pose
    to: Pose
    /** Set when the flight is aimed at a body: it keeps chasing it. */
    followId: FocusTargetId | null
    /** The offset from that body the flight should arrive at. */
    offset: Vector3
    elapsed: number
    duration: number
  } | null>(null)
  const lastFollow = useRef<Vector3 | null>(null)
  const tmp = useRef(new Vector3())
  const deltaVec = useRef(new Vector3())
  const chaseOffset = useRef(new Vector3())
  const chaseDesired = useRef(new Vector3())
  const dragging = useRef(false)

  const cameraRequest = useSimulationStore((state) => state.cameraRequest)
  const cameraMode = useSimulationStore((state) => state.cameraMode)
  const followTargetId = useSimulationStore((state) => state.followTargetId)
  const chaseCamera = useSimulationStore((state) => state.chaseCamera)
  const chaseAutoFrame = useSimulationStore((state) => state.chaseAutoFrame)
  const scaleMode = useSimulationStore((state) => state.scaleMode)
  const customScale = useSimulationStore((state) => state.customScale)
  const orbitModel = useSimulationStore((state) => state.orbitModel)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)

  const { camera } = useThree()
  const requestId = cameraRequest?.id ?? 0

  // A new camera request starts a fresh tween.
  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    let destination: Pose = { position: SYSTEM_VIEW.position.clone(), target: SYSTEM_VIEW.target.clone() }
    const offset = new Vector3()

    const targetId = cameraRequest?.targetId ?? null
    if (targetId) {
      const worldPosition = getBodyWorldPosition(targetId, tmp.current)
      if (worldPosition) {
        const radius = visualRadiusOf(targetId, scaleMode, customScale, orbitModel)
        const direction = camera.position.clone().sub(worldPosition)
        if (direction.lengthSq() < 1e-6) direction.set(0.62, 0.42, 0.72)
        direction.normalize()
        // Always keep a little height so we look down on the orbit plane.
        direction.y = Math.max(direction.y, 0.24)
        direction.normalize()
        const distanceScale = cameraRequest?.distanceScale ?? 6
        const distance = radius * distanceScale + radius * 0.9 + 0.35
        destination = {
          position: worldPosition.clone().addScaledVector(direction, distance),
          target: worldPosition.clone(),
        }
        offset.copy(destination.position).sub(worldPosition)
      }
    }

    const travel = camera.position.distanceTo(destination.position)
    const duration = reducedMotion ? 0.4 : clamp(0.75 + Math.log10(travel + 2) * 0.75, 0.9, 2.6)
    tween.current = {
      from: { position: camera.position.clone(), target: controls.target.clone() },
      to: destination,
      followId: targetId,
      offset,
      elapsed: 0,
      duration,
    }
  }, [requestId, camera, scaleMode, customScale, orbitModel, reducedMotion, cameraRequest])

  // Re-aim the follow tracker whenever the followed body changes.
  useEffect(() => {
    lastFollow.current = null
  }, [followTargetId, cameraMode])

  useFrame((_, delta) => {
    const controls = controlsRef.current
    if (!controls) return
    // A generous step cap keeps the flight smooth even if a frame is late, while
    // still preventing a huge jump after the tab has been in the background.
    const step = Math.min(delta, 0.08)

    const active = tween.current
    if (active) {
      active.elapsed += step
      // A flight aimed at a body keeps chasing it. A planet does not wait for the
      // camera: arriving at where it stood when the flight began would park the
      // view at a random distance — far too far, or even inside the planet — and
      // that is exactly what following a fast world used to do.
      if (active.followId) {
        const live = getBodyWorldPosition(active.followId, tmp.current)
        if (live) {
          active.to.position.copy(live).add(active.offset)
          active.to.target.copy(live)
        }
      }
      const progress = easeInOutCubic(Math.min(1, active.elapsed / active.duration))
      camera.position.lerpVectors(active.from.position, active.to.position, progress)
      controls.target.lerpVectors(active.from.target, active.to.target, progress)
      // Aim as we fly, so the last frame of the flight is already looking at the
      // body and the follow takes over without a twitch.
      camera.lookAt(controls.target)
      controls.enabled = false
      if (active.elapsed >= active.duration) {
        tween.current = null
        controls.enabled = true
      }
      return
    }

    controls.enabled = true

    // The chase camera only ever chases the ship; planets keep the rigid follow
    // below.
    const chasingShip = chaseCamera && cameraMode === 'follow' && followTargetId === 'spacecraft'
    // Auto framing holds one viewing distance, so lock out the wheel zoom that
    // would fight it. Free zoom returns the moment it is switched off.
    controls.enableZoom = !(chasingShip && chaseAutoFrame)

    if (cameraMode === 'follow' && followTargetId) {
      const position = getBodyWorldPosition(followTargetId, tmp.current)
      if (position) {
        const previous = lastFollow.current

        if (chasingShip && !dragging.current) {
          // True chase: hold the ship centred from behind its nose. Move the
          // camera with the ship *first* — measuring the offset after the ship
          // has moved would measure it against the old camera position and let
          // the camera drift away as the ship flies.
          if (previous) {
            deltaVec.current.copy(position).sub(previous)
            camera.position.add(deltaVec.current)
            controls.target.add(deltaVec.current)
          }
          chaseOffset.current.copy(camera.position).sub(position)
          let distance = chaseOffset.current.length()
          if (distance > 0.001) {
            chaseDesired.current
              .copy(CHASE_LOCAL_OFFSET)
              .applyQuaternion(spacecraft.orientation)
              .normalize()
            const ease = reducedMotion ? 1 : 1 - Math.exp(-step * CHASE_RATE)
            chaseOffset.current.normalize().lerp(chaseDesired.current, ease)
            // Guard the exact 180° case, where the interpolation passes through
            // zero and would normalise to NaN.
            if (chaseOffset.current.lengthSq() < 1e-8) chaseOffset.current.copy(chaseDesired.current)
            chaseOffset.current.normalize()
            // Auto framing keeps the camera at the framing distance for as long
            // as it is on, whether the ship is still or flying.
            if (chaseAutoFrame) {
              distance += (CHASE_FRAMING_DISTANCE - distance) * ease
            }
            camera.position.copy(position).addScaledVector(chaseOffset.current, distance)
            controls.target.copy(position)
            camera.lookAt(controls.target)
          }
        } else if (previous) {
          // Rigid follow: camera and look-at point move by the body's own motion,
          // together. The framing is then fixed: the body holds its exact place on
          // screen however fast it travels, and the viewing distance never pumps.
          // Easing only the look-at point (as this used to) aimed the view one step
          // behind the body and the correction landed on the next frame — that was
          // the shimmer. While the user drags a chase, this still keeps the ship
          // framed but lets them look around.
          deltaVec.current.copy(position).sub(previous)
          camera.position.add(deltaVec.current)
          controls.target.add(deltaVec.current)

          // Anything left over — a pan, or a flight that ended while the body kept
          // travelling — is eased away on the look-at point alone, so re-centring
          // never changes the zoom. It pauses while the user drags, so it cannot
          // fight their hand.
          if (!dragging.current) {
            controls.target.lerp(position, 1 - Math.exp(-step * RECENTRE_RATE))
          }

          // Aim now, in this frame: the controls only look at their target during
          // their own update, which runs earlier, so without this the camera would
          // render the whole frame with the previous frame's orientation.
          camera.lookAt(controls.target)
        }
        if (!previous) lastFollow.current = position.clone()
        else previous.copy(position)
      }
    }
  })

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.075}
      rotateSpeed={0.55}
      zoomSpeed={0.85}
      panSpeed={0.7}
      screenSpacePanning
      minDistance={0.35}
      maxDistance={1500}
      onStart={() => {
        // Respect the user: any interaction cancels the automatic flight, and
        // pauses the re-centring pull until they let go.
        tween.current = null
        dragging.current = true
        if (controlsRef.current) controlsRef.current.enabled = true
      }}
      onEnd={() => {
        dragging.current = false
      }}
    />
  )
}