import { Panel } from './Panel'
import { useSimulation } from '../../store/simulationStore'
import { audio } from '../../audio/audioEngine'
import type { WhatIfKey } from '../../types'

interface WhatIfItem {
  key: WhatIfKey
  emoji: string
  title: string
  description: string
  toast: string
}

const ITEMS: WhatIfItem[] = [
  {
    key: 'twoMoons',
    emoji: '🌕',
    title: 'Earth had two moons?',
    description: 'A second little moon joins ours in the sky. Double moonlight — and very confused tides!',
    toast: 'Two moons! Imagine the double moonlight 🌕🌕',
  },
  {
    key: 'bigEarth',
    emoji: '🤏',
    title: 'Earth were the size of Jupiter?',
    description: 'Earth swells into a giant and the Moon has to orbit much farther away.',
    toast: 'Whoa! Earth just grew to the size of Jupiter (in this simulation).',
  },
  {
    key: 'noSun',
    emoji: '🌑',
    title: 'The Sun disappeared?',
    description: 'Everything goes dark. Earth would keep moving in a straight line instead of circling — and its gravity would let go of us about 8 minutes later, because gravity travels at the speed of light.',
    toast: 'Brrr! No sunlight — and the Sun’s gravity would release us ~8 minutes later. Light (and gravity) travel at light speed!',
  },
  {
    key: 'stoppedEarth',
    emoji: '🛑',
    title: 'Earth stopped rotating?',
    description: 'One side would have endless day, the other endless night — and the winds would be unbelievable.',
    toast: 'Earth stopped spinning! One side cooks while the other freezes.',
  },
]

/** Playful "What If?" experiments — clearly labelled as pretend simulations. */
export function WhatIfPanel(): JSX.Element {
  const open = useSimulation((s) => s.panel === 'whatif')
  const setPanel = useSimulation((s) => s.setPanel)
  const whatIf = useSimulation((s) => s.whatIf)
  const toggleWhatIf = useSimulation((s) => s.toggleWhatIf)
  const pushToast = useSimulation((s) => s.pushToast)

  const onToggle = (item: WhatIfItem): void => {
    const turningOn = !whatIf[item.key]
    toggleWhatIf(item.key)
    if (turningOn) {
      pushToast(item.toast, item.emoji)
      audio.whoosh()
    } else {
      audio.blip(500)
    }
  }

  return (
    <Panel open={open} title="What If? Lab" emoji="🤔" onClose={() => setPanel('none')}>
      <div className="space-y-3">
        <p className="rounded-xl border border-astro-orange/30 bg-astro-orange/10 p-2.5 text-[12px] leading-snug text-white/80">
          ⚠️ These are <strong>pretend experiments</strong> — educational simulations to spark curiosity, NOT real predictions!
        </p>
        {ITEMS.map((item) => {
          const active = whatIf[item.key]
          return (
            <button
              key={item.key}
              type="button"
              role="switch"
              aria-checked={active}
              onClick={() => onToggle(item)}
              className={`block w-full rounded-2xl border p-3.5 text-left transition ${
                active
                  ? 'border-astro-cyan/50 bg-astro-cyan/10 shadow-glow'
                  : 'border-white/10 bg-white/[0.04] hover:bg-white/[0.08]'
              }`}
            >
              <span className="flex items-center gap-2.5">
                <span aria-hidden className="text-2xl">
                  {item.emoji}
                </span>
                <span className="flex-1">
                  <span className="block text-sm font-semibold text-white">What if {item.title}</span>
                  <span className="mt-0.5 block text-[12px] leading-snug text-white/60">
                    {item.description}
                  </span>
                </span>
                <span
                  className={`relative h-5 w-9 shrink-0 rounded-full transition ${
                    active ? 'bg-astro-cyan' : 'bg-white/20'
                  }`}
                >
                  <span
                    className={`absolute top-0.5 h-4 w-4 rounded-full bg-white transition-all ${
                      active ? 'left-[18px]' : 'left-0.5'
                    }`}
                  />
                </span>
              </span>
            </button>
          )
        })}
      </div>
    </Panel>
  )
}
