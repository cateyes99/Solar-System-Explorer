import { create } from 'zustand';
import type { SimulationState, UIState, ScaleMode, CameraMode, ViewMode, PlanetData, MoonData } from '../types';
import { planetsData, moonsData } from '../data/planets';
import * as THREE from 'three';

interface AppStore extends SimulationState, UIState {
  planets: PlanetData[];
  moons: MoonData[];
  setSelectedPlanet: (id: string | null) => void;
  setHoveredPlanet: (id: string | null) => void;
  setCameraMode: (mode: CameraMode) => void;
  setCameraTarget: (target: THREE.Vector3 | null) => void;
  setSimulationSpeed: (speed: number) => void;
  setSimulationDate: (date: Date) => void;
  setPaused: (paused: boolean) => void;
  togglePause: () => void;
  setScaleMode: (mode: ScaleMode) => void;
  setShowLabels: (show: boolean) => void;
  setShowOrbits: (show: boolean) => void;
  setShowStars: (show: boolean) => void;
  setReducedMotion: (reduced: boolean) => void;
  setSoundEnabled: (enabled: boolean) => void;
  setViewMode: (mode: ViewMode) => void;
  setCinematicTourActive: (active: boolean) => void;
  setCinematicTourStep: (step: number) => void;
  setCinematicTourProgress: (progress: number) => void;
  setSpacecraftActive: (active: boolean) => void;
  setSpacecraftPosition: (pos: THREE.Vector3) => void;
  setSpacecraftVelocity: (vel: THREE.Vector3) => void;
  setSpacecraftTarget: (target: string | null) => void;
  setPlanetPanelOpen: (open: boolean) => void;
  setSettingsPanelOpen: (open: boolean) => void;
  setTimeControlsOpen: (open: boolean) => void;
  setMissionControlOpen: (open: boolean) => void;
  setTourControlsOpen: (open: boolean) => void;
  setLoading: (loading: boolean) => void;
  setLoadingProgress: (progress: number) => void;
  setError: (error: string | null) => void;
  setWelcomeMessage: (show: boolean) => void;
  setRandomFact: (fact: string | null) => void;
  resetSimulation: () => void;
}

const initialSimulationState: SimulationState = {
  selectedPlanetId: null,
  hoveredPlanetId: null,
  cameraMode: 'solar-system',
  cameraTarget: null,
  simulationSpeed: 1,
  simulationDate: new Date(),
  isPaused: false,
  scaleMode: 'educational',
  showLabels: true,
  showOrbits: true,
  showStars: true,
  reducedMotion: false,
  soundEnabled: false,
  viewMode: 'explore',
  cinematicTourActive: false,
  cinematicTourStep: 0,
  cinematicTourProgress: 0,
  spacecraftActive: false,
  spacecraftPosition: new THREE.Vector3(0, 50, 100),
  spacecraftVelocity: new THREE.Vector3(0, 0, 0),
  spacecraftTarget: null,
};

const initialUIState: UIState = {
  planetPanelOpen: false,
  settingsPanelOpen: false,
  timeControlsOpen: true,
  missionControlOpen: false,
  tourControlsOpen: false,
  loading: true,
  loadingProgress: 0,
  error: null,
  welcomeMessage: true,
  randomFact: null,
};

export const useAppStore = create<AppStore>()((set, _get) => ({
  ...initialSimulationState,
  ...initialUIState,
  planets: planetsData,
  moons: moonsData,

  setSelectedPlanet: (id) => set({ selectedPlanetId: id, planetPanelOpen: !!id }),
  setHoveredPlanet: (id) => set({ hoveredPlanetId: id }),
  setCameraMode: (mode) => set({ cameraMode: mode }),
  setCameraTarget: (target) => set({ cameraTarget: target }),
  setSimulationSpeed: (speed) => set({ simulationSpeed: Math.max(0, Math.min(10000, speed)) }),
  setSimulationDate: (date) => set({ simulationDate: date }),
  setPaused: (paused) => set({ isPaused: paused }),
  togglePause: () => set((state) => ({ isPaused: !state.isPaused })),
  setScaleMode: (mode) => set({ scaleMode: mode }),
  setShowLabels: (show) => set({ showLabels: show }),
  setShowOrbits: (show) => set({ showOrbits: show }),
  setShowStars: (show) => set({ showStars: show }),
  setReducedMotion: (reduced) => set({ reducedMotion: reduced }),
  setSoundEnabled: (enabled) => set({ soundEnabled: enabled }),
  setViewMode: (mode) => set({ viewMode: mode }),
  setCinematicTourActive: (active) => set({ cinematicTourActive: active, cinematicTourStep: 0, cinematicTourProgress: 0 }),
  setCinematicTourStep: (step) => set({ cinematicTourStep: step }),
  setCinematicTourProgress: (progress) => set({ cinematicTourProgress: progress }),
  setSpacecraftActive: (active) => set({ spacecraftActive: active }),
  setSpacecraftPosition: (pos) => set({ spacecraftPosition: pos }),
  setSpacecraftVelocity: (vel) => set({ spacecraftVelocity: vel }),
  setSpacecraftTarget: (target) => set({ spacecraftTarget: target }),
  setPlanetPanelOpen: (open) => set({ planetPanelOpen: open }),
  setSettingsPanelOpen: (open) => set({ settingsPanelOpen: open }),
  setTimeControlsOpen: (open) => set({ timeControlsOpen: open }),
  setMissionControlOpen: (open) => set({ missionControlOpen: open }),
  setTourControlsOpen: (open) => set({ tourControlsOpen: open }),
  setLoading: (loading) => set({ loading }),
  setLoadingProgress: (progress) => set({ loadingProgress: progress }),
  setError: (error) => set({ error }),
  setWelcomeMessage: (show) => set({ welcomeMessage: show }),
  setRandomFact: (fact) => set({ randomFact: fact }),

  resetSimulation: () => set({
    ...initialSimulationState,
    ...initialUIState,
    planets: planetsData,
    moons: moonsData,
  }),
}));