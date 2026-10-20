import { AnimatePresence, motion } from 'framer-motion'
import { useState } from 'react'
import { useDialogFocus } from '../../hooks/useDialogFocus'
import { useSimulationStore, type AppMode } from '../../store/simulationStore'
import { Icon, type IconName } from './Icon'

const MODES: { id: AppMode; label: string; icon: IconName; description: string }[] = [
  { id: 'explore', label: 'Explore', icon: 'globe', description: 'Fly around and click planets' },
  { id: 'learn', label: 'Learn', icon: 'book', description: 'Interactive lessons' },
  { id: 'whatif', label: 'What If?', icon: 'flask', description: 'Playful experiments' },
  { id: 'mission', label: 'Mission', icon: 'rocket', description: 'Fly your own spacecraft' },
  { id: 'tour', label: 'Cinematic Tour', icon: 'film', description: 'Sit back and enjoy the ride' },
]

function Logo() {
  return (
    <div className="flex items-center gap-2.5">
      <svg width="34" height="34" viewBox="0 0 64 64" aria-hidden="true">
        <defs>
          <radialGradient id="logo-sun" cx="40%" cy="40%">
            <stop offset="0%" stopColor="#fff3c4" />
            <stop offset="60%" stopColor="#ffb347" />
            <stop offset="100%" stopColor="#ff7a1a" />
          </radialGradient>
        </defs>
        <ellipse cx="32" cy="32" rx="28" ry="11" fill="none" stroke="#5ee7ff" strokeOpacity="0.7" strokeWidth="2" transform="rotate(-24 32 32)" />
        <circle cx="32" cy="32" r="11" fill="url(#logo-sun)" />
        <circle cx="55" cy="21" r="4" fill="#7dd3fc" />
      </svg>
      <div className="leading-tight">
        <div className="font-display text-[15px] font-bold tracking-tight text-white sm:text-base">Solar System Explorer</div>
        <div className="hidden text-[11px] font-medium text-slate-400 sm:block">An interactive journey through space</div>
      </div>
    </div>
  )
}

function ModeButtons({ onPick, vertical = false }: { onPick?: () => void; vertical?: boolean }) {
  const appMode = useSimulationStore((s) => s.appMode)
  const setAppMode = useSimulationStore((s) => s.setAppMode)
  const is2D = useSimulationStore((s) => s.renderMode === '2d')
  return (
    <>
      {MODES.filter((mode) => !is2D || mode.id === 'explore' || mode.id === 'learn').map((mode) => {
        const active = appMode === mode.id
        return (
          <button
            key={mode.id}
            type="button"
            aria-pressed={active}
            onClick={() => {
              if (mode.id === 'tour' && active) useSimulationStore.getState().exitTour()
              else setAppMode(mode.id)
              onPick?.()
            }}
            className={`btn ${vertical ? 'w-full justify-start rounded-2xl py-3' : ''}`}
          >
            <Icon name={mode.icon} size={18} />
            <span>{mode.label}</span>
            {vertical && <span className="ml-auto text-xs font-normal text-slate-400">{mode.description}</span>}
          </button>
        )
      })}
    </>
  )
}

function MobileMenu({ open, onClose }: { open: boolean; onClose: () => void }) {
  const ref = useDialogFocus<HTMLDivElement>(open, onClose)
  const setSettingsOpen = useSimulationStore((s) => s.setSettingsOpen)
  const setHelpOpen = useSimulationStore((s) => s.setHelpOpen)
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/50"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.div
            ref={ref}
            role="dialog"
            aria-modal="true"
            aria-label="Main menu"
            tabIndex={-1}
            className="glass fixed inset-x-0 bottom-0 z-50 rounded-t-3xl p-5 pb-[max(1.25rem,env(safe-area-inset-bottom))]"
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
          >
            <div className="mx-auto mb-4 h-1.5 w-12 rounded-full bg-white/20" />
            <nav className="flex flex-col gap-2" aria-label="Modes">
              <ModeButtons vertical onPick={onClose} />
            </nav>
            <div className="mt-4 grid grid-cols-2 gap-2">
              <button
                type="button"
                className="btn rounded-2xl"
                onClick={() => {
                  onClose()
                  setSettingsOpen(true)
                }}
              >
                <Icon name="settings" /> Settings
              </button>
              <button
                type="button"
                className="btn rounded-2xl"
                onClick={() => {
                  onClose()
                  setHelpOpen(true)
                }}
              >
                <Icon name="help" /> Help
              </button>
            </div>
            <button type="button" className="btn mt-3 w-full rounded-2xl" onClick={onClose} data-autofocus>
              Close menu
            </button>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

export function Header() {
  const [menuOpen, setMenuOpen] = useState(false)
  const sound = useSimulationStore((s) => s.sound.enabled)
  const setSound = useSimulationStore((s) => s.setSound)
  const showFact = useSimulationStore((s) => s.showFact)
  const setSettingsOpen = useSimulationStore((s) => s.setSettingsOpen)
  const setHelpOpen = useSimulationStore((s) => s.setHelpOpen)

  return (
    <header className="pointer-events-none fixed inset-x-0 top-0 z-30 flex items-center justify-between gap-3 px-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:px-5">
      <div className="glass pointer-events-auto rounded-2xl px-3 py-2">
        <Logo />
      </div>

      <nav aria-label="Modes" className="glass pointer-events-auto hidden items-center gap-1 rounded-full p-1.5 xl:flex">
        <ModeButtons />
      </nav>

      <div className="pointer-events-auto flex items-center gap-2">
        <button type="button" onClick={showFact} className="btn-primary btn-solar hidden sm:inline-flex">
          <Icon name="lightbulb" size={18} />
          Teach Me Something!
        </button>
        <button type="button" onClick={showFact} className="btn-primary btn-solar btn-icon sm:hidden" aria-label="Teach me something">
          <Icon name="lightbulb" size={20} />
        </button>
        <button
          type="button"
          className="btn btn-icon glass"
          aria-label={sound ? 'Mute sound' : 'Turn sound on'}
          aria-pressed={sound}
          onClick={() => setSound({ enabled: !sound })}
        >
          <Icon name={sound ? 'soundOn' : 'soundOff'} />
        </button>
        <button type="button" className="btn btn-icon glass hidden md:inline-flex" aria-label="Help and keyboard shortcuts" onClick={() => setHelpOpen(true)}>
          <Icon name="help" />
        </button>
        <button type="button" className="btn btn-icon glass hidden md:inline-flex" aria-label="Settings" onClick={() => setSettingsOpen(true)}>
          <Icon name="settings" />
        </button>
        <button
          type="button"
          className="btn btn-icon glass xl:hidden"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <Icon name="menu" />
        </button>
      </div>
      <MobileMenu open={menuOpen} onClose={() => setMenuOpen(false)} />
    </header>
  )
}
