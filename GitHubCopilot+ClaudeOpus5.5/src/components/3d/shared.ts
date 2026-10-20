import { createContext, useContext } from 'react'
import { MeshBasicMaterial, SphereGeometry, Vector3 } from 'three'
import type { TextureSet } from '../../graphics/textures'
import type { BodyId } from '../../data/types'
import { bodyObjects, layoutState } from '../../store/runtime'

export const TexturesContext = createContext<TextureSet | null>(null)

export function useTextures(): TextureSet {
  const textures = useContext(TexturesContext)
  if (!textures) throw new Error('useTextures must be used inside TexturesContext')
  return textures
}

const sphereCache = new Map<number, SphereGeometry>()

/** Unit spheres are shared between all bodies and scaled per object. */
export function getSphere(segments: number): SphereGeometry {
  let geometry = sphereCache.get(segments)
  if (!geometry) {
    geometry = new SphereGeometry(1, segments, Math.round(segments / 2))
    sphereCache.set(segments, geometry)
  }
  return geometry
}

/** Invisible but raycastable material for generous click targets. */
export const hitMaterial = new MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false, colorWrite: false })

export const UP = new Vector3(0, 1, 0)
export const ORIGIN = new Vector3(0, 0, 0)

/** Visual spin is capped so fast simulation speeds don’t turn into a strobe. */
export const MAX_SPIN_RAD_PER_SEC = Math.PI * 1.2

export function getBodyWorldPosition(id: BodyId, out: Vector3): Vector3 {
  const object = bodyObjects.get(id)
  if (!object) return out.set(0, 0, 0)
  return object.getWorldPosition(out)
}

export function getBodyRadius(id: BodyId): number {
  return layoutState.current.radius[id]
}

/** Comfortable camera distance for looking at a body. */
export function viewDistance(id: BodyId): number {
  const r = getBodyRadius(id)
  if (id === 'sun') return r * 3.4
  if (id === 'saturn') return r * 5.8
  return Math.max(r * 4.2, r + 1.2)
}
