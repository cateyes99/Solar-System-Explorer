import { lazy, Suspense, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { MotionConfig } from 'motion/react'
import { ArrowUpRight, Orbit } from 'lucide-react'
import { DiscoveryTools, Header, PlanetIndex, PlanetPanel, SceneLabels, SettingsPanel, TimeControls, TourControls, ViewTools } from './components/ui/Controls'
import { FallbackScene, LoadingScreen, SceneBoundary } from './components/ui/SceneBoundary'
import { useSimulation } from './store/simulationStore'
import { useExperience } from './hooks/useExperience'
import { LearningPanel } from './components/ui/LearningPanel'
import { ExperimentsPanel } from './components/ui/ExperimentsPanel'
import { MissionPanel } from './components/ui/MissionPanel'

const SolarSystemScene = lazy(() => import('./scenes/SolarSystemScene'))

function supportsWebGL() {
  try {
    if (new URLSearchParams(location.search).has('fallback')) return false
    const canvas = document.createElement('canvas')
    const context = canvas.getContext('webgl2')
    if (context) context.getExtension('WEBGL_lose_context')?.loseContext()
    return Boolean(context)
  } catch { return false }
}

export default function App() {
  const { t } = useTranslation()
  const [webgl, setWebgl] = useState(supportsWebGL)
  const [ready, setReady] = useState(false)
  const [welcome, setWelcome] = useState(true)
  const reduced = useSimulation(state => state.reducedMotion)
  const selected = useSimulation(state => state.selected)
  const panel = useSimulation(state => state.panel)
  const tour = useSimulation(state => state.tour)
  useExperience()
  useEffect(() => {
    if (!ready) return
    const timer = setTimeout(() => setWelcome(false), 7000)
    return () => clearTimeout(timer)
  }, [ready])
  useEffect(() => {
    const failed = () => { setWebgl(false); setReady(true) }
    window.addEventListener('solar-context-lost', failed)
    return () => window.removeEventListener('solar-context-lost', failed)
  }, [])
  return <MotionConfig reducedMotion={reduced ? 'always' : 'user'}><main className={`app ${selected || panel || tour !== null ? 'has-panel' : ''} ${reduced ? 'reduced-motion' : ''}`}>
    <a className="skip-link" href="#explorer-content">{t('Skip to planet explorer')}</a>
    <div className="scene" aria-label={t('Solar system viewport')}><SceneBoundary onFailure={() => setReady(true)}>{webgl ? <Suspense fallback={<LoadingScreen />}><SolarSystemScene onReady={() => setReady(true)} /></Suspense> : <FallbackScene />}</SceneBoundary></div>
    {webgl && !ready && <LoadingScreen />}
    <div className="scene-vignette" />
    {webgl && <SceneLabels />}
    <Header />
    {ready && welcome && !selected && !panel && tour === null && <div className="welcome-message" role="status"><Orbit size={13} /> {t('Welcome to the Solar System')}</div>}
    <section className="scene-heading" id="explorer-content" tabIndex={-1}><div className="eyebrow"><span className="section-number">01</span> {t('THE SOLAR SYSTEM')} <span className="heading-line" /></div><h1>{t('Our cosmic')}<br /><em>{t('neighborhood.')}</em></h1><p>{t('One star. Eight planets. A million questions.')}</p></section>
    <div className="system-coordinate"><Orbit size={15} /><span>{t('YOU ARE HERE')}<small>{t('THE ORION ARM / MILKY WAY')}</small></span><ArrowUpRight size={16} /></div>
    <PlanetIndex />
    <ViewTools />
    <PlanetPanel />
    <SettingsPanel />
    <LearningPanel />
    <ExperimentsPanel />
    <MissionPanel />
    <DiscoveryTools />
    <TourControls />
    <div className="scene-caption"><span className="crosshair">+</span><span>{t('OUR SOLAR SYSTEM')}<span className="caption-separator">/</span><span className="muted">{t('An educational view. Not to scale.')}</span></span></div>
    <TimeControls />
  </main></MotionConfig>
}