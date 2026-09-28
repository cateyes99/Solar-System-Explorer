import { useEffect, useMemo } from 'react'
import { DoubleSide, MeshStandardMaterial } from 'three'
import type { RingVisuals } from '../../data/visuals'
import { getTexture } from '../../utils/textures'
import { createRingGeometry } from './geometry'

interface RingsProps {
  /** Radius of the planet in scene units; the rings are measured from it. */
  radius: number
  visuals: RingVisuals
  /** Fades the rings out during focus changes. */
  opacity?: number
  /** Extra spin, so the rings are not perfectly static relative to the planet. */
  tiltDeg: number
}

/**
 * Saturn's (and Uranus's) rings.
 *
 * The disc geometry carries radial UVs so the generated band texture with its
 * Cassini division and Encke gap lines up exactly, and the material stays
 * double sided so the rings are visible from above and below.
 */
export function Rings({ radius, visuals, opacity = 1, tiltDeg }: RingsProps) {
  const geometry = useMemo(
    () => createRingGeometry(radius * visuals.innerRadiusScale, radius * visuals.outerRadiusScale),
    [radius, visuals.innerRadiusScale, visuals.outerRadiusScale],
  )

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        map: getTexture(visuals.textureId),
        transparent: true,
        side: DoubleSide,
        roughness: 0.92,
        metalness: 0,
        depthWrite: false,
        opacity: visuals.opacity * opacity,
      }),
    [visuals.textureId, visuals.opacity, opacity],
  )

  // Geometries are rebuilt when the scale mode changes, so free the old ones.
  useEffect(() => () => geometry.dispose(), [geometry])

  return (
    <mesh
      geometry={geometry}
      material={material}
      rotation={[0, 0, tiltDeg * (Math.PI / 180)]}
      receiveShadow={false}
    />
  )
}