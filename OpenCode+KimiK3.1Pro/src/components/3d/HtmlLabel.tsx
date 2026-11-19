import { useLayoutEffect, useMemo, useRef } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { createRoot } from 'react-dom/client'
import type { Root } from 'react-dom/client'
import { useFrame, useThree } from '@react-three/fiber'
import { Group, Vector3 } from 'three'

interface HtmlProps {
  children: ReactNode
  position: [number, number, number]
  center?: boolean
  style?: CSSProperties
  zIndexRange?: [number, number]
}

const projected = new Vector3()

/**
 * A small HTML projector for labels. Unlike drei's current Html helper, it reuses
 * roots across event-target changes and defers unmounting outside React's commit.
 */
export function Html({ children, position, center = false, style, zIndexRange = [20, 0] }: HtmlProps) {
  const group = useRef<Group>(null)
  const root = useRef<Root | null>(null)
  const unmountTimer = useRef<number | null>(null)
  const element = useMemo(() => document.createElement('div'), [])
  const { camera, size, gl, events } = useThree()
  const target = (events.connected as HTMLElement | null) ?? gl.domElement.parentElement

  useLayoutEffect(() => {
    if (!target) return
    if (unmountTimer.current !== null) {
      window.clearTimeout(unmountTimer.current)
      unmountTimer.current = null
    }
    const reactRoot = root.current ?? createRoot(element)
    root.current = reactRoot
    Object.assign(element.style, {
      position: 'absolute',
      top: '0',
      left: '0',
      pointerEvents: 'none',
      ...style,
    })
    target.appendChild(element)
    return () => {
      if (target.contains(element)) target.removeChild(element)
      unmountTimer.current = window.setTimeout(() => {
        reactRoot.unmount()
        if (root.current === reactRoot) root.current = null
        unmountTimer.current = null
      }, 0)
    }
  }, [element, target, style])

  useLayoutEffect(() => {
    root.current?.render(<>{children}</>)
  })

  useFrame(() => {
    if (!group.current) return
    group.current.getWorldPosition(projected)
    projected.project(camera)
    const x = (projected.x * 0.5 + 0.5) * size.width
    const y = (-projected.y * 0.5 + 0.5) * size.height
    const visible = projected.z > -1 && projected.z < 1
    element.style.visibility = visible ? 'visible' : 'hidden'
    element.style.transform = `translate3d(${x}px, ${y}px, 0)${center ? ' translate(-50%, -50%)' : ''}`
    const [high, low] = zIndexRange
    element.style.zIndex = `${Math.round(low + (1 - projected.z) * 0.5 * (high - low))}`
  })

  return <group ref={group} position={position} />
}
