import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { BufferAttribute, BufferGeometry, Points } from 'three'
import { createStarMaterial } from './materials'
import { mulberry32 } from '../../utils/math'
import { useAppStore } from '../../store/useAppStore'

/**
 * Three shells of stars with different depth layers, per-star colour temperature
 * and a gentle twinkle. One draw call for the whole sky.
 */
export function StarField({ count = 9000 }: { count?: number }) {
  const reducedMotion = useAppStore((s) => s.reducedMotion)
  const dpr = useThree((state) => state.viewport.dpr)
  const pointsRef = useRef<Points>(null)

  const geometry = useMemo(() => {
    const rand = mulberry32(90210)
    const positions = new Float32Array(count * 3)
    const colors = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const phases = new Float32Array(count)

    // Colour temperature ramp: hot blue-white through to cool red giants.
    const palette: [number, number, number][] = [
      [0.68, 0.78, 1.0],
      [0.82, 0.88, 1.0],
      [1.0, 1.0, 0.98],
      [1.0, 0.94, 0.82],
      [1.0, 0.82, 0.65],
      [1.0, 0.72, 0.55],
    ]

    const shellRadii = [340, 620, 1100]

    for (let i = 0; i < count; i += 1) {
      const shell = i % shellRadii.length
      const radius = shellRadii[shell] * (0.9 + rand() * 0.2)

      // Uniform distribution on a sphere.
      const u = rand() * 2 - 1
      const theta = rand() * Math.PI * 2
      const s = Math.sqrt(1 - u * u)
      positions[i * 3] = radius * s * Math.cos(theta)
      positions[i * 3 + 1] = radius * u
      positions[i * 3 + 2] = radius * s * Math.sin(theta)

      const pick = rand()
      const color = palette[Math.min(palette.length - 1, Math.floor(pick ** 1.6 * palette.length))]
      const brightness = 0.3 + rand() * 0.34
      colors[i * 3] = color[0] * brightness
      colors[i * 3 + 1] = color[1] * brightness
      colors[i * 3 + 2] = color[2] * brightness

      const rare = rand()
      // Most stars sit below the bloom threshold so the sky stays crisp; a rare
      // few are bright enough to sparkle.
      sizes[i] = rare > 0.988 ? 4.5 + rand() * 3 : 0.9 + rand() * 1.4
      phases[i] = rand() * Math.PI * 2
    }

    const geo = new BufferGeometry()
    geo.setAttribute('position', new BufferAttribute(positions, 3))
    geo.setAttribute('aColor', new BufferAttribute(colors, 3))
    geo.setAttribute('aSize', new BufferAttribute(sizes, 1))
    geo.setAttribute('aPhase', new BufferAttribute(phases, 1))
    return geo
  }, [count])

  const material = useMemo(() => createStarMaterial(dpr), [dpr])

  useFrame((state) => {
    material.uniforms.uTime.value = reducedMotion ? 0 : state.clock.elapsedTime
    // Rotate the whole field very slowly so the sky drifts.
    if (pointsRef.current) {
      pointsRef.current.rotation.y = reducedMotion ? 0 : state.clock.elapsedTime * 0.0022
    }
  })

  return <points ref={pointsRef} geometry={geometry} material={material} frustumCulled={false} />
}