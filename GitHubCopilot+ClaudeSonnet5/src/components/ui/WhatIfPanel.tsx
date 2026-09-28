import { AnimatePresence, motion } from 'framer-motion'
import { useSimulationStore, type WhatIfState } from '../../store/simulationStore'
import { CloseIcon } from './icons'
import { Toggle } from './Toggle'

interface Scenario {
  key: keyof WhatIfState
  title: string
  description: string
}

const SCENARIOS: Scenario[] = [
  {
    key: 'twoMoons',
    title: 'What if Earth had two moons?',
    description:
      'Earth really only has one moon, but let\u2019s imagine adding a second one and see what our night sky might look like.',
  },
  {
    key: 'earthAsJupiter',
    title: 'What if Earth were the size of Jupiter?',
    description: 'Jupiter is so enormous that more than 1,000 Earths could fit inside it. Let\u2019s see the size difference for ourselves.',
  },
  {
    key: 'noSun',
    title: 'What if the Sun disappeared?',
    description:
      'The planets would instantly lose their light and warmth. Interestingly, since gravity\u2019s effects travel at the speed of light, Earth would keep orbiting normally for about 8 more minutes before anything seemed different.',
  },
  {
    key: 'stoppedRotation',
    title: 'What if Earth stopped spinning?',
    description:
      'One side of Earth would face the Sun forever in permanent scorching daylight, while the other side would freeze in endless night.',
  },
]

/** Playful, clearly-labeled hypothetical simulations \u2014 not real predictions (see spec \u00a79/\u00a724). */
export function WhatIfPanel() {
  const isWhatIfOpen = useSimulationStore((s) => s.isWhatIfOpen)
  const toggleWhatIf = useSimulationStore((s) => s.toggleWhatIf)
  const whatIf = useSimulationStore((s) => s.whatIf)
  const setWhatIf = useSimulationStore((s) => s.setWhatIf)
  const select = useSimulationStore((s) => s.select)
  const resetToSystemView = useSimulationStore((s) => s.resetToSystemView)

  const handleToggle = (key: keyof WhatIfState) => {
    const next = !whatIf[key]
    setWhatIf(key, next)
    if (!next) return
    if (key === 'noSun') resetToSystemView()
    else select('earth')
  }

  return (
    <AnimatePresence>
      {isWhatIfOpen && (
        <motion.section
          role="dialog"
          aria-label="What If? simulations"
          initial={{ opacity: 0, x: 24 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 24 }}
          transition={{ duration: 0.2, ease: 'easeOut' }}
          className="glass-panel pointer-events-auto relative flex max-h-[75vh] w-full flex-col gap-4 overflow-y-auto rounded-t-3xl p-5 sm:max-h-[calc(100vh-7rem)] sm:w-96 sm:rounded-3xl"
        >
          <button
            type="button"
            onClick={toggleWhatIf}
            aria-label="Close What If panel"
            className="absolute right-4 top-4 flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-white/80 hover:bg-white/20 hover:text-white"
          >
            <CloseIcon className="h-4 w-4" />
          </button>

          <header>
            <h2 className="text-lg font-semibold text-white">What If?</h2>
            <p className="mt-1 text-xs text-white/60">
              Playful educational simulations — not real scientific predictions.
            </p>
          </header>

          <div className="flex flex-col gap-3">
            {SCENARIOS.map((scenario) => (
              <div key={scenario.key} className="flex flex-col gap-2 rounded-2xl bg-white/5 p-3">
                <p className="text-sm font-medium text-white">{scenario.title}</p>
                <p className="text-xs leading-relaxed text-white/65">{scenario.description}</p>
                <Toggle label={whatIf[scenario.key] ? 'Enabled' : 'Try it'} checked={whatIf[scenario.key]} onChange={() => handleToggle(scenario.key)} />
              </div>
            ))}
          </div>
        </motion.section>
      )}
    </AnimatePresence>
  )
}
