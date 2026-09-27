import { create } from 'zustand'
import { tourStops, type BodyId } from '../data/planets'
import { clampDays, MAX_DAYS, MIN_DAYS, type ScaleMode } from '../utils/astronomy'

export type Panel = 'learn' | 'experiments' | 'mission' | 'settings' | null
export type CameraMode = 'system' | 'planet' | 'follow' | 'orbit'
export type Experiment = 'none' | 'two-moons' | 'giant-earth' | 'no-sun' | 'no-spin'

interface SimulationState {
  selected: BodyId | null
  cameraMode: CameraMode
  cameraRevision: number
  speed: number
  paused: boolean
  days: number
  approximationAllowed: boolean
  dateLimitPrompt: boolean
  reducedMotion: boolean
  labels: boolean
  orbits: boolean
  audio: boolean
  panel: Panel
  scale: ScaleMode
  size: number
  spacing: number
  tour: number | null
  tourPaused: boolean
  experiment: Experiment
  lesson: number
  missionDestination: BodyId
  missionActive: boolean
  thrust: number
  steer: number
  missionReset: number
  select: (id: BodyId, focus?: boolean) => void
  viewSystem: () => void
  advance: (days: number) => void
  resolveDateLimit: (accept: boolean) => void
  resetDate: () => void
  tick: (seconds: number) => void
  set: (values: Partial<SimulationState>) => void
  startTour: () => void
  jumpToTourStop: (index: number) => void
  nextTour: () => void
  exitTour: () => void
}

export const useSimulation = create<SimulationState>((set, get) => ({
  selected: null, cameraMode: 'system', cameraRevision: 0,
  speed: 8, paused: false, days: 0,
  approximationAllowed: false, dateLimitPrompt: false,
  reducedMotion: typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches,
  labels: true, orbits: true, audio: false, panel: null,
  scale: 'educational', size: 1, spacing: 1,
  tour: null, tourPaused: false, experiment: 'none', lesson: 0,
  missionDestination: 'earth', missionActive: false, thrust: 0, steer: 0, missionReset: 0,
  select: (selected, focus = true) => set(state => ({ selected, cameraMode: focus ? 'follow' : state.cameraMode, cameraRevision: state.cameraRevision + 1, panel: null })),
  viewSystem: () => set(state => ({ cameraMode: 'system', cameraRevision: state.cameraRevision + 1, selected: null })),
  advance: amount => {
    const state = get()
    if (state.dateLimitPrompt || !Number.isFinite(amount)) return
    const days = state.days + amount
    if (!state.approximationAllowed && ((amount > 0 && days >= MAX_DAYS) || (amount < 0 && days <= MIN_DAYS))) {
      set({ days: clampDays(days), paused: true, dateLimitPrompt: true })
    } else set({ days })
  },
  resolveDateLimit: accept => {
    if (!get().dateLimitPrompt) return
    set({ dateLimitPrompt: false, approximationAllowed: accept, paused: !accept, ...(accept ? { reducedMotion: false } : {}) })
  },
  resetDate: () => set(state => ({ days: 0, approximationAllowed: false, dateLimitPrompt: false, cameraRevision: state.cameraRevision + 1 })),
  tick: seconds => {
    const state = get()
    if (!state.paused && !state.reducedMotion && !state.dateLimitPrompt) get().advance(Math.min(seconds, .2) * state.speed)
  },
  set: values => set(values),
  startTour: () => set(state => ({ tour: 0, tourPaused: false, panel: null, selected: null, cameraMode: 'system', cameraRevision: state.cameraRevision + 1, missionActive: false })),
  jumpToTourStop: index => {
    if (!Number.isInteger(index) || index < 0 || index >= tourStops.length) return
    const selected = tourStops[index].body
    set(state => ({ tour: index, tourPaused: false, selected, cameraMode: selected ? 'follow' : 'system', cameraRevision: state.cameraRevision + 1 }))
  },
  nextTour: () => {
    const state = get()
    const next = (state.tour ?? -1) + 1
    if (next >= tourStops.length) { get().exitTour(); return }
    const selected = tourStops[next].body
    set({ tour: next, selected, cameraMode: selected ? 'follow' : 'system', cameraRevision: state.cameraRevision + 1 })
  },
  exitTour: () => set(state => ({ tour: null, tourPaused: false, selected: null, cameraMode: 'system', cameraRevision: state.cameraRevision + 1 })),
}))