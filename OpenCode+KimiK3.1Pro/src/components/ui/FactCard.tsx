import { Sparkles } from 'lucide-react'
import { RANDOM_FACTS } from '../../data/facts'
import { useSimulationStore } from '../../store/simulationStore'
import { Modal } from './Modal'

export function FactCard() {
  const activeModal = useSimulationStore((state) => state.activeModal)
  const factIndex = useSimulationStore((state) => state.factIndex)
  const nextFact = useSimulationStore((state) => state.nextFact)
  return (
    <Modal open={activeModal === 'fact'} title="A little cosmic wonder" eyebrow="TEACH ME SOMETHING!" size="small" className="fact-modal">
      <div className="fact-card">
        <div className="fact-card__spark"><Sparkles size={28} /></div>
        <span>DISCOVERY #{String(factIndex + 1).padStart(2, '0')}</span>
        <p key={factIndex}>{RANDOM_FACTS[factIndex]}</p>
        <button className="primary-button" onClick={nextFact}><Sparkles size={16} />Another discovery</button>
      </div>
    </Modal>
  )
}
