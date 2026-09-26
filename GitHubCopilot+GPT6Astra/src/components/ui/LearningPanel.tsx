import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Lightbulb, Sun, X } from 'lucide-react'
import { bodyById, planets, type BodyId } from '../../data/planets'
import { lessons, phases, seasons } from '../../data/lessons'
import { gravityAcceleration } from '../../utils/astronomy'
import { useSimulation } from '../../store/simulationStore'
import { IconButton } from './Controls'

function SizeLesson() {
  const [first, setFirst] = useState<BodyId>('earth')
  const [second, setSecond] = useState<BodyId>('jupiter')
  const maximum = Math.max(bodyById[first].diameter, bodyById[second].diameter)
  const ratio = Math.max(bodyById[first].diameter, bodyById[second].diameter) / Math.min(bodyById[first].diameter, bodyById[second].diameter)
  return <><div className="comparison-pickers"><label>First world<select aria-label="First comparison planet" value={first} onChange={event => setFirst(event.target.value as BodyId)}>{planets.map(body => <option key={body.id} value={body.id}>{body.name}</option>)}</select></label><span>vs</span><label>Second world<select aria-label="Second comparison planet" value={second} onChange={event => setSecond(event.target.value as BodyId)}>{planets.map(body => <option key={body.id} value={body.id}>{body.name}</option>)}</select></label></div><div className="size-comparison">{[first, second].map((id, index) => <div key={index}><div className="comparison-world-space"><span className={`mini-planet ${id}`} style={{ '--planet-color': bodyById[id].color, width: bodyById[id].diameter / maximum * 120, height: bodyById[id].diameter / maximum * 120 } as React.CSSProperties} /></div><strong>{bodyById[id].name}</strong><small>{bodyById[id].diameter.toLocaleString()} km</small></div>)}</div><p className="lesson-result">{ratio.toFixed(1)}x the diameter <span>/ about {Math.round(ratio ** 3).toLocaleString()}x the volume</span></p></>
}

function DistancesLesson() {
  const [distance, setDistance] = useState(1)
  return <><div className="distance-scale">{planets.map(body => <button key={body.id} onClick={() => setDistance(body.distanceAU)}><span>{body.name}</span><span className="distance-track"><i style={{ width: `${body.distanceAU / 30.069 * 100}%`, background: body.color }} /></span><small>{body.distanceAU.toFixed(1)}</small></button>)}</div><label className="range-label" htmlFor="light-trip">Distance from the Sun <strong>{distance.toFixed(1)} AU</strong></label><input id="light-trip" type="range" min="0.1" max="30.1" step="0.1" value={distance} onChange={event => setDistance(Number(event.target.value))} /><p className="lesson-result">{(distance * 8.317).toFixed(1)} minutes <span>for sunlight to reach this distance</span></p></>
}

function GravityLesson() {
  const [mass, setMass] = useState(1)
  const [distance, setDistance] = useState(1)
  const radius = 36 + distance * 17
  return <><div className="gravity-diagram"><div className="gravity-orbit" style={{ width: radius * 2, height: radius * 2, animationDuration: `${8 * Math.sqrt(distance ** 3 / mass)}s` }}><span className="gravity-satellite" /></div><span className="gravity-core" style={{ width: 18 + Math.cbrt(mass) * 12, height: 18 + Math.cbrt(mass) * 12 }} /></div><label className="range-label" htmlFor="gravity-mass">Central mass <strong>{mass}x</strong></label><input id="gravity-mass" type="range" min="1" max="10" step="1" value={mass} onChange={event => setMass(Number(event.target.value))} /><label className="range-label" htmlFor="gravity-distance">Orbital distance <strong>{distance.toFixed(1)}x</strong></label><input id="gravity-distance" type="range" min="1" max="3" step="0.1" value={distance} onChange={event => setDistance(Number(event.target.value))} /><p className="lesson-result">{gravityAcceleration(mass, distance).toFixed(2)}x <span>gravitational acceleration, relative to the starting setup</span></p></>
}

function DayLesson() {
  const [hour, setHour] = useState(12)
  return <><div className="day-diagram"><Sun size={34} /><div className="light-rays"><span /><span /><span /></div><div className="day-earth" style={{ backgroundPositionX: `${hour / 24 * 100}%` }}><span /></div><span className="night-label">NIGHT</span></div><label className="range-label" htmlFor="rotation-hour">Earth rotation <strong>{Math.round(hour / 24 * 360)} degrees</strong></label><input id="rotation-hour" type="range" min="0" max="24" step="0.1" value={hour} onChange={event => setHour(Number(event.target.value))} /><p className="lesson-result">{hour.toFixed(1)} hours <span>into one simplified solar day</span></p></>
}

function SeasonsLesson() {
  const [season, setSeason] = useState(0)
  return <><div className="seasons-diagram"><div className="season-track" /><span className="season-sun" /><span className="season-earth" style={{ left: `${50 + Math.cos(season * Math.PI / 2) * 36}%`, top: `${50 + Math.sin(season * Math.PI / 2) * 35}%` }}><i /></span></div><label className="range-label" htmlFor="season-position">{seasons[season].title}<strong>23.4 degree tilt</strong></label><input id="season-position" type="range" min="0" max="3" step="1" value={season} onChange={event => setSeason(Number(event.target.value))} /><div className="hemispheres"><span>Northern Hemisphere<strong>{seasons[season].north}</strong></span><span>Southern Hemisphere<strong>{seasons[season].south}</strong></span></div><p className="helper-text">{seasons[season].note}</p></>
}

function MoonLesson() {
  const [phase, setPhase] = useState(4)
  const canvas = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const context = canvas.current?.getContext('2d')
    if (!context) return
    const image = context.createImageData(160, 160)
    const angle = phase / 8 * Math.PI * 2
    for (let vertical = 0; vertical < 160; vertical++) for (let horizontal = 0; horizontal < 160; horizontal++) {
      const normalX = (horizontal - 80) / 75
      const normalY = (vertical - 80) / 75
      const depth = 1 - normalX ** 2 - normalY ** 2
      const offset = (vertical * 160 + horizontal) * 4
      if (depth >= 0) {
        const light = Math.max(0, normalX * Math.sin(angle) - Math.sqrt(depth) * Math.cos(angle))
        const grain = Math.sin(horizontal * 1.3 + vertical * 4.2) * Math.sin(vertical * .31) * 12
        const brightness = 24 + light * 205 + grain
        image.data.set([brightness, brightness, brightness * .96, 255], offset)
      }
    }
    context.putImageData(image, 0, 0)
  }, [phase])
  return <><div className="moon-phase-diagram"><canvas ref={canvas} width={160} height={160} aria-label={`Moon phase: ${phases[phase]}`} /><span>{phases[phase]}</span></div><label className="range-label" htmlFor="moon-phase">Moon's journey <strong>Day {(phase / 8 * 29.53).toFixed(1)}</strong></label><input id="moon-phase" type="range" min="0" max="7" step="1" value={phase} onChange={event => setPhase(Number(event.target.value))} /><div className="phase-buttons">{[0, 1, 2, 3, 4].map(index => <button key={index} className={phase === index ? 'active' : ''} onClick={() => setPhase(index)}>{['New', 'Crescent', 'Quarter', 'Gibbous', 'Full'][index]}</button>)}</div></>
}

function OrbitLesson() {
  const [gravity, setGravity] = useState(true)
  return <><div className={`orbit-lesson ${gravity ? '' : 'released'}`}><div className="orbit-track" /><span className="season-sun" /><div className="orbiting-body"><span className="orbiting-earth" /><ArrowRight className="velocity-arrow" size={35} /><ArrowDown className="gravity-arrow" size={32} /></div></div><div className="diagram-legend"><span className="mint">Forward motion</span><span className="warm">Inward gravity</span></div><button className="lesson-action" onClick={() => setGravity(!gravity)}>{gravity ? 'Remove the gravitational pull' : 'Restore the orbit'}<ArrowRight size={15} /></button><p className="helper-text">{gravity ? 'The inward pull continuously changes the direction of motion.' : 'Without the pull, the planet moves along the tangent. This is a simplified illustration, not an instant physical change.'}</p></>
}

function SunLesson() {
  const [fusion, setFusion] = useState(1)
  return <><div className="fusion-diagram"><div className="hydrogen-group">{[0, 1, 2, 3].map(index => <span key={index}>H</span>)}</div><ArrowRight size={24} /><span className="helium" style={{ boxShadow: `0 0 ${fusion * 10}px #efb57855` }}>He</span><span className="fusion-energy"><Sun size={26} />ENERGY</span></div><label className="range-label" htmlFor="fusion-rate">Imagined fusion rate <strong>{fusion}x</strong></label><input id="fusion-rate" type="range" min="1" max="5" value={fusion} onChange={event => setFusion(Number(event.target.value))} /><p className="lesson-result">{fusion}x energy <span>more fusion reactions release more energy</span></p><p className="helper-text">A simplified net reaction. Real fusion takes several steps and releases other particles, too.</p></>
}

const diagrams = [SunLesson, SizeLesson, DistancesLesson, GravityLesson, DayLesson, SeasonsLesson, MoonLesson, OrbitLesson]

export function LearningPanel() {
  const panel = useSimulation(state => state.panel)
  const lessonIndex = useSimulation(state => state.lesson)
  const [completed, setCompleted] = useState<number[]>([])
  if (panel !== 'learn') return null
  const lesson = lessons[lessonIndex]
  const Diagram = diagrams[lessonIndex]
  const go = (index: number) => {
    const state = useSimulation.getState()
    state.set({ lesson: index, selected: lessons[index].body, cameraMode: 'follow', cameraRevision: state.cameraRevision + 1 })
  }
  return <aside className="side-panel learning-panel" aria-label="Explore and Learn">
    <div className="panel-top"><span className="eyebrow"><BookOpen size={13} /> EXPLORE & LEARN</span><IconButton label="Close lessons" onClick={() => useSimulation.getState().set({ panel: null })}><X size={17} /></IconButton></div>
    <div className="lesson-nav" aria-label="Choose a lesson">{lessons.map((item, index) => <button key={item.title} className={index === lessonIndex ? 'active' : ''} onClick={() => go(index)} aria-pressed={index === lessonIndex}>{completed.includes(index) ? <Check size={10} /> : <span>{String(index + 1).padStart(2, '0')}</span>}{item.title}</button>)}</div>
    <div className="lesson-heading"><span className="eyebrow">LESSON {lessonIndex + 1} / 8</span><h2>{lesson.title}</h2><p>{lesson.subtitle}</p></div>
    <p className="lesson-explanation">{lesson.explanation}</p>
    <Diagram />
    <div className="lesson-takeaway"><Lightbulb size={17} /><p>{lesson.takeaway}</p></div>
    <div className="lesson-footer"><IconButton label="Previous lesson" disabled={lessonIndex === 0} onClick={() => go(lessonIndex - 1)}><ArrowLeft size={16} /></IconButton><span>{completed.length} of 8 discovered</span><button onClick={() => { setCompleted(current => current.includes(lessonIndex) ? current : [...current, lessonIndex]); if (lessonIndex < 7) go(lessonIndex + 1) }}>{lessonIndex === 7 ? 'Complete' : 'Next lesson'}<ChevronRight size={15} /></button></div>
  </aside>
}