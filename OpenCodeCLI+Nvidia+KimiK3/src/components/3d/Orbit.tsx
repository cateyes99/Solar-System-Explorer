import { useMemo, useRef } from 'react'
import * as THREE from 'three'

export function Orbit({ radius }: { radius: number }) {
  const geometry = useMemo(() => {
    const points: THREE.Vector3[] = []
    for (let i = 0; i <= 128; i++) {
      const a = (i / 128) * Math.PI * 2
      points.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius))
    }
    return new THREE.BufferGeometry().setFromPoints(points)
  }, [radius])

  return (
    <primitive object={useMemo(() => {
      const line = new THREE.Line(
        geometry,
        new THREE.LineBasicMaterial({ color: '#4a5a8a', transparent: true, opacity: 0.35 }),
      )
      return line
    }, [geometry])} />
  )
}
