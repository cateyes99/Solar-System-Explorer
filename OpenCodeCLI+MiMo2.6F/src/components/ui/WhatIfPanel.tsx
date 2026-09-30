import { AnimatePresence, motion } from 'framer-motion'
import { useSimStore, type WhatIfFlags } from '../../store/simulationStore'
import { CloseIcon, SparkIcon } from './icons'
import { playBlip } from '../../utils/audio'

interface Scenario {
  id: keyof WhatIfFlags
  title: string
  prompt: string
  effect: string
  science: string
  emoji: string
}

const SCENARIOS: Scenario[] = [
  {
    id: 'secondMoon',
    title: 'What if Earth had two moons?',
    prompt: 'Add a second, smaller Moon that zips around faster.',
    effect: 'Two moons appear in the sky — one big and slow, one small and quick.',
    science:
      'A second large Moon would tug on the oceans and make tides far more chaotic, and it would wobble Earth’s tilt much more. Real moons also slowly push each other into locked orbits — here we keep it simple so you can just watch them dance.',
    emoji: '🌙',
  },
  {
    id: 'earthAsJupiter',
    title: 'What if Earth were the size of Jupiter?',
    prompt: 'Grow Earth until it matches the biggest planet.',
    effect: 'Earth balloons to Jupiter size while everything else stays the same — the Moon looks tiny next to it.',
    science:
      'A rocky planet this large would have crushing gravity (about 2.4× stronger at the surface) and might even hold a thick atmosphere, becoming a mini gas giant. This is a size comparison only — it is not a real prediction.',
    emoji: '🪐',
  },
  {
    id: 'sunGone',
    title: 'What if the Sun disappeared?',
    prompt: 'Switch off our star and watch the Solar System change.',
    effect: 'The Sun vanishes and every planet drops into darkness.',
    science:
      'In reality, Earth would stay lit for another 8 minutes and 20 seconds (that is how long sunlight takes to arrive), and the gravity change would also travel at the speed of light — only after that would planets fly off in straight lines. Here the darkness happens instantly so you can see the idea.',
    emoji: '🌑',
  },
  {
    id: 'earthStopped',
    title: 'What if Earth stopped rotating?',
    prompt: 'Freeze Earth’s spin but keep it orbiting.',
    effect: 'Earth’s day/night cycle stops — one side bakes while the other freezes.',
    science:
      'With no spin, one hemisphere would face the Sun for months (boiling hot) and the other would get months of darkness (freezing). Winds at the equator would rage as the atmosphere tried to keep up, and our magnetic field would weaken. We have switched off the spin in the 3D scene for you.',
    emoji: '🛑',
  },
]

function Switch({
  checked,
  onChange,
  label,
}: {
  checked: boolean
  onChange: () => void
  label: string
}) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-cyan-200">
      <input
        type="checkbox"
        checked={checked}
        onChange={onChange}
        aria-label={label}
        className="relative h-5 w-9 shrink-0 appearance-none rounded-full bg-white/20 transition-colors
                   checked:bg-solar-400 before:absolute before:top-0.5 before:left-0.5 before:h-4 before:w-4
                   before:rounded-full before:bg-white before:transition-transform before:content-['']
                   checked:before:translate-x-4"
      />
      {checked ? 'ON' : 'OFF'}
    </label>
  )
}

/**
 * "What If?" playground — playful hypothetical experiments, each clearly
 * labelled as an educational simulation rather than a prediction.
 */
export function WhatIfPanel() {
  const open = useSimStore((s) => s.panel) === 'whatif'
  const closePanel = useSimStore((s) => s.closePanel)
  const whatIf = useSimStore((s) => s.whatIf)
  const setWhatIf = useSimStore((s) => s.setWhatIf)

  const handleToggle = (flag: keyof WhatIfFlags, next: boolean) => {
    playBlip(next ? 880 : 420, 0.1)
    setWhatIf(flag, next)
    if (flag === 'sunGone' && next) {
      useSimStore.getState().showToast('Lights out! Notice how everything depends on the Sun.', 'fun')
    }
  }

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-end justify-center sm:items-center sm:p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <button
            type="button"
            className="absolute inset-0 bg-space-950/75 backdrop-blur-sm"
            onClick={closePanel}
            aria-label="Close What If mode"
          />

          <motion.div
            role="dialog"
            aria-label="What If mode"
            initial={{ y: 60, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 40, opacity: 0 }}
            transition={{ type: 'spring', stiffness: 260, damping: 30 }}
            className="panel relative flex max-h-[92svh] w-full max-w-3xl flex-col overflow-hidden rounded-t-3xl sm:max-h-[86vh] sm:rounded-3xl"
          >
            <header className="flex items-start justify-between gap-3 border-b border-white/10 px-4 py-3 sm:px-6">
              <div>
                <h2 className="flex items-center gap-2 font-display text-xl font-bold text-white">
                  <SparkIcon className="text-solar-400" /> What If?
                </h2>
                <p className="text-[11px] uppercase tracking-[0.16em] text-solar-400/90">
                  Educational simulations · not real predictions
                </p>
              </div>
              <button
                type="button"
                className="chip !px-2 !py-1"
                onClick={closePanel}
                aria-label="Close What If mode"
              >
                <CloseIcon width={14} height={14} />
              </button>
            </header>

            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4 sm:px-6">
              <p className="rounded-xl border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-[13px] leading-relaxed text-amber-100">
                These experiments are <strong>thought experiments</strong> — fun ways to understand
                real science. None of them is happening, and none is a prediction about the future.
              </p>

              {SCENARIOS.map((scenario) => (
                <section
                  key={scenario.id}
                  aria-labelledby={`whatif-${scenario.id}`}
                  className="rounded-2xl border border-white/10 bg-white/5 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="mr-2 text-xl" aria-hidden="true">
                        {scenario.emoji}
                      </span>
                      <h3
                        id={`whatif-${scenario.id}`}
                        className="inline font-display text-lg font-semibold text-white"
                      >
                        {scenario.title}
                      </h3>
                      <p className="mt-1 text-sm text-white/70">{scenario.prompt}</p>
                    </div>
                    <Switch
                      checked={whatIf[scenario.id]}
                      label={`Turn on ${scenario.title}`}
                      onChange={() => handleToggle(scenario.id, !whatIf[scenario.id])}
                    />
                  </div>

                  <div className="mt-3 grid gap-2 sm:grid-cols-2">
                    <div className="rounded-lg border border-cyan-400/25 bg-cyan-400/10 px-3 py-2 text-[12px] leading-relaxed text-cyan-100">
                      <strong className="block text-cyan-300">What you’ll see</strong>
                      {scenario.effect}
                    </div>
                    <div className="rounded-lg border border-solar-400/25 bg-solar-400/10 px-3 py-2 text-[12px] leading-relaxed text-solar-100">
                      <strong className="block text-solar-400">The real science</strong>
                      {scenario.science}
                    </div>
                  </div>

                  {whatIf[scenario.id] && (
                    <motion.p
                      initial={{ opacity: 0, y: 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="mt-2 text-[12px] text-cyan-300"
                    >
                      ✓ Simulation active — look at the 3D scene behind this panel.
                    </motion.p>
                  )}
                </section>
              ))}

              <button
                type="button"
                className="chip w-full justify-center"
                onClick={() => {
                  (Object.keys(whatIf) as (keyof WhatIfFlags)[]).forEach((flag) =>
                    setWhatIf(flag, false),
                  )
                  playBlip(400, 0.1)
                }}
              >
                Reset all simulations
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
