import { useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import * as THREE from 'three'

/** Procedural multi-layer star field with subtle twinkle. */
export function StarField({ count = 4500 }: { count?: number }) {
  const ref = useRef<THREE.Points>(null)
  const twinkleRef = useRef<THREE.Points>(null)

  const [positions, colors, sizes] = useMemo(() => {
    const pos = new Float32Array(count * 3)
    const col = new Float32Array(count * 3)
    const siz = new Float32Array(count)
    const palette = [
      new THREE.Color('#ffffff'),
      new THREE.Color('#cfe4ff'),
      new THREE.Color('#ffe9c8'),
      new THREE.Color('#d8ccff'),
    ]
    for (let i = 0; i < count; i++) {
      // random point on a large sphere shell, several depth layers
      const r = 400 + Math.random() * 700
      const theta = Math.random() * Math.PI * 2
      const phi = Math.acos(2 * Math.random() - 1)
      pos[i * 3] = r * Math.sin(phi) * Math.cos(theta)
      pos[i * 3 + 1] = r * Math.cos(phi)
      pos[i * 3 + 2] = r * Math.sin(phi) * Math.sin(theta)
      const c = palette[Math.floor(Math.random() * palette.length)]
      col[i * 3] = c.r; col[i * 3 + 1] = c.g; col[i * 3 + 2] = c.b
      siz[i] = 0.6 + Math.random() * 1.8
    }
    return [pos, col, siz]
  }, [count])

  useFrame((state) => {
    if (ref.current) ref.current.rotation.y += 0.00008
    if (twinkleRef.current) {
      const mat = twinkleRef.current.material as THREE.PointsMaterial
      mat.opacity = 0.55 + Math.sin(state.clock.elapsedTime * 1.7) * 0.25
    }
  })

  return (
    <group>
      <points ref={ref}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-color" args={[colors, 3]} />
          <bufferAttribute attach="attributes-size" args={[sizes, 1]} />
        </bufferGeometry>
        <pointsMaterial size={1.4} vertexColors sizeAttenuation={false} transparent opacity={0.9} depthWrite={false} />
      </points>
      {/* a second sparse bright layer that twinkles */}
      <points ref={twinkleRef}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions.slice(0, 300 * 3), 3]} />
          <bufferAttribute attach="attributes-color" args={[colors.slice(0, 300 * 3), 3]} />
        </bufferGeometry>
        <pointsMaterial size={2.4} vertexColors sizeAttenuation={false} transparent opacity={0.8} depthWrite={false} />
      </points>
    </group>
  )
}
