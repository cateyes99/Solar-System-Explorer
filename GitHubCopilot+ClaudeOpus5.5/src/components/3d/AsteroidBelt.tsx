import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import {
  Color,
  IcosahedronGeometry,
  InstancedMesh,
  MeshStandardMaterial,
  Object3D,
  type Group,
} from 'three'
import { mulberry32 } from '../../graphics/noise'
import { layoutState, simClock } from '../../store/runtime'
import { useSimulationStore, type Quality } from '../../store/simulationStore'
import { TAU } from '../../utils/astronomy'

const COUNTS: Record<Quality, number> = { high: 2600, balanced: 1600, low: 800 }
const BELT_PERIOD_DAYS = 4.6 * 365.25
const dummy = new Object3D()

interface Rock {
  u: number
  angle: number
  height: number
  size: number
  rx: number
  ry: number
  rz: number
}

/** One instanced mesh for thousands of tumbling space rocks. */
export function AsteroidBelt() {
  const quality = useSimulationStore((s) => s.quality)
  const count = COUNTS[quality]
  const groupRef = useRef<Group>(null)
  const lastBounds = useRef({ inner: -1, outer: -1 })

  const { mesh, rocks } = useMemo(() => {
    const random = mulberry32(2024)
    const geometry = new IcosahedronGeometry(1, 0)
    const material = new MeshStandardMaterial({ roughness: 1, metalness: 0, flatShading: true })
    const instanced = new InstancedMesh(geometry, material, count)
    const color = new Color()
    const list: Rock[] = []
    for (let i = 0; i < count; i++) {
      const g = (random() + random() + random()) / 3
      list.push({
        u: g,
        angle: random() * TAU,
        height: (random() + random() - 1) * 0.5,
        size: 0.02 + Math.pow(random(), 4) * 0.11,
        rx: random() * TAU,
        ry: random() * TAU,
        rz: random() * TAU,
      })
      const shade = 0.35 + random() * 0.35
      color.setRGB(shade * (1 + random() * 0.15), shade * 0.92, shade * 0.82)
      instanced.setColorAt(i, color)
    }
    instanced.frustumCulled = false
    return { mesh: instanced, rocks: list }
  }, [count])

  useEffect(() => {
    lastBounds.current = { inner: -1, outer: -1 }
    return () => {
      mesh.geometry.dispose()
      ;(mesh.material as MeshStandardMaterial).dispose()
      mesh.dispose()
    }
  }, [mesh])

  useFrame(() => {
    const { beltInner, beltOuter } = layoutState.current
    const last = lastBounds.current
    if (Math.abs(last.inner - beltInner) > 1e-3 || Math.abs(last.outer - beltOuter) > 1e-3) {
      last.inner = beltInner
      last.outer = beltOuter
      const width = beltOuter - beltInner
      for (let i = 0; i < rocks.length; i++) {
        const rock = rocks[i]
        const radius = beltInner + rock.u * width
        dummy.position.set(Math.cos(rock.angle) * radius, rock.height * width * 0.12, -Math.sin(rock.angle) * radius)
        dummy.rotation.set(rock.rx, rock.ry, rock.rz)
        dummy.scale.setScalar(rock.size * Math.max(0.6, Math.min(2.2, width / 7)))
        dummy.updateMatrix()
        mesh.setMatrixAt(i, dummy.matrix)
      }
      mesh.instanceMatrix.needsUpdate = true
    }
    if (groupRef.current) groupRef.current.rotation.y = ((simClock.days / BELT_PERIOD_DAYS) % 1) * TAU
  }, -1)

  return (
    <group ref={groupRef}>
      <primitive object={mesh} />
    </group>
  )
}
