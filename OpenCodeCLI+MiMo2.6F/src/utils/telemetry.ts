/** Live spacecraft telemetry, read by the Mission Control HUD on a timer. */

export type CraftCommand =
  | { kind: 'body'; id: string }
  | { kind: 'orbit'; id: string }
  | { kind: 'stop' }
  | null

export const telemetry = {
  /** World units per second */
  speed: 0,
  /** Distance from the Sun in AU */
  distanceAu: 0,
  /** Distance from the Sun in world units */
  distanceUnits: 0,
  /** Destination label shown in the HUD */
  destinationLabel: 'Free flight',
  /** Destination body id (null = free flight) */
  destinationId: null as string | null,
  /** True while riding a planet's orbital path */
  orbitRide: false,
  /** Set once when the craft reaches its destination */
  arrived: false,
}

/** One-shot command consumed by the Spacecraft component on its next frame. */
export const craftCommand: { pending: CraftCommand } = { pending: null }

export function sendCraftCommand(command: CraftCommand): void {
  craftCommand.pending = command
}
