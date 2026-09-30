import { AnimatePresence } from 'framer-motion'
import { useAppStore } from '../../store/useAppStore'
import { Icon } from './Icon'
import { IconButton } from './primitives/Button'
import { ModalSurface } from './primitives/Overlays'

interface Shortcut {
  keys: string
  action: string
}

const MOUSE: Shortcut[] = [
  { keys: 'Drag', action: 'Rotate around the Solar System' },
  { keys: 'Scroll / pinch', action: 'Zoom in and out' },
  { keys: 'Right-drag / two fingers', action: 'Pan across the scene' },
  { keys: 'Hover a planet', action: 'Highlight it and show a tooltip' },
  { keys: 'Click a planet', action: 'Open its information panel' },
  { keys: 'Double-click a planet', action: 'Follow it with the camera' },
  { keys: 'Click empty space', action: 'Clear the selection' },
]

const KEYBOARD: Shortcut[] = [
  { keys: 'Tab', action: 'Move between controls' },
  { keys: 'Enter / Space', action: 'Activate the focused control' },
  { keys: 'Esc', action: 'Close the open panel or dialog' },
  { keys: 'H', action: 'View the whole Solar System' },
  { keys: '1 – 8', action: 'Jump to Mercury … Neptune' },
  { keys: '0', action: 'Jump to the Sun' },
  { keys: 'F', action: 'Follow the selected planet' },
  { keys: 'P', action: 'Pause or resume time' },
  { keys: '[ / ]', action: 'Slow down / speed up time' },
  { keys: 'L', action: 'Toggle planet labels' },
  { keys: 'T', action: 'Start the cinematic tour' },
  { keys: 'K', action: 'Open Explore & Learn' },
  { keys: 'W', action: 'Teach me something' },
  { keys: '?', action: 'Show this help' },
]

export function HelpOverlay() {
  const visible = useAppStore((s) => s.helpVisible)
  const setVisible = useAppStore((s) => s.setHelpVisible)

  return (
    <AnimatePresence>
      {visible && (
        <ModalSurface onDismiss={() => setVisible(false)} labelledBy="help-title">
          <>
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <p className="eyebrow mb-1">Getting around</p>
                <h2 id="help-title" className="text-[19px] font-semibold tracking-tight text-ice-50">
                  How to explore
                </h2>
              </div>
              <IconButton icon="close" label="Close help" onClick={() => setVisible(false)} className="-mr-2 -mt-1" />
            </div>

            <div className="grid gap-6 sm:grid-cols-2">
              <ShortcutList title="Mouse and touch" icon="target" items={MOUSE} />
              <ShortcutList title="Keyboard" icon="layers" items={KEYBOARD} />
            </div>

            <div className="mt-6 flex items-start gap-3 rounded-xl border border-cyan-glow/25 bg-cyan-glow/8 p-4">
              <Icon name="lightbulb" size={17} className="mt-0.5 shrink-0 text-cyan-glow" />
              <p className="text-[12px] leading-relaxed text-ice-200/85">
                Try clicking the Sun three times. Or open <strong className="text-ice-50">Explore &amp; Learn</strong>{' '}
                and try the gravity lesson — turning the star into a black hole is genuinely fun.
              </p>
            </div>
          </>
        </ModalSurface>
      )}
    </AnimatePresence>
  )
}

function ShortcutList({ title, icon, items }: { title: string; icon: 'target' | 'layers'; items: Shortcut[] }) {
  return (
    <section>
      <h3 className="mb-2.5 flex items-center gap-2 text-[13px] font-semibold text-ice-50">
        <Icon name={icon} size={15} className="text-cyan-200" />
        {title}
      </h3>
      <ul className="space-y-1.5">
        {items.map((item) => (
          <li key={item.keys + item.action} className="flex items-baseline gap-3 text-[12px]">
            <kbd className="w-[8.5rem] shrink-0 rounded border border-edge bg-black/30 px-1.5 py-0.5 text-center font-mono text-[10.5px] text-ice-200">
              {item.keys}
            </kbd>
            <span className="text-ice-200/75">{item.action}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}