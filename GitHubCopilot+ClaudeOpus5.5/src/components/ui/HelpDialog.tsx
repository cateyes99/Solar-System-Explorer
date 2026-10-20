import { useSimulationStore } from '../../store/simulationStore'
import { Modal } from './Modal'

const SHORTCUTS: [string, string][] = [
  ['Drag / swipe', 'Rotate around the Solar System'],
  ['Scroll / pinch', 'Zoom in and out'],
  ['Right-drag / two fingers', 'Pan the view'],
  ['Click a planet', 'Open its information'],
  ['Double-click a planet', 'Fly to it'],
  ['0 – 9', 'Fly to the Sun (0), planets (1–8) or the Moon (9)'],
  ['H', 'View the whole Solar System'],
  ['F', 'Follow the selected planet'],
  ['Space', 'Pause or play time'],
  ['+ / −', 'Speed time up or slow it down'],
  ['L / O', 'Show or hide labels / orbit lines'],
  ['T', 'Teach me something!'],
  ['C', 'Start or stop the Cinematic Tour'],
  ['M', 'Sound on or off'],
  ['Esc', 'Close panels or go back'],
]

const FLIGHT: [string, string][] = [
  ['W / S', 'Speed up / slow down'],
  ['A / D or ← / →', 'Turn left / right'],
  ['↑ / ↓', 'Nose up / down'],
  ['Shift', 'Turbo boost'],
]

function KeyTable({ rows, caption }: { rows: [string, string][]; caption: string }) {
  return (
    <table className="w-full text-left text-sm">
      <caption className="mb-2 text-left text-xs font-bold tracking-wider text-slate-400 uppercase">{caption}</caption>
      <tbody>
        {rows.map(([key, action]) => (
          <tr key={key} className="border-t border-white/8">
            <th scope="row" className="py-2 pr-4 font-semibold whitespace-nowrap text-cyan-200">
              {key}
            </th>
            <td className="py-2 text-slate-200">{action}</td>
          </tr>
        ))}
      </tbody>
    </table>
  )
}

export function HelpDialog() {
  const open = useSimulationStore((s) => s.helpOpen)
  const setOpen = useSimulationStore((s) => s.setHelpOpen)
  return (
    <Modal open={open} onClose={() => setOpen(false)} title="How to explore" size="lg">
      <p className="mb-4 text-slate-300">
        Everything works with a mouse, a touch screen or the keyboard. Press <kbd className="rounded bg-white/10 px-1.5">Tab</kbd> to move
        between buttons.
      </p>
      <KeyTable rows={SHORTCUTS} caption="Exploring" />
      <div className="mt-5">
        <KeyTable rows={FLIGHT} caption="Flying your spacecraft (Mission mode)" />
      </div>
    </Modal>
  )
}
