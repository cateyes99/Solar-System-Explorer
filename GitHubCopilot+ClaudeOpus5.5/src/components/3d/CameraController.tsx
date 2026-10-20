import { OrbitControls } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useRef } from 'react'
import { PerspectiveCamera, Vector3 } from 'three'
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib'
import type { BodyId } from '../../data/types'
import { layoutState } from '../../store/runtime'
import { useSimulationStore, type CameraRequest } from '../../store/simulationStore'
import { audio } from '../../utils/audio'
import { DEG } from '../../utils/astronomy'
import { shipPose } from './Spacecraft'
import { UP, getBodyRadius, getBodyWorldPosition, viewDistance } from './shared'

const DEFAULT_AZIMUTH = 52
const DEFAULT_ELEVATION = 16
const IDLE_ROTATE_AFTER = 14

const desiredPos = new Vector3()
const desiredTarget = new Vector3()
const bodyPos = new Vector3()
const radial = new Vector3()
const tangent = new Vector3()
const scratch = new Vector3()
const shipOffset = new Vector3()

const easeInOutCubic = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2)

function systemView(out: Vector3, aspect: number): Vector3 {
  // Narrow portrait screens need to step back further to fit the outer planets.
  const portraitBoost = Math.pow(Math.max(1, 1.1 / Math.max(aspect, 0.3)), 0.75)
  const distance = layoutState.current.outerEdge * 1.08 * portraitBoost
  const az = -28 * DEG
  const el = 30 * DEG
  return out.set(Math.sin(az) * Math.cos(el) * distance, Math.sin(el) * distance, Math.cos(az) * Math.cos(el) * distance)
}

/** Direction from a body towards its sunlit side, rotated for a pleasing three-quarter view. */
function litDirection(id: BodyId, request: CameraRequest, cameraPos: Vector3, out: Vector3): Vector3 {
  if (id === 'sun') {
    out.copy(cameraPos)
    out.y = 0
    if (out.lengthSq() < 1e-6) out.set(0, 0, 1)
    out.normalize()
  } else {
    getBodyWorldPosition(id, out).negate()
    out.y = 0
    if (out.lengthSq() < 1e-6) out.set(0, 0, 1)
    out.normalize()
  }
  out.applyAxisAngle(UP, (request.azimuthDeg ?? DEFAULT_AZIMUTH) * DEG)
  const el = (request.elevationDeg ?? DEFAULT_ELEVATION) * DEG
  return out.multiplyScalar(Math.cos(el)).addScaledVector(UP, Math.sin(el)).normalize()
}

export function CameraController() {
  const controlsRef = useRef<OrbitControlsImpl>(null)
  const camera = useThree((s) => s.camera) as PerspectiveCamera
  const request = useSimulationStore((s) => s.camera)
  const transition = useRef({ active: false, start: 0, duration: 2, lift: 0, fromPos: new Vector3(), fromTarget: new Vector3() })
  const planetOffset = useRef(new Vector3(0, 3, 10))
  const followDistance = useRef(10)
  const lastBody = useRef(new Vector3())
  const lastInteraction = useRef(performance.now() / 1000)
  const viewOffset = useRef({ x: 0, y: 0 })

  /** Slides the rendered image so the subject stays visible beside or above the open panels. */
  const updateViewOffset = (width: number, height: number, s: ReturnType<typeof useSimulationStore.getState>, dt: number) => {
    const desktop = width >= 1024
    const sidePanel = s.infoOpen || s.appMode === 'learn' || s.appMode === 'whatif' || s.appMode === 'mission'
    const leftNav = desktop && (s.appMode === 'explore' || s.appMode === 'learn' || s.appMode === 'whatif')
    let x = 0
    let y = 0
    if (desktop) {
      x = ((sidePanel ? 436 : 0) - (leftNav ? 244 : 0)) / 2
      if (s.appMode === 'tour') y = height * 0.08
    } else if (s.infoOpen || s.appMode === 'learn' || s.appMode === 'whatif') {
      y = height * 0.24
    } else if (s.appMode === 'mission') {
      y = -height * 0.14
    } else if (s.appMode === 'tour') {
      y = height * 0.16
    }
    const offset = viewOffset.current
    const k = 1 - Math.exp(-dt * 4)
    offset.x += (x - offset.x) * k
    offset.y += (y - offset.y) * k
    if (Math.abs(offset.x) < 0.5 && Math.abs(offset.y) < 0.5 && x === 0 && y === 0) {
      if (camera.view?.enabled) camera.clearViewOffset()
      return
    }
    camera.setViewOffset(width, height, offset.x, offset.y, width, height)
  }

  /** Where the camera wants to be for the current request (used by transitions and follow modes). */
  const computeDesired = (req: CameraRequest) => {
    if (req.mode === 'spacecraft') {
      shipOffset.set(0, 0.42, 1.55).applyQuaternion(shipPose.quaternion)
      desiredPos.copy(shipPose.position).add(shipOffset)
      scratch.set(0, 0.2, -2.5).applyQuaternion(shipPose.quaternion)
      desiredTarget.copy(shipPose.position).add(scratch)
      return
    }
    if (req.mode === 'system' || !req.targetId) {
      systemView(desiredPos, camera.aspect)
      desiredTarget.set(0, 0, 0)
      return
    }
    getBodyWorldPosition(req.targetId, bodyPos)
    desiredTarget.copy(bodyPos)
    if (req.mode === 'follow') {
      radial.copy(bodyPos)
      radial.y = 0
      if (radial.lengthSq() < 1e-6) radial.set(1, 0, 0)
      radial.normalize()
      tangent.set(radial.z, 0, -radial.x)
      const d = followDistance.current
      desiredPos.copy(bodyPos).addScaledVector(tangent, -d * 0.82).addScaledVector(radial, d * 0.5).addScaledVector(UP, d * 0.3)
      return
    }
    desiredPos.copy(bodyPos).add(planetOffset.current)
  }

  useEffect(() => {
    const controls = controlsRef.current
    const t = transition.current
    const { reducedMotion, sound } = useSimulationStore.getState()
    t.fromPos.copy(camera.position)
    t.fromTarget.copy(controls ? controls.target : scratch.set(0, 0, 0))

    if (request.targetId && request.mode !== 'system') {
      const portraitZoom = Math.max(1, Math.pow(0.9 / Math.max(camera.aspect, 0.3), 0.85))
      const distance = viewDistance(request.targetId) * (request.distanceFactor ?? 1) * portraitZoom
      if (request.mode === 'planet') {
        litDirection(request.targetId, request, camera.position, planetOffset.current).multiplyScalar(distance)
      } else {
        followDistance.current = distance * 1.4
      }
    }
    computeDesired(request)
    const travel = t.fromPos.distanceTo(desiredPos)
    const natural = Math.min(4.5, Math.max(1.6, 1.3 + travel / 110))
    t.duration = reducedMotion ? Math.min(0.6, request.duration ?? 0.6) : (request.duration ?? natural)
    t.lift = reducedMotion ? 0 : Math.min(travel * 0.16, 70)
    t.start = performance.now() / 1000
    t.active = true
    if (sound.enabled && sound.cinematic && travel > 25 && request.nonce > 1) audio.cinematic('whoosh')
    // computeDesired only reads refs and module state.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request.nonce])

  useEffect(() => {
    const controls = controlsRef.current
    if (!controls) return
    const onStart = () => {
      lastInteraction.current = performance.now() / 1000
      controls.autoRotate = false
    }
    controls.addEventListener('start', onStart)
    return () => controls.removeEventListener('start', onStart)
  }, [])

  useFrame((state, delta) => {
    const controls = controlsRef.current
    if (!controls) return
    const s = useSimulationStore.getState()
    const req = s.camera
    const now = performance.now() / 1000
    const dt = Math.min(delta, 0.1)
    updateViewOffset(state.size.width, state.size.height, s, dt)
    computeDesired(req)
    const t = transition.current
    const spacecraft = req.mode === 'spacecraft'

    if (t.active) {
      controls.enabled = false
      const progress = Math.min(1, (now - t.start) / t.duration)
      const e = easeInOutCubic(progress)
      camera.position.lerpVectors(t.fromPos, desiredPos, e)
      camera.position.y += t.lift * Math.sin(Math.PI * e)
      controls.target.lerpVectors(t.fromTarget, desiredTarget, e)
      if (progress >= 1) {
        t.active = false
        lastInteraction.current = now
      }
    } else if (req.mode === 'planet' && req.targetId) {
      // Ride along with the planet while letting the user orbit around it.
      scratch.subVectors(desiredTarget, lastBody.current)
      if (scratch.lengthSq() < 400) camera.position.add(scratch)
      controls.target.copy(desiredTarget)
    } else if (req.mode === 'follow') {
      camera.position.lerp(desiredPos, 1 - Math.exp(-dt * 3))
      controls.target.copy(desiredTarget)
    } else if (spacecraft) {
      camera.position.lerp(desiredPos, 1 - Math.exp(-dt * 6))
      controls.target.lerp(desiredTarget, 1 - Math.exp(-dt * 10))
    }
    lastBody.current.copy(desiredTarget)

    const freeControl = !t.active && !spacecraft && req.mode !== 'follow' && s.appMode !== 'tour'
    controls.enabled = freeControl
    const radius = req.targetId ? getBodyRadius(req.targetId) : 1
    controls.minDistance = req.mode === 'planet' && req.targetId ? radius * (req.targetId === 'saturn' ? 2.6 : 1.35) : 2
    controls.maxDistance = layoutState.current.outerEdge * 4
    controls.autoRotate =
      freeControl && req.mode === 'system' && s.appMode === 'explore' && !s.reducedMotion && now - lastInteraction.current > IDLE_ROTATE_AFTER
    controls.autoRotateSpeed = 0.22

    const focusDistance = camera.position.distanceTo(controls.target)
    const near = spacecraft ? 0.02 : Math.min(2, Math.max(0.01, focusDistance * 0.008))
    if (Math.abs(camera.near - near) / near > 0.15) {
      camera.near = near
      camera.updateProjectionMatrix()
    }

    if (freeControl) controls.update()
    else camera.lookAt(controls.target)
  })

  return (
    <OrbitControls
      ref={controlsRef}
      makeDefault
      enableDamping
      dampingFactor={0.08}
      rotateSpeed={0.6}
      zoomSpeed={0.9}
      panSpeed={0.8}
      enablePan
      screenSpacePanning
    />
  )
}
