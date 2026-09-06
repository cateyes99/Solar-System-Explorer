import { create } from 'zustand'
import type { BodyId, CustomScale, ScaleMode, WhatIfKey } from '../types'
import { audio } from '../audio/audioEngine'
import { SPEEDS } from '../utils/clock'

export type PanelId = 'none' | 'learn' | 'whatif' | 'missions' | 'settings' | 'facts'
export type ViewMode = 'system' | 'body' | 'follow' | 'spacecraft'

export interface FocusTarget {
  mode: ViewMode
  bodyId: BodyId | null
  /** Optional preferred camera distance (scene units) for the focused body. */
  distance?: number
  /** Monotonic counter so listeners can detect focus changes without deep compares. */
  revision: number
}

export interface Toast {
  id: number
  text: string
  emoji?: string
}

interface SimulationStore {
  paused: boolean
  speedIndex: number
  selectedBody: BodyId | null
  hoveredBody: BodyId | null
  focus: FocusTarget
  scaleMode: ScaleMode
  customScale: CustomScale
  showLabels: boolean
  showOrbits: boolean
  reduceMotion: boolean
  soundOn: boolean
  panel: PanelId
  lessonId: string | null
  tourActive: boolean
  tourPaused: boolean
  whatIf: Record<WhatIfKey, boolean>
  toasts: Toast[]
  sunFlareKey: number
  cameraPoseSeed: number

  setPaused(v: boolean): void
  togglePaused(): void
  setSpeedIndex(i: number): void
  selectBody(id: BodyId | null): void
  setHovered(id: BodyId | null): void
  focusBody(id: BodyId, opts?: { follow?: boolean; distance?: number }): void
  focusSpacecraft(): void
  focusTourTarget(id: BodyId | null, distance?: number): void
  focusSystem(): void
  setScaleMode(m: ScaleMode): void
  setCustomScale(c: Partial<CustomScale>): void
  toggle(key: 'showLabels' | 'showOrbits' | 'reduceMotion' | 'soundOn'): void
  setPanel(p: PanelId): void
  openLesson(id: string | null): void
  startTour(): void
  stopTour(): void
  setTourPaused(v: boolean): void
  toggleWhatIf(k: WhatIfKey): void
  pushToast(text: string, emoji?: string): void
  dismissToast(id: number): void
  triggerSunFlare(): void
  surpriseCamera(): void
}

let focusRevision = 0
let toastId = 0
const nextRevision = () => ++focusRevision

export const useSimulation = create<SimulationStore>()((set, get) => ({
  paused: false,
  speedIndex: 1,
  selectedBody: null,
  hoveredBody: null,
  focus: { mode: 'system', bodyId: null, revision: 0 },
  scaleMode: 'educational',
  customScale: { sizeExaggeration: 1, distanceSpread: 1 },
  showLabels: true,
  showOrbits: true,
  reduceMotion:
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  soundOn: false,
  panel: 'none',
  lessonId: null,
  tourActive: false,
  tourPaused: false,
  whatIf: { twoMoons: false, bigEarth: false, noSun: false, stoppedEarth: false },
  toasts: [],
  sunFlareKey: 0,
  cameraPoseSeed: 0,

  setPaused: (v) => set({ paused: v }),
  togglePaused: () => set((s) => ({ paused: !s.paused })),
  setSpeedIndex: (i) => set({ speedIndex: Math.max(0, Math.min(SPEEDS.length - 1, i)) }),

  selectBody: (id) => {
    if (!id) {
      set({ selectedBody: null })
      return
    }
    audio.blip(660)
    set({ selectedBody: id, focus: { mode: 'body', bodyId: id, revision: nextRevision() } })
  },
  setHovered: (id) => set({ hoveredBody: id }),

  focusBody: (id, opts) =>
    set({
      selectedBody: id,
      focus: {
        mode: opts?.follow ? 'follow' : 'body',
        bodyId: id,
        distance: opts?.distance,
        revision: nextRevision(),
      },
    }),
  focusSpacecraft: () =>
    set({
      focus: { mode: 'spacecraft', bodyId: null, revision: nextRevision() },
    }),
  /** Camera-only focus used by the cinematic tour (never opens the info panel). */
  focusTourTarget: (id, distance) =>
    set({
      focus: {
        mode: id ? 'body' : 'system',
        bodyId: id ?? null,
        distance,
        revision: nextRevision(),
      },
    }),
  focusSystem: () =>
    set({
      selectedBody: null,
      focus: { mode: 'system', bodyId: null, revision: nextRevision() },
    }),

  setScaleMode: (m) => set({ scaleMode: m }),
  setCustomScale: (c) => set((s) => ({ customScale: { ...s.customScale, ...c } })),

  toggle: (key) =>
    set((s) => {
      const next = !s[key]
      if (key === 'soundOn') audio.setEnabled(next)
      return { [key]: next } as Partial<SimulationStore>
    }),

  setPanel: (p) => set((s) => ({ panel: p, lessonId: p === 'learn' ? s.lessonId : null })),
  openLesson: (id) => set({ lessonId: id }),

  startTour: () =>
    set({
      tourActive: true,
      tourPaused: false,
      panel: 'none',
      lessonId: null,
      focus: { mode: 'system', bodyId: null, revision: nextRevision() },
    }),
  stopTour: () => set({ tourActive: false, tourPaused: false }),
  setTourPaused: (v) => set({ tourPaused: v }),

  toggleWhatIf: (k) => {
    const current = get()
    set({ whatIf: { ...current.whatIf, [k]: !current.whatIf[k] } })
  },

  pushToast: (text, emoji) =>
    set((s) => ({ toasts: [...s.toasts.slice(-2), { id: ++toastId, text, emoji }] })),
  dismissToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),

  triggerSunFlare: () => set((s) => ({ sunFlareKey: s.sunFlareKey + 1 })),
  surpriseCamera: () => set((s) => ({ cameraPoseSeed: s.cameraPoseSeed + 1 })),
}))
