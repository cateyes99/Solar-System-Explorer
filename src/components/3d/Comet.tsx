import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { useFrame } from '@react-three/fiber'
import { DEG, TAU, totalDaysSinceJ2000 } from '../../utils/astronomy'
import { getGlowTexture } from '../../utils/textures'
import { mulberry32 } from '../../utils/noise'
import { useSimulation } from '../../store/simulationStore'
import { useClickWithoutDrag } from '../../hooks/usePointerDragGuard'

const TAIL_COUNT = 110
/** Ellipse parameters in educational scene units (between the belt and Neptune). */
const A = 36
const E = 0.72
const PERIOD_DAYS = 1100
const INCL = 18 * DEG
const NODE = 2.2

const X_AXIS = new THREE.Vector3(1, 0, 0)
const Y_AXIS = new THREE.Vector3(0, 1, 0)

function planeToWorld(v: THREE.Vector3, out: THREE.Vector3): THREE.Vector3 {
  out.copy(v).applyAxisAngle(X_AXIS, INCL).applyAxisAngle(Y_AXIS, NODE)
  return out
}

function radiusAt(theta: number): number {
  return (A * (1 - E * E)) / (1 + E * Math.cos(theta))
}

/** Solve Kepler's equation: returns distance + true anomaly. */
function cometState(days: number): { r: number; theta: number } {
  const M = (TAU * (((days % PERIOD_DAYS) + PERIOD_DAYS) % PERIOD_DAYS)) / PERIOD_DAYS
  let eccentric = M
  for (let i = 0; i < 5; i++) {
    eccentric -= (eccentric - E * Math.sin(eccentric) - M) / (1 - E * Math.cos(eccentric))
  }
  const theta =
    2 * Math.atan2(Math.sqrt(1 + E) * Math.sin(eccentric / 2), Math.sqrt(1 - E) * Math.cos(eccentric / 2))
  return { r: A * (1 - E * Math.cos(eccentric)), theta }
}

/** A hidden comet on a long, eccentric orbit — finding it is an easter egg. */
export function Comet(): JSX.Element {
  const guard = useClickWithoutDrag()
  const nucleusGroup = useRef<THREE.Group>(null)
  const coma = useRef<THREE.Sprite>(null)
  const tailPoints = useRef<THREE.Points>(null)
  const lastToast = useRef(0)

  const glow = useMemo(
    () => getGlowTexture('rgba(210,240,255,0.95)', 'rgba(120,190,255,0.35)', 'rgba(60,110,220,0)'),
    [],
  )
  const tailData = useMemo(() => {
    const rnd = mulberry32(777)
    const jitter = new Float32Array(TAIL_COUNT * 3)
    for (let i = 0; i < TAIL_COUNT * 3; i++) jitter[i] = (rnd() * 2 - 1) * 0.12
    return jitter
  }, [])
  const tailGeometry = useMemo(() => {
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(TAIL_COUNT * 3), 3))
    return g
  }, [])
  const tailMaterial = useMemo(
    () =>
      new THREE.PointsMaterial({
        size: 0.55,
        map: glow,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
        color: new THREE.Color('#bfe3ff'),
        opacity: 0.75,
      }),
    [glow],
  )
  const comaMaterial = useMemo(
    () =>
      new THREE.SpriteMaterial({
        map: glow,
        transparent: true,
        depthWrite: false,
        blending: THREE.AdditiveBlending,
      }),
    [glow],
  )
  const orbitGeometry = useMemo(() => {
    const pts: number[] = []
    for (let i = 0; i < 220; i++) {
      const theta = (i / 220) * TAU
      const r = radiusAt(theta)
      pts.push(Math.cos(theta) * r, 0, -Math.sin(theta) * r)
    }
    const g = new THREE.BufferGeometry()
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3))
    return g
  }, [])

  useEffect(
    () => () => {
      tailGeometry.dispose()
      orbitGeometry.dispose()
    },
    [tailGeometry, orbitGeometry],
  )

  const planePos = useMemo(() => new THREE.Vector3(), [])
  const worldPos = useMemo(() => new THREE.Vector3(), [])
  const tmp = useMemo(() => new THREE.Vector3(), [])

  useFrame((state) => {
    const { r, theta } = cometState(totalDaysSinceJ2000())
    planePos.set(Math.cos(theta) * r, 0, -Math.sin(theta) * r)
    planeToWorld(planePos, worldPos)
    if (nucleusGroup.current) nucleusGroup.current.position.copy(planePos)
    if (coma.current) {
      const s = THREE.MathUtils.clamp(26 / r, 0.8, 3.4) * 2
      coma.current.scale.set(s, s, 1)
    }
    // Dust tail: points away from the Sun, longer and brighter near perihelion.
    const p = tailPoints.current
    if (p) {
      const len = THREE.MathUtils.clamp(140 / r, 2.5, 14)
      const dir = tmp.copy(worldPos).normalize()
      const t = state.clock.elapsedTime
      const pos = p.geometry.getAttribute('position') as THREE.BufferAttribute
      for (let i = 0; i < TAIL_COUNT; i++) {
        const f = (i + 1) / TAIL_COUNT
        const wobble = Math.sin(t * 1.5 + i) * 0.05 * f
        pos.setXYZ(
          i,
          worldPos.x + dir.x * len * f + tailData[i * 3] * len * f * 0.5 + wobble,
          worldPos.y + dir.y * len * f + tailData[i * 3 + 1] * len * f * 0.5,
          worldPos.z + dir.z * len * f + tailData[i * 3 + 2] * len * f * 0.5,
        )
      }
      pos.needsUpdate = true
    }
  })

  return (
    <>
      <group rotation={[0, NODE, 0]}>
        <group rotation={[INCL, 0, 0]}>
          <lineLoop geometry={orbitGeometry}>
            <lineBasicMaterial color="#7fa8d9" transparent opacity={0.1} depthWrite={false} />
          </lineLoop>
          <group ref={nucleusGroup}>
            <mesh
              onPointerDown={guard.onPointerDown}
              onClick={(e) => {
                if (!guard.wasClick(e)) return
                e.stopPropagation()
                const now = Date.now()
                if (now - lastToast.current > 15000) {
                  lastToast.current = now
                  useSimulation
                    .getState()
                    .pushToast(
                      'You found the comet! ☄️ Comets are giant "dirty snowballs" of ice and dust.',
                      '💫',
                    )
                }
              }}
            >
              <sphereGeometry args={[0.14, 12, 10]} />
              <meshStandardMaterial color="#dfe9f2" roughness={0.8} />
            </mesh>
            <sprite ref={coma} material={comaMaterial} />
          </group>
        </group>
      </group>
      <points ref={tailPoints} geometry={tailGeometry} material={tailMaterial} frustumCulled={false} />
    </>
  )
}
