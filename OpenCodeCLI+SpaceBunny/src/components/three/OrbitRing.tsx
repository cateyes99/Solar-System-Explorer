import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import { Vector3 } from 'three'
import type { OrbitGeometry } from './orbitMath'
import { orbitPoints } from './orbitMath'

/**
 * A single orbit path. The line itself lives in the same tilted frame as the
 * planet, so inclination and ellipse shape are honest to the real data.
 */
export function OrbitRing({
  orbit,
  color,
  opacity = 0.32,
  highlighted = false,
}: {
  orbit: OrbitGeometry
  color: string
  opacity?: number
  highlighted?: boolean
}) {
  const points = useMemo(() => orbitPoints(orbit, 220), [orbit])

  // drei's Line needs a flat tuple array.
  const tuples = useMemo(() => points.map((p: Vector3) => [p.x, p.y, p.z] as [number, number, number]), [points])

  return (
    <Line
      points={tuples}
      color={color}
      lineWidth={highlighted ? 1.6 : 1}
      transparent
      opacity={highlighted ? Math.min(0.85, opacity + 0.4) : opacity}
      depthWrite={false}
    />
  )
}