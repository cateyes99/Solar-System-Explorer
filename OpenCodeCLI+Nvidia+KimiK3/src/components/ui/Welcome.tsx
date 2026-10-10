import { useEffect, useState } from 'react'
import { useSimulationStore } from '../../store/simulationStore'

export function Welcome() {
  const visible = useSimulationStore((s) => s.welcomeVisible)
  const dismiss = useSimulationStore((s) => s.dismissWelcome)
  const [phase, setPhase] = useState(0)

  useEffect(() => {
    if (!visible) return
    const t1 = setTimeout(() => setPhase(1), 1800)
    const t2 = setTimeout(() => dismiss(), 7000)
    return () => { clearTimeout(t1); clearTimeout(t2) }
  }, [visible, dismiss])

  if (!visible) return null
  return (
    <div className="welcome" onClick={dismiss} role="status">
      <h1 className={phase >= 0 ? 'fade-in' : ''}>Welcome to the Solar System</h1>
      <p className={phase >= 1 ? 'fade-in' : ''}>Drag to explore • Click a planet to learn • Start a mission</p>
    </div>
  )
}
