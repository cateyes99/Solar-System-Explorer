import type { Object3D } from 'three'
import { Vector3 } from 'three'
import type { FocusTargetId } from '../types'

/**
 * A tiny registry of live 3D objects.
 *
 * The camera controller and the HUD need to know where a planet actually is,
 * but passing refs through React props every frame would be noisy. Each 3D body
 * registers itself here on mount and removes itself on unmount.
 */
const registry = new Map<FocusTargetId, Object3D>()

export function registerBody(id: FocusTargetId, object: Object3D): void {
  registry.set(id, object)
}

export function unregisterBody(id: FocusTargetId, object: Object3D): void {
  if (registry.get(id) === object) {
    registry.delete(id)
  }
}

export function getBodyObject(id: FocusTargetId): Object3D | undefined {
  return registry.get(id)
}

const scratch = new Vector3()

/** World-space position of a registered body, or `undefined` if it is not mounted. */
export function getBodyWorldPosition(id: FocusTargetId, out: Vector3 = scratch): Vector3 | undefined {
  const object = registry.get(id)
  if (!object) return undefined
  return object.getWorldPosition(out)
}

/** Distance from the Sun in scene units, for HUD read-outs. */
export function getDistanceFromSun(id: FocusTargetId): number {
  const position = getBodyWorldPosition(id, new Vector3())
  return position ? position.length() : 0
}