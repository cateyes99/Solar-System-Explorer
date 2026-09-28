import { create } from 'zustand'
import type { PlanetId } from '../data/planets'
import { DEFAULT_CUSTOM_SCALE, type CustomScaleSettings, type ScaleMode } from '../utils/scale'
import { getRandomFact } from '../data/facts'

export type CameraMode = 'system' | 'planet' | 'follow'
export type FocusTarget = PlanetId | 'sun' | 'moon' | null

export type SpeedPreset = 'slow' | 'normal' | 'fast' | 'veryFast'

export const SPEED_PRESETS: Record<SpeedPreset, { label: string; daysPerSecond: number; displayMultiplier: string }> = {
  slow: { label: 'Slow', daysPerSecond: 0.5, displayMultiplier: '0.5\u00d7' },
  normal: { label: 'Normal', daysPerSecond: 1, displayMultiplier: '1\u00d7' },
  fast: { label: 'Fast', daysPerSecond: 10, displayMultiplier: '10\u00d7' },
  veryFast: { label: 'Very Fast', daysPerSecond: 365, displayMultiplier: '365\u00d7' },
}

export interface WhatIfState {
  twoMoons: boolean
  earthAsJupiter: boolean
  noSun: boolean
  stoppedRotation: boolean
}

const DEFAULT_WHAT_IF: WhatIfState = {
  twoMoons: false,
  earthAsJupiter: false,
  noSun: false,
  stoppedRotation: false,
}

interface SimulationState {
  // --- Time ---
  simTimeDays: number
  speedPreset: SpeedPreset
  isPaused: boolean
  setSpeedPreset: (preset: SpeedPreset) => void
  togglePaused: (force?: boolean) => void
  tick: (deltaSeconds: number) => void
  setSimTimeDays: (days: number) => void

  // --- Selection & camera ---
  selectedId: FocusTarget
  hoveredId: FocusTarget
  cameraMode: CameraMode
  select: (id: FocusTarget) => void
  hover: (id: FocusTarget) => void
  setCameraMode: (mode: CameraMode) => void
  resetToSystemView: () => void
  surpriseMe: () => void

  // --- Scale ---
  scaleMode: ScaleMode
  customScale: CustomScaleSettings
  setScaleMode: (mode: ScaleMode) => void
  setCustomScale: (settings: Partial<CustomScaleSettings>) => void

  // --- UI toggles ---
  showLabels: boolean
  reducedMotion: boolean
  soundEnabled: boolean
  toggleLabels: () => void
  toggleReducedMotion: () => void
  toggleSound: () => void

  // --- Panels & modes ---
  isSettingsOpen: boolean
  isExploreOpen: boolean
  isWhatIfOpen: boolean
  isSpacecraftMode: boolean
  activeLessonId: string | null
  toggleSettings: () => void
  toggleExplore: () => void
  toggleWhatIf: () => void
  setSpacecraftMode: (on: boolean) => void
  setActiveLesson: (id: string | null) => void

  // --- Cinematic tour ---
  isTourActive: boolean
  isTourPaused: boolean
  tourStepIndex: number
  startTour: () => void
  exitTour: () => void
  pauseTour: () => void
  resumeTour: () => void
  setTourStepIndex: (index: number) => void

  // --- What-if scenarios ---
  whatIf: WhatIfState
  setWhatIf: (key: keyof WhatIfState, value: boolean) => void

  // --- Random facts & toasts ---
  currentFact: string | null
  toastMessage: string | null
  showRandomFact: () => void
  dismissFact: () => void
  showToast: (message: string) => void
  dismissToast: () => void

  // --- Easter eggs ---
  sunClickCount: number
  registerSunClick: () => void

  // --- Spacecraft Mode telemetry ---
  spacecraftTelemetry: { speed: number; distanceFromSun: number }
  setSpacecraftTelemetry: (telemetry: { speed: number; distanceFromSun: number }) => void
}

export const useSimulationStore = create<SimulationState>()((set, get) => ({
  simTimeDays: 0,
  speedPreset: 'normal',
  isPaused: false,
  setSpeedPreset: (preset) => set({ speedPreset: preset }),
  togglePaused: (force) => set((state) => ({ isPaused: force ?? !state.isPaused })),
  tick: (deltaSeconds) => {
    const state = get()
    if (state.isPaused) return
    const daysPerSecond = SPEED_PRESETS[state.speedPreset].daysPerSecond
    set({ simTimeDays: state.simTimeDays + deltaSeconds * daysPerSecond })
  },
  setSimTimeDays: (days) => set({ simTimeDays: days }),

  selectedId: null,
  hoveredId: null,
  cameraMode: 'system',
  select: (id) =>
    set({
      selectedId: id,
      cameraMode: id ? 'planet' : 'system',
      activeLessonId: null,
      isSettingsOpen: false,
      isExploreOpen: false,
      isWhatIfOpen: false,
    }),
  hover: (id) => set({ hoveredId: id }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  resetToSystemView: () => set({ selectedId: null, cameraMode: 'system', activeLessonId: null }),
  surpriseMe: () => {
    const ids: FocusTarget[] = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune']
    const current = get().selectedId
    let next = current
    while (next === current) {
      next = ids[Math.floor(Math.random() * ids.length)]
    }
    set({ selectedId: next, cameraMode: 'planet' })
  },

  scaleMode: 'educational',
  customScale: DEFAULT_CUSTOM_SCALE,
  setScaleMode: (mode) => set({ scaleMode: mode }),
  setCustomScale: (settings) => set((state) => ({ customScale: { ...state.customScale, ...settings } })),

  showLabels: true,
  reducedMotion: false,
  soundEnabled: false,
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  toggleReducedMotion: () => set((state) => ({ reducedMotion: !state.reducedMotion })),
  toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

  isSettingsOpen: false,
  isExploreOpen: false,
  isWhatIfOpen: false,
  isSpacecraftMode: false,
  activeLessonId: null,
  toggleSettings: () =>
    set((state) => ({
      isSettingsOpen: !state.isSettingsOpen,
      isExploreOpen: false,
      isWhatIfOpen: false,
      selectedId: state.isSettingsOpen ? state.selectedId : null,
    })),
  toggleExplore: () =>
    set((state) => ({
      isExploreOpen: !state.isExploreOpen,
      isSettingsOpen: false,
      isWhatIfOpen: false,
      selectedId: state.isExploreOpen ? state.selectedId : null,
    })),
  toggleWhatIf: () =>
    set((state) => ({
      isWhatIfOpen: !state.isWhatIfOpen,
      isSettingsOpen: false,
      isExploreOpen: false,
      selectedId: state.isWhatIfOpen ? state.selectedId : null,
    })),
  setSpacecraftMode: (on) =>
    set(
      on
        ? {
            isSpacecraftMode: true,
            cameraMode: 'follow',
            selectedId: null,
            isTourActive: false,
            isTourPaused: false,
            isExploreOpen: false,
            isWhatIfOpen: false,
            isSettingsOpen: false,
          }
        : { isSpacecraftMode: false, cameraMode: 'system' },
    ),
  setActiveLesson: (id) => set({ activeLessonId: id }),

  isTourActive: false,
  isTourPaused: false,
  tourStepIndex: 0,
  startTour: () =>
    set({
      isTourActive: true,
      isTourPaused: false,
      tourStepIndex: 0,
      selectedId: null,
      isSpacecraftMode: false,
      isExploreOpen: false,
      isWhatIfOpen: false,
      isSettingsOpen: false,
    }),
  exitTour: () => set({ isTourActive: false, isTourPaused: false, cameraMode: 'system', selectedId: null }),
  pauseTour: () => set({ isTourPaused: true }),
  resumeTour: () => set({ isTourPaused: false }),
  setTourStepIndex: (index) => set({ tourStepIndex: index }),

  whatIf: DEFAULT_WHAT_IF,
  setWhatIf: (key, value) => set((state) => ({ whatIf: { ...state.whatIf, [key]: value } })),

  currentFact: null,
  toastMessage: null,
  showRandomFact: () => set((state) => ({ currentFact: getRandomFact(state.currentFact ?? undefined) })),
  dismissFact: () => set({ currentFact: null }),
  showToast: (message) => set({ toastMessage: message }),
  dismissToast: () => set({ toastMessage: null }),

  sunClickCount: 0,
  registerSunClick: () => set((state) => ({ sunClickCount: state.sunClickCount + 1 })),

  spacecraftTelemetry: { speed: 0, distanceFromSun: 0 },
  setSpacecraftTelemetry: (telemetry) => set({ spacecraftTelemetry: telemetry }),
}))
