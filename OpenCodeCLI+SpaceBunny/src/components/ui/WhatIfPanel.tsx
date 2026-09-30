import { AnimatePresence } from 'framer-motion'
import { SCENARIOS } from '../../data/scenarios'
import { useAppStore } from '../../store/useAppStore'
import { Panel } from './primitives/Panel'
import { Pill } from './primitives/Controls'
import { Icon } from './Icon'

export function WhatIfPanel() {
  const panel = useAppStore((s) => s.panel)
  const whatIfId = useAppStore((s) => s.whatIfId)
  const openWhatIf = useAppStore((s) => s.openWhatIf)
  const closeWhatIf = useAppStore((s) => s.closeWhatIf)
  const setPanel = useAppStore((s) => s.setPanel)

  const active = SCENARIOS.find((s) => s.id === whatIfId) ?? null

  return (
    <AnimatePresence>
      {panel === 'whatif' &&
        (active ? (
          <Panel
            key="whatif-active"
            title={active.title}
            eyebrow="Educational simulation"
            onClose={() => {
              closeWhatIf()
              setPanel('whatif')
            }}
          >
            <div className="space-y-5">
              <div className="flex items-start gap-3 rounded-xl border border-solar/25 bg-solar/8 p-3.5">
                <Icon name="flask" size={17} className="mt-0.5 shrink-0 text-solar" />
                <p className="text-[12px] leading-relaxed text-ice-100/90">
                  This is a <strong className="text-ice-50">simplified teaching model</strong>, not a prediction.
                  Real physics would be far more complicated.
                </p>
              </div>

              <section>
                <h3 className="eyebrow mb-2">What you are seeing</h3>
                <ul className="space-y-2">
                  {active.shows.map((line) => (
                    <li key={line} className="flex gap-2.5 text-[13px] leading-relaxed text-ice-200/85">
                      <Icon name="chevron-right" size={14} className="mt-1 shrink-0 text-cyan-glow/70" />
                      {line}
                    </li>
                  ))}
                </ul>
              </section>

              <section>
                <h3 className="eyebrow mb-2">What it teaches</h3>
                <ul className="space-y-2.5">
                  {active.teaches.map((line) => (
                    <li key={line} className="flex gap-2.5 text-[13px] leading-relaxed text-ice-200/85">
                      <span className="mt-[7px] h-1 w-1 shrink-0 rounded-full bg-solar/70" />
                      {line}
                    </li>
                  ))}
                </ul>
              </section>

              <div className="flex flex-wrap gap-1.5">
                {SCENARIOS.filter((s) => s.id !== active.id).map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => openWhatIf(s.id)}
                    className="rounded-full border border-edge px-3 py-1.5 text-[11.5px] font-medium text-ice-200/85 transition-colors hover:border-edge-strong hover:text-ice-50 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                  >
                    Try: {s.title.replace('What if ', '')}
                  </button>
                ))}
              </div>

              <Pill tone="muted">Drag the scene to look around. Every world here is procedurally drawn.</Pill>
            </div>
          </Panel>
        ) : (
          <Panel title="What If?" eyebrow="Four playful experiments" onClose={() => setPanel(null)}>
            <div className="space-y-2.5">
              <p className="text-[13px] leading-relaxed text-ice-200/80">
                Change one thing about the Solar System and watch what it does. These are teaching models built to
                explain a real idea, not predictions about what would actually happen.
              </p>
              {SCENARIOS.map((scenario) => (
                <button
                  key={scenario.id}
                  type="button"
                  onClick={() => openWhatIf(scenario.id)}
                  className="group flex w-full items-start gap-3.5 rounded-xl border border-edge bg-white/3 p-3.5 text-left transition-colors hover:border-edge-strong hover:bg-white/7 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cyan-glow"
                >
                  <span className="mt-0.5 grid h-9 w-9 shrink-0 place-items-center rounded-lg border border-edge bg-white/5 text-solar">
                    <Icon name={scenario.icon} size={17} />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-[13.5px] font-semibold text-ice-50">{scenario.title}</span>
                    <span className="mt-1 block text-[12px] leading-relaxed text-ice-200/70">
                      {scenario.teaser}
                    </span>
                  </span>
                  <Icon name="chevron-right" size={16} className="mt-2 shrink-0 text-ice-400/60" />
                </button>
              ))}
            </div>
          </Panel>
        ))}
    </AnimatePresence>
  )
}