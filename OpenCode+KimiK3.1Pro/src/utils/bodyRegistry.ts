import type { Object3D } from 'three'
import { Vector3 } from 'three'

const bodies = new Map<string, Object3D>()
const scratch = new Vector3()

export function registerBody(id: string, body: Object3D): () => void {
  bodies.set(id, body)
  return () => {
    if (bodies.get(id) === body) bodies.delete(id)
  }
}

export function getBody(id: string): Object3D | undefined {
  return bodies.get(id)
}

export function getBodyPosition(id: string, target = new Vector3()): Vector3 | null {
  const body = bodies.get(id)
  if (!body) return null
  body.updateWorldMatrix(true, false)
  return body.getWorldPosition(target)
}

export function getBodyDistance(id: string, from: Vector3): number {
  const position = getBodyPosition(id, scratch)
  return position ? position.distanceTo(from) : Number.POSITIVE_INFINITY
}
