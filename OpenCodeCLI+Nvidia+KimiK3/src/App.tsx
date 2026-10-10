import { useEffect, useState } from 'react'
import { SolarSystemScene } from './scenes/SolarSystemScene'
import { Header } from './components/ui/Header'
import { PlanetPanel } from './components/ui/PlanetPanel'
import { TimeControls } from './components/ui/TimeControls'
import { Tooltip } from './components/ui/Tooltip'
import { TourControls } from './components/ui/TourControls'
import { FactCard } from './components/ui/FactCard'
import { SettingsPanel } from './components/ui/SettingsPanel'
import { LoadingScreen } from './components/ui/LoadingScreen'
import { WebGLFallback } from './components/ui/WebGLFallback'
import { Welcome } from './components/ui/Welcome'
import { AmbientAudio } from './components/ui/AmbientAudio'
import { useSimulationStore } from './store/simulationStore'

function webglAvailable(): boolean {
  try {
    const canvas = document.createElement('canvas')
    return !!(canvas.getContext('webgl2') || canvas.getContext('webgl'))
  } catch {
    return false
  }
}

export default function App() {
  const [loading, setLoading] = useState(true)
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [spacecraftActive, setSpacecraftActive] = useState(false)
  const [webglOk] = useState(webglAvailable)
  const select = useSimulationStore((s) => s.select)

  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 1600)
    return () => clearTimeout(t)
  }, [])

  // keyboard shortcuts: Esc deselects, Space pauses
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') select(null)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [select])

  if (!webglOk) return <WebGLFallback />
  if (loading) return <LoadingScreen />

  return (
    <div className="app">
      <Header onOpenSettings={() => setSettingsOpen(true)} />
      <main className="viewport">
        <SolarSystemScene spacecraftActive={spacecraftActive} />
      </main>
      <Welcome />
      <Tooltip />
      <PlanetPanel />
      <TourControls />
      <FactCard />
      <SettingsPanel open={settingsOpen} onClose={() => setSettingsOpen(false)} />
      <div className="bottom-bar">
        <TimeControls />
        <button
          className={`ship-toggle glass ${spacecraftActive ? 'active' : ''}`}
          onClick={() => setSpacecraftActive((v) => !v)}
          aria-pressed={spacecraftActive}
        >
          🚀 {spacecraftActive ? 'Dock Ship' : 'Fly a Spacecraft'}
        </button>
      </div>
      {spacecraftActive && (
        <div className="mission-control glass" role="status" aria-label="Mission control">
          <strong>Mission Control</strong>
          <span>Speed: <b id="ship-speed">0 u/s</b></span>
          <span>Distance from Sun: <b id="ship-dist">—</b></span>
          <span className="hint">W/A/S/D or arrow keys to fly • Space to brake</span>
        </div>
      )}
      <AmbientAudio />
    </div>
  )
}
