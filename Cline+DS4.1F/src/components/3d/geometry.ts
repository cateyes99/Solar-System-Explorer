import { BufferGeometry, Float32BufferAttribute, SphereGeometry } from 'three'

/**
 * Geometries are created once and shared by every body. Nine planets, ten moons
 * and a hundred asteroids should not each allocate their own sphere.
 *
 * The spheres form a ladder from a distant speck to a full-screen disc. A
 * sphere's silhouette is a polygon, and the gap between that polygon and a true
 * circle falls with the square of the segment count: at 24 segments the rim
 * bulges about 0.9% of the radius away from the circle, which is invisible on a
 * speck but shows as flat facets on a world zoomed in until it fills the view.
 * Bodies therefore pick a rung from how large they are on screen (see
 * `sphereTierForApparentSize`) so the fine spheres are only paid for up close.
 *
 * The last two rungs exist for a different reason: they are the tessellation a
 * *displaced* surface needs. Earth's continents are pushed out along their
 * normals by a real elevation model, and a rung that is only fine enough to
 * keep a circle round cannot express a mountain range — at 192 segments a
 * vertex still sits 200 km from its neighbour, which smears the Himalayas into
 * a single bump. Only Earth ever selects those rungs (see
 * `terrainTierForApparentSize`); every other body keeps to the first four.
 */
export const SPHERE_LODS = [
  new SphereGeometry(1, 24, 16),
  new SphereGeometry(1, 48, 32),
  new SphereGeometry(1, 96, 64),
  new SphereGeometry(1, 192, 128),
  new SphereGeometry(1, 384, 256),
  new SphereGeometry(1, 768, 512),
]

/** The rung shared by the fixed shells: the Sun, the atmosphere and the lights. */
export const HIGH_DETAIL_SPHERE = SPHERE_LODS[2]

/**
 * The apparent diameter at which each finer rung starts to earn its triangles.
 * Index `n` is the size at which rung `n` is reached; each keeps the silhouette
 * within roughly a third of a pixel of a circle on a 1080p screen.
 */
const SPHERE_TIER_THRESHOLDS = [0, 0.045, 0.16, 0.5, 1.1, 2.4]

/**
 * The same idea for a surface that is genuinely displaced. Relief has to be
 * paid for in vertices, so Earth climbs the ladder earlier than a smooth sphere
 * needs to: at the default focused view — the planet filling a quarter of the
 * height of the window — it already wants 384 segments across, and by the time
 * it fills the view it is at 768.
 */
const TERRAIN_TIER_THRESHOLDS = [0, 0.012, 0.04, 0.1, 0.24, 0.9]

/**
 * Chooses a rung of `SPHERE_LODS` for a body whose diameter spans `apparentSize`
 * of the viewport's shorter side, never going finer than `maxTier`.
 *
 * Passing the current tier in adds hysteresis: a body steps up to a finer sphere
 * as soon as it crosses a threshold, but only steps back down once it is clearly
 * smaller, so a camera parked on a boundary cannot flicker between two rungs.
 */
function tierForThresholds(
  thresholds: number[],
  apparentSize: number,
  maxTier: number,
  currentTier: number,
): number {
  const top = Math.max(0, Math.min(maxTier, SPHERE_LODS.length - 1))
  let tier = Math.max(0, Math.min(currentTier, top))
  while (tier < top && apparentSize > thresholds[tier + 1]) tier += 1
  while (tier > 0 && apparentSize < thresholds[tier] * 0.75) tier -= 1
  return tier
}

export function sphereTierForApparentSize(
  apparentSize: number,
  maxTier: number,
  currentTier = 0,
): number {
  return tierForThresholds(SPHERE_TIER_THRESHOLDS, apparentSize, maxTier, currentTier)
}

/**
 * The rung for a body whose surface is displaced by an elevation model. It is
 * the same ladder, climbed earlier, because relief needs vertices to live in.
 */
export function terrainTierForApparentSize(
  apparentSize: number,
  maxTier: number,
  currentTier = 0,
): number {
  return tierForThresholds(TERRAIN_TIER_THRESHOLDS, apparentSize, maxTier, currentTier)
}

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
