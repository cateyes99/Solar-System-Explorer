import { useMemo, useRef } from 'react'
import { Html } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import type { PerspectiveCamera } from 'three'
import { MOONS, PLANETS, SUN } from '../../data/planets'
import { bodyPosition, bodyRadius } from '../../store/registry'
import { useAppStore } from '../../store/useAppStore'
import { clamp } from '../../utils/math'

const TRACKED = [
  { id: 'sun', label: SUN.name, sub: 'Star', kind: 'sun' as const },
  ...PLANETS.map((p) => ({ id: p.id, label: p.name, sub: p.type, kind: 'planet' as const })),
  { id: 'luna', label: 'The Moon', sub: 'Moon of Earth', kind: 'moon' as const },
]

/**
 * DOM labels projected from world space every frame.
 *
 * HTML keeps the type crisp at any resolution, avoids shipping a font file and
 * means every label is real, selectable text for assistive technology.
 */
export function Labels() {
  const visible = useAppStore((s) => s.labelsVisible)
  const hoveredId = useAppStore((s) => s.hoveredId)
  const focusedId = useAppStore((s) => s.focusedId)
  const camera = useThree((state) => state.camera)
  const size = useThree((state) => state.size)
  // The scene always uses a perspective camera; asserted once so the label
  // offsets can convert world radii into pixels.
  const perspective = camera as PerspectiveCamera

  const refs = useRef<Record<string, HTMLDivElement | null>>({})
  const projected = useMemo(() => new Vector3(), [])

  useFrame(({ camera: activeCamera }) => {
    // Pixels per world unit at one unit of depth, for correct label offsets.
    const focal = size.height / (2 * Math.tan((perspective.fov * Math.PI) / 360))
    const placed: { id: string; x: number; y: number; depth: number; r: number }[] = []

    for (const item of TRACKED) {
      const position = bodyPosition(item.id)
      if (position.lengthSq() === 0) continue
      projected.copy(position).project(activeCamera)
      const depth = activeCamera.position.distanceTo(position)
      const screenSize = (bodyRadius(item.id) / Math.max(0.001, depth)) * focal
      placed.push({
        id: item.id,
        x: (projected.x * 0.5 + 0.5) * size.width,
        // Sit the label clear of the planet's disc, not just its centre.
        y: (-projected.y * 0.5 + 0.5) * size.height - screenSize - 14,
        depth,
        r: screenSize,
      })
    }

    // Draw nearest last so nearer labels sit on top when they overlap.
    placed.sort((a, b) => b.depth - a.depth)

    const accepted: typeof placed = []
    for (const item of placed) {
      const node = refs.current[item.id]
      if (!node) continue
      const emphasise = item.id === hoveredId || item.id === focusedId
      const isMoon = item.id === 'luna' || MOONS.some((m) => m.id === item.id)

      let opacity = clamp((item.r - 1.6) / 7, 0, 1)
      if (isMoon) opacity *= clamp((item.r - 1) / 5, 0, 1) * 0.92

      const clash = accepted.some((other) => Math.abs(other.x - item.x) < 96 && Math.abs(other.y - item.y) < 26)
      accepted.push(item)

      const show = projected.z < 1 && opacity > 0.06 && (!clash || emphasise)
      node.style.opacity = show ? String(emphasise ? 1 : opacity * 0.9) : '0'
      node.style.transform = `translate3d(${item.x.toFixed(1)}px, ${item.y.toFixed(1)}px, 0) translate(-50%, -100%)`
      node.style.zIndex = String(1000 - Math.round(item.depth))
    }
  })

  if (!visible) return null

  return (
    <Html fullscreen style={{ pointerEvents: 'none' }} zIndexRange={[30, 0]}>
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {TRACKED.map((item) => (
          <div
            key={item.id}
            ref={(node) => {
              refs.current[item.id] = node
            }}
            className="pointer-events-none absolute top-0 left-0 whitespace-nowrap opacity-0 will-change-transform"
          >
            <div className="flex items-center gap-2">
              <span className="h-px w-5 bg-white/40" aria-hidden />
              <span className="text-[12px] font-semibold tracking-[0.16em] text-white/90 uppercase [text-shadow:0_1px_8px_rgba(0,0,0,0.95)]">
                {item.label}
              </span>
              <span className="text-[10px] font-medium tracking-wider text-cyan-200/65 uppercase">
                {item.sub}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Html>
  )
}