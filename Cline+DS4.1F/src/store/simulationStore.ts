import { create } from 'zustand'
import type {
  BodyId,
  CameraMode,
  CameraRequest,
  CustomScale,
  FocusTargetId,
  LessonId,
  OrbitModel,
  QualityLevel,
  ScaleMode,
  WhatIfId,
} from '../types'
import { DEFAULT_CUSTOM_SCALE } from '../utils/scale'
import { clampSpacecraftSize, DEFAULT_SPACECRAFT_SIZE } from '../utils/spacecraftSize'
import { pickFact } from '../data/facts'
import { findClosestSpeed, DEFAULT_SPEED_INDEX, TIME_SPEEDS } from '../data/missions'
import { audio } from '../utils/audio'
import { clock } from '../utils/simulationClock'
import { translate } from '../i18n'
import type { Language } from '../i18n'

export type ToastTone = 'info' | 'fun' | 'alert'

/**
 * A batch of already-validated settings, applied once at startup from the JSONC
 * configuration file (see `src/config/appConfig.ts`). Every field is optional:
 * anything left out keeps its current value.
 */
export interface SettingsPatch {
  language?: Language
  earthAtmosphereOpacity?: number
  earthCloudCoverage?: number
  earthCloudOpacity?: number
  earthCloudDynamics?: number
  earthTerrainRelief?: number
  leftPanelOpacity?: number
  rightPanelOpacity?: number
  /** The spacecraft's size level, 1…100 (see `utils/spacecraftSize`). */
  spacecraftSize?: number
}

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
  /** Mission Control's own "Spacecraft controls" popup. */
  spacecraftHelpOpen: boolean
  /** The left (controls) and right (information) side panels fold away independently. */
  leftPanelCollapsed: boolean
  rightPanelCollapsed: boolean
  /** 0…1 opacity of each side panel's body (its header controls never fade). */
  leftPanelOpacity: number
  rightPanelOpacity: number
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
  /**
   * When true, following the spacecraft keeps the view behind its nose instead
   * of holding a fixed world-space offset. Only affects the ship, never planets.
   */
  chaseCamera: boolean
  /**
   * When true (and the chase camera is on), engaging the chase flies the camera
   * in to a close, framed distance once, then leaves the zoom to the user.
   */
  chaseAutoFrame: boolean

  /* Layers */
  showOrbits: boolean
  showLabels: boolean
  showAsteroidBelt: boolean
  showNebula: boolean
  showOrbitFlow: boolean
  /**
   * How strongly Earth's atmosphere is drawn: 0 = invisible (bare surface),
   * 1 = full strength. Only Earth has this control, so no other body reads it.
   */
  earthAtmosphereOpacity: number
  /**
   * How solid Earth's cloud deck is: 0 = no clouds (fully transparent), 1 = the
   * full cloud layer. Matches the atmosphere slider's direction, so 0% always
   * means “none” on both. Only Earth has clouds, so only Earth reads it.
   */
  earthCloudOpacity: number
  /**
   * How lively the cloud *shapes* are: 0 = frozen mid-drift, 1 = the full swirl
   * and morph. The deck's faster-than-surface rotation is always on, so it keeps
   * slipping over the ground even at 0. Only Earth has clouds.
   */
  earthCloudDynamics: number
  /**
   * How much of the sky the cloud deck fills: 0 = a few scattered wisps, 1 = a
   * near-continuous sheet. Only Earth has clouds, so only Earth reads it.
   */
  earthCloudCoverage: number
  /**
   * How much of Earth's real elevation model is applied: 0 = a smooth globe,
   * 1 = the full vertical exaggeration. Earth is the only body with a terrain
   * model, so no other body reads it. See `TerrainVisuals` for the exaggeration
   * it scales.
   */
  earthTerrainRelief: number

  /* Scale */
  scaleMode: ScaleMode
  customScale: CustomScale

  /* Orbits */
  orbitModel: OrbitModel

  /* Modes */
  cinematic: CinematicState
  ui: UiState
  whatIfId: WhatIfId | null

  /* Mission Control */
  missionActive: boolean
  destinationId: BodyId | null
  autopilot: boolean
  /** The ship's size level, 1…100. Level 100 is the model's authored size. */
  spacecraftSize: number

  /* Settings */
  soundEnabled: boolean
  volume: number
  reducedMotion: boolean
  quality: QualityLevel
  /** The interface language. See `src/i18n`. */
  language: Language

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
  setChaseCamera: (enabled: boolean) => void
  setChaseAutoFrame: (enabled: boolean) => void

  toggleOrbits: () => void
  toggleLabels: () => void
  toggleAsteroidBelt: () => void
  toggleNebula: () => void
  setShowOrbitFlow: (visible: boolean) => void
  setEarthAtmosphereOpacity: (value: number) => void
  setEarthCloudOpacity: (value: number) => void
  setEarthCloudDynamics: (value: number) => void
  setEarthCloudCoverage: (value: number) => void
  setEarthTerrainRelief: (value: number) => void

  setScaleMode: (mode: ScaleMode) => void
  setCustomScale: (patch: Partial<CustomScale>) => void

  setOrbitModel: (model: OrbitModel) => void
  toggleOrbitModel: () => void

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
  setLanguage: (language: Language) => void
  applySettings: (patch: SettingsPatch) => void

  teachMeSomething: () => void
  closeFactCard: () => void
  registerSunClick: () => void
  registerDiscovery: (id: string) => void
  showToast: (message: string, tone?: ToastTone) => void
  clearToast: () => void
  dismissWelcome: () => void
  toggleHelp: (open?: boolean) => void
  /** Opens or closes Mission Control's "Spacecraft controls" popup. */
  toggleSpacecraftHelp: (open?: boolean) => void
  openSettings: (open?: boolean) => void
  toggleLeftPanel: () => void
  toggleRightPanel: () => void
  setLeftPanelOpacity: (value: number) => void
  setRightPanelOpacity: (value: number) => void

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

/** Keeps a batch setting inside 0…1, falling back when it is missing or unusable. */
const clamp01 = (value: number | undefined, fallback: number): number =>
  value === undefined || !Number.isFinite(value) ? fallback : Math.max(0, Math.min(1, value))

const initialState: SimulationState = {
  paused: false,
  speedIndex: DEFAULT_SPEED_INDEX,
  direction: 1,

  selectedId: null,
  hoveredId: null,

  cameraMode: 'system',
  followTargetId: null,
  cameraRequest: null,
  chaseCamera: false,
  chaseAutoFrame: true,

  showOrbits: true,
  showLabels: true,
  showAsteroidBelt: true,
  showNebula: true,
  showOrbitFlow: false,
  // The slider is a 0…1 haze level, mapped onto the shader's opacity range by
  // `atmosphereOpacityFromSlider`. 0.45 is a gentle rim that still lets the whole
  // surface read, with plenty of range to thin it further or fill it out.
  earthAtmosphereOpacity: 0.45,
  // Half the full cloud deck by default, so the continents and oceans read
  // clearly through the clouds instead of being hidden behind them.
  earthCloudOpacity: 0.5,
  // The full swirl-and-morph is a touch brisk for a permanent default, so start
  // at half; the slider goes up to the original liveliness and down to a frozen
  // (but still drifting) deck.
  earthCloudDynamics: 0.5,
  // Half the sky filled by default: a balanced mix of clear and cloudy regions.
  earthCloudCoverage: 0.5,
  // Half the maximum vertical exaggeration — the default a relief globe would
  // ship with: mountains read clearly from orbit without turning Earth into a
  // pincushion when the camera comes close.
  earthTerrainRelief: 0.5,

  scaleMode: 'distances',
  customScale: DEFAULT_CUSTOM_SCALE,

  orbitModel: 'realistic',

  cinematic: { active: false, paused: false, stageIndex: 0 },
  ui: {
    settingsOpen: false,
    educationOpen: false,
    lessonId: null,
    whatIfOpen: false,
    factCardOpen: false,
    welcomeVisible: true,
    helpOpen: false,
    spacecraftHelpOpen: false,
    leftPanelCollapsed: false,
    rightPanelCollapsed: false,
    leftPanelOpacity: 1,
    rightPanelOpacity: 1,
  },
  whatIfId: null,

  missionActive: false,
  destinationId: 'earth',
  autopilot: false,
  spacecraftSize: DEFAULT_SPACECRAFT_SIZE,

  soundEnabled: false,
  volume: 0.4,
  reducedMotion: prefersReducedMotion(),
  quality: 'medium',
  language: 'en',

  factIndex: -1,
  discoveries: [],
  flareId: 0,
  sunClickCount: 0,
  toast: null,

  webglSupported: null,
  assetsProgress: 0,
  assetsLabel: 'loading.preparing',
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
    set({ direction: 1, speedIndex: DEFAULT_SPEED_INDEX })
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

  // Turning the chase camera on always re-engages the ship while a mission is
  // active. The switch is the reliable way back to tracking after any camera
  // change — "return to the full Solar System view" (R) or focusing another
  // body — because those leave the camera pointed somewhere else while the flag
  // stays on. `followTargetId` cannot be trusted here: focusing a body with a
  // non-follow mode keeps the previous target, so it does not mean "following".
  setChaseCamera: (enabled) =>
    set((state) => {
      if (!enabled) return { chaseCamera: false }
      if (!state.missionActive) return { chaseCamera: true }
      return { chaseCamera: true, cameraMode: 'follow', followTargetId: 'spacecraft' }
    }),

  setChaseAutoFrame: (enabled) => set({ chaseAutoFrame: enabled }),

  toggleOrbits: () => set((state) => ({ showOrbits: !state.showOrbits })),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  toggleAsteroidBelt: () => set((state) => ({ showAsteroidBelt: !state.showAsteroidBelt })),
  toggleNebula: () => set((state) => ({ showNebula: !state.showNebula })),
  setShowOrbitFlow: (visible) => set({ showOrbitFlow: visible }),

  setEarthAtmosphereOpacity: (value) =>
    set({ earthAtmosphereOpacity: Math.max(0, Math.min(1, value)) }),

  setEarthCloudOpacity: (value) =>
    set({ earthCloudOpacity: Math.max(0, Math.min(1, value)) }),

  setEarthCloudDynamics: (value) =>
    set({ earthCloudDynamics: Math.max(0, Math.min(1, value)) }),

  setEarthCloudCoverage: (value) =>
    set({ earthCloudCoverage: Math.max(0, Math.min(1, value)) }),

  setEarthTerrainRelief: (value) =>
    set({ earthTerrainRelief: Math.max(0, Math.min(1, value)) }),

  setScaleMode: (mode) => {
    audio.play('click')
    set({ scaleMode: mode })
  },

  setCustomScale: (patch) => set((state) => ({ customScale: { ...state.customScale, ...patch } })),

  setOrbitModel: (model) => {
    audio.play('click')
    set({ orbitModel: model })
  },

  toggleOrbitModel: () => {
    audio.play('click')
    set((state) => ({ orbitModel: state.orbitModel === 'realistic' ? 'educational' : 'realistic' }))
  },

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
        spacecraftHelpOpen: false,
        leftPanelCollapsed: false,
        rightPanelCollapsed: false,
        leftPanelOpacity: 1,
        rightPanelOpacity: 1,
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
      // A mission starts on autopilot (see Spacecraft), so the switch opens ON.
      autopilot: true,
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
      ui: { ...state.ui, welcomeVisible: false, factCardOpen: false, spacecraftHelpOpen: false },
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
        get().showToast(translate(get().language, 'toast.noAudio'), 'alert')
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

  setLanguage: (language) => set({ language }),

  applySettings: (patch) =>
    set((state) => ({
      language: patch.language ?? state.language,
      earthAtmosphereOpacity: clamp01(patch.earthAtmosphereOpacity, state.earthAtmosphereOpacity),
      earthCloudCoverage: clamp01(patch.earthCloudCoverage, state.earthCloudCoverage),
      earthCloudOpacity: clamp01(patch.earthCloudOpacity, state.earthCloudOpacity),
      earthCloudDynamics: clamp01(patch.earthCloudDynamics, state.earthCloudDynamics),
      earthTerrainRelief: clamp01(patch.earthTerrainRelief, state.earthTerrainRelief),
      spacecraftSize: clampSpacecraftSize(patch.spacecraftSize ?? state.spacecraftSize),
      ui: {
        ...state.ui,
        leftPanelOpacity: clamp01(patch.leftPanelOpacity, state.ui.leftPanelOpacity),
        rightPanelOpacity: clamp01(patch.rightPanelOpacity, state.ui.rightPanelOpacity),
      },
    })),

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
      get().showToast(translate(get().language, 'toast.solarFlare'), 'fun')
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

  toggleSpacecraftHelp: (open) =>
    set((state) => ({ ui: { ...state.ui, spacecraftHelpOpen: open ?? !state.ui.spacecraftHelpOpen } })),

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

  toggleLeftPanel: () =>
    set((state) => ({ ui: { ...state.ui, leftPanelCollapsed: !state.ui.leftPanelCollapsed } })),

  toggleRightPanel: () =>
    set((state) => ({ ui: { ...state.ui, rightPanelCollapsed: !state.ui.rightPanelCollapsed } })),

  setLeftPanelOpacity: (value) =>
    set((state) => ({
      ui: { ...state.ui, leftPanelOpacity: Math.max(0, Math.min(1, value)) },
    })),

  setRightPanelOpacity: (value) =>
    set((state) => ({
      ui: { ...state.ui, rightPanelOpacity: Math.max(0, Math.min(1, value)) },
    })),

  setWebglSupported: (webglSupported) => set({ webglSupported }),
  setAssetsProgress: (assetsProgress, assetsLabel) => set({ assetsProgress, assetsLabel }),
  setReady: (ready) => set({ ready }),
}))

/** Current simulation speed in days per second, including direction. */
export function simulationDaysPerSecond(state: SimulationState): number {
  const speed = TIME_SPEEDS[state.speedIndex] ?? TIME_SPEEDS[DEFAULT_SPEED_INDEX]
  return speed.daysPerSecond * state.direction
}
