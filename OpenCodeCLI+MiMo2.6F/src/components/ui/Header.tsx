import { useSimStore } from '../../store/simulationStore'
import { RANDOM_FACTS } from '../../data/facts'
import {
  BookIcon,
  CogIcon,
  RocketIcon,
  RouteIcon,
  SoundOffIcon,
  SoundOnIcon,
  SparkIcon,
} from './icons'
import { playBlip } from '../../utils/audio'

interface NavAction {
  key: string
  label: string
  icon: React.ReactNode
  onClick: () => void
  active?: boolean
}

export function Header() {
  const openPanel = useSimStore((s) => s.openPanel)
  const panel = useSimStore((s) => s.panel)
  const soundOn = useSimStore((s) => s.soundOn)
  const toggleSound = useSimStore((s) => s.toggleSound)
  const tourActive = useSimStore((s) => s.tour.active)
  const startTour = useSimStore((s) => s.startTour)
  const spacecraftActive = useSimStore((s) => s.spacecraftActive)
  const setSpacecraftActive = useSimStore((s) => s.setSpacecraftActive)

  const actions: NavAction[] = [
    {
      key: 'learn',
      label: 'Explore & Learn',
      icon: <BookIcon />,
      onClick: () => openPanel('learn', 'sun'),
      active: panel === 'learn',
    },
    {
      key: 'whatif',
      label: 'What If?',
      icon: <SparkIcon />,
      onClick: () => openPanel('whatif'),
      active: panel === 'whatif',
    },
    {
      key: 'tour',
      label: tourActive ? 'Exit Tour' : 'Cinematic Tour',
      icon: <RouteIcon />,
      onClick: () => {
        if (tourActive) useSimStore.getState().stopTour()
        else startTour()
      },
      active: tourActive,
    },
    {
      key: 'mission',
      label: spacecraftActive ? 'Leave Craft' : 'Spacecraft',
      icon: <RocketIcon />,
      onClick: () => setSpacecraftActive(!spacecraftActive),
      active: spacecraftActive,
    },
    {
      key: 'fact',
      label: 'Teach Me Something!',
      icon: <SparkIcon />,
      onClick: () => {
        playBlip(920, 0.1)
        useSimStore.getState().showFact(Math.floor(Math.random() * RANDOM_FACTS.length))
      },
    },
    {
      key: 'sound',
      label: soundOn ? 'Sound on' : 'Sound off',
      icon: soundOn ? <SoundOnIcon /> : <SoundOffIcon />,
      onClick: toggleSound,
      active: soundOn,
    },
    {
      key: 'settings',
      label: 'Settings',
      icon: <CogIcon />,
      onClick: () => openPanel(panel === 'settings' ? 'none' : 'settings'),
      active: panel === 'settings',
    },
  ]

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 p-2 sm:p-3">
      <div className="panel pointer-events-auto flex items-center gap-2 rounded-2xl px-3 py-2">
        <a
          href="#scene"
          className="flex shrink-0 items-center gap-2 rounded-xl px-1 py-1"
          aria-label="Solar System Explorer home"
        >
          <span className="relative grid h-8 w-8 place-items-center">
            <span className="absolute h-6 w-6 rounded-full border border-electric-400/70" />
            <span className="h-3.5 w-3.5 rounded-full bg-solar-400 shadow-[0_0_14px_rgba(255,179,71,0.9)]" />
          </span>
          <span className="hidden leading-none sm:block">
            <span className="hud-title block text-[13px] text-white">Solar System</span>
            <span className="block text-[10px] tracking-[0.28em] text-cyan-300/80">EXPLORER</span>
          </span>
        </a>

        <nav
          aria-label="Main controls"
          className="flex min-w-0 flex-1 items-center gap-1.5 overflow-x-auto sm:justify-end"
        >
          {actions.map((action) => (
            <button
              key={action.key}
              type="button"
              onClick={action.onClick}
              data-active={action.active ? 'true' : 'false'}
              className="chip shrink-0"
              aria-pressed={action.active === undefined ? undefined : Boolean(action.active)}
            >
              {action.icon}
              <span className="hidden lg:inline">{action.label}</span>
              <span className="sr-only lg:hidden">{action.label}</span>
            </button>
          ))}
        </nav>
      </div>
    </header>
  )
}
