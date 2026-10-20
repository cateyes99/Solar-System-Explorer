import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { BufferGeometry, Float32BufferAttribute, Points, Vector3, type Group, type Mesh } from 'three'
import { createNebulaMaterial, createStarMaterial } from '../../graphics/materials'
import { mulberry32 } from '../../graphics/noise'
import { useSimulationStore, type Quality } from '../../store/simulationStore'
import { getSphere, useTextures } from './shared'

const COUNTS: Record<Quality, number> = { high: 9000, balanced: 6000, low: 3000 }

const STAR_COLORS: [number, number, number][] = [
  [0.7, 0.8, 1.0],
  [0.85, 0.9, 1.0],
  [1.0, 1.0, 1.0],
  [1.0, 0.95, 0.85],
  [1.0, 0.85, 0.65],
  [1.0, 0.72, 0.5],
]

/** Thousands of stars in three depth layers, denser along a Milky Way band. */
export function StarField() {
  const quality = useSimulationStore((s) => s.quality)
  const dpr = useThree((s) => s.viewport.dpr)
  const groupRef = useRef<Group>(null)
  const count = COUNTS[quality]

  const points = useMemo(() => {
    const random = mulberry32(42)
    const positions = new Float32Array(count * 3)
    const sizes = new Float32Array(count)
    const colors = new Float32Array(count * 3)
    const phases = new Float32Array(count)
    const bandNormal = new Vector3(0.32, 0.88, 0.35).normalize()
    const dir = new Vector3()
    for (let i = 0; i < count; i++) {
      dir.set(random() * 2 - 1, random() * 2 - 1, random() * 2 - 1)
      if (dir.lengthSq() < 1e-4) dir.set(1, 0, 0)
      dir.normalize()
      if (random() < 0.35) {
        // Squash towards the galactic plane to create a Milky Way band.
        const d = dir.dot(bandNormal)
        dir.addScaledVector(bandNormal, -d * 0.88).normalize()
      }
      const layer = random()
      const radius = layer < 0.6 ? 5200 + random() * 900 : layer < 0.9 ? 4200 + random() * 700 : 3300 + random() * 600
      positions[i * 3] = dir.x * radius
      positions[i * 3 + 1] = dir.y * radius
      positions[i * 3 + 2] = dir.z * radius
      const bright = Math.pow(random(), 6)
      sizes[i] = 1.2 + bright * 4.2 + (layer > 0.9 ? 0.8 : 0)
      const c = STAR_COLORS[Math.floor(random() * STAR_COLORS.length)]
      const dim = 0.45 + bright * 0.55 + random() * 0.2
      colors[i * 3] = c[0] * dim
      colors[i * 3 + 1] = c[1] * dim
      colors[i * 3 + 2] = c[2] * dim
      phases[i] = random()
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new Float32BufferAttribute(positions, 3))
    geometry.setAttribute('aSize', new Float32BufferAttribute(sizes, 1))
    geometry.setAttribute('aColor', new Float32BufferAttribute(colors, 3))
    geometry.setAttribute('aPhase', new Float32BufferAttribute(phases, 1))
    const p = new Points(geometry, createStarMaterial(1))
    p.frustumCulled = false
    return p
  }, [count])

  const material = points.material as ReturnType<typeof createStarMaterial>

  useEffect(() => {
    material.uniforms.uPixelRatio.value = dpr
  }, [dpr, material])

  useEffect(
    () => () => {
      points.geometry.dispose()
      material.dispose()
    },
    [points, material],
  )

  useFrame((_, delta) => {
    const reduced = useSimulationStore.getState().reducedMotion
    material.uniforms.uTime.value += delta
    material.uniforms.uTwinkle.value = reduced ? 0 : 1
    if (groupRef.current && !reduced) groupRef.current.rotation.y += delta * 0.0015
  })

  return (
    <group ref={groupRef}>
      <primitive object={points} />
    </group>
  )
}

/** Faint coloured clouds painted on a huge sphere that travels with the camera. */
export function Nebula() {
  const textures = useTextures()
  const meshRef = useRef<Mesh>(null)
  const material = useMemo(() => createNebulaMaterial(textures.nebula), [textures])
  useEffect(() => () => material.dispose(), [material])

  useFrame(({ camera }, delta) => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.position.copy(camera.position)
    if (!useSimulationStore.getState().reducedMotion) mesh.rotation.y += delta * 0.001
  })

  return <mesh ref={meshRef} geometry={getSphere(32)} material={material} scale={9000} renderOrder={-10} frustumCulled={false} />
}
