import type { ReactNode } from 'react'
import { useSimulationStore } from '../../store/simulationStore'
import { primeAudio } from '../../utils/audio'
import { BookIcon, QuestionIcon, RocketIcon, CameraIcon, SparkleIcon, SettingsIcon, SoundOnIcon, SoundOffIcon } from './icons'
import { Tooltip } from './Tooltip'

interface HeaderButtonProps {
  label: string
  icon: ReactNode
  active?: boolean
  onClick: () => void
}

function HeaderButton({ label, icon, active, onClick }: HeaderButtonProps) {
  return (
    <Tooltip label={label}>
      <button
        type="button"
        onClick={onClick}
        aria-pressed={active}
        aria-label={label}
        className={`flex h-11 min-w-11 items-center gap-2 rounded-full px-3 text-sm font-medium transition-colors ${
          active ? 'bg-electric-blue/25 text-white ring-1 ring-electric-blue/60' : 'text-white/80 hover:bg-white/10 hover:text-white'
        }`}
      >
        <span className="h-5 w-5 shrink-0">{icon}</span>
        <span className="hidden sm:inline">{label}</span>
      </button>
    </Tooltip>
  )
}

/** Top navigation bar: mode toggles on the left/center, sound + settings on the right. */
export function Header() {
  const isExploreOpen = useSimulationStore((s) => s.isExploreOpen)
  const isWhatIfOpen = useSimulationStore((s) => s.isWhatIfOpen)
  const isSpacecraftMode = useSimulationStore((s) => s.isSpacecraftMode)
  const isTourActive = useSimulationStore((s) => s.isTourActive)
  const isSettingsOpen = useSimulationStore((s) => s.isSettingsOpen)
  const soundEnabled = useSimulationStore((s) => s.soundEnabled)
  const toggleExplore = useSimulationStore((s) => s.toggleExplore)
  const toggleWhatIf = useSimulationStore((s) => s.toggleWhatIf)
  const setSpacecraftMode = useSimulationStore((s) => s.setSpacecraftMode)
  const startTour = useSimulationStore((s) => s.startTour)
  const exitTour = useSimulationStore((s) => s.exitTour)
  const toggleSettings = useSimulationStore((s) => s.toggleSettings)
  const toggleSound = useSimulationStore((s) => s.toggleSound)
  const showRandomFact = useSimulationStore((s) => s.showRandomFact)

  return (
    <header className="pointer-events-auto flex items-center justify-between gap-2 px-3 py-3 sm:px-6">
      <div className="flex items-center gap-2">
        <div className="h-3 w-3 rounded-full bg-solar-orange shadow-[0_0_12px_4px_rgba(255,157,77,0.7)]" />
        <h1 className="text-glow hidden text-base font-semibold tracking-wide text-white sm:block sm:text-lg">
          Solar System Explorer
        </h1>
      </div>

      <nav className="glass-panel flex items-center gap-1 overflow-x-auto rounded-full p-1 no-scrollbar" aria-label="Main">
        <HeaderButton label="Explore & Learn" icon={<BookIcon className="h-full w-full" />} active={isExploreOpen} onClick={toggleExplore} />
        <HeaderButton label="What If?" icon={<QuestionIcon className="h-full w-full" />} active={isWhatIfOpen} onClick={toggleWhatIf} />
        <HeaderButton
          label="Spacecraft Mode"
          icon={<RocketIcon className="h-full w-full" />}
          active={isSpacecraftMode}
          onClick={() => setSpacecraftMode(!isSpacecraftMode)}
        />
        <HeaderButton
          label="Cinematic Tour"
          icon={<CameraIcon className="h-full w-full" />}
          active={isTourActive}
          onClick={() => (isTourActive ? exitTour() : startTour())}
        />
        <HeaderButton label="Teach Me Something!" icon={<SparkleIcon className="h-full w-full" />} onClick={showRandomFact} />
      </nav>

      <div className="flex items-center gap-1">
        <Tooltip label={soundEnabled ? 'Mute sound' : 'Unmute sound'}>
          <button
            type="button"
            aria-label={soundEnabled ? 'Mute sound' : 'Unmute sound'}
            aria-pressed={soundEnabled}
            onClick={() => {
              primeAudio()
              toggleSound()
            }}
            className="flex h-11 w-11 items-center justify-center rounded-full text-white/80 transition-colors hover:bg-white/10 hover:text-white"
          >
            {soundEnabled ? <SoundOnIcon className="h-5 w-5" /> : <SoundOffIcon className="h-5 w-5" />}
          </button>
        </Tooltip>
        <Tooltip label="Settings">
          <button
            type="button"
            aria-label="Settings"
            aria-pressed={isSettingsOpen}
            onClick={toggleSettings}
            className={`flex h-11 w-11 items-center justify-center rounded-full transition-colors ${
              isSettingsOpen ? 'bg-electric-blue/25 text-white ring-1 ring-electric-blue/60' : 'text-white/80 hover:bg-white/10 hover:text-white'
            }`}
          >
            <SettingsIcon className="h-5 w-5" />
          </button>
        </Tooltip>
      </div>
    </header>
  )
}
