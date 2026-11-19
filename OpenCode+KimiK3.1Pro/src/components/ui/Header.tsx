import { BookOpen, FlaskConical, Orbit, Rocket, Settings2, Sparkles, Volume2, VolumeX } from 'lucide-react'
import { useSimulationStore } from '../../store/simulationStore'

export function BrandMark() {
  return (
    <svg className="brand-mark" viewBox="0 0 42 42" fill="none" aria-hidden="true">
      <circle cx="21" cy="21" r="5" fill="currentColor" />
      <ellipse cx="21" cy="21" rx="18" ry="8.5" stroke="currentColor" strokeWidth="1.25" transform="rotate(-28 21 21)" />
      <ellipse cx="21" cy="21" rx="13" ry="18" stroke="currentColor" strokeOpacity=".35" strokeWidth="1" transform="rotate(38 21 21)" />
      <circle cx="35.5" cy="12.5" r="2.2" fill="#7cddff" />
    </svg>
  )
}

export function Header() {
  const activeModal = useSimulationStore((state) => state.activeModal)
  const setActiveModal = useSimulationStore((state) => state.setActiveModal)
  const missionActive = useSimulationStore((state) => state.missionActive)
  const setMissionActive = useSimulationStore((state) => state.setMissionActive)
  const viewSystem = useSimulationStore((state) => state.viewSystem)
  const nextFact = useSimulationStore((state) => state.nextFact)
  const soundEnabled = useSimulationStore((state) => state.soundEnabled)
  const setSoundEnabled = useSimulationStore((state) => state.setSoundEnabled)
  const exitTour = useSimulationStore((state) => state.exitTour)

  return (
    <header className="topbar">
      <button className="brand" onClick={viewSystem} aria-label="Astra home — view the complete Solar System">
        <BrandMark />
        <span className="brand__word">ASTRA</span>
        <span className="brand__divider" />
        <span className="brand__descriptor">SOLAR SYSTEM<br />EXPLORER</span>
      </button>
      <nav className="main-nav" aria-label="Main navigation">
        <button className={!activeModal && !missionActive ? 'active' : ''} onClick={viewSystem}><Orbit size={16} /><span>Explore</span></button>
        <button className={activeModal === 'learn' ? 'active' : ''} onClick={() => setActiveModal('learn')}><BookOpen size={16} /><span>Explore & Learn</span></button>
        <button className={missionActive ? 'active' : ''} onClick={() => { exitTour(); setMissionActive(!missionActive) }}><Rocket size={16} /><span>Missions</span></button>
        <button className={activeModal === 'what-if' ? 'active' : ''} onClick={() => setActiveModal('what-if')}><FlaskConical size={16} /><span>What if?</span></button>
      </nav>
      <div className="topbar__actions">
        <button className="teach-button" onClick={nextFact}><Sparkles size={15} /><span>Teach me!</span></button>
        <button className="icon-button" onClick={() => setSoundEnabled(!soundEnabled)} aria-label={soundEnabled ? 'Mute ambient audio' : 'Enable ambient audio'} aria-pressed={soundEnabled}>
          {soundEnabled ? <Volume2 size={19} /> : <VolumeX size={19} />}
        </button>
        <button className="icon-button" onClick={() => setActiveModal('settings')} aria-label="Open settings"><Settings2 size={19} /></button>
      </div>
    </header>
  )
}
