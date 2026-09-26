import { Component } from 'react'
import type { ReactNode } from 'react'
import { Orbit, RotateCcw } from 'lucide-react'
import { bodies } from '../../data/planets'
import { useSimulation } from '../../store/simulationStore'

export function LoadingScreen() {
  return <div className="loading-screen" role="status"><div className="loading-orbit"><span /></div><span className="eyebrow">ORBIT ATLAS</span><h2>Preparing the Solar System...</h2><p>A little curiosity. An entire universe.</p></div>
}

export function FallbackScene() {
  return <section className="fallback-scene" aria-label="2D solar system fallback"><Orbit size={40} /><h2>A different window into space.</h2><p>Your browser or graphics hardware cannot display the 3D Solar System.</p><p>You can still discover every world in this simplified 2D view.</p><div className="fallback-planets">{bodies.filter(body => body.id !== 'moon').map(body => <button key={body.id} onClick={() => useSimulation.getState().select(body.id, false)}><span className={`mini-planet ${body.id}`} style={{ '--planet-color': body.color } as React.CSSProperties} />{body.name}</button>)}</div><button className="secondary-button" onClick={() => window.location.reload()}><RotateCcw size={15} />Try 3D again</button></section>
}

export class SceneBoundary extends Component<{ children: ReactNode; onFailure: () => void }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() { this.props.onFailure() }
  render() { return this.state.failed ? <FallbackScene /> : this.props.children }
}