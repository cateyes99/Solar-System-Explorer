import { create } from 'zustand'
import { LESSONS, type CameraPreset, type LessonId } from '../data/lessons'
import { MISSIONS } from '../data/missions'
import { BODIES } from '../data/planets'
import { TOUR_STEPS } from '../data/tour'
import type { BodyId } from '../data/types'
import { WHAT_IFS, type WhatIfId } from '../data/whatIf'
import { DEFAULT_CUSTOM_SCALE, type CustomScale, type ScaleMode } from '../utils/scale'
import { simClock, sunGoneState } from './runtime'

export type AppMode = 'explore' | 'learn' | 'whatif' | 'mission' | 'tour'
export type CameraMode = 'system' | 'planet' | 'follow' | 'spacecraft'
export type Quality = 'high' | 'balanced' | 'low'
export type Autopilot = 'off' | 'fly' | 'orbit'
export type Discovery = 'solar-flare' | 'hello-earth' | 'comet' | 'probe'

export const DISCOVERY_COUNT = 4

export const SPEED_PRESETS = [
  { id: 'slow', label: 'Slow', daysPerSecond: 0.1 },
  { id: 'normal', label: 'Normal', daysPerSecond: 1 },
  { id: 'fast', label: 'Fast', daysPerSecond: 30 },
  { id: 'very-fast', label: 'Very Fast', daysPerSecond: 365 },
] as const

const SPEED_STEPS = [0.1, 0.25, 1, 3, 7, 30, 90, 365, 1000]

export interface CameraRequest {
  mode: CameraMode
  targetId: BodyId | null
  nonce: number
  distanceFactor?: number
  azimuthDeg?: number
  elevationDeg?: number
  duration?: number
}

export interface Toast {
  id: number
  title: string
  message?: string
  tone: 'info' | 'success' | 'discovery'
}

export interface Telemetry {
  speedKmS: number
  distanceAU: number
  nearestId: BodyId | null
  nearestDistance: number
}

export interface SoundSettings {
  enabled: boolean
  ambient: boolean
  ui: boolean
  cinematic: boolean
}

interface State {
  paused: boolean
  daysPerSecond: number
  savedSpeed: number | null
  displayDays: number

  selectedId: BodyId | null
  hoveredId: BodyId | null
  infoOpen: boolean

  camera: CameraRequest

  appMode: AppMode
  activeLesson: LessonId | null
  whatIf: WhatIfId | null
  tourStep: number
  tourPaused: boolean

  scaleMode: ScaleMode
  customScale: CustomScale
  showLabels: boolean
  showOrbits: boolean
  reducedMotion: boolean
  quality: Quality
  sound: SoundSettings

  factOpen: boolean
  factIndex: number
  settingsOpen: boolean
  helpOpen: boolean
  welcomeVisible: boolean

  toasts: Toast[]
  discoveries: Discovery[]
  solarFlareNonce: number

  telemetry: Telemetry
  destinationId: BodyId
  autopilot: Autopilot
  visited: BodyId[]
  completedMissions: string[]

  loadProgress: number
  loadLabel: string
  sceneReady: boolean
  renderMode: '3d' | '2d'
}

interface Actions {
  togglePause: () => void
  setPaused: (paused: boolean) => void
  setSpeed: (daysPerSecond: number) => void
  stepSpeed: (direction: 1 | -1) => void
  advanceDays: (days: number) => void
  jumpToToday: () => void
  publishDays: (days: number) => void

  select: (id: BodyId | null) => void
  closeInfo: () => void
  hover: (id: BodyId | null) => void

  viewSystem: () => void
  viewBody: (id: BodyId, preset?: Partial<CameraPreset>) => void
  followBody: (id: BodyId) => void
  surpriseMe: () => void

  setAppMode: (mode: AppMode) => void
  openLesson: (id: LessonId | null) => void
  startWhatIf: (id: WhatIfId | null) => void
  startTour: () => void
  exitTour: () => void
  setTourStep: (index: number) => void
  setTourPaused: (paused: boolean) => void

  setScaleMode: (mode: ScaleMode) => void
  setCustomScale: (patch: Partial<CustomScale>) => void
  toggleLabels: () => void
  toggleOrbits: () => void
  setReducedMotion: (value: boolean) => void
  setQuality: (quality: Quality) => void
  setSound: (patch: Partial<SoundSettings>) => void

  showFact: () => void
  closeFact: () => void
  setSettingsOpen: (open: boolean) => void
  setHelpOpen: (open: boolean) => void
  dismissWelcome: () => void

  addToast: (toast: Omit<Toast, 'id'>) => void
  dismissToast: (id: number) => void
  discover: (discovery: Discovery, title: string, message: string) => void
  triggerSolarFlare: () => void

  setTelemetry: (telemetry: Telemetry) => void
  setDestination: (id: BodyId) => void
  setAutopilot: (mode: Autopilot) => void
  markVisited: (id: BodyId) => void

  setLoad: (progress: number, label: string) => void
  setSceneReady: () => void
  switchTo2D: () => void
}

export type SimulationStore = State & Actions

let toastId = 0

const prefersReducedMotion =
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

function cameraFromPreset(preset: CameraPreset, nonce: number): CameraRequest {
  if (preset.mode === 'system' || !preset.target) return { mode: 'system', targetId: null, nonce }
  return {
    mode: preset.mode,
    targetId: preset.target,
    nonce,
    distanceFactor: preset.distanceFactor,
    azimuthDeg: preset.azimuthDeg,
    elevationDeg: preset.elevationDeg,
  }
}

export const useSimulationStore = create<SimulationStore>()((set, get) => {
  const nextCamera = (request: Omit<CameraRequest, 'nonce'>): CameraRequest => ({
    ...request,
    nonce: get().camera.nonce + 1,
  })

  /** Leaves whatever special mode is active and restores normal exploring. */
  const leaveMode = (): Partial<State> => {
    const s = get()
    const patch: Partial<State> = {
      activeLesson: null,
      whatIf: null,
      tourPaused: false,
      autopilot: 'off',
      settingsOpen: false,
    }
    if (s.savedSpeed !== null) {
      patch.daysPerSecond = s.savedSpeed
      patch.savedSpeed = null
    }
    sunGoneState.reset()
    return patch
  }

  const withSpeed = (speed: number | undefined): Partial<State> => {
    if (speed === undefined) return {}
    const s = get()
    return { daysPerSecond: speed, paused: false, savedSpeed: s.savedSpeed ?? s.daysPerSecond }
  }

  return {
    paused: false,
    daysPerSecond: 1,
    savedSpeed: null,
    displayDays: simClock.days,

    selectedId: null,
    hoveredId: null,
    infoOpen: false,

    camera: { mode: 'system', targetId: null, nonce: 1, duration: prefersReducedMotion ? 0.6 : 5.5 },

    appMode: 'explore',
    activeLesson: null,
    whatIf: null,
    tourStep: 0,
    tourPaused: false,

    scaleMode: 'educational',
    customScale: DEFAULT_CUSTOM_SCALE,
    showLabels: true,
    showOrbits: true,
    reducedMotion: Boolean(prefersReducedMotion),
    quality: 'high',
    sound: { enabled: false, ambient: true, ui: true, cinematic: true },

    factOpen: false,
    factIndex: -1,
    settingsOpen: false,
    helpOpen: false,
    welcomeVisible: true,

    toasts: [],
    discoveries: [],
    solarFlareNonce: 0,

    telemetry: { speedKmS: 0, distanceAU: 1, nearestId: 'earth', nearestDistance: 0 },
    destinationId: 'mars',
    autopilot: 'off',
    visited: [],
    completedMissions: [],

    loadProgress: 0,
    loadLabel: 'Preparing the Solar System…',
    sceneReady: false,
    renderMode: '3d',

    togglePause: () => set((s) => ({ paused: !s.paused })),
    setPaused: (paused) => set({ paused }),
    setSpeed: (daysPerSecond) => set({ daysPerSecond, paused: false }),
    stepSpeed: (direction) => {
      const current = get().daysPerSecond
      const index = SPEED_STEPS.findIndex((v) => v >= current - 1e-6)
      const base = index === -1 ? SPEED_STEPS.length - 1 : index
      const next = SPEED_STEPS[Math.min(SPEED_STEPS.length - 1, Math.max(0, base + direction))]
      set({ daysPerSecond: next, paused: false })
    },
    advanceDays: (days) => {
      simClock.days += days
      set({ displayDays: simClock.days })
    },
    jumpToToday: () => {
      simClock.days = (Date.now() - Date.UTC(2000, 0, 1, 12)) / 86_400_000
      set({ displayDays: simClock.days })
    },
    publishDays: (days) => set({ displayDays: days }),

    select: (id) => {
      set({ selectedId: id, infoOpen: id !== null, welcomeVisible: false })
    },
    closeInfo: () => set({ infoOpen: false }),
    hover: (id) => {
      if (get().hoveredId !== id) set({ hoveredId: id })
    },

    viewSystem: () => set({ camera: nextCamera({ mode: 'system', targetId: null }) }),
    viewBody: (id, preset) =>
      set({
        selectedId: id,
        welcomeVisible: false,
        camera: nextCamera({
          mode: 'planet',
          targetId: id,
          distanceFactor: preset?.distanceFactor,
          azimuthDeg: preset?.azimuthDeg,
          elevationDeg: preset?.elevationDeg,
        }),
      }),
    followBody: (id) =>
      set({ selectedId: id, welcomeVisible: false, camera: nextCamera({ mode: 'follow', targetId: id }) }),
    surpriseMe: () => {
      const ids: BodyId[] = ['sun', 'mercury', 'venus', 'earth', 'moon', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']
      const current = get().camera.targetId
      const choices = ids.filter((id) => id !== current)
      const id = choices[Math.floor(Math.random() * choices.length)]
      const follow = id !== 'sun' && id !== 'moon' && Math.random() < 0.4
      set({
        selectedId: id,
        welcomeVisible: false,
        camera: nextCamera({
          mode: follow ? 'follow' : 'planet',
          targetId: id,
          distanceFactor: 0.75 + Math.random() * 1.4,
          azimuthDeg: -80 + Math.random() * 160,
          elevationDeg: -15 + Math.random() * 60,
        }),
      })
      get().addToast({ title: `Surprise! Welcome to ${BODIES[id].name}`, tone: 'info' })
    },

    setAppMode: (mode) => {
      const s = get()
      if (mode === s.appMode && mode !== 'learn' && mode !== 'whatif') return
      if (mode === 'tour') {
        get().startTour()
        return
      }
      const patch: Partial<State> = { ...leaveMode(), appMode: mode, infoOpen: false, welcomeVisible: false }
      if (mode === 'mission') {
        patch.camera = nextCamera({ mode: 'spacecraft', targetId: null, duration: 2.2 })
        patch.paused = false
        if (!s.visited.includes('earth')) patch.visited = [...s.visited, 'earth']
        const speed = patch.daysPerSecond ?? s.daysPerSecond
        if (speed > 1) {
          patch.savedSpeed = speed
          patch.daysPerSecond = 0.5
        }
      } else if (s.appMode === 'mission' || s.appMode === 'tour' || s.appMode === 'whatif') {
        patch.camera = nextCamera({ mode: 'system', targetId: null })
      }
      set(patch)
    },

    openLesson: (id) => {
      if (id === null) {
        set({ ...leaveMode(), appMode: 'learn' })
        return
      }
      const lesson = LESSONS.find((l) => l.id === id)
      if (!lesson) return
      const base = leaveMode()
      const s = get()
      const baseSpeed = base.daysPerSecond ?? s.daysPerSecond
      const speedPatch: Partial<State> =
        lesson.speed === undefined ? {} : { daysPerSecond: lesson.speed, paused: false, savedSpeed: baseSpeed }
      set({
        ...base,
        ...speedPatch,
        appMode: 'learn',
        activeLesson: id,
        infoOpen: false,
        camera: cameraFromPreset(lesson.camera, s.camera.nonce + 1),
      })
    },

    startWhatIf: (id) => {
      const base = leaveMode()
      if (id === null) {
        set({ ...base, appMode: 'whatif', camera: nextCamera({ mode: 'system', targetId: null }) })
        return
      }
      const scenario = WHAT_IFS.find((w) => w.id === id)
      if (!scenario) return
      set({ ...base })
      if (id === 'no-sun') sunGoneState.active = true
      set({
        ...withSpeed(scenario.speed),
        appMode: 'whatif',
        whatIf: id,
        infoOpen: false,
        camera: cameraFromPreset(scenario.camera, get().camera.nonce + 1),
      })
    },

    startTour: () => {
      const base = leaveMode()
      const step = TOUR_STEPS[0]
      set({
        ...base,
        appMode: 'tour',
        tourStep: 0,
        tourPaused: false,
        infoOpen: false,
        welcomeVisible: false,
        paused: false,
      })
      set({ ...withSpeed(1), camera: tourCamera(step, get().camera.nonce + 1) })
    },
    exitTour: () => {
      set({ ...leaveMode(), appMode: 'explore', camera: nextCamera({ mode: 'system', targetId: null }) })
    },
    setTourStep: (index) => {
      if (index >= TOUR_STEPS.length) {
        get().exitTour()
        get().addToast({ title: 'Tour complete!', message: 'Now it is your turn – click any planet to explore.', tone: 'success' })
        return
      }
      const step = TOUR_STEPS[Math.max(0, index)]
      set({ tourStep: Math.max(0, index), camera: tourCamera(step, get().camera.nonce + 1) })
    },
    setTourPaused: (tourPaused) => set({ tourPaused }),

    setScaleMode: (scaleMode) => set({ scaleMode }),
    setCustomScale: (patch) => set((s) => ({ scaleMode: 'custom', customScale: { ...s.customScale, ...patch } })),
    toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
    toggleOrbits: () => set((s) => ({ showOrbits: !s.showOrbits })),
    setReducedMotion: (reducedMotion) => set({ reducedMotion }),
    setQuality: (quality) => set({ quality }),
    setSound: (patch) => set((s) => ({ sound: { ...s.sound, ...patch } })),

    showFact: () =>
      set((s) => ({ factOpen: true, factIndex: s.factIndex + 1, welcomeVisible: false })),
    closeFact: () => set({ factOpen: false }),
    setSettingsOpen: (settingsOpen) => set({ settingsOpen }),
    setHelpOpen: (helpOpen) => set({ helpOpen }),
    dismissWelcome: () => set({ welcomeVisible: false }),

    addToast: (toast) => {
      const id = ++toastId
      set((s) => ({ toasts: [...s.toasts.slice(-2), { ...toast, id }] }))
      window.setTimeout(() => get().dismissToast(id), 5200)
    },
    dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    discover: (discovery, title, message) => {
      const s = get()
      const isNew = !s.discoveries.includes(discovery)
      const discoveries = isNew ? [...s.discoveries, discovery] : s.discoveries
      set({ discoveries })
      get().addToast({
        title,
        message: isNew ? `${message} (Secret ${discoveries.length} of ${DISCOVERY_COUNT} found!)` : message,
        tone: 'discovery',
      })
    },
    triggerSolarFlare: () => {
      set((s) => ({ solarFlareNonce: s.solarFlareNonce + 1 }))
      get().discover('solar-flare', 'Whoosh! A solar flare!', 'Real solar flares are giant bursts of energy from the Sun.')
    },

    setTelemetry: (telemetry) => set({ telemetry }),
    setDestination: (destinationId) => set({ destinationId }),
    setAutopilot: (autopilot) => set({ autopilot }),
    markVisited: (id) => {
      const s = get()
      if (s.visited.includes(id)) return
      const visited = [...s.visited, id]
      const newlyDone = MISSIONS.filter(
        (m) => !s.completedMissions.includes(m.id) && m.targets.every((t) => visited.includes(t)),
      )
      set({ visited, completedMissions: [...s.completedMissions, ...newlyDone.map((m) => m.id)] })
      get().addToast({ title: `You reached ${BODIES[id].name}!`, tone: 'info' })
      for (const mission of newlyDone) {
        get().addToast({ title: `Mission complete: ${mission.title}`, message: mission.description, tone: 'success' })
      }
    },

    setLoad: (loadProgress, loadLabel) => set({ loadProgress, loadLabel }),
    setSceneReady: () => set({ sceneReady: true, loadProgress: 1 }),
    switchTo2D: () => set({ renderMode: '2d', appMode: 'explore', sceneReady: true }),
  }
})

function tourCamera(step: (typeof TOUR_STEPS)[number], nonce: number): CameraRequest {
  if (step.target === 'system') return { mode: 'system', targetId: null, nonce, duration: step.flightSeconds }
  return {
    mode: step.mode === 'system' ? 'planet' : step.mode,
    targetId: step.target,
    nonce,
    distanceFactor: step.distanceFactor,
    azimuthDeg: step.azimuthDeg,
    elevationDeg: step.elevationDeg,
    duration: step.flightSeconds,
  }
}
