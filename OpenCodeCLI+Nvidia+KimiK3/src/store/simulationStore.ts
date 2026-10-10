import { create } from 'zustand'
import type { ScaleMode } from '../utils/scale'

export type CameraMode = 'system' | 'planet' | 'follow'

export type TourStage = {
  targetId: string | 'sun' | 'system'
  duration: number // seconds of camera travel
  hold: number // seconds to linger
  text: string
}

export const TOUR_STAGES: TourStage[] = [
  { targetId: 'system', duration: 4, hold: 3, text: 'Welcome aboard! This is our Solar System — one star, eight planets, and countless wonders.' },
  { targetId: 'sun', duration: 5, hold: 4, text: 'The Sun: a giant star that makes its own light by smashing hydrogen atoms together. Its gravity holds everything together.' },
  { targetId: 'mercury', duration: 4, hold: 3, text: 'Mercury — the fastest planet, racing around the Sun in just 88 days.' },
  { targetId: 'venus', duration: 4, hold: 3, text: 'Venus — wrapped in thick clouds and hotter than an oven.' },
  { targetId: 'earth', duration: 5, hold: 5, text: 'Earth — our home. The only world known to have oceans, air to breathe, and life. See the Moon tagging along?' },
  { targetId: 'mars', duration: 4, hold: 3, text: 'Mars — the Red Planet, where robot rovers explore right now.' },
  { targetId: 'jupiter', duration: 6, hold: 4, text: 'Jupiter — the giant! Its Great Red Spot is a storm bigger than all of Earth.' },
  { targetId: 'saturn', duration: 6, hold: 5, text: 'Saturn — with dazzling rings made of billions of pieces of ice and rock.' },
  { targetId: 'uranus', duration: 5, hold: 3, text: 'Uranus — the planet that rolls around the Sun on its side.' },
  { targetId: 'neptune', duration: 5, hold: 3, text: 'Neptune — the farthest planet, with the fastest winds in the Solar System.' },
  { targetId: 'system', duration: 7, hold: 2, text: 'And back home to the full view. Thanks for flying with us — now go explore!' },
]

type SimulationState = {
  selectedPlanetId: string | null
  hoveredId: string | null
  cameraMode: CameraMode
  speed: number
  paused: boolean
  scaleMode: ScaleMode
  customSize: number
  customDistance: number
  showLabels: boolean
  showOrbits: boolean
  reducedMotion: boolean
  muted: boolean
  tourActive: boolean
  tourIndex: number
  tourPaused: boolean
  factIndex: number | null
  welcomeVisible: boolean
  sunClicks: number
  flareActive: boolean

  select: (id: string | null) => void
  hover: (id: string | null) => void
  setCameraMode: (m: CameraMode) => void
  setSpeed: (s: number) => void
  togglePaused: () => void
  setScaleMode: (m: ScaleMode) => void
  setCustomSize: (v: number) => void
  setCustomDistance: (v: number) => void
  toggleLabels: () => void
  toggleOrbits: () => void
  toggleReducedMotion: () => void
  toggleMuted: () => void
  startTour: () => void
  stopTour: () => void
  setTourIndex: (i: number) => void
  toggleTourPaused: () => void
  showFact: (i: number | null) => void
  dismissWelcome: () => void
  clickSun: () => void
  clearFlare: () => void
}

export const useSimulationStore = create<SimulationState>((set) => ({
  selectedPlanetId: null,
  hoveredId: null,
  cameraMode: 'system',
  speed: 1,
  paused: false,
  scaleMode: 'educational',
  customSize: 1,
  customDistance: 1,
  showLabels: true,
  showOrbits: true,
  reducedMotion: false,
  muted: true,
  tourActive: false,
  tourIndex: 0,
  tourPaused: false,
  factIndex: null,
  welcomeVisible: true,
  sunClicks: 0,
  flareActive: false,

  select: (id) => set((s) => ({
    selectedPlanetId: id,
    cameraMode: id ? (s.cameraMode === 'system' ? 'planet' : s.cameraMode) : 'system',
  })),
  hover: (id) => set({ hoveredId: id }),
  setCameraMode: (m) => set({ cameraMode: m }),
  setSpeed: (s) => set({ speed: s, paused: false }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setScaleMode: (m) => set({ scaleMode: m }),
  setCustomSize: (v) => set({ customSize: v }),
  setCustomDistance: (v) => set({ customDistance: v }),
  toggleLabels: () => set((s) => ({ showLabels: !s.showLabels })),
  toggleOrbits: () => set((s) => ({ showOrbits: !s.showOrbits })),
  toggleReducedMotion: () => set((s) => ({ reducedMotion: !s.reducedMotion })),
  toggleMuted: () => set((s) => ({ muted: !s.muted })),
  startTour: () => set({ tourActive: true, tourIndex: 0, tourPaused: false, selectedPlanetId: null }),
  stopTour: () => set({ tourActive: false, tourIndex: 0, tourPaused: false, cameraMode: 'system', selectedPlanetId: null }),
  setTourIndex: (i) => set({ tourIndex: i }),
  toggleTourPaused: () => set((s) => ({ tourPaused: !s.tourPaused })),
  showFact: (i) => set({ factIndex: i }),
  dismissWelcome: () => set({ welcomeVisible: false }),
  clickSun: () => set((s) => {
    const n = s.sunClicks + 1
    return n >= 5
      ? { sunClicks: 0, flareActive: true }
      : { sunClicks: n }
  }),
  clearFlare: () => set({ flareActive: false }),
}))
