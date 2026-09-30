import { Vector3 } from 'three'

/**
 * Every animated body publishes its world position here each frame.
 * The camera rig, labels, spacecraft autopilot and lesson scenes all read from
 * this map instead of holding references to individual meshes, which keeps the
 * components decoupled.
 */

const positions = new Map<string, Vector3>()
const radii = new Map<string, number>()

export function bodyPosition(id: string): Vector3 {
  let vector = positions.get(id)
  if (!vector) {
    vector = new Vector3()
    positions.set(id, vector)
  }
  return vector
}

export function setBodyRadius(id: string, radius: number): void {
  radii.set(id, radius)
}

export function bodyRadius(id: string): number {
  return radii.get(id) ?? 1
}

export function hasBody(id: string): boolean {
  return positions.has(id)
}

export function clearRegistry(): void {
  positions.clear()
  radii.clear()
}