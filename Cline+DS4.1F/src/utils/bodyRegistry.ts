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

/**
 * A celestial body's opaque disc, as a sphere the label system can test against.
 *
 * A label is a DOM overlay, so the GPU's depth buffer never touches it: the only
 * way to know it is behind a body is to test the ray from the camera to the
 * label. A body's real surface mesh can run to hundreds of thousands of
 * triangles, so each body registers a cheap sphere — its centre object and the
 * radius it is drawn at — and the test stays a handful of arithmetic ops.
 */
export interface BodyOccluder {
  object: Object3D
  radius: number
}

const occluders = new Map<Object3D, BodyOccluder>()
/** Rebuilt whenever the set changes, so per-frame reads allocate nothing. */
let occluderList: BodyOccluder[] = []

export function registerBodyOccluder(object: Object3D, radius: number): void {
  occluders.set(object, { object, radius })
  occluderList = [...occluders.values()]
}

export function unregisterBodyOccluder(object: Object3D): void {
  if (occluders.delete(object)) occluderList = [...occluders.values()]
}

/** The spheres a label is hidden behind, as of the last registration change. */
export function getBodyOccluders(): BodyOccluder[] {
  return occluderList
}

/**
 * The camera-to-label ray a body test needs: `direction` is filled with the unit
 * vector from the camera to `point`, and the distance is returned (0 when the two
 * coincide, which cannot be tested against anything).
 *
 * It is split out from the test below so a caller with many labels can prepare
 * the ray once and then check it against every body, rather than recomputing the
 * normalisation for each pair.
 */
export function cameraRayTo(point: Vector3, cameraPosition: Vector3, direction: Vector3): number {
  direction.copy(point).sub(cameraPosition)
  const distance = direction.length()
  if (distance < 1e-9) return 0
  direction.divideScalar(distance)
  return distance
}

/**
 * Whether the sphere at `centreFromCamera` (radius `radius`) stands in front of
 * the point that `direction`/`distance` describe — the only test a DOM label can
 * use, because the GPU's depth buffer never touches it.
 *
 * `centreFromCamera` is the body's centre *relative to the camera*, which saves
 * the caller a subtraction per body. The maths is the standard ray–sphere
 * intersection, kept here so the two label layers cannot drift apart.
 */
export function rayBlockedBySphere(
  direction: Vector3,
  distance: number,
  centreFromCamera: Vector3,
  radius: number,
): boolean {
  const along = centreFromCamera.dot(direction)
  // The body is behind the camera, so it cannot stand in front of the point.
  if (along <= 0) return false
  const perpendicularSq = centreFromCamera.lengthSq() - along * along
  const radiusSq = radius * radius
  // The ray misses the body's disc entirely.
  if (perpendicularSq > radiusSq) return false
  const near = along - Math.sqrt(radiusSq - perpendicularSq)
  return near > 0 && near < distance
}