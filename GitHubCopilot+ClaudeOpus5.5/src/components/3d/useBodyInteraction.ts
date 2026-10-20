import type { ThreeEvent } from '@react-three/fiber'
import { useMemo } from 'react'
import { BODIES } from '../../data/planets'
import type { BodyId } from '../../data/types'
import { useSimulationStore } from '../../store/simulationStore'

const CLICK_DRAG_TOLERANCE = 6

/** Hover, click and double-click behaviour shared by every clickable body. */
export function useBodyInteraction(id: BodyId, onClickExtra?: () => boolean) {
  return useMemo(
    () => ({
      onPointerOver: (e: ThreeEvent<PointerEvent>) => {
        e.stopPropagation()
        useSimulationStore.getState().hover(id)
        document.body.style.cursor = 'pointer'
      },
      onPointerOut: () => {
        const s = useSimulationStore.getState()
        if (s.hoveredId === id) s.hover(null)
        document.body.style.cursor = ''
      },
      onClick: (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        if (e.delta > CLICK_DRAG_TOLERANCE) return
        if (onClickExtra?.()) return
        const s = useSimulationStore.getState()
        if (s.appMode === 'tour') return
        if (s.appMode === 'mission') {
          s.setDestination(id)
          s.addToast({ title: `Destination set: ${BODIES[id].name}`, message: 'Press “Fly there” to engage autopilot.', tone: 'info' })
          return
        }
        s.select(id)
        if (id === 'earth') {
          s.discover('hello-earth', 'Hello, Earth!', 'You waved at our home planet. Everyone you know lives down there!')
        }
      },
      onDoubleClick: (e: ThreeEvent<MouseEvent>) => {
        e.stopPropagation()
        const s = useSimulationStore.getState()
        if (s.appMode === 'tour' || s.appMode === 'mission') return
        s.viewBody(id)
      },
    }),
    [id, onClickExtra],
  )
}
