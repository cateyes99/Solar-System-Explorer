import { useMemo } from 'react'
import type {
  AstronomyFact,
  CelestialBody,
  Lesson,
  SatelliteDefinition,
  ScaleMode,
  TimeSpeedOption,
  TourStage,
  TravelDestination,
  WhatIfScenario,
} from '../types'
import { BODIES, SATELLITES } from '../data/planets'
import { LESSONS } from '../data/lessons'
import { TOUR_STAGES } from '../data/tour'
import { TIME_SPEEDS, TRAVEL_DESTINATIONS } from '../data/missions'
import { WHAT_IF_SCENARIOS } from '../data/whatIf'
import { FACTS } from '../data/facts'
import { SCALE_MODE_INFO } from '../utils/scale'
import { useTranslation } from './index'
import type { Language } from './index'
import { zhContent } from './content.zh'

/**
 * The prose half of the localisation system.
 *
 * The astronomy — orbit elements, diameters, colours — is language-independent
 * data and lives in `src/data`. The *words* around it (names, descriptions,
 * lesson narration, tour scripts …) are translated here: the English stays in the
 * data files as the source of truth, and each other language supplies a
 * `ContentOverrides` layer that `useContent()` merges on top. Adding a language
 * is therefore one more overrides file, with no change to the components.
 */
export type BodyText = Pick<
  CelestialBody,
  'name' | 'type' | 'tagline' | 'description' | 'facts' | 'didYouKnow' | 'discoveryToast'
>

export interface ContentOverrides {
  bodies?: Record<string, Partial<BodyText>>
  satellites?: Record<string, { note?: string }>
  lessons?: Record<
    string,
    { title?: string; summary?: string; steps?: { text: string; highlight?: string }[]; actionLabel?: string }
  >
  tour?: Record<string, { title?: string; narration?: string }>
  destinations?: Record<string, { name?: string; description?: string; funFact?: string }>
  speeds?: Record<string, { label?: string; shortLabel?: string }>
  scenarios?: Record<string, { title?: string; question?: string; explanation?: string; takeaway?: string }>
  facts?: Record<string, string>
  scale?: Partial<Record<ScaleMode, { title?: string; description?: string; caveat?: string }>>
}

export interface ScaleModeText {
  title: string
  description: string
  caveat: string
}

export interface Content {
  bodies: CelestialBody[]
  bodyById: Record<string, CelestialBody>
  satellites: SatelliteDefinition[]
  satellitesOf: (parentId: string) => SatelliteDefinition[]
  lessons: Lesson[]
  tourStages: TourStage[]
  destinations: TravelDestination[]
  timeSpeeds: TimeSpeedOption[]
  scenarios: WhatIfScenario[]
  facts: AstronomyFact[]
  scaleInfo: Record<ScaleMode, ScaleModeText>
}

const OVERRIDES: Record<Language, ContentOverrides> = {
  en: {},
  zh: zhContent,
}

function buildContent(language: Language): Content {
  const o = OVERRIDES[language]

  const bodies = BODIES.map((body) => {
    const patch = o.bodies?.[body.id]
    return patch ? { ...body, ...patch } : body
  })
  const bodyById = Object.fromEntries(bodies.map((body) => [body.id, body]))

  const satellites = SATELLITES.map((satellite) => {
    const patch = o.satellites?.[satellite.id]
    return patch ? { ...satellite, ...patch } : satellite
  })

  const lessons = LESSONS.map((lesson) => {
    const patch = o.lessons?.[lesson.id]
    if (!patch) return lesson
    return {
      ...lesson,
      title: patch.title ?? lesson.title,
      summary: patch.summary ?? lesson.summary,
      steps: patch.steps ?? lesson.steps,
      sceneAction: lesson.sceneAction
        ? { ...lesson.sceneAction, label: patch.actionLabel ?? lesson.sceneAction.label }
        : lesson.sceneAction,
    }
  })

  const tourStages = TOUR_STAGES.map((stage) => {
    const patch = o.tour?.[stage.id]
    return patch ? { ...stage, ...patch } : stage
  })

  const destinations = TRAVEL_DESTINATIONS.map((destination) => {
    const patch = o.destinations?.[destination.id]
    return patch ? { ...destination, ...patch } : destination
  })

  const timeSpeeds = TIME_SPEEDS.map((speed) => {
    const patch = o.speeds?.[speed.id]
    return patch ? { ...speed, ...patch } : speed
  })

  const scenarios = WHAT_IF_SCENARIOS.map((scenario) => {
    const patch = o.scenarios?.[scenario.id]
    return patch ? { ...scenario, ...patch } : scenario
  })

  const facts = FACTS.map((fact) => {
    const text = o.facts?.[fact.id]
    return text ? { ...fact, text } : fact
  })

  const scaleInfo = Object.fromEntries(
    (Object.keys(SCALE_MODE_INFO) as ScaleMode[]).map((mode) => {
      const patch = o.scale?.[mode]
      return [mode, patch ? { ...SCALE_MODE_INFO[mode], ...patch } : SCALE_MODE_INFO[mode]]
    }),
  ) as Record<ScaleMode, ScaleModeText>

  return {
    bodies,
    bodyById,
    satellites,
    satellitesOf: (parentId) => satellites.filter((satellite) => satellite.parentId === parentId),
    lessons,
    tourStages,
    destinations,
    timeSpeeds,
    scenarios,
    facts,
    scaleInfo,
  }
}

/** The astronomy data with all of its prose in the current language. */
export function useContent(): Content {
  const { language } = useTranslation()
  return useMemo(() => buildContent(language), [language])
}
