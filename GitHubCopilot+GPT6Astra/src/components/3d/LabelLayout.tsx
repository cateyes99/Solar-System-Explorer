import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useSimulation } from '../../store/simulationStore'

function overlaps(first: DOMRect, second: DOMRect) {
  return first.left < second.right && first.right > second.left && first.top < second.bottom && first.bottom > second.top
}

export function LabelLayout() {
  const elapsed = useRef(0)
  useFrame((_, delta) => {
    elapsed.current += delta
    if (elapsed.current < .12) return
    elapsed.current = 0
    const occupied = Array.from(document.querySelectorAll('.header, .scene-heading, .planet-index, .side-panel, .view-tools, .time-bar, .tour-narration, .discovery-invite')).map(element => element.getBoundingClientRect())
    const labels = Array.from(document.querySelectorAll<HTMLElement>('.planet-label'))
    const selected = useSimulation.getState().selected
    labels.sort((first, second) => Number(second.id === `scene-label-${selected}`) - Number(first.id === `scene-label-${selected}`))
    for (const label of labels) {
      if (label.style.display === 'none') continue
      const bounds = label.getBoundingClientRect()
      const hidden = occupied.some(area => overlaps(area, bounds))
      label.style.visibility = hidden ? 'hidden' : 'visible'
      if (!hidden) occupied.push(bounds)
    }
  })
  return null
}