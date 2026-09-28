import { useTranslation } from 'react-i18next'
import { useEffect, useRef, useState } from 'react'
import { ArrowDown, ArrowLeft, ArrowRight, BookOpen, Check, ChevronRight, Lightbulb, Sun, X } from 'lucide-react'
import { bodyById, planets, type BodyId } from '../../data/planets'
import { lessons, phases, seasons } from '../../data/lessons'
import { gravityAcceleration } from '../../utils/astronomy'
import { useSimulation } from '../../store/simulationStore'
import { IconButton } from './Controls'

function SizeLesson() {
  const { t, i18n } = useTranslation()
  const [first, setFirst] = useState<BodyId>('earth')
  const [second, setSecond] = useState<BodyId>('jupiter')
  const maximum = Math.max(bodyById[first].diameter, bodyById[second].diameter)
  const ratio = Math.max(bodyById[first].diameter, bodyById[second].diameter) / Math.min(bodyById[first].diameter, bodyById[second].diameter)
  return <><div className="comparison-pickers"><label>{t("First world")}<select aria-label={t("First comparison planet")} value={first} onChange={event => setFirst(event.target.value as BodyId)}>{planets.map(body => <option key={body.id} value={body.id}>{t(body.name)}</option>)}</select></label><span>{t("vs")}</span><label>{t("Second world")}<select aria-label={t("Second comparison planet")} value={second} onChange={event => setSecond(event.target.value as BodyId)}>{planets.map(body => <option key={body.id} value={body.id}>{t(body.name)}</option>)}</select></label></div><div className="size-comparison">{[first, second].map((id, index) => <div key={index}><div className="comparison-world-space"><span className={`mini-planet ${id}`} style={{ '--planet-color': bodyById[id].color, width: bodyById[id].diameter / maximum * 120, height: bodyById[id].diameter / maximum * 120 } as React.CSSProperties} /></div><strong>{t(bodyById[id].name)}</strong><small>{bodyById[id].diameter.toLocaleString(i18n.language)} {t("km")}</small></div>)}</div><p className="lesson-result">{ratio.toLocaleString(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false })}{t("x the diameter")} <span>{t("/ about")} {Math.round(ratio ** 3).toLocaleString(i18n.language)}{t("x the volume")}</span></p></>
}

function DistancesLesson() {
  const { t, i18n } = useTranslation()
  const [distance, setDistance] = useState(1)
  return <><div className="distance-scale">{planets.map(body => <button key={body.id} onClick={() => setDistance(body.distanceAU)}><span>{t(body.name)}</span><span className="distance-track"><i style={{ width: `${body.distanceAU / 30.069 * 100}%`, background: body.color }} /></span><small>{body.distanceAU.toLocaleString(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false })}</small></button>)}</div><label className="range-label" htmlFor="light-trip">{t("Distance from the Sun")} <strong>{distance.toLocaleString(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false })} {t("AU")}</strong></label><input id="light-trip" type="range" min="0.1" max="30.1" step="0.1" value={distance} onChange={event => setDistance(Number(event.target.value))} /><p className="lesson-result">{(distance * 8.317).toLocaleString(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false })} {t("minutes")} <span>{t("for sunlight to reach this distance")}</span></p></>
}

function GravityLesson() {
  const { t, i18n } = useTranslation()
  const [mass, setMass] = useState(1)
  const [distance, setDistance] = useState(1)
  const radius = 36 + distance * 17
  return <><div className="gravity-diagram"><div className="gravity-orbit" style={{ width: radius * 2, height: radius * 2, animationDuration: `${8 * Math.sqrt(distance ** 3 / mass)}s` }}><span className="gravity-satellite" /></div><span className="gravity-core" style={{ width: 18 + Math.cbrt(mass) * 12, height: 18 + Math.cbrt(mass) * 12 }} /></div><label className="range-label" htmlFor="gravity-mass">{t("Central mass")} <strong>{mass}{t("x")}</strong></label><input id="gravity-mass" type="range" min="1" max="10" step="1" value={mass} onChange={event => setMass(Number(event.target.value))} /><label className="range-label" htmlFor="gravity-distance">{t("Orbital distance")} <strong>{distance.toLocaleString(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false })}{t("x")}</strong></label><input id="gravity-distance" type="range" min="1" max="3" step="0.1" value={distance} onChange={event => setDistance(Number(event.target.value))} /><p className="lesson-result">{gravityAcceleration(mass, distance).toLocaleString(i18n.language, { minimumFractionDigits: 2, maximumFractionDigits: 2, useGrouping: false })}{t("x")} <span>{t("gravitational acceleration, relative to the starting setup")}</span></p></>
}

function DayLesson() {
  const { t, i18n } = useTranslation()
  const [hour, setHour] = useState(12)
  return <><div className="day-diagram"><Sun size={34} /><div className="light-rays"><span /><span /><span /></div><div className="day-earth" style={{ backgroundPositionX: `${hour / 24 * 100}%` }}><span /></div><span className="night-label">{t("NIGHT")}</span></div><label className="range-label" htmlFor="rotation-hour">{t("Earth rotation")} <strong>{Math.round(hour / 24 * 360)} {t("degrees")}</strong></label><input id="rotation-hour" type="range" min="0" max="24" step="0.1" value={hour} onChange={event => setHour(Number(event.target.value))} /><p className="lesson-result">{hour.toLocaleString(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false })} {t("hours")} <span>{t("into one simplified solar day")}</span></p></>
}

function SeasonsLesson() {
  const { t } = useTranslation()
  const [season, setSeason] = useState(0)
  return <><div className="seasons-diagram"><div className="season-track" /><span className="season-sun" /><span className="season-earth" style={{ left: `${50 + Math.cos(season * Math.PI / 2) * 36}%`, top: `${50 + Math.sin(season * Math.PI / 2) * 35}%` }}><i /></span></div><label className="range-label" htmlFor="season-position">{t(seasons[season].title)}<strong>{t("23.4 degree tilt")}</strong></label><input id="season-position" type="range" min="0" max="3" step="1" value={season} onChange={event => setSeason(Number(event.target.value))} /><div className="hemispheres"><span>{t("Northern Hemisphere")}<strong>{t(seasons[season].north)}</strong></span><span>{t("Southern Hemisphere")}<strong>{t(seasons[season].south)}</strong></span></div><p className="helper-text">{t(seasons[season].note)}</p></>
}

function MoonLesson() {
  const { t, i18n } = useTranslation()
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
  return <><div className="moon-phase-diagram"><canvas ref={canvas} width={160} height={160} aria-label={t("Moon phase: {{value1}}", { value1: t(phases[phase]) })} /><span>{t(phases[phase])}</span></div><label className="range-label" htmlFor="moon-phase">{t("Moon's journey")} <strong>{t("Day")} {(phase / 8 * 29.53).toLocaleString(i18n.language, { minimumFractionDigits: 1, maximumFractionDigits: 1, useGrouping: false })}</strong></label><input id="moon-phase" type="range" min="0" max="7" step="1" value={phase} onChange={event => setPhase(Number(event.target.value))} /><div className="phase-buttons">{[0, 1, 2, 3, 4].map(index => <button key={index} className={phase === index ? 'active' : ''} onClick={() => setPhase(index)}>{t(['New', 'Crescent', 'Quarter', 'Gibbous', 'Full'][index])}</button>)}</div></>
}

function OrbitLesson() {
  const { t } = useTranslation()
  const [gravity, setGravity] = useState(true)
  return <><div className={`orbit-lesson ${gravity ? '' : 'released'}`}><div className="orbit-track" /><span className="season-sun" /><div className="orbiting-body"><span className="orbiting-earth" /><ArrowRight className="velocity-arrow" size={35} /><ArrowDown className="gravity-arrow" size={32} /></div></div><div className="diagram-legend"><span className="mint">{t("Forward motion")}</span><span className="warm">{t("Inward gravity")}</span></div><button className="lesson-action" onClick={() => setGravity(!gravity)}>{gravity ? t('Remove the gravitational pull') : t('Restore the orbit')}<ArrowRight size={15} /></button><p className="helper-text">{gravity ? t('The inward pull continuously changes the direction of motion.') : t('Without the pull, the planet moves along the tangent. This is a simplified illustration, not an instant physical change.')}</p></>
}

function SunLesson() {
  const { t } = useTranslation()
  const [fusion, setFusion] = useState(1)
  return <><div className="fusion-diagram"><div className="hydrogen-group">{[0, 1, 2, 3].map(index => <span key={index}>{t("H")}</span>)}</div><ArrowRight size={24} /><span className="helium" style={{ boxShadow: `0 0 ${fusion * 10}px #efb57855` }}>{t("He")}</span><span className="fusion-energy"><Sun size={26} />{t("ENERGY")}</span></div><label className="range-label" htmlFor="fusion-rate">{t("Imagined fusion rate")} <strong>{fusion}{t("x")}</strong></label><input id="fusion-rate" type="range" min="1" max="5" value={fusion} onChange={event => setFusion(Number(event.target.value))} /><p className="lesson-result">{fusion}{t("x energy")} <span>{t("more fusion reactions release more energy")}</span></p><p className="helper-text">{t("A simplified net reaction. Real fusion takes several steps and releases other particles, too.")}</p></>
}

const diagrams = [SunLesson, SizeLesson, DistancesLesson, GravityLesson, DayLesson, SeasonsLesson, MoonLesson, OrbitLesson]

export function LearningPanel() {
  const { t } = useTranslation()
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
  return <aside className="side-panel learning-panel" aria-label={t("Explore and Learn")}>
    <div className="panel-top"><span className="eyebrow"><BookOpen size={13} /> {t("EXPLORE & LEARN")}</span><IconButton label={t("Close lessons")} onClick={() => useSimulation.getState().set({ panel: null })}><X size={17} /></IconButton></div>
    <div className="lesson-nav" aria-label={t("Choose a lesson")}>{lessons.map((item, index) => <button key={item.title} className={index === lessonIndex ? 'active' : ''} onClick={() => go(index)} aria-pressed={index === lessonIndex}>{completed.includes(index) ? <Check size={10} /> : <span>{String(index + 1).padStart(2, '0')}</span>}{t(item.title)}</button>)}</div>
    <div className="lesson-heading"><span className="eyebrow">{t("LESSON")} {lessonIndex + 1} / 8</span><h2>{t(lesson.title)}</h2><p>{t(lesson.subtitle)}</p></div>
    <p className="lesson-explanation">{t(lesson.explanation)}</p>
    <Diagram />
    <div className="lesson-takeaway"><Lightbulb size={17} /><p>{t(lesson.takeaway)}</p></div>
    <div className="lesson-footer"><IconButton label={t("Previous lesson")} disabled={lessonIndex === 0} onClick={() => go(lessonIndex - 1)}><ArrowLeft size={16} /></IconButton><span>{completed.length} {t("of 8 discovered")}</span><button onClick={() => { setCompleted(current => current.includes(lessonIndex) ? current : [...current, lessonIndex]); if (lessonIndex < 7) go(lessonIndex + 1) }}>{lessonIndex === 7 ? t('Complete') : t('Next lesson')}<ChevronRight size={15} /></button></div>
  </aside>
}