import { useEffect, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { Earth, Rocket, Sparkles, Sun, X } from 'lucide-react'
import { useSimulationStore } from '../../store/simulationStore'

export function SceneHeading() {
  const selectedBody = useSimulationStore((state) => state.selectedBody)
  const missionActive = useSimulationStore((state) => state.missionActive)
  const tourActive = useSimulationStore((state) => state.tourActive)
  if (selectedBody || missionActive || tourActive) return null
  return <div className="scene-heading"><span><i />LIVE INTERACTIVE MODEL</span><h1>Our cosmic<br /><em>neighborhood.</em></h1><p>Eight worlds. Endless questions.<br />Where will your curiosity take you?</p></div>
}

export function WelcomeMessage() {
  const [visible, setVisible] = useState(true)
  const sceneReady = useSimulationStore((state) => state.sceneReady)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  useEffect(() => {
    if (!sceneReady) return
    const timer = window.setTimeout(() => setVisible(false), 7500)
    return () => window.clearTimeout(timer)
  }, [sceneReady])
  return <AnimatePresence>{visible && sceneReady && <motion.div className="welcome-message" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ delay: reducedMotion ? 0 : 0.5, duration: 0.6 }}><Sparkles size={15} /><div><strong>Welcome to the Solar System</strong><span>Drag to explore · Click a planet to learn · Start a mission</span></div><button onClick={() => setVisible(false)} aria-label="Dismiss welcome message"><X size={14} /></button></motion.div>}</AnimatePresence>
}

export function Toast() {
  const toast = useSimulationStore((state) => state.toast)
  const clearToast = useSimulationStore((state) => state.clearToast)
  useEffect(() => {
    if (!toast) return
    const timer = window.setTimeout(clearToast, 4800)
    return () => window.clearTimeout(timer)
  }, [toast, clearToast])
  const Icon = toast?.icon === 'earth' ? Earth : toast?.icon === 'sun' ? Sun : toast?.icon === 'rocket' ? Rocket : Sparkles
  return <AnimatePresence>{toast && <motion.div className="toast glass" role="status" key={toast.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}><Icon size={19} /><span>{toast.text}</span><button onClick={clearToast} aria-label="Dismiss notification"><X size={14} /></button></motion.div>}</AnimatePresence>
}

export function ViewSystemButton() {
  const selected = useSimulationStore((state) => state.selectedBody)
  const mode = useSimulationStore((state) => state.cameraMode)
  const viewSystem = useSimulationStore((state) => state.viewSystem)
  if (!selected && mode === 'system') return null
  return <button className="view-system-button glass" onClick={viewSystem}>← View Solar System</button>
}
