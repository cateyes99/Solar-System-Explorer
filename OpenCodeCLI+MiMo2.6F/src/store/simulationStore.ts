import { create } from 'zustand'
import type { CustomScale, ScaleMode } from '../utils/scale'
import { DEFAULT_CUSTOM_SCALE } from '../utils/scale'

export type CameraMode = 'system' | 'focus' | 'follow' | 'spacecraft' | 'tour'
export type SpeedPreset = 'paused' | 'slow' | 'normal' | 'fast' | 'veryFast' | 'epic'

export interface SpeedOption {
  id: SpeedPreset
  label: string
  /** Simulated days per real second */
  daysPerSecond: number
}

export const SPEED_OPTIONS: SpeedOption[] = [
  { id: 'paused', label: 'Pause', daysPerSecond: 0 },
  { id: 'slow', label: 'Slow', daysPerSecond: 0.05 },
  { id: 'normal', label: 'Normal', daysPerSecond: 1 },
  { id: 'fast', label: 'Fast', daysPerSecond: 30 },
  { id: 'veryFast', label: 'Very Fast', daysPerSecond: 365 },
  { id: 'epic', label: 'Epic', daysPerSecond: 3650 },
]

export interface WhatIfFlags {
  secondMoon: boolean
  earthAsJupiter: boolean
  sunGone: boolean
  earthStopped: boolean
}

export interface TourState {
  active: boolean
  paused: boolean
  stageIndex: number
}

interface SimulationState {
  // ---- core simulation ----
  speedPreset: SpeedPreset
  paused: boolean
  /** Throttled simulated date for the timeline (ms since epoch) */
  simDateMs: number
  speedLabel: string

  // ---- selection & camera ----
  selectedId: string | null
  hoveredId: string | null
  cameraMode: CameraMode
  /** Id the camera is focused on / following */
  cameraTargetId: string | null
  /** Bumped to force a camera animation to the home view */
  homeRequest: number

  // ---- scale ----
  scaleMode: ScaleMode
  customScale: CustomScale

  // ---- display toggles ----
  showLabels: boolean
  showOrbits: boolean
  showAsteroids: boolean
  quality: 'auto' | 'high' | 'low'
  reducedMotion: boolean

  // ---- panels ----
  panel: 'none' | 'learn' | 'whatif' | 'settings' | 'mission'
  activeLesson: string
  soundOn: boolean
  factCardIndex: number | null
  welcomeVisible: boolean
  shortcutsVisible: boolean
  toast: { id: number; message: string; tone: 'info' | 'fun' } | null

  // ---- modes ----
  tour: TourState
  spacecraftActive: boolean
  whatIf: WhatIfFlags
  sunFlareLevel: number
  bootProgress: number
  bootComplete: boolean

  // ---- actions ----
  setSpeed: (preset: SpeedPreset) => void
  togglePause: () => void
  setSimDate: (ms: number) => void
  setSpeedLabel: (label: string) => void
  select: (id: string | null) => void
  setHovered: (id: string | null) => void
  focusBody: (id: string) => void
  followBody: (id: string) => void
  viewSystem: () => void
  setScaleMode: (mode: ScaleMode) => void
  setCustomScale: (scale: CustomScale) => void
  toggleLabels: () => void
  toggleOrbits: () => void
  toggleSound: () => void
  toggleReducedMotion: () => void
  setQuality: (q: 'auto' | 'high' | 'low') => void
  openPanel: (panel: SimulationState['panel'], lesson?: string) => void
  closePanel: () => void
  setActiveLesson: (id: string) => void
  showFact: (index: number | null) => void
  dismissWelcome: () => void
  toggleShortcuts: () => void
  showToast: (message: string, tone?: 'info' | 'fun') => void
  startTour: () => void
  stopTour: () => void
  setTourStage: (index: number) => void
  toggleTourPause: () => void
  skipTourStage: () => void
  setSpacecraftActive: (active: boolean) => void
  setWhatIf: (flag: keyof WhatIfFlags, value: boolean) => void
  triggerSunFlare: () => void
  setBootProgress: (p: number) => void
  finishBoot: () => void
}

let toastId = 0

export const useSimStore = create<SimulationState>()((set, get) => ({
  speedPreset: 'normal',
  paused: false,
  simDateMs: Date.now(),
  speedLabel: '1 day / second',

  selectedId: null,
  hoveredId: null,
  cameraMode: 'system',
  cameraTargetId: null,
  homeRequest: 0,

  scaleMode: 'educational',
  customScale: DEFAULT_CUSTOM_SCALE,

  showLabels: true,
  showOrbits: true,
  showAsteroids: true,
  quality: 'auto',
  reducedMotion: false,

  panel: 'none',
  activeLesson: 'sun',
  soundOn: false,
  factCardIndex: null,
  welcomeVisible: true,
  shortcutsVisible: false,
  toast: null,

  tour: { active: false, paused: false, stageIndex: 0 },
  spacecraftActive: false,
  whatIf: { secondMoon: false, earthAsJupiter: false, sunGone: false, earthStopped: false },
  sunFlareLevel: 0,
  bootProgress: 0,
  bootComplete: false,

  setSpeed: (preset) => {
    const option = SPEED_OPTIONS.find((o) => o.id === preset) ?? SPEED_OPTIONS[2]
    set({
      speedPreset: option.id,
      paused: option.daysPerSecond === 0,
      speedLabel:
        option.daysPerSecond === 0
          ? 'Paused'
          : option.daysPerSecond < 1
            ? `${(1 / option.daysPerSecond).toFixed(0)} seconds = 1 day`
            : option.daysPerSecond >= 365 && option.daysPerSecond % 365 === 0
              ? `${option.daysPerSecond}× · ${option.daysPerSecond / 365} year(s) per second`
              : `${option.daysPerSecond}× · ${option.daysPerSecond} day(s) per second`,
    })
  },
  togglePause: () => {
    const { paused, speedPreset } = get()
    if (paused) {
      const restored = speedPreset === 'paused' ? 'normal' : speedPreset
      get().setSpeed(restored)
      set({ paused: false })
    } else {
      set({ paused: true, speedPreset: 'paused' })
    }
  },
  setSimDate: (ms) => set({ simDateMs: ms }),
  setSpeedLabel: (label) => set({ speedLabel: label }),

  select: (id) => set({ selectedId: id }),
  setHovered: (id) => set((s) => (s.hoveredId === id ? s : { hoveredId: id })),
  focusBody: (id) =>
    set({ selectedId: id, cameraMode: 'focus', cameraTargetId: id, spacecraftActive: false }),
  followBody: (id) =>
    set({ selectedId: id, cameraMode: 'follow', cameraTargetId: id, spacecraftActive: false }),
  viewSystem: () =>
    set((s) => ({
      cameraMode: 'system',
      cameraTargetId: null,
      homeRequest: s.homeRequest + 1,
      spacecraftActive: false,
      selectedId: null,
    })),

  setScaleMode: (mode) => set({ scaleMode: mode }),
  setCustomScale: (scale) => set({ customScale: scale }),

  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  toggleOrbits: () => set((s) => ({ showOrbits: !s.showOrbits })),
  toggleSound: () => set((s) => ({ soundOn: !s.soundOn })),
  toggleReducedMotion: () => set((s) => ({ reducedMotion: !s.reducedMotion })),
  setQuality: (quality) => set({ quality }),

  openPanel: (panel, lesson) =>
    set((s) => ({
      panel,
      activeLesson: lesson ?? (panel === 'learn' ? s.activeLesson : s.activeLesson),
    })),
  closePanel: () => set({ panel: 'none' }),
  setActiveLesson: (id) => set({ activeLesson: id }),

  showFact: (index) => set({ factCardIndex: index }),
  dismissWelcome: () => set({ welcomeVisible: false }),
  toggleShortcuts: () => set((s) => ({ shortcutsVisible: !s.shortcutsVisible })),

  showToast: (message, tone = 'info') => set({ toast: { id: ++toastId, message, tone } }),

  startTour: () =>
    set((s) => ({
      tour: { active: true, paused: false, stageIndex: 0 },
      cameraMode: 'tour',
      selectedId: null,
      panel: 'none',
      spacecraftActive: false,
      reducedMotion: s.reducedMotion,
    })),
  stopTour: () => set({ tour: { active: false, paused: false, stageIndex: 0 }, cameraMode: 'system' }),
  setTourStage: (index) => set((s) => ({ tour: { ...s.tour, stageIndex: index } })),
  toggleTourPause: () => set((s) => ({ tour: { ...s.tour, paused: !s.tour.paused } })),
  skipTourStage: () => set((s) => ({ tour: { ...s.tour, stageIndex: s.tour.stageIndex + 1 } })),

  setSpacecraftActive: (active) =>
    set((s) => ({
      spacecraftActive: active,
      cameraMode: active ? 'spacecraft' : s.cameraMode === 'spacecraft' ? 'system' : s.cameraMode,
      panel: active ? 'mission' : s.panel === 'mission' ? 'none' : s.panel,
      selectedId: active ? null : s.selectedId,
    })),

  setWhatIf: (flag, value) => set((s) => ({ whatIf: { ...s.whatIf, [flag]: value } })),

  triggerSunFlare: () => set({ sunFlareLevel: 1 }),
  setBootProgress: (bootProgress) => set({ bootProgress }),
  finishBoot: () => set({ bootProgress: 1, bootComplete: true }),
}))

/** Selector hooks kept tiny so panels re-render only on what they use. */
export const useSelectedId = () => useSimStore((s) => s.selectedId)
export const useHoveredId = () => useSimStore((s) => s.hoveredId)
