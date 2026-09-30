import { create } from 'zustand'
import type { PlanetId } from '../types'

/**
 * Interactive state for the Explore & Learn scenes. Kept apart from the main
 * app store so lesson maths never forces the orrery to re-render.
 */
export interface LessonState {
  /** Sun lesson: fusion flash counter. */
  burst: number
  /** Sizes lesson: planets the child has tapped, up to two. */
  pick: string[]
  /** Gravity lesson: central mass slider, 0..3 (3 = black hole). */
  mass: number
  /** Gravity lesson: launch speed as a multiple of circular speed. */
  speedFactor: number
  /** Seasons lesson: position around the orbit, radians. */
  seasonAngle: number
  /** Moon phases lesson: Moon's position around Earth, radians. */
  moonAngle: number
  /** Orbits lesson: freeze the animation. */
  orbitsPaused: boolean

  fuse(): void
  togglePick(id: string): void
  clearPick(): void
  setMass(mass: number): void
  setSpeedFactor(value: number): void
  setSeasonAngle(angle: number): void
  setMoonAngle(angle: number): void
  toggleOrbitsPaused(): void
}

export const useLessonStore = create<LessonState>((set) => ({
  burst: 0,
  pick: ['earth'],
  mass: 1,
  speedFactor: 1,
  seasonAngle: Math.PI * 0.72,
  moonAngle: Math.PI * 0.5,
  orbitsPaused: false,

  fuse: () => set((state) => ({ burst: state.burst + 1 })),
  togglePick: (id) =>
    set((state) => {
      if (state.pick.includes(id)) {
        const next = state.pick.filter((p) => p !== id)
        return { pick: next.length ? next : state.pick }
      }
      return { pick: state.pick.length >= 2 ? [state.pick[1], id] : [...state.pick, id] }
    }),
  clearPick: () => set({ pick: ['earth'] }),
  setMass: (mass) => set({ mass }),
  setSpeedFactor: (speedFactor) => set({ speedFactor }),
  setSeasonAngle: (seasonAngle) => set({ seasonAngle }),
  setMoonAngle: (moonAngle) => set({ moonAngle }),
  toggleOrbitsPaused: () => set((state) => ({ orbitsPaused: !state.orbitsPaused })),
}))

export type PickId = PlanetId