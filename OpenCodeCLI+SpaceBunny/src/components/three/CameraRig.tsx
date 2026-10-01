import { useEffect, useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { OrbitControls } from '@react-three/drei'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import { Vector3 } from 'three'
import { bodyPosition, bodyRadius } from '../../store/registry'
import { useAppStore } from '../../store/useAppStore'
import { systemRadiusUnits } from '../../utils/scale'
import { clamp, damp } from '../../utils/math'
import { TOUR_STAGES } from '../../data/tour'

const MIN_DISTANCE = 0.75
const MAX_DISTANCE = 2600
const UP = new Vector3(0, 1, 0)

/**
 * One rig drives every camera behaviour in the app.
 *
 * Instead of tweening between keyframes it continuously damps the orbit target
 * towards whatever the current mode wants, which means user input blends in
 * naturally and moving planets can be followed without jitter. The camera
 * radius is only driven during an explicit transition so the user stays free
 * to zoom whenever they like.
 */
export function CameraRig({ distanceExponent }: { distanceExponent: number }) {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const camera = useThree((state) => state.camera)
  const invalidate = useThree((state) => state.invalidate)

  const focusedId = useAppStore((s) => s.focusedId)
  const cameraMode = useAppStore((s) => s.cameraMode)
  const cameraOverride = useAppStore((s) => s.cameraOverride)
  const tourActive = useAppStore((s) => s.tourActive)
  const tourStage = useAppStore((s) => s.tourStage)
  const tourPaused = useAppStore((s) => s.tourPaused)
  const reducedMotion = useAppStore((s) => s.reducedMotion)
  const setHovered = useAppStore((s) => s.setHovered)

  const systemRadius = systemRadiusUnits(distanceExponent)

  const desiredTarget = useMemo(() => new Vector3(), [])
  const offset = useMemo(() => new Vector3(), [])
  const toSun = useMemo(() => new Vector3(), [])
  const litDir = useMemo(() => new Vector3(), [])
  /**
   * The point the camera is actually riding. It eases onto a body while the
   * camera is flying in, then becomes rigidly equal to it, so the camera is
   * *carried* by the planet rather than chasing it.
   */
  const followAnchor = useMemo(() => new Vector3(), [])
  const prevAnchor = useMemo(() => new Vector3(), [])
  const prevBody = useMemo(() => new Vector3(), [])
  const followShift = useMemo(() => new Vector3(), [])

  const desiredDistance = useRef(systemRadius * 1.9)
  const transitioning = useRef(true)
  const transitionClock = useRef(0)
  const sweepAngle = useRef(0)
  const idleClock = useRef(0)
  const initialized = useRef(false)
  /** True once the anchor has been seeded with a real body position. */
  const anchorSeeded = useRef(false)

  /* Any explicit change of intent starts a new camera transition. */
  useEffect(() => {
    transitioning.current = true
    transitionClock.current = 0
    // A new subject invalidates the carried anchor: re-seed it from wherever the
    // camera currently is, so we ease in from the user's viewpoint rather than
    // teleporting to a stale position.
    anchorSeeded.current = false
  }, [focusedId, cameraMode, tourActive, tourStage, distanceExponent, cameraOverride])

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    controls.minDistance = MIN_DISTANCE
    controls.maxDistance = MAX_DISTANCE
    controls.enablePan = true
    controls.panSpeed = 0.85
    controls.rotateSpeed = 0.6
    controls.zoomSpeed = 0.95
    controls.dampingFactor = 0.08
  }, [])

  // Open on a composed three-quarter view of the whole system.
  useEffect(() => {
    if (initialized.current) return
    initialized.current = true
    camera.position.set(systemRadius * 0.13, systemRadius * 0.5, systemRadius * 1.5)
    camera.lookAt(0, 0, 0)
    invalidate()
  }, [camera, systemRadius, invalidate])

  useFrame((_, rawDelta) => {
    const controls = controlsRef.current
    if (!controls) return
    const delta = Math.min(rawDelta, 0.05)
    idleClock.current += delta

    /* ---------------- decide the framing ---------------- */
    const stage = tourActive ? TOUR_STAGES[Math.min(tourStage, TOUR_STAGES.length - 1)] : null
    /** Absolute world-space distance the camera should settle at. */
    let desiredDistanceNow: number

    if (stage) {
      if (stage.target === 'system') {
        desiredTarget.set(0, 0, 0)
        desiredDistanceNow = stage.distanceFactor * systemRadius
      } else {
        desiredTarget.copy(bodyPosition(stage.target))
        desiredDistanceNow = Math.max(1.2, bodyRadius(stage.target) * 6.2) * stage.distanceFactor
      }
    } else if (cameraOverride) {
      desiredTarget.copy(bodyPosition(cameraOverride.id))
      desiredDistanceNow = cameraOverride.distance
    } else if (focusedId && cameraMode === 'follow') {
      desiredTarget.copy(bodyPosition(focusedId))
      desiredDistanceNow = Math.max(2.2, bodyRadius(focusedId) * 4.2)
    } else if (focusedId) {
      desiredTarget.copy(bodyPosition(focusedId))
      desiredDistanceNow = Math.max(4.5, bodyRadius(focusedId) * 11)
    } else {
      desiredTarget.set(0, 0, 0)
      desiredDistanceNow = systemRadius * 1.75
    }

    /* ---------------- how the camera is carried ----------------
     *
     * Damping the target towards a *moving* body is what broke follow mode: an
     * exponential damper lags by speed/lambda, so the faster the orbit the more
     * the planet outruns the camera. Measured at Normal speed the steady-state
     * lag is ~1.1 units for Mercury but only ~0.13 for Neptune, which is exactly
     * the "outer planets follow, inner planets run away" split.
     *
     * So the anchor absorbs the body's *displacement* rigidly, which is lag-free
     * at any orbital speed, and only the residual error is eased. On arrival the
     * anchor starts at the camera's current target, so that residual is the whole
     * flight and it closes in smoothly; once settled the residual is zero and the
     * camera tracks perfectly.
     */
    const carryLambda = reducedMotion ? 16 : tourActive ? 3.4 : 4
    const trackingBody = focusedId !== null || stage !== null || cameraOverride !== null

    if (trackingBody) {
      if (!anchorSeeded.current) {
        // Arriving: start from the camera's current target so we ease across the
        // distance instead of teleporting, and remember where the body is so the
        // first frame's displacement is not mistaken for motion.
        followAnchor.copy(controls.target)
        prevBody.copy(desiredTarget)
        prevAnchor.copy(controls.target)
        anchorSeeded.current = true
      }

      // 1. Carry the body's own movement this frame, exactly.
      followShift.copy(desiredTarget).sub(prevBody)
      prevBody.copy(desiredTarget)
      followAnchor.add(followShift)

      // 2. Ease out whatever error is left (the flight in, or nothing at all once
      //    we are settled on the body).
      followAnchor.x = damp(followAnchor.x, desiredTarget.x, carryLambda, delta)
      followAnchor.y = damp(followAnchor.y, desiredTarget.y, carryLambda, delta)
      followAnchor.z = damp(followAnchor.z, desiredTarget.z, carryLambda, delta)

      // 3. Move the camera by the same delta as its target, so the user's own
      //    distance and viewing angle survive untouched.
      followShift.copy(followAnchor).sub(prevAnchor)
      prevAnchor.copy(followAnchor)
      controls.target.add(followShift)
      camera.position.add(followShift)
    } else {
      anchorSeeded.current = false
      controls.target.x = damp(controls.target.x, desiredTarget.x, carryLambda, delta)
      controls.target.y = damp(controls.target.y, desiredTarget.y, carryLambda, delta)
      controls.target.z = damp(controls.target.z, desiredTarget.z, carryLambda, delta)
    }

    /* ---------------- drive the radius only while transitioning ---------------- */
    const desired = clamp(desiredDistanceNow, MIN_DISTANCE * 1.5, MAX_DISTANCE)

    if (tourActive) transitioning.current = true
    if (transitioning.current) {
      transitionClock.current += delta
      desiredDistance.current = damp(desiredDistance.current, desired, reducedMotion ? 14 : 2.4, delta)

      offset.copy(camera.position).sub(controls.target)
      const length = offset.length()
      if (length > 0.0001) {
        offset.divideScalar(length)

        // Arriving at a planet from wherever we happened to be would usually
        // land on its night side, which looks like a black hole. Steer towards a
        // three-quarter lit portrait instead — mostly sunward, a little above.
        // Once the transition ends the child has the camera back entirely.
        const framingABody = desiredTarget.lengthSq() > 0.001
        if (framingABody && !(reducedMotion && tourPaused)) {
          toSun.copy(desiredTarget).negate().normalize()
          litDir.copy(toSun).multiplyScalar(0.88).addScaledVector(UP, 0.42).normalize()
          offset.lerp(litDir, clamp(delta * 0.85, 0, 1)).normalize()
        }

        if (stage && !reducedMotion && !tourPaused) {
          sweepAngle.current += stage.sweep * delta * 0.085
          offset.applyAxisAngle(UP, sweepAngle.current)
        }
        camera.position.copy(controls.target).addScaledVector(offset, desiredDistance.current)
      }

      if (Math.abs(desiredDistance.current - desired) / desired < 0.012 || transitionClock.current > 5) {
        transitioning.current = false
      }
    }

    /* ---------------- a whisper of idle drift ---------------- */
    const idleDrift =
      !reducedMotion && !focusedId && !tourActive && !cameraOverride && idleClock.current > 5
    controls.autoRotate = idleDrift
    controls.autoRotateSpeed = 0.22

    controls.update()
  })

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      screenSpacePanning
      onStart={() => {
        idleClock.current = 0
        // Interacting with the scene clears any hover tooltip.
        setHovered(null)
      }}
      onEnd={() => {
        idleClock.current = 0
      }}
    />
  )
}