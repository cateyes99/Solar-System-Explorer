import { create } from 'zustand'
import { simClock } from './clock'
import { DEFAULT_SCALE } from '../utils/scale'
import type { CameraMode, LessonId, OverlayPanel, ScaleSettings, WhatIfId } from '../types'

/** Simulation speed presets, expressed in simulated days per real second. */
export const SPEED_PRESETS = [
  { label: 'Slow', daysPerSecond: 0.5, blurb: '1 second = 12 hours' },
  { label: 'Gentle', daysPerSecond: 4, blurb: '1 second = 4 days' },
  { label: 'Normal', daysPerSecond: 20, blurb: '1 second = 20 days' },
  { label: 'Fast', daysPerSecond: 90, blurb: '1 second = 3 months' },
  { label: 'Very Fast', daysPerSecond: 365, blurb: '1 second = 1 year' },
  { label: 'Ludicrous', daysPerSecond: 2_000, blurb: '1 second = 5.5 years' },
] as const

export const DEFAULT_SPEED_INDEX = 2

export type SceneMode = 'system' | 'lesson' | 'whatif'

export interface ShipTelemetry {
  speedUnitsPerSecond: number
  distanceAu: number
  targetName: string
  arrivalProgress: number
  arrived: boolean
}

export interface AppState {
  /* ---------------- simulation time ---------------- */
  running: boolean
  speedIndex: number
  /** Throttled snapshot of the simulated clock, for display only. */
  displayedMs: number

  /* ---------------- selection & camera ---------------- */
  hoveredId: string | null
  hoveredPointer: { x: number; y: number }
  selectedId: string | null
  focusedId: string | null
  cameraMode: CameraMode
  /**
   * Lesson scenes publish their own framing target. While set it wins over
   * `focusedId`, which lets a lesson aim the camera without hijacking the
   * user's planet selection.
   */
  cameraOverride: { id: string; distance: number } | null

  /* ---------------- interface ---------------- */
  panel: OverlayPanel
  labelsVisible: boolean
  orbitsVisible: boolean
  moonsVisible: boolean
  soundEnabled: boolean
  reducedMotion: boolean
  helpVisible: boolean
  introVisible: boolean
  mobilePanelOpen: boolean
  scale: ScaleSettings
  quality: 'high' | 'balanced' | 'performance'
  bloom: boolean

  /* ---------------- modes ---------------- */
  sceneMode: SceneMode
  lessonId: LessonId | null
  whatIfId: WhatIfId | null

  /* ---------------- cinematic tour ---------------- */
  tourActive: boolean
  tourStage: number
  tourPaused: boolean

  /* ---------------- spacecraft ---------------- */
  shipActive: boolean
  shipTarget: string | null
  shipAutopilot: boolean
  shipTelemetry: ShipTelemetry

  /* ---------------- teach me something ---------------- */
  factIndex: number
  factVisible: boolean

  /* ---------------- easter eggs ---------------- */
  sunClicks: number
  flarePulse: number
  cometFound: boolean
  greetedEarth: boolean
  tooltipVersion: number

  /* ---------------- actions ---------------- */
  toggleRunning(): void
  setRunning(running: boolean): void
  setSpeedIndex(index: number): void
  stepDays(days: number): void
  setDisplayedMs(ms: number): void

  setHovered(id: string | null, pointer?: { x: number; y: number }): void
  select(id: string | null): void
  focus(id: string | null, mode?: CameraMode): void
  viewSystem(): void
  setCameraMode(mode: CameraMode): void
  setCameraOverride(override: { id: string; distance: number } | null): void

  setPanel(panel: OverlayPanel): void
  togglePanel(panel: Exclude<OverlayPanel, null>): void
  toggleLabels(): void
  toggleOrbits(): void
  toggleMoons(): void
  setSoundEnabled(enabled: boolean): void
  setReducedMotion(reduced: boolean): void
  setHelpVisible(visible: boolean): void
  dismissIntro(): void
  setMobilePanelOpen(open: boolean): void
  setScale(scale: ScaleSettings): void
  setQuality(quality: AppState['quality']): void
  setBloom(enabled: boolean): void

  openLesson(id: LessonId): void
  closeLesson(): void
  openWhatIf(id: WhatIfId): void
  closeWhatIf(): void

  startTour(): void
  setTourStage(stage: number): void
  toggleTourPaused(): void
  exitTour(): void

  setShipActive(active: boolean): void
  setShipTarget(target: string | null): void
  setShipAutopilot(on: boolean): void
  setShipTelemetry(telemetry: ShipTelemetry): void

  nextFact(): void
  toggleFact(): void

  clickSun(): void
  triggerFlare(): void
  findComet(): void
  greetEarth(): void
  bumpTooltip(): void
}

function prefersReducedMotion(): boolean {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches
}

function readStored<T>(key: string, fallback: T): T {
  try {
    const raw = window.localStorage.getItem(key)
    return raw === null ? fallback : (JSON.parse(raw) as T)
  } catch {
    return fallback
  }
}

function writeStored(key: string, value: unknown): void {
  try {
    window.localStorage.setItem(key, JSON.stringify(value))
  } catch {
    /* storage may be unavailable in private mode — settings simply won't persist */
  }
}

simClock.daysPerSecond = SPEED_PRESETS[DEFAULT_SPEED_INDEX].daysPerSecond

export const useAppStore = create<AppState>((set, get) => ({
  running: true,
  speedIndex: DEFAULT_SPEED_INDEX,
  displayedMs: simClock.simulatedMs,

  hoveredId: null,
  hoveredPointer: { x: 0, y: 0 },
  selectedId: null,
  focusedId: null,
  cameraMode: 'free',
  cameraOverride: null,

  panel: null,
  labelsVisible: true,
  orbitsVisible: true,
  moonsVisible: true,
  soundEnabled: false,
  reducedMotion: readStored('sse:reducedMotion', prefersReducedMotion()),
  helpVisible: false,
  introVisible: true,
  mobilePanelOpen: false,
  scale: readStored('sse:scale', DEFAULT_SCALE),
  quality: readStored('sse:quality', 'balanced'),
  bloom: readStored('sse:bloom', true),

  sceneMode: 'system',
  lessonId: null,
  whatIfId: null,

  tourActive: false,
  tourStage: 0,
  tourPaused: false,

  shipActive: false,
  shipTarget: null,
  shipAutopilot: false,
  shipTelemetry: { speedUnitsPerSecond: 0, distanceAu: 0, targetName: '—', arrivalProgress: 0, arrived: false },

  factIndex: 0,
  factVisible: false,

  sunClicks: 0,
  flarePulse: 0,
  cometFound: false,
  greetedEarth: false,
  tooltipVersion: 0,

  toggleRunning: () => {
    const running = !get().running
    simClock.running = running
    set({ running })
  },
  setRunning: (running) => {
    simClock.running = running
    set({ running })
  },
  setSpeedIndex: (index) => {
    const clamped = Math.max(0, Math.min(SPEED_PRESETS.length - 1, index))
    simClock.daysPerSecond = SPEED_PRESETS[clamped].daysPerSecond
    simClock.running = true
    set({ speedIndex: clamped, running: true })
  },
  stepDays: (days) => {
    simClock.advanceDays(days)
    set({ displayedMs: simClock.simulatedMs })
  },
  setDisplayedMs: (ms) => set({ displayedMs: ms }),

  setHovered: (id, pointer) => {
    const current = get()
    if (id === null) {
      if (current.hoveredId !== null) set({ hoveredId: null })
      return
    }
    set({ hoveredId: id, hoveredPointer: pointer ?? current.hoveredPointer })
  },
  select: (id) =>
    set((state) => ({
      selectedId: id,
      panel: id ? 'planet' : null,
      mobilePanelOpen: id ? state.mobilePanelOpen : false,
      factVisible: false,
    })),
  focus: (id, mode) =>
    set({
      focusedId: id,
      cameraMode: mode ?? (id ? 'view-planet' : 'free'),
      selectedId: id ?? get().selectedId,
      panel: id ? get().panel : null,
    }),
  viewSystem: () => set({ focusedId: null, cameraMode: 'free', selectedId: null, panel: null, mobilePanelOpen: false }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setCameraOverride: (cameraOverride) => set({ cameraOverride }),

  setPanel: (panel) =>
    set((state) => {
      // Leaving a lesson or a scenario must also return the scene to the orrery,
      // otherwise the 3D layer would stay swapped out behind a closed panel.
      const leavingLesson = state.panel === 'learn' && panel !== 'learn'
      const leavingWhatIf = state.panel === 'whatif' && panel !== 'whatif'
      return {
        panel,
        mobilePanelOpen: panel ? state.mobilePanelOpen : false,
        sceneMode: panel === 'learn' ? 'lesson' : panel === 'whatif' ? 'whatif' : 'system',
        lessonId: leavingLesson ? null : state.lessonId,
        whatIfId: leavingWhatIf ? null : state.whatIfId,
      }
    }),
  togglePanel: (panel) => set((state) => ({ panel: state.panel === panel ? null : panel })),
  toggleLabels: () => set((state) => ({ labelsVisible: !state.labelsVisible })),
  toggleOrbits: () => set((state) => ({ orbitsVisible: !state.orbitsVisible })),
  toggleMoons: () => set((state) => ({ moonsVisible: !state.moonsVisible })),
  setSoundEnabled: (enabled) => {
    writeStored('sse:sound', enabled)
    set({ soundEnabled: enabled })
  },
  setReducedMotion: (reduced) => {
    writeStored('sse:reducedMotion', reduced)
    set({ reducedMotion: reduced })
  },
  setHelpVisible: (visible) => set({ helpVisible: visible }),
  dismissIntro: () => set({ introVisible: false }),
  setMobilePanelOpen: (open) => set({ mobilePanelOpen: open }),
  setScale: (scale) => {
    writeStored('sse:scale', scale)
    set({ scale })
  },
  setQuality: (quality) => {
    writeStored('sse:quality', quality)
    set({ quality })
  },
  setBloom: (enabled) => {
    writeStored('sse:bloom', enabled)
    set({ bloom: enabled })
  },

  openLesson: (id) => set({ sceneMode: 'lesson', lessonId: id, whatIfId: null, panel: 'learn', tourActive: false }),
  closeLesson: () => set({ sceneMode: 'system', lessonId: null, panel: null }),
  openWhatIf: (id) => set({ sceneMode: 'whatif', whatIfId: id, lessonId: null, panel: 'whatif', tourActive: false }),
  closeWhatIf: () => set({ sceneMode: 'system', whatIfId: null, panel: null }),

  startTour: () =>
    set({
      tourActive: true,
      tourStage: 0,
      tourPaused: false,
      panel: null,
      lessonId: null,
      whatIfId: null,
      sceneMode: 'system',
      factVisible: false,
      focusedId: null,
      cameraMode: 'free',
      selectedId: null,
    }),
  setTourStage: (stage) => set({ tourStage: stage }),
  toggleTourPaused: () => set((state) => ({ tourPaused: !state.tourPaused })),
  exitTour: () => set({ tourActive: false, tourPaused: false, focusedId: null, cameraMode: 'free' }),

  setShipActive: (active) =>
    set({ shipActive: active, shipAutopilot: active, shipTarget: active ? 'mars' : null, tourActive: false }),
  setShipTarget: (target) => set({ shipTarget: target, shipAutopilot: target !== null }),
  setShipAutopilot: (on) => set({ shipAutopilot: on }),
  setShipTelemetry: (shipTelemetry) => set({ shipTelemetry }),

  nextFact: () => set((state) => ({ factIndex: (state.factIndex + 1) % 1000, factVisible: true })),
  toggleFact: () => set((state) => ({ factVisible: !state.factVisible })),

  clickSun: () =>
    set((state) => {
      const sunClicks = state.sunClicks + 1
      return { sunClicks, flarePulse: sunClicks, selectedId: 'sun' }
    }),
  triggerFlare: () => set((state) => ({ flarePulse: state.flarePulse + 1 })),
  findComet: () => set({ cometFound: true }),
  greetEarth: () => set({ greetedEarth: true }),
  bumpTooltip: () => set((state) => ({ tooltipVersion: state.tooltipVersion + 1 })),
}))