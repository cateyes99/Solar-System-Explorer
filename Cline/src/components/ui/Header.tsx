import { audio } from '../../audio/audioEngine'
import { useSimulation } from '../../store/simulationStore'
import type { PanelId } from '../../store/simulationStore'

const NAV: Array<{ id: PanelId; label: string; emoji: string }> = [
  { id: 'learn', label: 'Explore & Learn', emoji: '🔭' },
  { id: 'whatif', label: 'What If?', emoji: '🤔' },
  { id: 'missions', label: 'Missions', emoji: '🚀' },
  { id: 'settings', label: 'Settings', emoji: '⚙️' },
]

function Logo(): JSX.Element {
  return (
    <svg viewBox="0 0 40 40" className="h-8 w-8" aria-hidden>
      <circle cx="20" cy="20" r="7" fill="url(#logoSun)" />
      <defs>
        <radialGradient id="logoSun" cx="50%" cy="50%" r="50%">
          <stop offset="0%" stopColor="#fff3c4" />
          <stop offset="60%" stopColor="#ffb84d" />
          <stop offset="100%" stopColor="#ff6a00" />
        </radialGradient>
      </defs>
      <ellipse cx="20" cy="20" rx="16" ry="6.5" fill="none" stroke="#4da6ff" strokeOpacity="0.7" strokeWidth="1.4" transform="rotate(-18 20 20)" />
      <circle cx="33.5" cy="14.5" r="2.2" fill="#67e8f9" />
    </svg>
  )
}

/** Top navigation: logo, cinematic tour, panels, sound, and "Teach Me!". */
export function Header(): JSX.Element {
  const panel = useSimulation((s) => s.panel)
  const setPanel = useSimulation((s) => s.setPanel)
  const soundOn = useSimulation((s) => s.soundOn)
  const toggle = useSimulation((s) => s.toggle)
  const startTour = useSimulation((s) => s.startTour)

  const openPanel = (id: PanelId): void => {
    audio.blip(880)
    setPanel(panel === id ? 'none' : id)
  }

  return (
    <header className="pointer-events-none absolute inset-x-0 top-0 z-30 flex items-start justify-between gap-2 p-3 md:p-4">
      <div className="glass pointer-events-auto flex items-center gap-2.5 rounded-2xl px-3 py-2">
        <Logo />
        <div className="leading-tight">
          <p className="font-display text-[12px] font-bold tracking-[0.16em] text-white md:text-[13px]">
            SOLAR SYSTEM
          </p>
          <p className="text-[8px] uppercase tracking-[0.34em] text-astro-cyan/80 md:text-[9px]">
            Explorer
          </p>
        </div>
      </div>

      <nav className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5" aria-label="Main navigation">
        <button
          type="button"
          className="btn btn-primary"
          onClick={() => {
            audio.blip(700)
            startTour()
          }}
        >
          <span aria-hidden>🎬</span>
          <span className="hidden sm:inline">Cinematic Tour</span>
          <span className="sm:hidden">Tour</span>
        </button>
        {NAV.map((n) => (
          <button
            key={n.id}
            type="button"
            className={`btn max-md:px-2.5 ${panel === n.id ? 'chip-active' : ''}`}
            onClick={() => openPanel(n.id)}
            aria-pressed={panel === n.id}
            aria-label={n.label}
          >
            <span aria-hidden>{n.emoji}</span>
            <span className="hidden lg:inline">{n.label}</span>
          </button>
        ))}
        <button
          type="button"
          className="btn max-md:px-2.5"
          onClick={() => {
            audio.blip(820)
            setPanel('facts')
          }}
          aria-label="Teach me something"
        >
          <span aria-hidden>💡</span>
          <span className="hidden lg:inline">Teach Me!</span>
        </button>
        <button
          type="button"
          className="btn max-md:px-2.5"
          onClick={() => toggle('soundOn')}
          aria-pressed={soundOn}
          aria-label={soundOn ? 'Mute ambient sound' : 'Enable ambient sound'}
        >
          <span aria-hidden>{soundOn ? '🔊' : '🔇'}</span>
        </button>
      </nav>
    </header>
  )
}
