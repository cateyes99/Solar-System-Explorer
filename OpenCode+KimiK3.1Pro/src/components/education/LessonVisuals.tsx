import { useState } from 'react'
import { motion } from 'framer-motion'
import { ArrowLeftRight, ArrowRight, Pause, Play } from 'lucide-react'
import { PLANETS, PLANET_MAP } from '../../data/planets'
import type { PlanetId } from '../../types'
import { useSimulationStore } from '../../store/simulationStore'
import { lightMinutes } from '../../utils/astronomy'
import { formatDistance } from '../../utils/scale'

export function FusionVisual() {
  return (
    <div className="fusion-visual lesson-visual">
      <div className="fusion-particle hydrogen-one"><i />H</div><span>+</span><div className="fusion-particle hydrogen-two"><i />H</div>
      <ArrowRight size={24} />
      <div className="fusion-particle helium"><i />He</div>
      <div className="fusion-energy"><i /><i /><i /><span>LIGHT + HEAT</span></div>
      <div className="fusion-caption"><span>HYDROGEN</span><span>NUCLEAR FUSION</span><span>HELIUM + ENERGY</span></div>
    </div>
  )
}

export function SizeComparison() {
  const [first, setFirst] = useState<PlanetId>('earth')
  const [second, setSecond] = useState<PlanetId>('jupiter')
  const a = PLANET_MAP[first]
  const b = PLANET_MAP[second]
  const largest = Math.max(a.diameterKm, b.diameterKm)
  const size = (diameter: number) => Math.max(7, (diameter / largest) * 176)
  const volumeRatio = (largest / Math.min(a.diameterKm, b.diameterKm)) ** 3
  return (
    <div className="size-lab">
      <div className="lesson-controls">
        <label>First world<select value={first} onChange={(event) => setFirst(event.target.value as PlanetId)}>{PLANETS.map((planet) => <option key={planet.id} value={planet.id}>{planet.name}</option>)}</select></label>
        <button className="icon-button" onClick={() => { setFirst(second); setSecond(first) }} aria-label="Swap compared planets"><ArrowLeftRight size={17} /></button>
        <label>Second world<select value={second} onChange={(event) => setSecond(event.target.value as PlanetId)}>{PLANETS.map((planet) => <option key={planet.id} value={planet.id}>{planet.name}</option>)}</select></label>
      </div>
      <div className="comparison-stage lesson-visual">
        {[a, b].map((planet) => <div className="comparison-world" key={planet.id}><motion.div className={`comparison-sphere comparison-sphere--${planet.id}`} animate={{ width: size(planet.diameterKm), height: size(planet.diameterKm) }} transition={{ type: 'spring', stiffness: 130, damping: 18 }} /><strong>{planet.name}</strong><span>{planet.diameterKm.toLocaleString()} km wide</span></div>)}
        <div className="comparison-baseline" />
      </div>
      <p className="visual-insight">At the same scale, <strong>{largest === a.diameterKm ? a.name : b.name}</strong> is {(largest / Math.min(a.diameterKm, b.diameterKm)).toFixed(1)}× wider. About <strong>{Math.round(volumeRatio).toLocaleString()}</strong> of the smaller world could fit inside by volume.</p>
    </div>
  )
}

export function DistanceExplorer() {
  const [index, setIndex] = useState(2)
  const [linear, setLinear] = useState(false)
  const planet = PLANETS[index]
  const neptune = PLANET_MAP.neptune.distanceFromSunKm
  const ratio = linear
    ? planet.distanceFromSunKm / neptune
    : Math.log10(planet.distanceFromSunKm / PLANET_MAP.mercury.distanceFromSunKm + 1) / Math.log10(neptune / PLANET_MAP.mercury.distanceFromSunKm + 1)
  const minutes = lightMinutes(planet.distanceFromSunKm)
  return (
    <div className="distance-lab">
      <div className="lesson-controls"><label>Choose a planet<select value={index} onChange={(event) => setIndex(Number(event.target.value))}>{PLANETS.map((item, itemIndex) => <option key={item.id} value={itemIndex}>{item.name}</option>)}</select></label><button className="secondary-button" onClick={() => setLinear(!linear)}>{linear ? 'Use compact spacing' : 'Use true linear spacing'}</button></div>
      <div className="distance-stage lesson-visual">
        <div className="distance-sun"><i />SUN</div><div className="distance-line" />
        {PLANETS.map((item) => {
          const itemRatio = linear ? item.distanceFromSunKm / neptune : Math.log10(item.distanceFromSunKm / PLANET_MAP.mercury.distanceFromSunKm + 1) / Math.log10(neptune / PLANET_MAP.mercury.distanceFromSunKm + 1)
          return <i key={item.id} className={`distance-marker ${item.id === planet.id ? 'active' : ''}`} style={{ left: `${5 + itemRatio * 90}%`, background: item.color }}><span>{item.id === planet.id ? item.name : ''}</span></i>
        })}
        <div className="distance-active" style={{ left: `${5 + ratio * 90}%` }} />
      </div>
      <div className="distance-readout"><div><span>REAL AVERAGE DISTANCE</span><strong>{formatDistance(planet.distanceFromSunKm)}</strong></div><div><span>SUNLIGHT TRAVEL TIME</span><strong>{minutes < 90 ? `${minutes.toFixed(1)} minutes` : `${(minutes / 60).toFixed(2)} hours`}</strong></div></div>
      <p className="visual-insight">{linear ? 'Notice how the inner planets bunch together! On a true linear scale, Neptune is about 30× farther from the Sun than Earth.' : 'This compact view uses logarithmic spacing. Switch to true linear spacing to see how much empty space separates the outer worlds.'}</p>
    </div>
  )
}

export function GravityLab() {
  const [mass, setMass] = useState(5)
  return (
    <div className="gravity-lab">
      <div className="gravity-stage lesson-visual">
        <div className="gravity-arrows"><i /><i /><i /><i /></div>
        <div className="gravity-orbit" style={{ animationDuration: `${9 / Math.sqrt(mass)}s` }}><div className="gravity-moon" /></div>
        <div className="gravity-planet" style={{ transform: `translate(-50%, -50%) scale(${0.75 + Math.cbrt(mass) * 0.13})` }} />
        <span className="gravity-label">ORBITAL MOTION</span>
      </div>
      <label className="big-slider"><span>Planet mass <strong>{mass} Earth masses</strong></span><input aria-label="Planet mass in Earth masses" type="range" min="1" max="40" value={mass} onChange={(event) => setMass(Number(event.target.value))} /><span className="range-labels"><small>1 Earth</small><small>40 Earths</small></span></label>
      <div className="lab-result"><span>RELATIVE PULL</span><strong>{mass.toFixed(0)}× stronger</strong><div><i style={{ width: `${(mass / 40) * 100}%` }} /></div></div>
      <p className="visual-insight">More mass means a stronger gravitational pull. Our animated moon moves faster to show the extra motion needed to keep a tight orbit. The planet’s displayed size is illustrative.</p>
    </div>
  )
}

export function DayNightDemo() {
  const [spinning, setSpinning] = useState(true)
  const [speed, setSpeed] = useState(1)
  return (
    <div className="day-night-lab">
      <div className="day-night-stage lesson-visual"><div className="lesson-sun"><i /><span>SUNLIGHT</span></div><div className="light-rays"><i /><i /><i /></div><div className={`rotating-earth ${spinning ? '' : 'paused'}`} style={{ animationDuration: `${10 / speed}s` }}><div className="earth-terminator" /></div><div className="rotation-arrow">↻</div><span className="night-label">NIGHT</span><span className="day-label">DAY</span></div>
      <div className="lesson-controls"><button className="secondary-button" onClick={() => setSpinning(!spinning)}>{spinning ? <Pause size={15} /> : <Play size={15} />}{spinning ? 'Pause rotation' : 'Resume rotation'}</button><label>Rotation speed<input aria-label="Earth demonstration rotation speed" type="range" min="0.5" max="3" step="0.5" value={speed} onChange={(event) => setSpeed(Number(event.target.value))} /></label></div>
      <p className="visual-insight">Earth spins eastward once every <strong>23 hours, 56 minutes</strong>. The side facing the Sun has daytime; the side facing away has night. It is Earth’s rotation—not the Sun moving around us—that brings sunrise.</p>
    </div>
  )
}

const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
export function SeasonsDemo() {
  const [month, setMonth] = useState(5)
  const angle = (month / 12) * Math.PI * 2 - Math.PI / 2
  const x = 300 + Math.cos(angle) * 205
  const y = 130 + Math.sin(angle) * 88
  const season = month >= 2 && month <= 4 ? 'Spring' : month >= 5 && month <= 7 ? 'Summer' : month >= 8 && month <= 10 ? 'Autumn' : 'Winter'
  const southern = season === 'Summer' ? 'Winter' : season === 'Winter' ? 'Summer' : season === 'Spring' ? 'Autumn' : 'Spring'
  return (
    <div className="seasons-lab">
      <div className="seasons-stage lesson-visual"><svg viewBox="0 0 600 260" role="img" aria-label={`Earth orbit in ${months[month]}, showing constant axial tilt`}><defs><radialGradient id="lessonSun"><stop stopColor="#fff4ad" /><stop offset=".5" stopColor="#ffae45" /><stop offset="1" stopColor="#ed6527" /></radialGradient></defs><ellipse cx="300" cy="130" rx="205" ry="88" fill="none" stroke="#476177" strokeDasharray="4 7" /><circle cx="300" cy="130" r="28" fill="url(#lessonSun)" /><text x="300" y="177" textAnchor="middle">SUN</text><g><circle cx={x} cy={y} r="16" fill="#2688b7" /><path d={`M ${x - 12} ${y + 20} L ${x + 12} ${y - 20}`} stroke="#e8f3ff" strokeWidth="2" /><circle cx={x} cy={y} r="20" fill="none" stroke="#75d6ff" opacity=".35" /><text x={x} y={y + 38} textAnchor="middle" className="earth-label">EARTH</text></g><text x="55" y="30">AXIS KEEPS ITS DIRECTION</text><path d="M190 27h130" stroke="#6a7b8e" markerEnd="url(#arrow)" /></svg></div>
      <label className="big-slider"><span>Travel through the year <strong>{months[month]}</strong></span><input aria-label="Month of year" type="range" min="0" max="11" value={month} onChange={(event) => setMonth(Number(event.target.value))} /><span className="range-labels"><small>JAN</small><small>DEC</small></span></label>
      <div className="season-readout"><div>NORTHERN HEMISPHERE<strong>{season}</strong></div><div>SOUTHERN HEMISPHERE<strong>{southern}</strong></div></div>
      <p className="visual-insight">Earth’s axis is tilted <strong>23.4°</strong>. Seasons happen because each hemisphere tilts toward or away from the Sun during the year—not because Earth gets much closer to the Sun.</p>
    </div>
  )
}

const phases = ['New Moon', 'Waxing Crescent', 'First Quarter', 'Waxing Gibbous', 'Full Moon', 'Waning Gibbous', 'Last Quarter', 'Waning Crescent']
const phaseDescriptions = [
  'The Moon is between Earth and the Sun. Its illuminated side faces away from us.',
  'A sliver of light grows on the right side. “Waxing” means growing.',
  'Half of the visible face is lit. The Moon has completed a quarter of its orbit.',
  'More than half is lit and the bright portion is still growing.',
  'Earth is between the Sun and Moon. We see the whole illuminated face.',
  'The bright portion begins to shrink. “Waning” means shrinking.',
  'The opposite half is lit. The Moon is three-quarters through its orbit.',
  'Only a final sliver remains before the cycle begins again.',
]
function moonPath(index: number): string {
  if (index === 0) return ''
  if (index === 4) return 'M 0 -48 A 48 48 0 1 1 0 48 A 48 48 0 1 1 0 -48'
  const waxing = index < 4
  const fraction = waxing ? index / 4 : 1 - (index - 4) / 4
  const rx = Math.abs(1 - fraction * 2) * 48
  const outerSweep = waxing ? 1 : 0
  const innerSweep = waxing ? (fraction < 0.5 ? 0 : 1) : (fraction < 0.5 ? 1 : 0)
  return `M 0 -48 A 48 48 0 0 ${outerSweep} 0 48 A ${rx} 48 0 0 ${innerSweep} 0 -48 Z`
}

export function MoonPhaseDemo() {
  const [phase, setPhase] = useState(3)
  return (
    <div className="moon-lab">
      <div className="moon-stage lesson-visual"><div className="moon-orbit-diagram"><div className="moon-earth" /><div className="moon-orbit-path" /><div className="moon-orbit-dot" style={{ transform: `rotate(${phase * 45 - 90}deg) translateX(74px)` }} /></div><svg className="phase-moon" viewBox="-60 -60 120 120" role="img" aria-label={phases[phase]}><defs><radialGradient id="moonLight" cx="35%" cy="30%"><stop stopColor="#fffde5" /><stop offset="1" stopColor="#aaa99f" /></radialGradient></defs><circle r="49" fill="#111722" stroke="#536273" /><path d={moonPath(phase)} fill="url(#moonLight)" /></svg><div className="moon-sunlight">SUNLIGHT <ArrowRight size={18} /></div></div>
      <div className="phase-picker" aria-label="Moon phase">{phases.map((name, index) => <button key={name} className={phase === index ? 'active' : ''} onClick={() => setPhase(index)} aria-label={name} aria-pressed={phase === index} title={name}><svg viewBox="-60 -60 120 120"><circle r="48" fill="#111722" stroke="#526172" /><path d={moonPath(index)} fill="#e8e5ce" /></svg></button>)}</div>
      <h4 className="phase-title">{phases[phase]}</h4><p className="visual-insight">{phaseDescriptions[phase]} The complete cycle takes about <strong>29.5 days</strong>.</p>
    </div>
  )
}

export function OrbitDemo() {
  const [showArrows, setShowArrows] = useState(true)
  const reducedMotion = useSimulationStore((state) => state.reducedMotion)
  return (
    <div className="orbit-lab">
      <div className="orbit-stage lesson-visual"><svg viewBox="0 0 600 250" role="img" aria-label="A planet falling around the Sun under gravity"><defs><marker id="gravityArrow" markerWidth="8" markerHeight="8" refX="4" refY="3" orient="auto"><path d="M0,0 L0,6 L5,3 z" fill="#ffb75f" /></marker><marker id="motionArrow" markerWidth="8" markerHeight="8" refX="4" refY="3" orient="auto"><path d="M0,0 L0,6 L5,3 z" fill="#6cddff" /></marker><radialGradient id="orbitSun"><stop stopColor="#fff5a8" /><stop offset="1" stopColor="#f58132" /></radialGradient></defs><ellipse id="orbitPath" cx="300" cy="125" rx="205" ry="80" fill="none" stroke="#476177" strokeDasharray="4 7" /><circle cx="300" cy="125" r="27" fill="url(#orbitSun)" />{reducedMotion ? <circle cx="505" cy="125" r="13" fill="#64bfe0" /> : <circle r="13" fill="#64bfe0"><animateMotion dur="8s" repeatCount="indefinite"><mpath href="#orbitPath" /></animateMotion></circle>}{showArrows && <><path d="M465 100 Q420 105 360 120" fill="none" stroke="#ffb75f" strokeWidth="2" markerEnd="url(#gravityArrow)" /><text x="395" y="92" fill="#ffcb8b">GRAVITY PULLS IN</text><path d="M490 150 Q500 175 460 195" fill="none" stroke="#6cddff" strokeWidth="2" markerEnd="url(#motionArrow)" /><text x="425" y="219" fill="#8be5ff">MOTION CARRIES FORWARD</text></>}</svg></div>
      <button className="secondary-button" onClick={() => setShowArrows(!showArrows)}>{showArrows ? 'Hide' : 'Show'} force arrows</button>
      <p className="visual-insight">A planet is always falling toward the Sun, but its sideways motion keeps it from falling straight in. <strong>Gravity bends its path into an orbit.</strong> No engine is needed to keep it going.</p>
    </div>
  )
}
