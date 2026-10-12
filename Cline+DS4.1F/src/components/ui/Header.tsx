import { AnimatePresence, motion } from 'framer-motion'
import { useSimulationStore } from '../../store/simulationStore'
import { IconButton, ToolbarButton } from './primitives'
import {
  BookIcon,
  BulbIcon,
  HelpIcon,
  MotionIcon,
  OrbitIcon,
  QuestionIcon,
  RocketIcon,
  SettingsIcon,
  SoundOffIcon,
  SoundOnIcon,
  SunIcon,
} from './icons'

/**
 * Top navigation.
 *
 * On desktop every mode is one click away with a written label; on phones the
 * same buttons become large icon buttons (their accessible names stay in the
 * DOM, so screen readers and voice control still work perfectly).
 */
export function Header() {
  const startTour = useSimulationStore((state) => state.startTour)
  const exitTour = useSimulationStore((state) => state.exitTour)
  const cinematicActive = useSimulationStore((state) => state.cinematic.active)
  const openEducation = useSimulationStore((state) => state.openEducation)
  const educationOpen = useSimulationStore((state) => state.ui.educationOpen)
  const toggleWhatIf = useSimulationStore((state) => state.toggleWhatIf)
  const whatIfOpen = useSimulationStore((state) => state.ui.whatIfOpen)
  const missionActive = useSimulationStore((state) => state.missionActive)
  const startMission = useSimulationStore((state) => state.startMission)
  const endMission = useSimulationStore((state) => state.endMission)
  const teachMeSomething = useSimulationStore((state) => state.teachMeSomething)
  const soundEnabled = useSimulationStore((state) => state.soundEnabled)
  const setSoundEnabled = useSimulationStore((state) => state.setSoundEnabled)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  const setReducedMotion = useSimulationStore((state) => state.setReducedMotion)
  const openSettings = useSimulationStore((state) => state.openSettings)
  const settingsOpen = useSimulationStore((state) => state.ui.settingsOpen)
  const toggleHelp = useSimulationStore((state) => state.toggleHelp)
  const orbitModel = useSimulationStore((state) => state.orbitModel)
  const toggleOrbitModel = useSimulationStore((state) => state.toggleOrbitModel)
  const realisticOrbits = orbitModel === 'realistic'

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-40 flex items-start justify-between gap-2 bg-gradient-to-b from-void/92 via-void/55 to-transparent px-3 pb-4 pt-3 sm:px-5 sm:pb-6">
      <div className="pointer-events-auto flex items-center gap-3">
        <span
          aria-hidden="true"
          className="hidden h-10 w-10 shrink-0 place-items-center rounded-full border border-solar/40 bg-solar/12 text-solar animate-soft-pulse sm:grid"
        >
          <SunIcon size={20} />
        </span>
        <div className="leading-tight">
          <h1 className="text-shadow sse-text-shadow text-[0.8rem] font-semibold uppercase tracking-[0.16em] text-parchment sm:text-sm sm:tracking-[0.32em]">
            Solar System Explorer
          </h1>
          <p className="text-[0.62rem] uppercase tracking-[0.12em] text-mist/85 sm:text-[0.68rem] sm:tracking-[0.18em]">
            <span className="sm:hidden">
              {realisticOrbits ? 'Real spacing · real data' : 'Educational layout'}
            </span>
            <span className="hidden sm:inline">
              {realisticOrbits
                ? 'Real orbit spacing · planet sizes compressed · real astronomy data'
                : 'Educational layout · sizes and distances both compressed'}
            </span>
          </p>
        </div>
      </div>

      <div className="pointer-events-auto flex flex-wrap items-center justify-end gap-1.5">
        <ToolbarButton
          compact
          variant={cinematicActive ? 'primary' : 'ghost'}
          active={cinematicActive}
          icon={<RocketIcon />}
          onClick={() => (cinematicActive ? exitTour() : startTour())}
        >
          Cinematic Tour
        </ToolbarButton>

        <ToolbarButton
          compact
          variant={educationOpen ? 'primary' : 'ghost'}
          icon={<BookIcon />}
          onClick={() => (educationOpen ? useSimulationStore.getState().closeEducation() : openEducation(null))}
        >
          Explore &amp; Learn
        </ToolbarButton>

        <ToolbarButton compact variant={whatIfOpen ? 'primary' : 'ghost'} icon={<QuestionIcon />} onClick={() => toggleWhatIf()}>
          What If?
        </ToolbarButton>

        <ToolbarButton
          compact
          variant={missionActive ? 'primary' : 'ghost'}
          icon={<RocketIcon />}
          onClick={() => (missionActive ? endMission() : startMission())}
        >
          Mission Control
        </ToolbarButton>

        <ToolbarButton compact variant="ghost" icon={<BulbIcon />} onClick={teachMeSomething}>
          Teach Me Something!
        </ToolbarButton>

        {/*
          Switches between the two orbit models. The label names the view that is
          on screen right now — "More Realistic Orbits" for the real JPL elements,
          "Educational Scale Orbits" for the tidier classic layout — so a glance
          at the toolbar always tells you which Solar System you are looking at.
        */}
        <ToolbarButton
          compact
          variant={realisticOrbits ? 'primary' : 'ghost'}
          active={realisticOrbits}
          icon={<OrbitIcon />}
          onClick={() => toggleOrbitModel()}
          aria-pressed={realisticOrbits}
          title={
            realisticOrbits
              ? 'Showing the real JPL orbits. Click to switch to the educational layout.'
              : 'Showing the educational layout. Click to switch to the real JPL orbits.'
          }
        >
          {realisticOrbits ? 'More Realistic Orbits' : 'Educational Scale Orbits'}
        </ToolbarButton>

        <div className="mx-1 hidden h-8 w-px bg-white/12 sm:block" aria-hidden="true" />

        <IconButton
          label={soundEnabled ? 'Mute ambient sound' : 'Turn on ambient sound'}
          icon={soundEnabled ? <SoundOnIcon /> : <SoundOffIcon />}
          active={soundEnabled}
          onClick={() => setSoundEnabled(!soundEnabled)}
        />
        <IconButton
          label={reducedMotion ? 'Turn off reduced motion' : 'Reduce motion'}
          icon={<MotionIcon />}
          active={reducedMotion}
          onClick={() => setReducedMotion(!reducedMotion)}
        />
        <IconButton label="Keyboard shortcuts and help" icon={<HelpIcon />} onClick={() => toggleHelp()} />
        <IconButton
          label="Settings and display options"
          icon={<SettingsIcon />}
          active={settingsOpen}
          onClick={() => openSettings()}
          aria-expanded={settingsOpen}
        />
      </div>

      {/* A quiet banner so nobody ever mistakes the picture for a photograph. */}
      <AnimatePresence>
        {reducedMotion ? (
          <motion.p
            initial={{ opacity: 0, y: -6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            className="pointer-events-none absolute left-1/2 top-[4.6rem] hidden -translate-x-1/2 rounded-full border border-ice/25 bg-void/70 px-3 py-1 text-[0.62rem] uppercase tracking-[0.2em] text-ice/90 lg:block"
          >
            Reduced motion is on
          </motion.p>
        ) : null}
      </AnimatePresence>
    </header>
  )
}