import { useEffect } from 'react'
import { PLANETS } from '../data/planets'
import { RANDOM_FACTS } from '../data/facts'
import { useSimStore } from '../store/simulationStore'
import { bindGlobalInput } from '../utils/input'
import { playBlip } from '../utils/audio'

/** Maps the `0`–`8` number keys onto the planets in orbital order. */
const NUMBER_KEY_TARGETS = ['sun', ...PLANETS.map((p) => p.id)]

/**
 * Global keyboard shortcuts + focus helpers shared by the HUD and 3D scene.
 */
export function useKeyboardControls(): void {
  const store = useSimStore

  useEffect(() => {
    const unbind = bindGlobalInput((action) => {
      const s = store.getState()
      if (action === 'pause') {
        s.togglePause()
        playBlip(520, 0.07)
      } else if (action === 'escape') {
        // Dismiss the top-most layer, one at a time.
        if (s.tour.active) s.stopTour()
        else if (s.shortcutsVisible) s.toggleShortcuts()
        else if (s.factCardIndex !== null) s.showFact(null)
        else if (s.welcomeVisible) s.dismissWelcome()
        else if (s.spacecraftActive) s.setSpacecraftActive(false)
        else if (s.panel !== 'none') s.closePanel()
        else if (s.selectedId) s.select(null)
        else s.viewSystem()
      } else if (action === 'shortcuts') {
        s.toggleShortcuts()
      } else if (action.startsWith('focus:')) {
        const index = Number(action.split(':')[1])
        const target = NUMBER_KEY_TARGETS[index]
        if (target) s.focusBody(target)
      } else if (action === 'labels') {
        s.toggleLabels()
      } else if (action === 'orbits') {
        s.toggleOrbits()
      } else if (action === 'tour') {
        if (s.tour.active) s.stopTour()
        else s.startTour()
      } else if (action === 'follow') {
        const target = s.selectedId ?? s.cameraTargetId
        if (target) s.followBody(target)
      } else if (action === 'fact') {
        s.showFact(Math.floor(Math.random() * RANDOM_FACTS.length))
      } else if (action === 'sound') {
        s.toggleSound()
      } else if (action === 'spacecraft') {
        s.setSpacecraftActive(!s.spacecraftActive)
      } else if (action === 'learn') {
        s.openPanel('learn')
      }
    })
    return unbind
  }, [store])
}
