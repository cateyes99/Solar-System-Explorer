import type { Object3D } from 'three'
import type { BodyId, PlanetId } from '../data/types'
import { dateToDays } from '../utils/astronomy'
import { cloneLayout, computeLayout, DEFAULT_CUSTOM_SCALE, type SceneLayout } from '../utils/scale'

/**
 * Mutable, per-frame state shared between the 3D scene and the UI.
 * Kept outside React so animation never triggers re-renders.
 */
export const simClock = {
  days: dateToDays(new Date()),
}

const initialLayout = computeLayout('educational', DEFAULT_CUSTOM_SCALE)

export const layoutState: { current: SceneLayout; target: SceneLayout } = {
  current: cloneLayout(initialLayout),
  target: initialLayout,
}

/** Scene objects for each body, used by the camera and spacecraft. */
export const bodyObjects = new Map<BodyId, Object3D>()

/** Label DOM nodes, managed by the label overlap/fade system. */
export const labelElements = new Map<BodyId, HTMLElement>()

export const pointerPosition = { x: 0, y: 0 }

export const flightInput = {
  forward: false,
  back: false,
  left: false,
  right: false,
  up: false,
  down: false,
  boost: false,
}

export interface ReleasedPlanet {
  x: number
  y: number
  z: number
  vx: number
  vy: number
  vz: number
  days: number
}

/** “What if the Sun disappeared?” – an expanding wave of light/gravity news. */
export const sunGoneState = {
  active: false,
  waveRadius: 0,
  released: new Map<PlanetId, ReleasedPlanet>(),
  reset() {
    this.active = false
    this.waveRadius = 0
    this.released.clear()
  },
}
