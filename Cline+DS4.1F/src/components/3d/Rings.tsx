import { useEffect, useMemo } from 'react'
import { Color, DoubleSide, MeshStandardMaterial } from 'three'
import type { RingVisuals } from '../../data/visuals'
import { getTexture } from '../../utils/textures'
import { createRingGeometry } from './geometry'

interface RingsProps {
  /** Equatorial radius of the planet in scene units; the rings are measured from it. */
  radius: number
  visuals: RingVisuals
  /** Fades the rings out during focus changes. */
  opacity?: number
}

/**
 * Saturn's and Uranus's rings.
 *
 * The disc geometry carries radial UVs — u runs from the inner edge outward — so
 * the ring strip maps out from the planet exactly as measured, and both radii come
 * straight from `visuals`: the component never invents a distance. The strip's own
 * alpha channel is what carves the C ring's inner edge, the Cassini division and
 * the Encke gap (Saturn) or threads Uranus's nine narrow bands. The material stays
 * double sided so the rings read from above and below.
 */
export function Rings({ radius, visuals, opacity = 1 }: RingsProps) {
  const geometry = useMemo(
    () => createRingGeometry(radius * visuals.innerRadiusScale, radius * visuals.outerRadiusScale),
    [radius, visuals.innerRadiusScale, visuals.outerRadiusScale],
  )

  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        map: getTexture(visuals.textureId),
        // A ring strip is optical depth, not reflectance, so its grey values are
        // rescaled to a believable albedo (1 keeps it exactly as drawn).
        color: new Color(visuals.brightness, visuals.brightness, visuals.brightness),
        transparent: true,
        side: DoubleSide,
        // Ring particles are a rubble pile, not a polished surface.
        roughness: 0.92,
        metalness: 0,
        depthWrite: false,
        opacity: visuals.opacity * opacity,
      }),
    [visuals.textureId, visuals.brightness, visuals.opacity, opacity],
  )

  // Geometries are rebuilt when the scale mode changes, so free the old ones.
  useEffect(() => () => geometry.dispose(), [geometry])

  return <mesh geometry={geometry} material={material} />
}