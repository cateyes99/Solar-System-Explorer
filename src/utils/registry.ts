import type * as THREE from 'three'
import type { BodyId } from '../types'

/** Everything that can be looked up by the camera, labels or autopilot. */
export type RegistryId = BodyId | 'spacecraft'

/**
 * Scene-graph registry: 3D components register the anchor Object3D of each body
 * so the camera controller, labels and the spacecraft autopilot can look up
 * live world positions every frame without React re-renders.
 */
const bodyObjects = new Map<RegistryId, THREE.Object3D>()

export function registerBody(id: RegistryId, object: THREE.Object3D): () => void {
  bodyObjects.set(id, object)
  return () => {
    if (bodyObjects.get(id) === object) bodyObjects.delete(id)
  }
}

export function getBodyObject(id: RegistryId): THREE.Object3D | undefined {
  return bodyObjects.get(id)
}

export function getBodyWorldPosition(id: RegistryId, out: THREE.Vector3): THREE.Vector3 | null {
  const obj = bodyObjects.get(id)
  if (!obj) return null
  return obj.getWorldPosition(out)
}
