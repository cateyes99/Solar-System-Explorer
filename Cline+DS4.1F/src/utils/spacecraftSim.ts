import { Object3D, Quaternion, Vector3 } from 'three'
import type { BodyId } from '../types'
import { clamp } from './random'

export type MissionStatus = 'idle' | 'cruising' | 'arrived'

export interface MissionReadout {
  status: MissionStatus
  destinationId: BodyId | null
  autopilot: boolean
  /** Speed in scene units per second. */
  speed: number
  /** Speed converted to kilometres per second using the current scale. */
  speedKmPerSecond: number
  /** Distance from the Sun in scene units. */
  distanceFromSun: number
  /** Distance still to travel to the destination, in scene units. */
  distanceToDestination: number
  /** Km remaining to the destination. */
  distanceToDestinationKm: number
}

/** One frame of pilot input; each axis runs from -1 to +1. */
export interface FlightControls {
  /** -1 turns left, +1 turns right. */
  yaw: number
  /** -1 pitches the nose down, +1 pitches it up. */
  pitch: number
  /** -1 thrusts in reverse, +1 thrusts forward along the nose. */
  thrust: number
}

/** Moves `current` toward `target` by at most `maxDelta` this step. */
function approach(current: number, target: number, maxDelta: number): number {
  const delta = target - current
  if (Math.abs(delta) <= maxDelta) return target
  return current + Math.sign(delta) * maxDelta
}

// Scratch objects, reused every frame so the flight model never allocates.
// The ship's own axes: nose on +Z, up on +Y, and — because a right-handed frame
// gives right = forward × up — starboard on -X.
const SHIP_UP = new Vector3(0, 1, 0)
const SHIP_RIGHT = new Vector3(-1, 0, 0)
const TURN = new Quaternion()
const AIM = new Object3D()

/**
 * Spacecraft flight model.
 *
 * The ship owns its own orientation; the pilot turns the hull and the engine
 * pushes along whichever way the nose happens to point. That is the whole point
 * of the design: movement follows the ship, not the screen, and nothing about
 * thrusting ever changes the heading.
 *
 *  - **Turning** (yaw and pitch) ramps a turn rate up while a key is held, so the
 *    ship eases into a turn, swings faster the longer it is held, and eases back
 *    out when released. It is applied about the ship's own axes, so "left" always
 *    means the ship's left.
 *  - **Thrust** spools up smoothly and pushes along the nose (+Z) or straight
 *    back along the same axis (-Z). Reverse never turns the ship around.
 *  - **The autopilot** still flies itself to the chosen world; it now also eases
 *    the nose onto the direction of travel instead of snapping to it.
 *
 * Gentle damping keeps a released ship from drifting forever, which keeps it
 * flyable for a child.
 */
class SpacecraftSim {
  readonly position = new Vector3(0, 6, 26)
  readonly velocity = new Vector3()
  /** World orientation of the hull; its local +Z is the nose. */
  readonly orientation = new Quaternion()
  /** The nose direction in world space, refreshed each update. */
  readonly forward = new Vector3(0, 0, 1)

  status: MissionStatus = 'idle'
  destinationId: BodyId | null = null
  autopilot = false

  /** Scene units per second. */
  maxSpeed = 9
  boostMultiplier = 2.6
  acceleration = 14
  damping = 1.35
  /** Fastest the nose can swing, radians per second. */
  maxTurnRate = 1.8
  /** How quickly the turn rate builds while turning … and eases back down. */
  turnAcceleration = 4
  turnDeceleration = 7
  /** How quickly the engine spools up and down, per second. */
  throttleRate = 3.5

  /** Current signed thrust, -1…1. Drives the engine glow. */
  throttle = 0
  speed = 0
  distanceFromSun = 0
  distanceToDestination = 0

  private yawRate = 0
  private pitchRate = 0
  private readonly pull = new Vector3()
  private readonly desired = new Vector3()

  placeNear(target: Vector3, offset = 6): void {
    this.position.copy(target).add(new Vector3(offset, offset * 0.6, offset))
    this.velocity.set(0, 0, 0)
    this.speed = 0
    this.throttle = 0
    this.yawRate = 0
    this.pitchRate = 0
  }

  reset(): void {
    this.position.set(0, 6, 26)
    this.velocity.set(0, 0, 0)
    this.orientation.identity()
    this.forward.set(0, 0, 1)
    this.status = 'idle'
    this.destinationId = null
    this.autopilot = false
    this.throttle = 0
    this.yawRate = 0
    this.pitchRate = 0
    this.speed = 0
  }

  /**
   * @param controls    The pilot's input for this frame.
   * @param destination World position of the autopilot target, when set.
   */
  update(delta: number, controls: FlightControls, destination: Vector3 | null, boosting: boolean): void {
    const dt = clamp(delta, 0, 0.05)
    const maxSpeed = boosting ? this.maxSpeed * this.boostMultiplier : this.maxSpeed
    const onAutopilot = this.autopilot && destination !== null

    if (onAutopilot && destination) {
      // --- Autopilot: fly toward the target, easing the nose onto our course ---
      this.pull.copy(destination).sub(this.position)
      const distance = this.pull.length()
      this.distanceToDestination = distance
      if (distance < 0.0001) {
        this.velocity.set(0, 0, 0)
      } else {
        this.pull.multiplyScalar(1 / distance)
        // Slow down as we get close so we do not overshoot. "Arrival" happens a
        // few radii out, so the child ends up beside the planet, not inside it.
        const desiredSpeed = Math.min(maxSpeed, Math.max(0.6, distance * 0.35))
        this.desired.copy(this.pull).multiplyScalar(desiredSpeed)
        this.velocity.lerp(this.desired, clamp(dt * 1.8, 0, 1))
        this.status = distance < 3.2 ? 'arrived' : 'cruising'
        // Face the way we travel. `lookAt` aims a plain object's +Z at the
        // target, so this is exactly the heading we want.
        AIM.position.copy(this.position)
        AIM.lookAt(destination)
        this.orientation.slerp(AIM.quaternion, clamp(dt * 2.4, 0, 1))
      }
      this.throttle = 1
      this.yawRate = 0
      this.pitchRate = 0
    } else {
      // --- Manual: turn the hull, then push along its nose ---------------------
      const yawTarget = clamp(controls.yaw, -1, 1) * this.maxTurnRate
      const pitchTarget = clamp(controls.pitch, -1, 1) * this.maxTurnRate
      const yawStep = (controls.yaw !== 0 ? this.turnAcceleration : this.turnDeceleration) * dt
      const pitchStep = (controls.pitch !== 0 ? this.turnAcceleration : this.turnDeceleration) * dt
      this.yawRate = approach(this.yawRate, yawTarget, yawStep)
      this.pitchRate = approach(this.pitchRate, pitchTarget, pitchStep)

      // Applied about the ship's own axes, so the turn is always relative to the
      // hull. Right-multiplying rotates in local space.
      if (this.yawRate !== 0) {
        // A positive yaw (D) swings the nose toward starboard (-X), which is a
        // negative turn about the ship's up axis.
        TURN.setFromAxisAngle(SHIP_UP, -this.yawRate * dt)
        this.orientation.multiply(TURN)
      }
      if (this.pitchRate !== 0) {
        // A positive pitch (R) lifts the nose, a positive turn about starboard.
        TURN.setFromAxisAngle(SHIP_RIGHT, this.pitchRate * dt)
        this.orientation.multiply(TURN)
      }
      this.orientation.normalize()

      this.throttle = approach(this.throttle, clamp(controls.thrust, -1, 1), this.throttleRate * dt)
      this.status = 'idle'
    }

    // The nose, after this frame's rotation — also what thrust pushes along.
    this.forward.set(0, 0, 1).applyQuaternion(this.orientation)
    if (!onAutopilot) {
      this.velocity.addScaledVector(this.forward, this.throttle * this.acceleration * dt)
    }

    // Damping keeps the ship from drifting forever when the pilot lets go.
    this.velocity.multiplyScalar(Math.exp(-this.damping * dt))

    const speed = this.velocity.length()
    if (speed > maxSpeed) this.velocity.multiplyScalar(maxSpeed / speed)
    this.speed = this.velocity.length()
    this.position.addScaledVector(this.velocity, dt)
    this.distanceFromSun = this.position.length()

    if (onAutopilot && destination) {
      this.distanceToDestination = this.position.distanceTo(destination)
    } else {
      this.distanceToDestination = 0
    }
  }

  readout(kmPerUnit: number): MissionReadout {
    return {
      status: this.status,
      destinationId: this.destinationId,
      autopilot: this.autopilot,
      speed: this.speed,
      speedKmPerSecond: this.speed * kmPerUnit,
      distanceFromSun: this.distanceFromSun,
      distanceToDestination: this.distanceToDestination,
      distanceToDestinationKm: this.distanceToDestination * kmPerUnit,
    }
  }
}

export const spacecraft = new SpacecraftSim()
