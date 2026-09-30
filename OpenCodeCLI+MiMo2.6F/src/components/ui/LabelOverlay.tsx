import { useEffect, useMemo, useRef } from 'react'
import * as THREE from 'three'
import { PLANETS } from '../../data/planets'
import { useSimStore } from '../../store/simulationStore'
import { useScale } from '../../hooks/useScale'
import { getBodyPosition } from '../../utils/simClock'
import { labelBridge } from '../../utils/labelBridge'

/**
 * Body name labels.
 *
 * These are plain DOM nodes projected from 3D world positions each animation
 * frame — no React re-renders and no per-label React roots. (drei's <Html>
 * mounts its own react-dom root per label and unmounts it inside the scene's
 * commit phase, which makes React 19 report "synchronously unmount a root".)
 *
 * Chips that would overlap are pushed radially away from the Sun and joined to
 * their body with a thin leader line, so the crowded inner system stays readable.
 */

interface LabelDef {
  id: string
  /** Default caption shown in the chip */
  text: string
  /** Anchor height above the body, expressed in body radii */
  offset: number
}

const LABELS: LabelDef[] = [
  { id: 'sun', text: 'The Sun', offset: 1.25 },
  ...PLANETS.map((body) => ({ id: body.id, text: body.name, offset: 1.35 })),
  { id: 'moon', text: 'The Moon', offset: 1.7 },
]

/** Placement order: the Sun first, then planets largest first, Moon last. */
const ORDER: number[] = [
  0,
  ...PLANETS.map((body, index) => ({ index: index + 1, diameter: body.diameterKm }))
    .sort((a, b) => b.diameter - a.diameter)
    .map((entry) => entry.index),
  LABELS.length - 1,
]

/** Radial de-cluttering tuning (screen pixels). */
const PUSH_STEP = 16
const MAX_PUSH = 14
const MIN_GAP = 5

/** HUD bands that labels must never sit underneath. */
function hudBands(width: number): { top: number; bottom: number } {
  return width < 640 ? { top: 64, bottom: 210 } : { top: 74, bottom: 152 }
}

// Scratch objects: the projection loop must not allocate.
const anchorPos = new THREE.Vector3()
const viewPos = new THREE.Vector3()
const viewInv = new THREE.Matrix4()
const centerScreen = new THREE.Vector2()
const anchorScreen = new THREE.Vector2()
const sunScreen = new THREE.Vector2()

interface Slot {
  ok: boolean
  /** Body centre, screen px */
  bx: number
  by: number
  /** Label anchor, screen px */
  ax: number
  ay: number
}

const rects: number[][] = []
const slots: Slot[] = LABELS.map(() => ({ ok: false, bx: 0, by: 0, ax: 0, ay: 0 }))
/** Reusable direction table: radial out/in, tangential, then axis aligned. */
const directions = new Float64Array(16)

function overlaps(x: number, y: number, halfW: number, halfH: number): boolean {
  const left = x - halfW - MIN_GAP
  const right = x + halfW + MIN_GAP
  const top = y - halfH - MIN_GAP
  const bottom = y + halfH + MIN_GAP
  for (let i = 0; i < rects.length; i++) {
    const r = rects[i]
    if (left < r[0] + r[2] && right > r[0] && top < r[1] + r[3] && bottom > r[1]) return true
  }
  return false
}

export function LabelOverlay() {
  const scale = useScale()
  const earthAsJupiter = useSimStore((s) => s.whatIf.earthAsJupiter)
  const nodesRef = useRef<(HTMLDivElement | null)[]>([])
  const leadersRef = useRef<(SVGLineElement | null)[]>([])

  // Body radii (world units) — recomputed only when the scale mode changes.
  const radii = useMemo(() => {
    const map: Record<string, number> = {
      sun: scale.sunRadius,
      moon: Math.max(0.1, scale.planetRadius(3_475)),
    }
    for (const body of PLANETS) {
      const diameter = body.id === 'earth' && earthAsJupiter ? 139_820 : body.diameterKm
      map[body.id] = Math.max(0.16, scale.planetRadius(diameter))
    }
    return map
  }, [scale, earthAsJupiter])
  const radiiRef = useRef(radii)
  radiiRef.current = radii

  useEffect(() => {
    let frame = 0
    // Cached chip sizes (0 = needs measuring). Reading layout every frame
    // would force a reflow, so we only measure lazily.
    const sizes = LABELS.map(() => ({ w: 0, h: 0 }))
    const order: number[] = []
    const hide = (index: number) => {
      const node = nodesRef.current[index]
      if (node && node.style.visibility !== 'hidden') node.style.visibility = 'hidden'
      const leader = leadersRef.current[index]
      if (leader && leader.style.opacity !== '0') leader.style.opacity = '0'
    }

    // Re-measure after web fonts settle (chip widths can change).
    document.fonts?.ready.then(() => {
      sizes.forEach((size) => {
        size.w = 0
        size.h = 0
      })
    })

    const tick = () => {
      frame = requestAnimationFrame(tick)
      const camera = labelBridge.camera
      if (!camera) return

      const state = useSimStore.getState()
      const radii = radiiRef.current
      const width = labelBridge.width || window.innerWidth
      const height = labelBridge.height || window.innerHeight

      camera.updateMatrixWorld()
      viewInv.copy(camera.matrixWorld).invert()

      const project = (world: THREE.Vector3, out: THREE.Vector2): boolean => {
        viewPos.copy(world).applyMatrix4(viewInv)
        if (viewPos.z > 0) return false
        viewPos.applyMatrix4(camera.projectionMatrix)
        out.set((viewPos.x * 0.5 + 0.5) * width, (-viewPos.y * 0.5 + 0.5) * height)
        return true
      }

      const sunVisible = project(getBodyPosition('sun'), sunScreen)
      const bands = hudBands(width)
      rects.length = 0
      // Reserve the header and time-control bands so chips are never hidden
      // behind the HUD.
      rects.push([0, 0, width, bands.top], [0, height - bands.bottom, width, bands.bottom])

      // 1. Desired positions for every body label.
      for (let i = 0; i < LABELS.length; i++) {
        const def = LABELS[i]
        const slot = slots[i]
        const radius = radii[def.id] ?? 1

        anchorPos.copy(getBodyPosition(def.id))
        const centerOk = project(anchorPos, centerScreen)
        anchorPos.y += radius * def.offset
        const anchorOk = project(anchorPos, anchorScreen)

        slot.ok = centerOk && anchorOk
        slot.bx = centerScreen.x
        slot.by = centerScreen.y
        slot.ax = anchorScreen.x
        slot.ay = anchorScreen.y
      }

      // 2. Placement order: whatever is hovered or selected claims its spot first.
      order.length = 0
      const priority =
        state.hoveredId && LABELS.findIndex((d) => d.id === state.hoveredId) !== -1
          ? LABELS.findIndex((d) => d.id === state.hoveredId)
          : state.selectedId
            ? LABELS.findIndex((d) => d.id === state.selectedId)
            : -1
      if (priority >= 0) order.push(priority)
      for (let i = 0; i < ORDER.length; i++) {
        if (ORDER[i] !== priority) order.push(ORDER[i])
      }

      // 3. Place, pushing colliding chips away from the Sun.
      for (let o = 0; o < order.length; o++) {
        const index = order[o]
        const def = LABELS[index]
        const slot = slots[index]
        const node = nodesRef.current[index]
        const leader = leadersRef.current[index]
        if (!node) continue

        const visible = (state.showLabels || state.hoveredId === def.id) && slot.ok
        if (!visible) {
          hide(index)
          continue
        }

        if (sizes[index].w === 0) {
          sizes[index].w = node.offsetWidth
          sizes[index].h = node.offsetHeight
        }
        const chipW = sizes[index].w
        const chipH = sizes[index].h
        const halfChipW = chipW / 2
        const halfChipH = chipH / 2

        const isPriority =
          index === priority || state.hoveredId === def.id || state.selectedId === def.id

        let placedX = slot.ax
        let placedY = slot.ay

        if (!isPriority) {
          // Search outward from the desired point: radially first (so chips fan
          // away from the Sun), then tangentially and along the axes.
          let radialX = sunVisible ? slot.ax - sunScreen.x : 0
          let radialY = sunVisible ? slot.ay - sunScreen.y : -1
          const length = Math.hypot(radialX, radialY) || 1
          radialX /= length
          radialY /= length

          directions[0] = radialX
          directions[1] = radialY
          directions[2] = -radialX
          directions[3] = -radialY
          directions[4] = -radialY
          directions[5] = radialX
          directions[6] = radialY
          directions[7] = -radialX
          directions[8] = 0
          directions[9] = -1
          directions[10] = 0
          directions[11] = 1
          directions[12] = -1
          directions[13] = 0
          directions[14] = 1
          directions[15] = 0

          let found = false
          for (let step = 0; step <= MAX_PUSH && !found; step++) {
            const distance = PUSH_STEP * step
            for (let d = 0; d < directions.length && !found; d += 2) {
              const x = slot.ax + directions[d] * distance
              const y = slot.ay + directions[d + 1] * distance
              if (
                x - halfChipW < 2 ||
                x + halfChipW > width - 2 ||
                y - halfChipH < 2 ||
                y + halfChipH > height - 2
              ) {
                continue
              }
              if (!overlaps(x, y, halfChipW, halfChipH)) {
                placedX = x
                placedY = y
                found = true
              }
            }
          }
          if (!found) {
            hide(index)
            continue
          }
        }

        rects.push([placedX - halfChipW, placedY - halfChipH, chipW, chipH])

        node.style.visibility = 'visible'
        node.style.transform = `translate3d(${placedX.toFixed(1)}px, ${placedY.toFixed(1)}px, 0) translate(-50%, -50%)`

        const nextState =
          state.selectedId === def.id ? 'selected' : state.hoveredId === def.id ? 'hovered' : 'idle'
        if (node.dataset.state !== nextState) node.dataset.state = nextState

        const caption =
          def.id === 'earth' && state.whatIf.earthAsJupiter
            ? 'Earth (as big as Jupiter!)'
            : def.text
        const textNode = node.firstElementChild
        if (textNode && textNode.textContent !== caption) {
          textNode.textContent = caption
          sizes[index].w = 0 // caption changed → re-measure next frame
        }

        // Leader line back to the body when the chip had to be pushed away.
        if (leader) {
          const distance = Math.hypot(placedX - slot.bx, placedY - slot.by)
          if (distance > 14 + halfChipH) {
            leader.setAttribute('x1', slot.bx.toFixed(1))
            leader.setAttribute('y1', slot.by.toFixed(1))
            leader.setAttribute('x2', placedX.toFixed(1))
            leader.setAttribute('y2', placedY.toFixed(1))
            if (leader.style.opacity !== '1') leader.style.opacity = '1'
          } else if (leader.style.opacity !== '0') {
            leader.style.opacity = '0'
          }
        }
      }
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [])

  return (
    <div
      className="pointer-events-none fixed inset-0 z-20 overflow-hidden"
      aria-hidden="true"
      data-testid="label-overlay"
    >
      <svg className="label-leaders" aria-hidden="true">
        {LABELS.map((label, index) => (
          <line
            key={label.id}
            ref={(node) => {
              leadersRef.current[index] = node
            }}
            x1="0"
            y1="0"
            x2="0"
            y2="0"
          />
        ))}
      </svg>
      {LABELS.map((label, index) => (
        <div
          key={label.id}
          className="body-label"
          data-state="idle"
          ref={(node) => {
            nodesRef.current[index] = node
          }}
        >
          <span className="body-label__text">{label.text}</span>
          <span className="body-label__hint">click to learn</span>
        </div>
      ))}
    </div>
  )
}
