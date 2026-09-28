import { useMemo } from 'react'
import { Line } from '@react-three/drei'

interface OrbitProps {
  radius: number
  color?: string
  opacity?: number
}

/** A thin circular guideline showing an orbital path. */
export function Orbit({ radius, color = '#6cf5e8', opacity = 0.22 }: OrbitProps) {
  const points = useMemo(() => {
    const segments = 128
    const pts: Array<[number, number, number]> = []
    for (let i = 0; i <= segments; i++) {
      const angle = (i / segments) * Math.PI * 2
      pts.push([Math.cos(angle) * radius, 0, Math.sin(angle) * radius])
    }
    return pts
  }, [radius])

  return (
    <Line
      points={points}
      color={color}
      lineWidth={1}
      transparent
      opacity={opacity}
      depthWrite={false}
      toneMapped={false}
    />
  )
}
