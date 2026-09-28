import { Vector3 } from 'three'
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

/**
 * Spacecraft flight model.
 *
 * Kept deliberately arcade-simple so a seven-year-old can fly it: the ship
 * accelerates in the direction you steer, with a speed limit, gentle damping and
 * an optional autopilot that flies itself to a chosen planet.
 */
class SpacecraftSim {
  readonly position = new Vector3(0, 6, 26)
  readonly velocity = new Vector3()
  readonly heading = new Vector3(0, 0, 1)

  status: MissionStatus = 'idle'
  destinationId: BodyId | null = null
  autopilot = false

  /** Scene units per second. */
  maxSpeed = 9
  boostMultiplier = 2.6
  acceleration = 14
  damping = 1.35
  speed = 0
  distanceFromSun = 0
  distanceToDestination = 0

  private readonly pull = new Vector3()

  placeNear(target: Vector3, offset = 6): void {
    this.position.copy(target).add(new Vector3(offset, offset * 0.6, offset))
    this.velocity.set(0, 0, 0)
    this.speed = 0
  }

  reset(): void {
    this.position.set(0, 6, 26)
    this.velocity.set(0, 0, 0)
    this.heading.set(0, 0, 1)
    this.status = 'idle'
    this.destinationId = null
    this.autopilot = false
    this.speed = 0
  }

  /**
   * @param steerDirection  Unit direction the pilot is pushing the ship toward.
   * @param destination     World position of the autopilot target, when set.
   */
  update(delta: number, steerDirection: Vector3, destination: Vector3 | null, boosting: boolean): void {
    const dt = clamp(delta, 0, 0.05)
    const maxSpeed = boosting ? this.maxSpeed * this.boostMultiplier : this.maxSpeed

    if (this.autopilot && destination) {
      this.pull.copy(destination).sub(this.position)
      const distance = this.pull.length()
      this.distanceToDestination = distance
      if (distance < 0.0001) {
        this.velocity.set(0, 0, 0)
      } else {
        this.pull.multiplyScalar(1 / distance)
        // Slow down as we get close so we do not overshoot. "Arrival" happens
        // a few radii out, so the child ends up beside the planet, not inside it.
        const desiredSpeed = Math.min(maxSpeed, Math.max(0.6, distance * 0.35))
        const desired = this.pull.clone().multiplyScalar(desiredSpeed)
        this.velocity.lerp(desired, clamp(dt * 1.8, 0, 1))
        if (distance < 3.2) {
          this.status = 'arrived'
        } else {
          this.status = 'cruising'
        }
      }
      this.heading.copy(this.velocity).normalize()
    } else if (steerDirection.lengthSq() > 0.0001) {
      this.velocity.addScaledVector(steerDirection, this.acceleration * dt)
      this.status = 'idle'
    }

    // Damping keeps the ship from drifting forever when the child lets go.
    const damping = Math.exp(-this.damping * dt)
    this.velocity.multiplyScalar(damping)

    const speed = this.velocity.length()
    if (speed > maxSpeed) {
      this.velocity.multiplyScalar(maxSpeed / speed)
    }
    this.speed = this.velocity.length()
    this.position.addScaledVector(this.velocity, dt)
    this.distanceFromSun = this.position.length()

    if (this.autopilot && destination) {
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