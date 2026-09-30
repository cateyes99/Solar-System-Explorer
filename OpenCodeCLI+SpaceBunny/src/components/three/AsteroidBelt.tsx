import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import {
  Color,
  DynamicDrawUsage,
  Euler,
  IcosahedronGeometry,
  InstancedMesh,
  Matrix4,
  MeshStandardMaterial,
  Quaternion,
  Vector3,
} from 'three'
import { mulberry32 } from '../../utils/math'
import { orbitRadiusUnits } from '../../utils/scale'
import type { ScaleSettings } from '../../types'

interface Rock {
  radius: number
  phase: number
  speed: number
  inclination: number
  node: number
  eccentricity: number
  size: number
  spin: number
  tint: number
}

const BELT_INNER_AU = 2.1
const BELT_OUTER_AU = 3.4

/**
 * The asteroid belt as a single instanced mesh — one draw call for ~1,400 rocks.
 * A realistic belt is almost entirely empty space, so the rocks are spread wide
 * and sized down. Rotation period is derived from Kepler's third law so the
 * inner rocks really do orbit faster.
 */
export function AsteroidBelt({ count = 1400, scale }: { count?: number; scale: ScaleSettings }) {
  const meshRef = useRef<InstancedMesh>(null)

  const geometry = useMemo(() => new IcosahedronGeometry(1, 0), [])
  const material = useMemo(
    () =>
      new MeshStandardMaterial({
        roughness: 0.95,
        metalness: 0.08,
        vertexColors: false,
        flatShading: true,
      }),
    [],
  )

  const rocks = useMemo(() => {
    const rand = mulberry32(31337)
    const list: Rock[] = []
    for (let i = 0; i < count; i += 1) {
      // Denser towards the middle of the belt.
      const t = Math.pow(rand(), 0.7)
      const au = BELT_INNER_AU + (BELT_OUTER_AU - BELT_INNER_AU) * t
      // Kepler's third law: period in years = a^1.5 (a in AU), in days = *365.
      const periodDays = Math.pow(au, 1.5) * 365.25
      list.push({
        radius: orbitRadiusUnits(au, scale.distanceExponent),
        phase: rand() * Math.PI * 2,
        speed: (Math.PI * 2) / periodDays,
        inclination: (rand() - 0.5) * 0.28,
        node: rand() * Math.PI * 2,
        eccentricity: (rand() - 0.5) * 0.18,
        size: 0.13 + rand() * 0.3,
        spin: (rand() - 0.5) * 1.6,
        tint: 0.55 + rand() * 0.45,
      })
    }
    return list
  }, [count, scale.distanceExponent])

  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    mesh.instanceMatrix.setUsage(DynamicDrawUsage)
    return () => {
      geometry.dispose()
      material.dispose()
    }
  }, [geometry, material])

  const dummy = useMemo(() => new Matrix4(), [])
  const position = useMemo(() => new Vector3(), [])
  const quaternion = useMemo(() => new Quaternion(), [])
  const rotation = useMemo(() => new Euler(), [])
  const scaleVec = useMemo(() => new Vector3(), [])
  const color = useMemo(() => new Color(), [])
  const baseColor = useMemo(() => new Color('#6f6558'), [])

  // Per-instance colour is baked once; only the matrices change per frame.
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    rocks.forEach((rock, index) => {
      color.copy(baseColor).multiplyScalar(0.6 + rock.tint * 0.7)
      mesh.setColorAt(index, color)
    })
    if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true
  }, [rocks, color, baseColor])

  useFrame(({ clock }) => {
    const mesh = meshRef.current
    if (!mesh) return
    const t = clock.elapsedTime

    for (let i = 0; i < rocks.length; i += 1) {
      const rock = rocks[i]
      const angle = rock.phase + t * rock.speed
      const r = rock.radius * (1 - rock.eccentricity * 0.5)
      position.set(
        Math.cos(angle) * r,
        Math.sin(angle) * rock.inclination * r,
        Math.sin(angle) * r,
      )
      rotation.set(t * rock.spin, t * rock.spin * 0.7, t * rock.spin * 1.3)
      quaternion.setFromEuler(rotation)
      scaleVec.setScalar(rock.size)
      dummy.compose(position, quaternion, scaleVec)
      mesh.setMatrixAt(i, dummy)
    }
    mesh.instanceMatrix.needsUpdate = true
  })

  return (
    <instancedMesh
      ref={meshRef}
      args={[geometry, material, count]}
      frustumCulled={false}
      castShadow={false}
      receiveShadow={false}
    />
  )
}