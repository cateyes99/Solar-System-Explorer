import { useEffect, useRef, useState } from 'react'
import { ArrowRight, AudioLines, BookOpen, Check, ChevronRight, Compass, Focus, Globe2, GripHorizontal, Maximize, Minimize, Orbit, Pause, Play, Plus, Rocket, RotateCcw, Settings2, Shuffle, SkipForward, Sparkles, Telescope, Volume2, VolumeX, X } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { useShallow } from 'zustand/react/shallow'
import { allFacts, bodies, bodyById, DAY_MS, EPOCH, planets, tourStops } from '../../data/planets'
import { useSimulation } from '../../store/simulationStore'
import { formatDate, MAX_DAYS } from '../../utils/astronomy'

export function IconButton({ label, children, ...props }: ButtonHTMLAttributes<HTMLButtonElement> & { label: string; children: ReactNode }) {
  return <button {...props} className={`icon-button ${props.className ?? ''}`} aria-label={label} title={label}>{children}</button>
}

export function Header() {
  const panel = useSimulation(state => state.panel)
  const audio = useSimulation(state => state.audio)
  const tour = useSimulation(state => state.tour)
  const [full, setFull] = useState(false)
  useEffect(() => {
    const update = () => setFull(Boolean(document.fullscreenElement))
    document.addEventListener('fullscreenchange', update)
    return () => document.removeEventListener('fullscreenchange', update)
  }, [])
  const open = (next: typeof panel) => useSimulation.getState().set({ panel: panel === next ? null : next, tour: null })
  return <header className="header">
    <a className="brand" href="#" onClick={event => { event.preventDefault(); useSimulation.getState().viewSystem(); useSimulation.getState().set({ panel: null, tour: null }) }} aria-label="Orbit Atlas home"><span className="brand-mark"><Orbit size={28} strokeWidth={1.3} /></span><span>ORBIT<span className="brand-light">ATLAS</span><small>A FIELD GUIDE TO OUR SOLAR SYSTEM</small></span></a>
    <nav aria-label="Main navigation" className="main-nav">
      <button className={!panel ? 'active' : ''} onClick={() => { useSimulation.getState().set({ panel: null, tour: null }); useSimulation.getState().viewSystem() }}><Compass size={16} /><span>Explore</span></button>
      <button className={panel === 'learn' ? 'active' : ''} onClick={() => open('learn')}><BookOpen size={16} /><span>Explore & Learn</span></button>
      <button className={panel === 'mission' ? 'active' : ''} onClick={() => open('mission')}><Rocket size={16} /><span>Missions</span></button>
      <button className={panel === 'experiments' ? 'active' : ''} onClick={() => open('experiments')}><Sparkles size={16} /><span>What if?</span></button>
    </nav>
    <div className="header-actions">
      <IconButton label={audio ? 'Mute ambient audio' : 'Enable ambient audio'} onClick={() => useSimulation.getState().set({ audio: !audio })}>{audio ? <Volume2 size={18} /> : <VolumeX size={18} />}</IconButton>
      <IconButton label="Settings" className={panel === 'settings' ? 'active' : ''} onClick={() => open('settings')}><Settings2 size={18} /></IconButton>
      <button className="tour-button" onClick={() => tour === null ? useSimulation.getState().startTour() : useSimulation.getState().exitTour()}><Play size={13} fill="currentColor" /><span>{tour === null ? 'Cinematic Tour' : 'Exit Tour'}</span></button>
    </div>
    <IconButton label={full ? 'Exit fullscreen' : 'Enter fullscreen'} className="fullscreen-button" onClick={() => { if (document.fullscreenElement) void document.exitFullscreen(); else void document.documentElement.requestFullscreen?.().catch(() => undefined) }}>{full ? <Minimize size={17} /> : <Maximize size={17} />}</IconButton>
  </header>
}

export function PlanetIndex() {
  const selected = useSimulation(state => state.selected)
  return <aside className="planet-index" aria-label="Celestial objects">
    <div className="eyebrow index-heading">OUR SOLAR SYSTEM <span>{bodies.length - 1}</span></div>
    {bodies.filter(body => body.id !== 'moon').map((body, index) => <button key={body.id} className={`index-item ${selected === body.id ? 'active' : ''}`} onClick={() => useSimulation.getState().select(body.id)} aria-pressed={selected === body.id}>
      <span className={`mini-planet ${body.id}`} style={{ '--planet-color': body.color } as React.CSSProperties} /><span>{body.name}</span><small>{index === 0 ? <Sparkles size={11} /> : `0${index}`}</small>
    </button>)}
    <button className="index-moon" onClick={() => useSimulation.getState().select('moon')}><span className="moon-dot" /> Earth's Moon <ChevronRight size={12} /></button>
    <div className="index-footer"><span className="live-dot" /> LIVE SIMULATION</div>
  </aside>
}

export function PlanetPanel() {
  const id = useSimulation(state => state.selected)
  const panel = useSimulation(state => state.panel)
  const tour = useSimulation(state => state.tour)
  const cameraMode = useSimulation(state => state.cameraMode)
  const body = id ? bodyById[id] : null
  return <AnimatePresence>{body && !panel && tour === null && <motion.aside key={body.id} className="side-panel planet-panel" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 12 }} aria-label={`${body.name} information`}>
    <div className="panel-top"><span className="eyebrow">COSMIC FIELD NOTES</span><IconButton label="Close planet information" onClick={() => useSimulation.getState().viewSystem()}><X size={17} /></IconButton></div>
    <div className="body-title"><span className="eyebrow" style={{ color: body.color }}>{body.kind}</span><h2>{body.name}<span>.</span></h2>{body.id === 'earth' && <span className="home-tag">HELLO, EARTH</span>}</div>
    <p className="body-description">{body.description}</p>
    <dl className="planet-stats">
      <div><dt>{id === 'halley' ? 'Nucleus dimensions' : 'Diameter'}</dt><dd>{id === 'halley' ? '15 x 8' : body.diameter.toLocaleString()} <small>km</small></dd></div>
      <div><dt>{body.id === 'moon' ? 'From Earth' : 'From the Sun'}</dt><dd>{body.id === 'moon' ? '384,400' : body.distanceAU === 0 ? 'Center' : (body.distanceAU * 149.598).toLocaleString('en', { maximumFractionDigits: 1 })} <small>{body.id === 'moon' ? 'km' : body.distanceAU ? 'million km' : ''}</small></dd></div>
      <div><dt>{body.id === 'moon' ? 'Orbit around Earth' : 'Length of year'}</dt><dd>{body.year ? body.year.toLocaleString('en', { maximumFractionDigits: 1 }) : '--'} <small>{body.year ? 'Earth days' : ''}</small></dd></div>
      <div><dt>One rotation</dt><dd>{Math.abs(body.day).toLocaleString('en', { maximumFractionDigits: 1 })} <small>hours</small></dd></div>
      <div><dt>Moons</dt><dd>{body.moons}</dd></div>
      <div><dt>Temperature</dt><dd className="temperature">{body.temperature}</dd></div>
    </dl>
    <div className="did-you-know"><Sparkles size={17} /><div><h3>Did you know?</h3><p>{body.facts[0]}</p></div></div>
    <details><summary>More discoveries <Plus size={14} /></summary>{body.facts.slice(1).map(fact => <p key={fact}>{fact}</p>)}</details>
    {id === 'halley' && <div className="comet-controls" aria-label="Halley observations">
      <button onClick={() => useSimulation.getState().set({ cameraMode: 'orbit', cameraRevision: useSimulation.getState().cameraRevision + 1 })}><Orbit size={15} />View full orbit</button>
      {[{ label: '1986 perihelion', date: Date.UTC(1986, 1, 9, 12) }, { label: '2061 perihelion', date: Date.UTC(2061, 6, 28, 12) }].map(visit => <button key={visit.label} onClick={() => useSimulation.getState().set({ days: (visit.date - EPOCH) / DAY_MS, paused: true, cameraMode: 'follow', cameraRevision: useSimulation.getState().cameraRevision + 1 })}><RotateCcw size={15} />{visit.label}</button>)}
    </div>}
    <div className="camera-modes" aria-label="Camera mode"><button className={cameraMode === 'planet' ? 'active' : ''} onClick={() => useSimulation.getState().set({ cameraMode: 'planet' })}><Focus size={15} />{id === 'halley' ? 'View nucleus' : 'View Planet'}</button><button className={cameraMode === 'follow' ? 'active' : ''} onClick={() => useSimulation.getState().set({ cameraMode: 'follow' })}><Orbit size={15} />{id === 'halley' ? 'Follow comet' : 'Follow Planet'}</button></div>
    <small className="data-note">{id === 'halley' ? 'JPL Horizons trajectory. Orbit and nucleus enlarged separately. Irregular shape and tails are illustrative; rotation is complex tumbling. Distance and period are approximate mean values.' : 'Rounded values. Moon counts change with discoveries. Rotation is relative to the stars.'}</small>
  </motion.aside>}</AnimatePresence>
}

export function TimeControls() {
  const paused = useSimulation(state => state.paused)
  const speed = useSimulation(state => state.speed)
  const reduced = useSimulation(state => state.reducedMotion)
  const [days, setDays] = useState(useSimulation.getState().days)
  const atDateLimit = days >= MAX_DAYS
  useEffect(() => {
    const interval = setInterval(() => setDays(useSimulation.getState().days), 250)
    return () => clearInterval(interval)
  }, [])
  return <footer className="time-bar">
    <div className="time-label"><span className="eyebrow" role="status">{atDateLimit ? 'END OF DATE RANGE' : 'THE COSMIC CLOCK'}</span><time dateTime={new Date(Date.UTC(2026, 8, 26, 12) + days * 86400000).toISOString()}>{formatDate(days)}</time></div>
    <div className="transport"><IconButton label="Reset simulation date" onClick={() => { useSimulation.getState().set({ days: 0 }); setDays(0) }}><RotateCcw size={17} /></IconButton><IconButton label={atDateLimit ? 'Restart simulation' : paused || reduced ? 'Play simulation' : 'Pause simulation'} className="play-control" onClick={() => { if (atDateLimit) { useSimulation.getState().set({ days: 0, paused: false, reducedMotion: false }); setDays(0) } else useSimulation.getState().set(reduced ? { reducedMotion: false, paused: false } : { paused: !paused }) }}>{atDateLimit ? <RotateCcw size={19} /> : paused || reduced ? <Play size={19} fill="currentColor" /> : <Pause size={19} fill="currentColor" />}</IconButton><IconButton label="Advance one day" disabled={atDateLimit} onClick={() => { useSimulation.getState().advance(1); setDays(useSimulation.getState().days) }}><SkipForward size={18} /></IconButton></div>
    <div className="speed-controls" aria-label="Simulation speed">{[{ label: 'Slow', value: 1 }, { label: 'Normal', value: 8 }, { label: 'Fast', value: 30 }, { label: 'Very Fast', value: 365 }].map(item => <button key={item.value} className={speed === item.value ? 'active' : ''} aria-pressed={speed === item.value} onClick={() => useSimulation.getState().set({ speed: item.value })}>{item.label}</button>)}</div>
    <div className="speed-readout"><AudioLines size={16} /><span><strong>{reduced || paused ? 'PAUSED' : `${speed} DAYS / SEC`}</strong><small>Simulation speed: {(speed * 86400).toLocaleString()}x</small></span></div>
    <span className="timeline-decoration" aria-hidden="true" />
  </footer>
}

export function DiscoveryTools() {
  const [fact, setFact] = useState<number | null>(null)
  const panel = useSimulation(state => state.panel)
  const selected = useSimulation(state => state.selected)
  const tour = useSimulation(state => state.tour)
  const nextFact = () => setFact(current => current === null ? Math.floor(Math.random() * allFacts.length) : (current + 1) % allFacts.length)
  return <>
    {!panel && !selected && tour === null && <div className="discovery-invite"><span className="eyebrow"><span className="live-dot" /> A LITTLE PERSPECTIVE</span><p>Eight worlds.<br />Endless discoveries.</p><button onClick={() => useSimulation.getState().select('earth')}>Start with home <ArrowRight size={16} /></button><div className="tiny-coordinate">SOL SYSTEM / MILKY WAY</div></div>}
    <div className={`discovery-tools ${panel || selected || tour !== null ? 'compact' : ''}`}>
      <button className="fact-button" onClick={nextFact}><Sparkles size={17} /><span>Teach me something!</span></button>
      <IconButton label="Surprise me" onClick={() => useSimulation.getState().select(planets[Math.floor(Math.random() * planets.length)].id)}><Shuffle size={17} /></IconButton>
    </div>
    <AnimatePresence>{fact !== null && <motion.div className="fact-card" role="status" key={fact} initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}><div className="panel-top"><span className="eyebrow"><Sparkles size={13} /> A MOMENT OF WONDER</span><IconButton label="Close fact" onClick={() => setFact(null)}><X size={16} /></IconButton></div><h2>{allFacts[fact].text}</h2><button onClick={nextFact}>Another discovery <ArrowRight size={16} /></button></motion.div>}</AnimatePresence>
  </>
}

function constrainTourPosition(left: number, top: number, element: HTMLElement) {
  return {
    left: Math.max(8, Math.min(left, window.innerWidth - element.offsetWidth - 8)),
    top: Math.max(8, Math.min(top, window.innerHeight - element.offsetHeight - 8)),
  }
}

export function TourControls() {
  const tour = useSimulation(state => state.tour)
  const paused = useSimulation(state => state.tourPaused)
  const reduced = useSimulation(state => state.reducedMotion)
  const cameraRevision = useSimulation(state => state.cameraRevision)
  const [opacity, setOpacity] = useState(100)
  const [position, setPosition] = useState<{ left: number; top: number } | null>(null)
  const popup = useRef<HTMLElement>(null)
  const drag = useRef<{ pointerId: number; left: number; top: number } | null>(null)
  const active = tour !== null
  useEffect(() => {
    const element = popup.current
    if (!active || !element) return
    const constrain = () => {
      const bounds = element.getBoundingClientRect()
      const next = constrainTourPosition(bounds.left, bounds.top, element)
      setPosition(current => current?.left === next.left && current?.top === next.top ? current : next)
    }
    const observer = new ResizeObserver(constrain)
    observer.observe(element)
    window.addEventListener('resize', constrain)
    constrain()
    return () => { observer.disconnect(); window.removeEventListener('resize', constrain); drag.current = null }
  }, [active])
  useEffect(() => {
    if (tour === null || paused || reduced) return
    const timer = setTimeout(() => useSimulation.getState().nextTour(), 10500)
    return () => clearTimeout(timer)
  }, [tour, paused, reduced, cameraRevision])
  if (tour === null) return null
  const stop = tourStops[tour]
  return <section ref={popup} className="tour-window" aria-label="Cinematic tour" style={position ? { left: position.left, top: position.top, right: 'auto' } : undefined}>
    <div className="tour-toolbar">
      <IconButton label="Move tour popup" className="tour-drag-handle"
        onPointerDown={event => {
          if (!event.isPrimary || event.button !== 0 || !popup.current) return
          const bounds = popup.current.getBoundingClientRect()
          drag.current = { pointerId: event.pointerId, left: event.clientX - bounds.left, top: event.clientY - bounds.top }
          event.currentTarget.setPointerCapture(event.pointerId)
        }}
        onPointerMove={event => {
          if (!drag.current || drag.current.pointerId !== event.pointerId || !popup.current) return
          setPosition(constrainTourPosition(event.clientX - drag.current.left, event.clientY - drag.current.top, popup.current))
        }}
        onPointerUp={event => { if (event.currentTarget.hasPointerCapture(event.pointerId)) event.currentTarget.releasePointerCapture(event.pointerId) }}
        onLostPointerCapture={() => { drag.current = null }}
        onKeyDown={event => {
          if (!popup.current || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return
          event.preventDefault()
          const bounds = popup.current.getBoundingClientRect()
          const distance = event.shiftKey ? 40 : 10
          setPosition(constrainTourPosition(
            bounds.left + (event.key === 'ArrowRight' ? distance : event.key === 'ArrowLeft' ? -distance : 0),
            bounds.top + (event.key === 'ArrowDown' ? distance : event.key === 'ArrowUp' ? -distance : 0),
            popup.current,
          ))
        }}><GripHorizontal size={18} /></IconButton>
      <label htmlFor="tour-opacity">Opacity</label>
      <input id="tour-opacity" type="range" min="0" max="100" step="1" value={opacity} aria-valuetext={`${opacity}%`} onChange={event => setOpacity(Number(event.target.value))} />
      <output htmlFor="tour-opacity">{opacity}%</output>
      <IconButton label="Exit tour" onClick={() => useSimulation.getState().exitTour()}><X size={18} /></IconButton>
    </div>
    <div className="tour-narration" style={{ opacity: opacity / 100, pointerEvents: opacity === 0 ? 'none' : 'auto' }} inert={opacity === 0}>
      <nav className="tour-progress" aria-label="Tour steps">{tourStops.map((tourStop, index) => <button key={index} className={index <= tour ? 'complete' : ''} aria-label={`Step ${index + 1}: ${tourStop.title}`} title={`Step ${index + 1}: ${tourStop.title}`} aria-current={index === tour ? 'step' : undefined} onClick={() => useSimulation.getState().jumpToTourStop(index)} />)}</nav>
      <div className="panel-top"><span className="eyebrow">THE GRAND TOUR <span className="muted">/ {String(tour + 1).padStart(2, '0')} OF {tourStops.length}</span></span></div>
      <div aria-live="polite"><h2>{stop.title}</h2><p>{stop.text}</p></div>
      <div className="tour-actions"><button onClick={() => useSimulation.getState().set({ tourPaused: !paused })}>{paused ? <Play size={15} /> : <Pause size={15} />}{paused ? 'Resume tour' : 'Pause tour'}</button><button onClick={() => useSimulation.getState().nextTour()}>Next stop <SkipForward size={15} /></button></div>
    </div>
  </section>
}

export function SettingsPanel() {
  const state = useSimulation(useShallow(state => ({ panel: state.panel, scale: state.scale, size: state.size, spacing: state.spacing, labels: state.labels, orbits: state.orbits, reducedMotion: state.reducedMotion, audio: state.audio, set: state.set })))
  if (state.panel !== 'settings') return null
  return <aside className="side-panel" aria-label="Settings">
    <div className="panel-top"><span className="eyebrow">MAKE SPACE YOURS</span><IconButton label="Close settings" onClick={() => state.set({ panel: null })}><X size={17} /></IconButton></div>
    <h2>Observatory settings</h2>
    <div className="settings-section"><label htmlFor="scale-mode">Visual scale</label><select id="scale-mode" value={state.scale} onChange={event => state.set({ scale: event.target.value as typeof state.scale })}><option value="educational">Educational Scale</option><option value="relative">Relative Size</option><option value="distances">Distances Emphasized</option><option value="custom">Custom</option></select><p className="helper-text">{state.scale === 'relative' ? 'Body diameters share a real ratio. Orbital distances remain compressed.' : state.scale === 'distances' ? 'Orbital spacing emphasizes real distance ratios, with extra room around the Sun.' : 'Planets are enlarged and distances compressed so every world is visible. Not to scale.'}</p>
      {state.scale === 'custom' && <><label htmlFor="body-size">Planet size <span>{state.size.toFixed(1)}x</span></label><input id="body-size" type="range" min="0.5" max="2" step="0.1" value={state.size} onChange={event => state.set({ size: Number(event.target.value) })} /><label htmlFor="orbit-spacing">Orbit spacing <span>{state.spacing.toFixed(1)}x</span></label><input id="orbit-spacing" type="range" min="0.8" max="1.8" step="0.1" value={state.spacing} onChange={event => state.set({ spacing: Number(event.target.value) })} /></>}
    </div>
    {[{ key: 'labels', name: 'Planet Labels', description: 'Names in the star field' }, { key: 'orbits', name: 'Orbital paths', description: 'Trace each journey around the Sun' }, { key: 'reducedMotion', name: 'Reduce Motion', description: 'Still planets, quiet stars, brief camera transitions' }, { key: 'audio', name: 'Ambient sound', description: 'A soft, synthesized space soundscape' }].map(item => <label className="switch-row" key={item.key}><span>{item.name}<small>{item.description}</small></span><input type="checkbox" checked={state[item.key as 'labels' | 'orbits' | 'reducedMotion' | 'audio']} onChange={event => state.set({ [item.key]: event.target.checked })} /><span className="switch"><Check size={11} /></span></label>)}
    <details className="source-details"><summary>Science & sources <Plus size={14} /></summary><p>NASA Planetary Fact Sheets and NASA Solar System Exploration. Orbital longitudes use Astronomy Engine. Distances, sizes, axial rotation speeds, and inclinations are visually simplified.</p><a href="https://science.nasa.gov/solar-system/" target="_blank" rel="noreferrer">Explore NASA's solar system <ArrowRight size={14} /></a></details>
  </aside>
}

export function ViewTools() {
  const mode = useSimulation(state => state.cameraMode)
  const labels = useSimulation(state => state.labels)
  const scale = useSimulation(state => state.scale)
  return <div className="view-tools"><button className={mode === 'system' ? 'active' : ''} onClick={() => useSimulation.getState().viewSystem()}><Globe2 size={15} /><span>View Solar System</span></button><span className="tool-divider" /><button aria-pressed={labels} onClick={() => useSimulation.getState().set({ labels: !labels })}><Telescope size={15} /><span>Labels</span><span className={`status-dot ${labels ? 'on' : ''}`} /></button><button className="scale-badge" onClick={() => useSimulation.getState().set({ panel: 'settings' })}>{scale === 'educational' ? 'Educational scale' : scale === 'relative' ? 'Relative size' : scale === 'distances' ? 'Distances emphasized' : 'Custom scale'}<ChevronRight size={12} /></button></div>
}

export function SceneLabels() {
  const selected = useSimulation(state => state.selected)
  return <div className="scene-labels">{bodies.map(body => <button key={body.id} id={`scene-label-${body.id}`} className={`planet-label ${selected === body.id ? 'selected' : ''}`} onClick={() => useSimulation.getState().select(body.id)} aria-label={`Explore ${body.name}`}><span className="label-dot" style={{ background: body.color }} />{body.name}<span className="planet-tooltip">{body.kind}<br />{body.diameter.toLocaleString()} km across</span></button>)}</div>
}