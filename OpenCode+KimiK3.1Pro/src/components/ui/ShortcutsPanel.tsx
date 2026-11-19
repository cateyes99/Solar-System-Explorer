import { useSimulationStore } from '../../store/simulationStore'
import { Modal } from './Modal'

const shortcuts = [
  ['Space', 'Pause or resume time'],
  ['0 – 8', 'Visit the Sun or a planet'],
  ['L', 'Toggle planet labels'],
  ['O', 'Toggle orbital paths'],
  ['T', 'Start the cinematic tour'],
  ['F', 'Discover a random fact'],
  ['R', 'Return to the Solar System'],
  ['M', 'Mute or enable audio'],
  ['+ / −', 'Change simulation speed'],
  ['W A S D · Q E', 'Fly the spacecraft'],
  ['Shift', 'Boost spacecraft speed'],
  ['Esc', 'Close a panel or exit a mode'],
]

export function ShortcutsPanel() {
  const activeModal = useSimulationStore((state) => state.activeModal)
  return (
    <Modal open={activeModal === 'shortcuts'} title="Keyboard flight manual" eyebrow="EXPLORE WITHOUT THE MOUSE" size="small">
      <div className="shortcut-list">{shortcuts.map(([key, action]) => <div key={key}><kbd>{key}</kbd><span>{action}</span></div>)}</div>
      <p className="panel-footnote">You can also Tab through every control. Drag to orbit, scroll or pinch to zoom, and double-click a world to visit.</p>
    </Modal>
  )
}
