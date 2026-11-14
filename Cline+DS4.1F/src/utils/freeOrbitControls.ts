import { Quaternion, Vector3 } from 'three'
import type { OrthographicCamera, PerspectiveCamera } from 'three'

/** Keeps a value inside a range. Kept local so this module needs only `three`. */
function clamp(value: number, min: number, max: number): number {
  return value < min ? min : value > max ? max : value
}

/**
 * A free-tumbling orbit camera.
 *
 * The app used to orbit with three's `OrbitControls`, whose spherical model
 * clamps the polar angle to `[0, π]` — the camera can travel from straight above
 * the scene to straight below it, and no further. At either pole the azimuth
 * becomes undefined (gimbal lock) and the camera's `up` would line up with the
 * view direction, so the clamp is deliberate.
 *
 * This controller keeps the same orbit-the-target feel but drives the camera
 * with quaternions instead of spherical angles. A drag turns the camera about
 * its own up axis (horizontal) and its own right axis (vertical), and the same
 * rotation is applied to the camera offset *and* its `up` vector — so the two
 * stay perpendicular however far the camera rolls, and there is no pole to stop
 * at. Vertical rotation is therefore unlimited and the scene can tumble right
 * over the top.
 *
 * The trade-off is inherent: once the camera passes the pole its horizon rolls,
 * so the scene can end up tilted or upside-down. `freeTumble` can be switched
 * off, which clamps the polar angle exactly as `OrbitControls` did and keeps the
 * horizon level.
 */

/** The camera's polar angle is kept just short of the poles when tumbling is off. */
const MIN_POLAR = 0.02
const MAX_POLAR = Math.PI - 0.02

/** Used when the canvas has not reported a height yet, so drags still scale sanely. */
const FALLBACK_HEIGHT = 800

/** How close to rest a damped value must be before it is snapped to it. */
const EPSILON = 1e-4

// Scratch objects, reused so a frame of input never allocates.
const _offset = new Vector3()
const _right = new Vector3()
const _up = new Vector3()
const _nextUp = new Vector3()
const _move = new Vector3()
const _q = new Quaternion()
const _qYaw = new Quaternion()
const _qPitch = new Quaternion()

/**
 * Builds one drag step's rotation: `yaw` about the camera's own up axis and
 * `pitch` about its right axis. Both angles are unclamped, and the caller
 * applies the result to the camera offset *and* its up vector, so the two stay
 * perpendicular however far the camera tumbles — which is what makes an
 * unlimited vertical rotation possible without gimbal lock.
 */
export function tumbleQuaternion(
  yaw: number,
  pitch: number,
  up: Vector3,
  right: Vector3,
  out: Quaternion,
): Quaternion {
  _qYaw.setFromAxisAngle(up, yaw)
  _qPitch.setFromAxisAngle(right, pitch)
  return out.multiplyQuaternions(_qYaw, _qPitch)
}

/** The camera types this controller can drive. */
type OrbitCamera = PerspectiveCamera | OrthographicCamera

export type FreeOrbitControlsEvent = 'start' | 'end' | 'change'
type Listener = () => void

interface PointerPosition {
  x: number
  y: number
}

/** The properties `FreeOrbitControls` exposes, all optional at construction. */
export interface FreeOrbitControlsOptions {
  enabled?: boolean
  enableRotate?: boolean
  enablePan?: boolean
  enableZoom?: boolean
  enableDamping?: boolean
  dampingFactor?: number
  rotateSpeed?: number
  zoomSpeed?: number
  panSpeed?: number
  minDistance?: number
  maxDistance?: number
  screenSpacePanning?: boolean
  /** When false the camera keeps a level horizon and the polar angle is clamped. */
  freeTumble?: boolean
}

/**
 * The controller itself. It owns no React state: `update()` is expected to be
 * called once a frame (before anything that reads the camera), and the input
 * listeners are attached to the canvas by `connect`.
 */
export class FreeOrbitControls {
  /** The point the camera orbits and looks at. Mutated in place, like OrbitControls. */
  readonly target = new Vector3()

  enabled = true
  enableRotate = true
  enablePan = true
  enableZoom = true
  enableDamping = true
  dampingFactor = 0.075
  rotateSpeed = 1
  zoomSpeed = 1
  panSpeed = 1
  minDistance = 0.35
  maxDistance = 1500
  screenSpacePanning = true
  freeTumble = true

  private readonly object: OrbitCamera
  private domElement: HTMLElement | null = null

  // Damped input, applied over the frames after it arrives so a flick glides.
  private pendingYaw = 0
  private pendingPitch = 0
  private pendingZoom = 1

  // Live touch/mouse pointers, so one finger turns and two pan and pinch.
  private readonly pointers = new Map<number, PointerPosition>()
  private mode: 'none' | 'rotate' | 'pan' = 'none'
  private pinchDistance = 0
  private centre: PointerPosition | null = null

  private readonly listeners = new Map<FreeOrbitControlsEvent, Set<Listener>>()

  /** The camera is aimed at the target once, the first frame it is enabled. */
  private needsAim = true

  // Saved at connect time so `reset` can return to the opening view.
  private readonly savedPosition = new Vector3()
  private readonly savedTarget = new Vector3()
  private readonly savedUp = new Vector3()

  constructor(object: OrbitCamera, domElement: HTMLElement | null = null) {
    this.object = object
    this.savedPosition.copy(object.position)
    this.savedTarget.copy(this.target)
    this.savedUp.copy(object.up)
    if (domElement) this.connect(domElement)
  }

  /* --------------------------------------------------------------- events */

  addEventListener(type: FreeOrbitControlsEvent, listener: Listener): void {
    let set = this.listeners.get(type)
    if (!set) {
      set = new Set()
      this.listeners.set(type, set)
    }
    set.add(listener)
  }

  removeEventListener(type: FreeOrbitControlsEvent, listener: Listener): void {
    this.listeners.get(type)?.delete(listener)
  }

  private dispatch(type: FreeOrbitControlsEvent): void {
    const set = this.listeners.get(type)
    if (!set) return
    for (const listener of set) listener()
  }

  /* ----------------------------------------------------------- connection */

  connect(domElement: HTMLElement): void {
    if (this.domElement === domElement) return
    if (this.domElement) this.disconnect()
    this.domElement = domElement
    // Stop the browser turning a drag on the canvas into a page scroll, exactly
    // as three's OrbitControls does.
    domElement.style.touchAction = 'none'
    this.savedPosition.copy(this.object.position)
    this.savedTarget.copy(this.target)
    this.savedUp.copy(this.object.up)
    domElement.addEventListener('pointerdown', this.onPointerDown)
    domElement.addEventListener('pointermove', this.onPointerMove)
    domElement.addEventListener('pointerup', this.onPointerUp)
    domElement.addEventListener('pointercancel', this.onPointerUp)
    domElement.addEventListener('wheel', this.onWheel, { passive: false })
    domElement.addEventListener('contextmenu', this.onContextMenu)
  }

  private disconnect(): void {
    const domElement = this.domElement
    if (!domElement) return
    domElement.removeEventListener('pointerdown', this.onPointerDown)
    domElement.removeEventListener('pointermove', this.onPointerMove)
    domElement.removeEventListener('pointerup', this.onPointerUp)
    domElement.removeEventListener('pointercancel', this.onPointerUp)
    domElement.removeEventListener('wheel', this.onWheel)
    domElement.removeEventListener('contextmenu', this.onContextMenu)
    this.domElement = null
  }

  dispose(): void {
    this.disconnect()
    this.listeners.clear()
    this.pointers.clear()
  }

  /* -------------------------------------------------------------- input */

  private onPointerDown = (event: PointerEvent): void => {
    if (!this.enabled) return
    this.domElement?.setPointerCapture?.(event.pointerId)
    this.pointers.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (this.pointers.size === 1) {
      // The left button turns the view; the right (or middle) button pans.
      if (event.button === 0) this.mode = this.enableRotate ? 'rotate' : 'none'
      else this.mode = this.enablePan ? 'pan' : 'none'
      this.dispatch('start')
    } else if (this.pointers.size === 2) {
      this.mode = 'pan'
      this.pinchDistance = this.pointerDistance()
      this.centre = this.pointerCentre()
    }
  }

  private onPointerMove = (event: PointerEvent): void => {
    if (!this.enabled) return
    const previous = this.pointers.get(event.pointerId)
    if (!previous) return
    const dx = event.clientX - previous.x
    const dy = event.clientY - previous.y
    previous.x = event.clientX
    previous.y = event.clientY

    if (this.mode === 'rotate' && this.pointers.size === 1) {
      // Matches OrbitControls' feel: one full height of drag is a full turn.
      const perPixel = (2 * Math.PI) / this.clientHeight()
      this.rotate(-dx * perPixel * this.rotateSpeed, -dy * perPixel * this.rotateSpeed)
    } else if (this.mode === 'pan') {
      if (this.pointers.size === 1) {
        if (this.enablePan) this.pan(dx, dy)
      } else if (this.pointers.size === 2) {
        const centre = this.pointerCentre()
        if (centre && this.centre && this.enablePan) {
          this.pan(centre.x - this.centre.x, centre.y - this.centre.y)
        }
        this.centre = centre
        const distance = this.pointerDistance()
        if (this.pinchDistance > 0 && distance > 0 && this.enableZoom) {
          // Fingers closing (distance shrinking) zooms out, and vice versa.
          this.zoomBy(Math.pow(this.pinchDistance / distance, this.zoomSpeed))
        }
        this.pinchDistance = distance
      }
    }
  }

  private onPointerUp = (event: PointerEvent): void => {
    this.pointers.delete(event.pointerId)
    this.domElement?.releasePointerCapture?.(event.pointerId)
    if (this.pointers.size === 0) {
      this.mode = 'none'
      this.pinchDistance = 0
      this.centre = null
      this.dispatch('end')
    } else if (this.pointers.size === 1) {
      this.mode = 'pan'
      this.pinchDistance = 0
      this.centre = null
    }
  }

  private onWheel = (event: WheelEvent): void => {
    if (!this.enabled || !this.enableZoom) return
    event.preventDefault()
    const scale = Math.pow(0.95, this.zoomSpeed)
    this.zoomBy(event.deltaY < 0 ? scale : 1 / scale)
    // Wheel input counts as an interaction, so it cancels any camera flight just
    // as a drag would.
    this.dispatch('start')
    this.dispatch('end')
  }

  private onContextMenu = (event: Event): void => {
    if (this.enabled) event.preventDefault()
  }

  /* -------------------------------------------------------------- update */

  /**
   * Queues a rotation, in radians, to be eased in over the coming frames. The
   * pointer handlers call this; it is public so the motion can be driven
   * programmatically (and tested) without a live DOM.
   */
  rotate(yaw: number, pitch: number): void {
    this.pendingYaw += yaw
    this.pendingPitch += pitch
  }

  /** Queues a dolly by a multiplicative factor (below 1 zooms in). */
  zoomBy(factor: number): void {
    this.pendingZoom *= factor
  }

  /** Advances damping and writes the camera. Call once a frame, before readers. */
  update(): void {
    if (!this.enabled) return
    // OrbitControls re-aimed the camera at its target every frame; do it once on
    // the first enabled frame so the opening view points at the scene instead of
    // keeping the camera's default orientation.
    if (this.needsAim) {
      this.object.lookAt(this.target)
      this.needsAim = false
    }
    const damping = this.enableDamping ? this.dampingFactor : 1
    let changed = false

    if (this.pendingYaw !== 0 || this.pendingPitch !== 0) {
      this.applyRotation(this.pendingYaw * damping, this.pendingPitch * damping)
      changed = true
      if (this.enableDamping) {
        const keep = 1 - this.dampingFactor
        this.pendingYaw *= keep
        this.pendingPitch *= keep
        if (Math.abs(this.pendingYaw) < EPSILON) this.pendingYaw = 0
        if (Math.abs(this.pendingPitch) < EPSILON) this.pendingPitch = 0
      } else {
        this.pendingYaw = 0
        this.pendingPitch = 0
      }
    }

    if (this.pendingZoom !== 1) {
      const factor = 1 + (this.pendingZoom - 1) * damping
      if (this.applyZoom(factor)) changed = true
      if (this.enableDamping) {
        this.pendingZoom = 1 + (this.pendingZoom - 1) * (1 - this.dampingFactor)
        if (Math.abs(this.pendingZoom - 1) < EPSILON) this.pendingZoom = 1
      } else {
        this.pendingZoom = 1
      }
    }

    if (changed) this.dispatch('change')
  }

  /**
   * Turns the camera by `yaw` about its own up axis and `pitch` about its right
   * axis. The rotation is applied to the offset and the up vector together, so
   * the camera can tumble indefinitely; with `freeTumble` off the polar angle is
   * clamped and the horizon is re-levelled.
   */
  private applyRotation(yaw: number, pitch: number): void {
    const camera = this.object
    _offset.copy(camera.position).sub(this.target)
    _right.set(1, 0, 0).applyQuaternion(camera.quaternion)
    _up.copy(camera.up)

    const q = tumbleQuaternion(yaw, pitch, _up, _right, _q)
    _offset.applyQuaternion(q)
    _nextUp.copy(_up).applyQuaternion(q)

    if (this.freeTumble) {
      camera.up.copy(_nextUp)
    } else {
      // Keep the horizon level: rebuild the offset from spherical coordinates
      // with the polar angle held off the poles, exactly as OrbitControls does.
      const radius = _offset.length()
      if (radius > 1e-6) {
        const theta = Math.atan2(_offset.x, _offset.z)
        const phi = clamp(Math.acos(clamp(_offset.y / radius, -1, 1)), MIN_POLAR, MAX_POLAR)
        _offset.setFromSphericalCoords(radius, phi, theta)
      }
      camera.up.set(0, 1, 0)
    }

    camera.position.copy(this.target).add(_offset)
    camera.lookAt(this.target)
  }

  /** Dollies toward or away from the target, clamped to the distance range. */
  private applyZoom(factor: number): boolean {
    const camera = this.object
    _offset.copy(camera.position).sub(this.target)
    const current = _offset.length()
    const next = clamp(current * factor, this.minDistance, this.maxDistance)
    if (Math.abs(next - current) < 1e-9) return false
    _offset.setLength(next)
    camera.position.copy(this.target).add(_offset)
    return true
  }

  /** Slides the target and camera together across the screen plane. */
  private pan(deltaX: number, deltaY: number): void {
    const camera = this.object
    const distance = camera.position.distanceTo(this.target)
    const fov = 'fov' in camera ? camera.fov : 50
    const targetDistance = distance * Math.tan((fov / 2) * (Math.PI / 180))
    const perPixel = (2 * targetDistance) / this.clientHeight()
    const x = deltaX * perPixel * this.panSpeed
    const y = deltaY * perPixel * this.panSpeed

    _right.set(1, 0, 0).applyQuaternion(camera.quaternion)
    _move.copy(_right).multiplyScalar(-x)
    this.target.add(_move)
    camera.position.add(_move)

    if (this.screenSpacePanning) _up.set(0, 1, 0).applyQuaternion(camera.quaternion)
    else _up.set(0, 1, 0)
    _move.copy(_up).multiplyScalar(y)
    this.target.add(_move)
    camera.position.add(_move)

    this.dispatch('change')
  }

  /** Returns to the pose the camera had when the controller connected. */
  reset(): void {
    this.object.position.copy(this.savedPosition)
    this.object.up.copy(this.savedUp)
    this.target.copy(this.savedTarget)
    this.object.lookAt(this.target)
    this.pendingYaw = 0
    this.pendingPitch = 0
    this.pendingZoom = 1
    this.dispatch('change')
  }

  /* ------------------------------------------------------------ helpers */

  private clientHeight(): number {
    return this.domElement?.clientHeight || FALLBACK_HEIGHT
  }

  private pointerDistance(): number {
    const [a, b] = [...this.pointers.values()]
    if (!a || !b) return 0
    return Math.hypot(a.x - b.x, a.y - b.y)
  }

  private pointerCentre(): PointerPosition | null {
    const [a, b] = [...this.pointers.values()]
    if (!a || !b) return null
    return { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }
  }
}
