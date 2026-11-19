import { create } from 'zustand'
import type {
  BodyId,
  CameraMode,
  ModalId,
  Quality,
  ScaleMode,
  ToastMessage,
  WhatIfScenario,
} from '../types'

interface SimulationState {
  selectedBody: BodyId | null
  hoveredBody: BodyId | null
  cameraMode: CameraMode
  cameraRequest: number
  speedIndex: number
  isPlaying: boolean
  simulationDays: number
  scaleMode: ScaleMode
  customSize: number
  customDistance: number
  showLabels: boolean
  showOrbits: boolean
  reducedMotion: boolean
  soundEnabled: boolean
  quality: Quality
  activeModal: ModalId
  missionActive: boolean
  whatIf: WhatIfScenario | null
  tourActive: boolean
  tourPaused: boolean
  tourStep: number
  factIndex: number
  toast: ToastMessage | null
  sunClicks: number
  sceneReady: boolean
  selectBody: (id: BodyId | null, focus?: boolean) => void
  setHoveredBody: (id: BodyId | null) => void
  setCameraMode: (mode: CameraMode) => void
  viewSystem: () => void
  setSpeedIndex: (index: number) => void
  togglePlaying: () => void
  publishSimulationDays: (days: number) => void
  setScaleMode: (mode: ScaleMode) => void
  setCustomScale: (size: number, distance: number) => void
  toggleLabels: () => void
  toggleOrbits: () => void
  setReducedMotion: (enabled: boolean) => void
  setSoundEnabled: (enabled: boolean) => void
  setQuality: (quality: Quality) => void
  setActiveModal: (modal: ModalId) => void
  setMissionActive: (active: boolean) => void
  setWhatIf: (scenario: WhatIfScenario | null) => void
  startTour: () => void
  setTourPaused: (paused: boolean) => void
  setTourStep: (step: number) => void
  exitTour: () => void
  nextFact: () => void
  showToast: (text: string, icon?: ToastMessage['icon']) => void
  clearToast: () => void
  registerSunClick: () => number
  setSceneReady: (ready: boolean) => void
}

const prefersReducedMotion = typeof window !== 'undefined'
  && window.matchMedia('(prefers-reduced-motion: reduce)').matches

export const useSimulationStore = create<SimulationState>((set, get) => ({
  selectedBody: null,
  hoveredBody: null,
  cameraMode: 'system',
  cameraRequest: 0,
  speedIndex: 1,
  isPlaying: true,
  simulationDays: 0,
  scaleMode: 'educational',
  customSize: 1,
  customDistance: 1,
  showLabels: true,
  showOrbits: true,
  reducedMotion: prefersReducedMotion,
  soundEnabled: false,
  quality: 'auto',
  activeModal: null,
  missionActive: false,
  whatIf: null,
  tourActive: false,
  tourPaused: false,
  tourStep: 0,
  factIndex: 0,
  toast: null,
  sunClicks: 0,
  sceneReady: false,
  selectBody: (id, focus = false) => set((state) => ({
    selectedBody: id,
    activeModal: null,
    cameraMode: focus && id ? 'planet' : state.cameraMode,
    cameraRequest: focus ? state.cameraRequest + 1 : state.cameraRequest,
  })),
  setHoveredBody: (id) => set({ hoveredBody: id }),
  setCameraMode: (mode) => set((state) => ({
    cameraMode: mode,
    cameraRequest: state.cameraRequest + 1,
    selectedBody: mode === 'system' ? null : state.selectedBody,
  })),
  viewSystem: () => set((state) => ({
    cameraMode: 'system',
    selectedBody: null,
    cameraRequest: state.cameraRequest + 1,
    tourActive: false,
    tourPaused: false,
  })),
  setSpeedIndex: (index) => set({ speedIndex: Math.max(0, Math.min(3, index)), isPlaying: true }),
  togglePlaying: () => set((state) => ({ isPlaying: !state.isPlaying })),
  publishSimulationDays: (days) => set({ simulationDays: days }),
  setScaleMode: (mode) => set((state) => ({ scaleMode: mode, cameraRequest: state.cameraRequest + 1 })),
  setCustomScale: (size, distance) => set({ customSize: size, customDistance: distance }),
  toggleLabels: () => set((state) => ({ showLabels: !state.showLabels })),
  toggleOrbits: () => set((state) => ({ showOrbits: !state.showOrbits })),
  setReducedMotion: (enabled) => set({ reducedMotion: enabled }),
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setQuality: (quality) => set({ quality }),
  setActiveModal: (modal) => set({ activeModal: modal }),
  setMissionActive: (active) => set((state) => ({
    missionActive: active,
    activeModal: null,
    cameraMode: active ? 'spacecraft' : 'system',
    cameraRequest: state.cameraRequest + 1,
  })),
  setWhatIf: (scenario) => set({ whatIf: scenario }),
  startTour: () => set((state) => ({
    tourActive: true,
    tourPaused: false,
    tourStep: 0,
    activeModal: null,
    missionActive: false,
    selectedBody: null,
    cameraMode: 'system',
    cameraRequest: state.cameraRequest + 1,
  })),
  setTourPaused: (paused) => set({ tourPaused: paused }),
  setTourStep: (step) => set((state) => ({
    tourStep: step,
    cameraRequest: state.cameraRequest + 1,
  })),
  exitTour: () => set({ tourActive: false, tourPaused: false, tourStep: 0 }),
  nextFact: () => set((state) => ({ factIndex: (state.factIndex + 1) % 20, activeModal: 'fact' })),
  showToast: (text, icon = 'sparkle') => set({ toast: { id: Date.now(), text, icon } }),
  clearToast: () => set({ toast: null }),
  registerSunClick: () => {
    const count = get().sunClicks + 1
    set({ sunClicks: count })
    return count
  },
  setSceneReady: (ready) => set({ sceneReady: ready }),
}))
