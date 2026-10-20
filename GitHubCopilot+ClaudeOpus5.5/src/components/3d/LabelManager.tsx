import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { BodyId } from '../../data/types'
import { labelElements, sunGoneState } from '../../store/runtime'
import { useSimulationStore } from '../../store/simulationStore'
import { getBodyRadius, getBodyWorldPosition } from './shared'

const PRIORITY: BodyId[] = ['sun', 'jupiter', 'saturn', 'earth', 'uranus', 'neptune', 'mars', 'venus', 'mercury', 'moon']
const position = new Vector3()
const earth = new Vector3()
const placed: { x: number; y: number }[] = []
const lastOpacity = new WeakMap<HTMLElement, number>()
const toBody = new Vector3()

/** True when the Sun sits between the camera and the body. */
function isBehindSun(cameraPos: Vector3, bodyPos: Vector3, bodyDistance: number): boolean {
  const sunRadius = getBodyRadius('sun') * 1.3
  toBody.subVectors(bodyPos, cameraPos).divideScalar(bodyDistance || 1)
  const along = -cameraPos.dot(toBody)
  if (along <= 0 || along >= bodyDistance) return false
  const closestSq = cameraPos.lengthSq() - along * along
  return closestSq < sunRadius * sunRadius
}

/** Projects label anchors to the screen, fades them by distance and hides ones that would overlap a more important label. */
export function LabelManager() {
  const camera = useThree((s) => s.camera)
  const size = useThree((s) => s.size)

  useFrame((_, delta) => {
    if (labelElements.size === 0) return
    placed.length = 0
    const { selectedId, infoOpen, hoveredId } = useSimulationStore.getState()
    const k = 1 - Math.exp(-delta * 10)
    for (const id of PRIORITY) {
      const el = labelElements.get(id)
      if (!el) continue
      getBodyWorldPosition(id, position)
      const radius = getBodyRadius(id)
      const distance = camera.position.distanceTo(position)
      const hiddenBySun = id !== 'sun' && isBehindSun(camera.position, position, distance)
      position.y += radius * (id === 'saturn' ? 1.25 : 1.1)
      position.project(camera)
      const sx = (position.x * 0.5 + 0.5) * size.width
      const sy = (-position.y * 0.5 + 0.5) * size.height

      let target = position.z > 1 || position.z < -1 || hiddenBySun ? 0 : 1
      if (id === 'sun' && sunGoneState.active) target = 0
      if (distance < radius * 2.6) target = 0
      if (id === 'moon') {
        getBodyWorldPosition('earth', earth)
        if (camera.position.distanceTo(earth) > 40) target = 0
      }
      if (target > 0 && id !== hoveredId) {
        for (const p of placed) {
          if (Math.abs(p.x - sx) < 78 && Math.abs(p.y - sy) < 24) {
            target = 0
            break
          }
        }
      }
      if (id === selectedId && infoOpen) target = Math.min(target, 0.55)
      if (target > 0) placed.push({ x: sx, y: sy })

      el.style.transform = `translate3d(${sx.toFixed(1)}px, ${sy.toFixed(1)}px, 0) translate(-50%, -100%)`
      const prev = lastOpacity.get(el) ?? 0
      const next = Math.abs(target - prev) < 0.01 ? target : prev + (target - prev) * k
      if (next !== prev) {
        el.style.opacity = next.toFixed(3)
        lastOpacity.set(el, next)
      }
    }
  })
  return null
}
