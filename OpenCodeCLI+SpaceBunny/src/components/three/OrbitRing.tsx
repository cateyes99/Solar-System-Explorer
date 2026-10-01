import { useMemo } from 'react'
import { Line } from '@react-three/drei'
import type { Vector3 } from 'three'
import type { OrbitGeometry } from './orbitMath'
import { orbitPath } from './orbitMath'
import { simClock } from '../../store/clock'

/**
 * A single orbit path, sampled from the real JPL elements so it shows the true
 * ellipse, the true orbital plane and the real spacing between positions.
 *
 * The ring is sampled once per scale change, not per frame: an orbit does not
 * move, so re-sampling it at 60fps would be pure waste. The path is only a
 * function of where the planet is *now* through a negligible phase offset, so a
 * static sample stays correct as time advances.
 */
export function OrbitRing({
  orbit,
  color,
  distanceExponent,
  opacity = 0.32,
  highlighted = false,
}: {
  orbit: OrbitGeometry
  color: string
  distanceExponent: number
  opacity?: number
  highlighted?: boolean
}) {
  const tuples = useMemo(() => {
    const points: Vector3[] = orbitPath(orbit, simClock.simulatedMs, distanceExponent, 260)
    return points.map((p) => [p.x, p.y, p.z] as [number, number, number])
  }, [orbit, distanceExponent])

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
