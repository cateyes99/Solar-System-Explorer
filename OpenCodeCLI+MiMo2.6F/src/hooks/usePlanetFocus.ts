import { useCallback } from 'react'
import { useSimStore } from '../store/simulationStore'
import { playBlip } from '../utils/audio'

/** Focus / follow / dismiss helpers with sound feedback. */
export function usePlanetFocus() {
  const focusBody = useSimStore((s) => s.focusBody)
  const followBody = useSimStore((s) => s.followBody)
  const viewSystem = useSimStore((s) => s.viewSystem)
  const select = useSimStore((s) => s.select)

  const focus = useCallback(
    (id: string) => {
      focusBody(id)
      playBlip(740, 0.1)
    },
    [focusBody],
  )

  const follow = useCallback(
    (id: string) => {
      followBody(id)
      playBlip(880, 0.12)
    },
    [followBody],
  )

  const home = useCallback(() => {
    viewSystem()
    playBlip(440, 0.12)
  }, [viewSystem])

  const dismiss = useCallback(() => {
    select(null)
    playBlip(330, 0.08)
  }, [select])

  return { focus, follow, home, dismiss }
}
