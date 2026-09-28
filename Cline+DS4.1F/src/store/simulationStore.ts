import { create } from 'zustand'
import type {
  BodyId,
  CameraMode,
  CameraRequest,
  CustomScale,
  FocusTargetId,
  LessonId,
  QualityLevel,
  ScaleMode,
  WhatIfId,
} from '../types'
import { DEFAULT_CUSTOM_SCALE } from '../utils/scale'
import { FACTS, pickFact } from '../data/facts'
import { findClosestSpeed, TIME_SPEEDS } from '../data/missions'
import { audio } from '../utils/audio'
import { clock } from '../utils/simulationClock'

export type ToastTone = 'info' | 'fun' | 'alert'

export interface Toast {
  id: number
  message: string
  tone: ToastTone
}

interface UiState {
  settingsOpen: boolean
  educationOpen: boolean
  lessonId: LessonId | null
  whatIfOpen: boolean
  factCardOpen: boolean
  welcomeVisible: boolean
  helpOpen: boolean
}

interface CinematicState {
  active: boolean
  paused: boolean
  stageIndex: number
}

export interface SimulationState {
  /* Time */
  paused: boolean
  speedIndex: number
  direction: 1 | -1

  /* Selection */
  selectedId: FocusTargetId | null
  hoveredId: FocusTargetId | null

  /* Camera */
  cameraMode: CameraMode
  followTargetId: FocusTargetId | null
  cameraRequest: CameraRequest | null

  /* Layers */
  showOrbits: boolean
  showLabels: boolean
  showAsteroidBelt: boolean
  showNebula: boolean
  showOrbitFlow: boolean

  /* Scale */
  scaleMode: ScaleMode
  customScale: CustomScale

  /* Modes */
  cinematic: CinematicState
  ui: UiState
  whatIfId: WhatIfId | null

  /* Mission Control */
  missionActive: boolean
  destinationId: BodyId | null
  autopilot: boolean

  /* Settings */
  soundEnabled: boolean
  volume: number
  reducedMotion: boolean
  quality: QualityLevel

  /* Discoveries and easter eggs */
  factIndex: number
  discoveries: string[]
  flareId: number
  sunClickCount: number
  toast: Toast | null

  /* Boot */
  webglSupported: boolean | null
  assetsProgress: number
  assetsLabel: string
  ready: boolean
}

export interface SimulationActions {
  setPaused: (paused: boolean) => void
  togglePaused: () => void
  setSpeedIndex: (index: number) => void
  setDaysPerSecond: (daysPerSecond: number) => void
  nudgeDays: (days: number) => void
  setDirection: (direction: 1 | -1) => void
  resetToToday: () => void
  setSimulationDate: (timeMs: number) => void

  selectBody: (id: FocusTargetId | null) => void
  setHovered: (id: FocusTargetId | null) => void
  focusBody: (id: FocusTargetId, mode?: CameraMode, distanceScale?: number) => void
  resetView: () => void
  setCameraMode: (mode: CameraMode) => void

  toggleOrbits: () => void
  toggleLabels: () => void
  toggleAsteroidBelt: () => void
  toggleNebula: () => void
  setShowOrbitFlow: (visible: boolean) => void

  setScaleMode: (mode: ScaleMode) => void
  setCustomScale: (patch: Partial<CustomScale>) => void

  startTour: () => void
  pauseTour: () => void
  resumeTour: () => void
  setTourStage: (index: number) => void
  exitTour: () => void

  openEducation: (lessonId?: LessonId | null) => void
  closeEducation: () => void
  setLesson: (lessonId: LessonId | null) => void
  toggleWhatIf: (open?: boolean) => void
  setWhatIf: (id: WhatIfId | null) => void

  startMission: () => void
  endMission: () => void
  setDestination: (id: BodyId | null) => void
  setAutopilot: (on: boolean) => void

  setSoundEnabled: (enabled: boolean) => void
  setVolume: (volume: number) => void
  setReducedMotion: (reduced: boolean) => void
  setQuality: (quality: QualityLevel) => void

  teachMeSomething: () => void
  closeFactCard: () => void
  registerSunClick: () => void
  registerDiscovery: (id: string) => void
  showToast: (message: string, tone?: ToastTone) => void
  clearToast: () => void
  dismissWelcome: () => void
  toggleHelp: (open?: boolean) => void
  openSettings: (open?: boolean) => void

  setWebglSupported: (supported: boolean) => void
  setAssetsProgress: (progress: number, label: string) => void
  setReady: (ready: boolean) => void
}

export type SimulationStore = SimulationState & SimulationActions

let toastCounter = 0
let requestCounter = 0

const prefersReducedMotion = (): boolean => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') return false
  return window.matchMedia('(prefers-reduced-motion: reduce)').matches
}

const initialState: SimulationState = {
  paused: false,
  speedIndex: 1,
  direction: 1,

  selectedId: null,
  hoveredId: null,

  cameraMode: 'system',
  followTargetId: null,
  cameraRequest: null,

  showOrbits: true,
  showLabels: true,
  showAsteroidBelt: true,
  showNebula: true,
  showOrbitFlow: false,

  scaleMode: 'educational',
  customScale: DEFAULT_CUSTOM_SCALE,

  cinematic: { active: false, paused: false, stageIndex: 0 },
  ui: {
    settingsOpen: false,
    educationOpen: false,
    lessonId: null,
    whatIfOpen: false,
    factCardOpen: false,
    welcomeVisible: true,
    helpOpen: false,
  },
  whatIfId: null,

  missionActive: false,
  destinationId: 'earth',
  autopilot: false,

  soundEnabled: false,
  volume: 0.4,
  reducedMotion: prefersReducedMotion(),
  quality: 'medium',

  factIndex: -1,
  discoveries: [],
  flareId: 0,
  sunClickCount: 0,
  toast: null,

  webglSupported: null,
  assetsProgress: 0,
  assetsLabel: 'Preparing the Solar System…',
  ready: false,
}
export const useSimulationStore = create<SimulationStore>((set, get) => ({
  ...initialState,

  setPaused: (paused) => set({ paused }),

  togglePaused: () => {
    audio.play('click')
    set((state) => ({ paused: !state.paused }))
  },

  setSpeedIndex: (index) =>
    set({
      speedIndex: Math.max(0, Math.min(TIME_SPEEDS.length - 1, index)),
      paused: false,
    }),

  setDaysPerSecond: (daysPerSecond) =>
    set({ speedIndex: findClosestSpeed(daysPerSecond), paused: false }),

  nudgeDays: (days) => {
    clock.setTime(clock.time + days * 86_400_000)
    set({ paused: true })
  },

  setDirection: (direction) => set({ direction }),

  resetToToday: () => {
    clock.resetToNow()
    set({ direction: 1, speedIndex: 1 })
  },

  setSimulationDate: (timeMs) => {
    if (!Number.isFinite(timeMs)) return
    clock.setTime(timeMs)
  },

  // Choosing a world is the clearest signal that the user is exploring, so the
  // welcome card steps aside instead of covering the information panel.
  selectBody: (id) =>
    set((state) => ({
      selectedId: id,
      ui: id && state.ui.welcomeVisible ? { ...state.ui, welcomeVisible: false } : state.ui,
    })),

  setHovered: (id) => set({ hoveredId: id }),

  focusBody: (id, mode = 'planet', distanceScale = 5.4) =>
    set((state) => ({
      cameraMode: mode,
      followTargetId: mode === 'follow' ? id : state.followTargetId,
      cameraRequest: { id: (requestCounter += 1), targetId: id, mode, distanceScale },
    })),

  resetView: () =>
    set({
      cameraMode: 'system',
      followTargetId: null,
      cameraRequest: { id: (requestCounter += 1), targetId: null, mode: 'system', distanceScale: 0 },
    }),

  setCameraMode: (mode) =>
    set((state) => ({
      cameraMode: mode,
      followTargetId: mode === 'follow' ? (state.followTargetId ?? state.selectedId) : null,
    })),

  toggleOrbits: () => set((state) => ({ showOrbits: !state.showOrbits })),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  toggleAsteroidBelt: () => set((state) => ({ showAsteroidBelt: !state.showAsteroidBelt })),
  toggleNebula: () => set((state) => ({ showNebula: !state.showNebula })),
  setShowOrbitFlow: (visible) => set({ showOrbitFlow: visible }),

  setScaleMode: (mode) => {
    audio.play('click')
    set({ scaleMode: mode })
  },

  setCustomScale: (patch) => set((state) => ({ customScale: { ...state.customScale, ...patch } })),

  startTour: () => {
    audio.play('whoosh')
    set({
      cinematic: { active: true, paused: false, stageIndex: 0 },
      cameraMode: 'cinematic',
      selectedId: null,
      hoveredId: null,
      whatIfId: null,
      ui: {
        settingsOpen: false,
        educationOpen: false,
        lessonId: null,
        whatIfOpen: false,
        factCardOpen: false,
        welcomeVisible: false,
        helpOpen: false,
      },
    })
  },

  pauseTour: () => set((state) => ({ cinematic: { ...state.cinematic, paused: true } })),

  resumeTour: () => set((state) => ({ cinematic: { ...state.cinematic, paused: false } })),

  setTourStage: (index) =>
    set((state) => ({ cinematic: { ...state.cinematic, stageIndex: Math.max(0, index) } })),

  exitTour: () =>
    set((state) => ({
      cinematic: { ...state.cinematic, active: false, paused: false },
      showOrbitFlow: false,
      cameraMode: 'system',
      cameraRequest: { id: (requestCounter += 1), targetId: null, mode: 'system', distanceScale: 0 },
    })),

  openEducation: (lessonId = null) =>
    set((state) => ({
      cinematic: { ...state.cinematic, active: false },
      ui: {
        ...state.ui,
        educationOpen: true,
        lessonId,
        settingsOpen: false,
        factCardOpen: false,
        whatIfOpen: false,
        welcomeVisible: false,
      },
    })),

  closeEducation: () => set((state) => ({ ui: { ...state.ui, educationOpen: false } })),

  setLesson: (lessonId) => set((state) => ({ ui: { ...state.ui, lessonId } })),

  toggleWhatIf: (open) =>
    set((state) => {
      const next = open ?? !state.ui.whatIfOpen
      return {
        cinematic: next ? { ...state.cinematic, active: false } : state.cinematic,
        ui: {
          ...state.ui,
          whatIfOpen: next,
          settingsOpen: false,
          educationOpen: false,
          factCardOpen: false,
          welcomeVisible: false,
        },
        whatIfId: next ? state.whatIfId : null,
      }
    }),

  setWhatIf: (id) => set({ whatIfId: id }),

  startMission: () => {
    audio.play('click')
    set((state) => ({
      missionActive: true,
      autopilot: false,
      cameraMode: 'follow',
      followTargetId: 'spacecraft',
      ui: { ...state.ui, welcomeVisible: false, factCardOpen: false },
    }))
  },

  endMission: () => {
    set((state) => ({
      missionActive: false,
      autopilot: false,
      cameraMode: 'system',
      followTargetId: null,
      selectedId: null,
      ui: { ...state.ui, welcomeVisible: false, factCardOpen: false },
    }))
    get().resetView()
  },

  setDestination: (id) => set({ destinationId: id }),

  setAutopilot: (on) => {
    audio.play('click')
    set({ autopilot: on })
  },

  setSoundEnabled: (enabled) => {
    if (enabled) {
      if (!audio.enable()) {
        set({ soundEnabled: false })
        get().showToast('This browser cannot play generated audio.', 'alert')
        return
      }
      audio.setVolume(get().volume)
      audio.play('click')
      set({ soundEnabled: true })
    } else {
      audio.disable()
      set({ soundEnabled: false })
    }
  },

  setVolume: (volume) => {
    audio.setVolume(volume)
    set({ volume })
  },

  setReducedMotion: (reducedMotion) => set({ reducedMotion }),

  setQuality: (quality) => set({ quality }),

  teachMeSomething: () => {
    audio.play('click')
    set((state) => ({
      factIndex: pickFact(state.factIndex),
      ui: { ...state.ui, factCardOpen: true, welcomeVisible: false },
    }))
  },

  closeFactCard: () => set((state) => ({ ui: { ...state.ui, factCardOpen: false } })),

  registerSunClick: () => {
    const count = get().sunClickCount + 1
    set({ sunClickCount: count })
    if (count % 3 === 0) {
      audio.play('flare')
      set((state) => ({ flareId: state.flareId + 1 }))
      get().showToast('Solar flare! The Sun is throwing a tantrum of plasma.', 'fun')
    }
  },

  registerDiscovery: (id) => {
    if (get().discoveries.includes(id)) return
    set((state) => ({ discoveries: [...state.discoveries, id] }))
  },

  showToast: (message, tone) => set({ toast: { id: (toastCounter += 1), message, tone: tone ?? 'info' } }),

  clearToast: () => set({ toast: null }),

  dismissWelcome: () => set((state) => ({ ui: { ...state.ui, welcomeVisible: false } })),

  toggleHelp: (open) => set((state) => ({ ui: { ...state.ui, helpOpen: open ?? !state.ui.helpOpen } })),

  openSettings: (open) =>
    set((state) => ({
      ui: {
        ...state.ui,
        settingsOpen: open ?? !state.ui.settingsOpen,
        educationOpen: false,
        whatIfOpen: false,
        factCardOpen: false,
      },
    })),

  setWebglSupported: (webglSupported) => set({ webglSupported }),
  setAssetsProgress: (assetsProgress, assetsLabel) => set({ assetsProgress, assetsLabel }),
  setReady: (ready) => set({ ready }),
}))

/** Current simulation speed in days per second, including direction. */
export function simulationDaysPerSecond(state: SimulationState): number {
  const speed = TIME_SPEEDS[state.speedIndex] ?? TIME_SPEEDS[1]
  return speed.daysPerSecond * state.direction
}

/** Text of the fact currently shown on the random-fact card. */
export function currentFact(state: SimulationState): string {
  if (state.factIndex < 0) return FACTS[0].text
  return (FACTS[state.factIndex] ?? FACTS[0]).text
}
