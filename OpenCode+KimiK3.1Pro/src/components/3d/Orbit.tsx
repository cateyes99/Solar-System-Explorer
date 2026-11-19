import { useMemo } from 'react'
import { BufferAttribute, BufferGeometry, MathUtils } from 'three'
import type { PlanetData } from '../../types'

interface OrbitProps {
  body: PlanetData
  radius: number
  color?: string
  opacity?: number
}

export function Orbit({ body, radius, color = '#7ca5c4', opacity = 0.18 }: OrbitProps) {
  const geometry = useMemo(() => {
    const points = new Float32Array(192 * 3)
    const inclination = MathUtils.degToRad(body.inclinationDeg)
    for (let index = 0; index < 192; index += 1) {
      const angle = (index / 192) * Math.PI * 2
      const flatZ = Math.sin(angle) * radius
      points[index * 3] = Math.cos(angle) * radius
      points[index * 3 + 1] = flatZ * Math.sin(inclination)
      points[index * 3 + 2] = flatZ * Math.cos(inclination)
    }
    const result = new BufferGeometry()
    result.setAttribute('position', new BufferAttribute(points, 3))
    return result
  }, [body.inclinationDeg, radius])

  return (
    <lineLoop geometry={geometry} raycast={() => null}>
      <lineBasicMaterial color={color} transparent opacity={opacity} depthWrite={false} />
    </lineLoop>
  )
}
