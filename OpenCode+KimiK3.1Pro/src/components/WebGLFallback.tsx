import { Component, useEffect } from 'react'
import type { ReactNode } from 'react'
import { AlertTriangle } from 'lucide-react'
import { PLANETS, SUN } from '../data/planets'
import { useSimulationStore } from '../store/simulationStore'

export function WebGLFallback() {
  const setSceneReady = useSimulationStore((state) => state.setSceneReady)
  const selectBody = useSimulationStore((state) => state.selectBody)
  useEffect(() => setSceneReady(true), [setSceneReady])
  return (
    <div className="webgl-fallback">
      <div className="fallback-notice"><AlertTriangle size={18} /><div><strong>2D explorer mode</strong><span>Your browser or graphics hardware cannot display the 3D Solar System. You can still explore every world below.</span></div></div>
      <div className="fallback-system" aria-label="Simplified 2D Solar System">
        <div className="fallback-sun"><button onClick={() => selectBody('sun')} style={{ background: SUN.color }} aria-label="Learn about the Sun" /></div>
        {PLANETS.map((planet, index) => {
          const size = 90 + index * 42
          const angle = index * 47 + 20
          return <div className="fallback-orbit" key={planet.id} style={{ width: size * 2, height: size * 2 }}><button className="fallback-planet" onClick={() => selectBody(planet.id)} style={{ transform: `rotate(${angle}deg) translateX(${size}px) rotate(${-angle}deg)`, background: planet.color }} aria-label={`Learn about ${planet.name}`}><span>{planet.name}</span></button></div>
        })}
      </div>
    </div>
  )
}

interface BoundaryProps { children: ReactNode; onError: () => void }
interface BoundaryState { failed: boolean }

export class SceneErrorBoundary extends Component<BoundaryProps, BoundaryState> {
  state: BoundaryState = { failed: false }

  static getDerivedStateFromError(): BoundaryState {
    return { failed: true }
  }

  componentDidCatch(): void {
    this.props.onError()
  }

  render(): ReactNode {
    return this.state.failed ? <WebGLFallback /> : this.props.children
  }
}
