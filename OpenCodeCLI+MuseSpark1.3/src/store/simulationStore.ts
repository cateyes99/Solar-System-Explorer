import { create } from 'zustand';

export type ScaleMode = 'educational' | 'relative' | 'distances' | 'custom';
export type CameraMode = 'overview' | 'focus' | 'follow';

type SimState = {
  selectedId: string | null;
  hoveredId: string | null;
  cameraMode: CameraMode;
  scaleMode: ScaleMode;
  sizeMult: number;
  distMult: number;
  speed: number; // simulated days per real second
  paused: boolean;
  simDays: number;
  showLabels: boolean;
  showOrbits: boolean;
  showOrbitArrows: boolean;
  reducedMotion: boolean;
  soundOn: boolean;
  tourActive: boolean;
  tourIndex: number;
  tourPlaying: boolean;
  learnOpen: boolean;
  learnTab: string;
  whatIfOpen: boolean;
  twoMoons: boolean;
  bigEarth: boolean;
  sunOff: boolean;
  noSpin: boolean;
  craftActive: boolean;
  craftFollow: boolean;
  craftSpeed: number;
  showFact: boolean;
  factIndex: number;
  sunClicks: number;
  flareUntil: number;
  welcomeDone: boolean;
  moonPhase: number; // 0..1 manual override for lesson (0 = auto)
  moonPhaseManual: boolean;
  gravityMass: number; // 0.2..2.5 multiplier for gravity demo
  showHelp: boolean;
  webglFailed: boolean;

  set: (p: Partial<SimState>) => void;
  select: (id: string | null) => void;
  advanceFact: () => void;
};

const SPEEDS = [0.5, 2, 10, 40];

export { SPEEDS };

export const useSim = create<SimState>((set) => ({
  selectedId: null,
  hoveredId: null,
  cameraMode: 'overview',
  scaleMode: 'educational',
  sizeMult: 1,
  distMult: 1,
  speed: 2,
  paused: false,
  simDays: 120,
  showLabels: true,
  showOrbits: true,
  showOrbitArrows: false,
  reducedMotion: false,
  soundOn: false,
  tourActive: false,
  tourIndex: 0,
  tourPlaying: true,
  learnOpen: false,
  learnTab: 'sun',
  whatIfOpen: false,
  twoMoons: false,
  bigEarth: false,
  sunOff: false,
  noSpin: false,
  craftActive: false,
  craftFollow: false,
  craftSpeed: 12,
  showFact: false,
  factIndex: 0,
  sunClicks: 0,
  flareUntil: 0,
  welcomeDone: false,
  moonPhase: 0,
  moonPhaseManual: false,
  gravityMass: 1,
  showHelp: false,
  webglFailed: false,
  set: (p) => set(p),
  select: (id) => set({ selectedId: id, cameraMode: id ? 'focus' : 'overview' }),
  advanceFact: () => set((s) => ({ factIndex: s.factIndex + 1, showFact: true })),
}));
