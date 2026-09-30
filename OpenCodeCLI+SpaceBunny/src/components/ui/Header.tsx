import { AnimatePresence, motion } from 'framer-motion'
import { IconButton, Button } from './primitives/Button'
import { Icon } from './Icon'
import { useAppStore } from '../../store/useAppStore'
import { useLayout } from '../../hooks/useMediaQuery'
import { spaceAudio } from '../../utils/audio'

const NAV = [
  { id: 'learn' as const, label: 'Learn', icon: 'book' as const },
  { id: 'whatif' as const, label: 'What If?', icon: 'flask' as const },
  { id: 'missions' as const, label: 'Missions', icon: 'rocket' as const },
]

export function Header() {
  const panel = useAppStore((s) => s.panel)
  const togglePanel = useAppStore((s) => s.togglePanel)
  const soundEnabled = useAppStore((s) => s.soundEnabled)
  const setSoundEnabled = useAppStore((s) => s.setSoundEnabled)
  const labelsVisible = useAppStore((s) => s.labelsVisible)
  const toggleLabels = useAppStore((s) => s.toggleLabels)
  const startTour = useAppStore((s) => s.startTour)
  const tourActive = useAppStore((s) => s.tourActive)
  const reducedMotion = useAppStore((s) => s.reducedMotion)
  const setReducedMotion = useAppStore((s) => s.setReducedMotion)
  const setHelpVisible = useAppStore((s) => s.setHelpVisible)
  const sceneMode = useAppStore((s) => s.sceneMode)
  const { isCompact } = useLayout()

  const isSystem = sceneMode === 'system'

  return (
    <header className="safe-top pointer-events-none absolute inset-x-0 top-0 z-30 px-3 sm:px-5">
      <div className="flex items-start justify-between gap-2">
        {/* Brand */}
        <div className="pointer-events-auto flex min-w-0 items-center gap-2.5">
          <div className="relative grid h-9 w-9 shrink-0 place-items-center rounded-xl border border-edge bg-white/6">
            <Icon name="sun" size={19} className="text-solar" />
            <span className="animate-pulse-ring absolute inset-0 rounded-xl border border-solar/40" />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-[12px] leading-tight font-semibold tracking-[0.14em] text-ice-50 uppercase sm:text-sm sm:tracking-[0.16em]">
              Solar System Explorer
            </h1>
            <p className="hidden text-[11px] leading-tight text-ice-400/80 sm:block">
              An interactive journey through space
            </p>
          </div>
        </div>

        {/* Utility cluster. Settings and reduced motion live in the settings
            panel too, so they are hidden on phones to keep this row narrow. */}
        <div className="pointer-events-auto flex shrink-0 items-center gap-0.5 rounded-2xl border border-edge bg-white/4 p-1 backdrop-blur-xl">
          <IconButton
            icon="lightbulb"
            label="Teach me something"
            className="h-9 w-9"
            onClick={() => {
              useAppStore.getState().nextFact()
              spaceAudio.play('chime')
            }}
          />
          <IconButton
            icon="label"
            label={labelsVisible ? 'Hide planet labels' : 'Show planet labels'}
            active={labelsVisible}
            className="h-9 w-9"
            onClick={() => {
              toggleLabels()
              spaceAudio.play('click')
            }}
          />
          <IconButton
            icon={soundEnabled ? 'sound' : 'mute'}
            label={soundEnabled ? 'Mute sound' : 'Turn on ambient sound'}
            active={soundEnabled}
            className="h-9 w-9"
            onClick={() => {
              const next = !soundEnabled
              setSoundEnabled(next)
              if (next) spaceAudio.play('chime')
            }}
          />
          {!isCompact && (
            <>
              <IconButton
                icon="rotate"
                label={reducedMotion ? 'Turn off reduced motion' : 'Reduce motion'}
                active={reducedMotion}
                className="h-9 w-9"
                onClick={() => setReducedMotion(!reducedMotion)}
              />
              <IconButton
                icon="gear"
                label="Settings"
                active={panel === 'settings'}
                className="h-9 w-9"
                onClick={() => useAppStore.getState().setPanel('settings')}
              />
            </>
          )}
          <IconButton
            icon="help"
            label="Help and shortcuts"
            className="h-9 w-9"
            onClick={() => setHelpVisible(true)}
          />
        </div>
      </div>

      {/* Desktop navigation */}
      {!isCompact && (
        <nav
          aria-label="Main"
          className="pointer-events-auto mx-auto mt-3 hidden w-fit items-center gap-1 rounded-2xl border border-edge bg-white/4 p-1 backdrop-blur-xl lg:flex"
        >
          {NAV.map((item) => (
            <Button
              key={item.id}
              size="sm"
              icon={item.icon}
              active={panel === item.id}
              onClick={() => {
                togglePanel(item.id)
                spaceAudio.play('click')
              }}
            >
              {item.label === 'Learn' ? 'Explore & Learn' : item.label}
            </Button>
          ))}
          <span className="mx-1 h-5 w-px bg-edge" />
          <Button
            size="sm"
            icon="tour"
            active={tourActive}
            onClick={() => {
              startTour()
              spaceAudio.play('whoosh')
            }}
          >
            Cinematic Tour
          </Button>
        </nav>
      )}

      {/* Mobile navigation rail, below the header so nothing has to share a row */}
      <AnimatePresence>
        {isCompact && isSystem && (
          <motion.nav
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            aria-label="Main"
            className="pointer-events-auto mx-auto mt-2.5 flex w-fit gap-1 rounded-2xl border border-edge bg-white/4 p-1 backdrop-blur-xl"
          >
            {[...NAV, { id: 'tour' as const, label: 'Tour', icon: 'tour' as const }].map((item) => (
              <Button
                key={item.id}
                size="sm"
                icon={item.icon}
                className="px-2.5"
                active={item.id === 'tour' ? tourActive : panel === item.id}
                onClick={() => {
                  if (item.id === 'tour') startTour()
                  else togglePanel(item.id as 'learn')
                  spaceAudio.play('click')
                }}
              >
                {item.label}
              </Button>
            ))}
          </motion.nav>
        )}
      </AnimatePresence>
    </header>
  )
}