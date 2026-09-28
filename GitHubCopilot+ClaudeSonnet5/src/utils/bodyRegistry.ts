import type { Object3D } from 'three'

/**
 * Plain module-level registry mapping body id -> live Object3D.
 * Lets the camera controller read a moving planet's current world position
 * every frame without prop-drilling refs or causing React re-renders.
 */
const registry = new Map<string, Object3D>()

export function registerBody(id: string, object: Object3D | null): void {
  if (object) registry.set(id, object)
  else registry.delete(id)
}

export function getBody(id: string | null | undefined): Object3D | undefined {
  if (!id) return undefined
  return registry.get(id)
}
