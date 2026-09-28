import { BufferGeometry, Float32BufferAttribute, SphereGeometry } from 'three'

/**
 * Geometries are created once and shared by every body. Nine planets, ten moons
 * and a hundred asteroids should not each allocate their own sphere.
 */
export const HIGH_DETAIL_SPHERE = new SphereGeometry(1, 64, 48)
export const MEDIUM_DETAIL_SPHERE = new SphereGeometry(1, 40, 28)
export const LOW_DETAIL_SPHERE = new SphereGeometry(1, 20, 14)

/**
 * A ring disc whose UV.u runs from 0 at the inner edge to 1 at the outer edge,
 * so a 1D ring profile texture maps radially the way it should.
 */
export function createRingGeometry(innerRadius: number, outerRadius: number, segments = 160): BufferGeometry {
  const geometry = new BufferGeometry()
  const positions: number[] = []
  const normals: number[] = []
  const uvs: number[] = []
  const indices: number[] = []

  for (let i = 0; i <= segments; i += 1) {
    const angle = (i / segments) * Math.PI * 2
    const cos = Math.cos(angle)
    const sin = Math.sin(angle)
    positions.push(cos * innerRadius, 0, sin * innerRadius)
    positions.push(cos * outerRadius, 0, sin * outerRadius)
    normals.push(0, 1, 0, 0, 1, 0)
    uvs.push(0, i / segments, 1, i / segments)
  }

  for (let i = 0; i < segments; i += 1) {
    const a = i * 2
    const b = a + 1
    const c = a + 2
    const d = a + 3
    indices.push(a, c, b, b, c, d)
  }

  geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
  geometry.setAttribute('normal', new Float32BufferAttribute(normals, 3))
  geometry.setAttribute('uv', new Float32BufferAttribute(uvs, 2))
  geometry.setIndex(indices)
  geometry.computeBoundingSphere()
  return geometry
}