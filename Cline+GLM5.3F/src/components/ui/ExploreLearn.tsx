import { Panel } from './Panel'
import { useSimulation } from '../../store/simulationStore'
import { LESSONS } from '../../data/lessons'
import type { BodyId } from '../../types'
import { audio } from '../../audio/audioEngine'
import { SizeDiagram } from './diagrams/SizeDiagram'
import { DistanceDiagram } from './diagrams/DistanceDiagram'
import { GravityDiagram } from './diagrams/GravityDiagram'
import { DayNightDiagram } from './diagrams/DayNightDiagram'
import { SeasonsDiagram } from './diagrams/SeasonsDiagram'
import { MoonPhasesDiagram } from './diagrams/MoonPhasesDiagram'
import { OrbitDiagram } from './diagrams/OrbitDiagram'
import type { DiagramId } from '../../data/lessons'

const DIAGRAMS: Record<DiagramId, () => JSX.Element> = {
  sizes: SizeDiagram,
  distances: DistanceDiagram,
  gravity: GravityDiagram,
  daynight: DayNightDiagram,
  seasons: SeasonsDiagram,
  moonphases: MoonPhasesDiagram,
  orbits: OrbitDiagram,
}

/** The Explore & Learn mode: interactive lessons with 2D experiments. */
export function ExploreLearn(): JSX.Element {
  const open = useSimulation((s) => s.panel === 'learn')
  const setPanel = useSimulation((s) => s.setPanel)
  const lessonId = useSimulation((s) => s.lessonId)
  const openLesson = useSimulation((s) => s.openLesson)
  const focusBody = useSimulation((s) => s.focusBody)
  const setScaleMode = useSimulation((s) => s.setScaleMode)
  const lesson = LESSONS.find((l) => l.id === lessonId) ?? null

  return (
    <Panel open={open} title="Explore & Learn" emoji="🔭" onClose={() => setPanel('none')}>
      {!lesson ? (
        <div className="grid gap-2">
          <p className="mb-1 text-sm text-white/60">
            Pick a lesson, young astronomer! Each one has an interactive experiment. 🧪
          </p>
          {LESSONS.map((l) => (
            <button
              key={l.id}
              type="button"
              className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/[0.04] p-3 text-left transition hover:bg-white/[0.09]"
              onClick={() => {
                openLesson(l.id)
                audio.blip(840)
              }}
            >
              <span aria-hidden className="text-2xl">
                {l.emoji}
              </span>
              <span>
                <span className="block text-sm font-semibold text-white">{l.title}</span>
                <span className="block text-[12px] text-white/55">{l.tagline}</span>
              </span>
              <span aria-hidden className="ml-auto text-white/30">
                ›
              </span>
            </button>
          ))}
        </div>
      ) : (
        <div className="space-y-4">
          <button type="button" className="chip" onClick={() => openLesson(null)}>
            ← All lessons
          </button>
          <div>
            <h3 className="font-display text-lg font-bold text-white">
              {lesson.emoji} {lesson.title}
            </h3>
            <p className="text-xs text-white/50">{lesson.tagline}</p>
          </div>
          {lesson.paragraphs.map((p, i) => (
            <p key={i} className="text-sm leading-relaxed text-white/80">
              {p}
            </p>
          ))}
          {lesson.diagram && (
            <div className="rounded-2xl border border-white/10 bg-space-900/60 p-3">
              {DIAGRAMS[lesson.diagram]()}
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            {lesson.focusBody && (
              <button
                type="button"
                className="btn btn-primary"
                onClick={() => {
                  focusBody(lesson.focusBody as BodyId, { follow: false })
                  audio.whoosh()
                }}
              >
                🌌 Show me in 3D
              </button>
            )}
            {lesson.action === 'distances-scale' && (
              <button
                type="button"
                className="btn"
                onClick={() => {
                  setScaleMode('distances')
                  audio.blip(700)
                }}
              >
                📏 Turn on the distance scale
              </button>
            )}
          </div>
        </div>
      )}
    </Panel>
  )
}
