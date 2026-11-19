import { AlertTriangle, ArrowRight, Earth, Moon, RotateCcw, Sun, X } from 'lucide-react'
import type { WhatIfScenario } from '../../types'
import { useSimulationStore } from '../../store/simulationStore'
import { Modal } from './Modal'

const experiments: { id: WhatIfScenario; icon: typeof Moon; title: string; question: string; description: string }[] = [
  { id: 'two-moons', icon: Moon, title: 'A second Moon', question: 'What if Earth had two moons?', description: 'Meet Luna II and imagine more complicated tides, brighter nights, and a busier sky.' },
  { id: 'giant-earth', icon: Earth, title: 'A giant Earth', question: 'What if Earth were the size of Jupiter?', description: 'See Earth match Jupiter’s displayed diameter. A larger planet could have much stronger gravity.' },
  { id: 'no-sun', icon: Sun, title: 'The lights go out', question: 'What if the Sun disappeared?', description: 'Watch sunlight fade. Nothing would notice instantly: light and gravitational changes travel at light speed.' },
  { id: 'no-rotation', icon: RotateCcw, title: 'A still world', question: 'What if Earth stopped rotating?', description: 'Freeze Earth’s spin to imagine a world where one side faces the Sun for far longer.' },
]

export function WhatIfPanel() {
  const activeModal = useSimulationStore((state) => state.activeModal)
  const whatIf = useSimulationStore((state) => state.whatIf)
  const setWhatIf = useSimulationStore((state) => state.setWhatIf)
  const selectBody = useSimulationStore((state) => state.selectBody)
  const showToast = useSimulationStore((state) => state.showToast)

  const run = (scenario: WhatIfScenario) => {
    setWhatIf(scenario)
    selectBody(scenario === 'no-sun' ? 'sun' : 'earth', true)
    showToast('Hypothetical mode enabled — this is an educational simulation, not a prediction.', 'sparkle')
  }

  return (
    <Modal open={activeModal === 'what-if'} title="What if we changed the rules?" eyebrow="THE CURIOSITY LABORATORY" size="large">
      <div className="what-if-intro"><AlertTriangle size={18} /><p>These are <strong>playful educational simulations</strong>, not real predictions. Real events would be far more complicated.</p></div>
      <div className="experiment-grid">{experiments.map((experiment) => {
        const Icon = experiment.icon
        return <button key={experiment.id} className={`experiment-card ${whatIf === experiment.id ? 'active' : ''}`} onClick={() => run(experiment.id)}><span className="experiment-card__icon"><Icon size={25} /></span><small>HYPOTHETICAL 0{experiments.indexOf(experiment) + 1}</small><h3>{experiment.title}</h3><strong>{experiment.question}</strong><p>{experiment.description}</p><span className="experiment-card__action">{whatIf === experiment.id ? 'Return to experiment' : 'Run simulation'}<ArrowRight size={16} /></span></button>
      })}</div>
    </Modal>
  )
}

export function WhatIfBanner() {
  const whatIf = useSimulationStore((state) => state.whatIf)
  const setWhatIf = useSimulationStore((state) => state.setWhatIf)
  if (!whatIf) return null
  const experiment = experiments.find((item) => item.id === whatIf)
  if (!experiment) return null
  return (
    <div className="what-if-banner glass"><span><AlertTriangle size={14} />EDUCATIONAL SIMULATION</span><strong>{experiment.question}</strong><p>{whatIf === 'no-sun' ? 'Orbital paths are held visible for clarity. In reality, each planet would respond only when the change reached it, then travel in a nearly straight line.' : whatIf === 'no-rotation' ? 'Only rotation is frozen in this model. An abrupt real stop would release enormous energy and be catastrophic.' : experiment.description}</p><button onClick={() => setWhatIf(null)}><X size={14} />Reset experiment</button></div>
  )
}
