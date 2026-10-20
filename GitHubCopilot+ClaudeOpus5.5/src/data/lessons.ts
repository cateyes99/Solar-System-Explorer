import type { BodyId } from './types'

export type LessonId = 'sun' | 'orbits' | 'sizes' | 'distances' | 'gravity' | 'day-night' | 'seasons' | 'moon-phases'

export interface CameraPreset {
  mode: 'system' | 'planet' | 'follow'
  target: BodyId | null
  distanceFactor?: number
  azimuthDeg?: number
  elevationDeg?: number
}

export interface LessonMeta {
  id: LessonId
  title: string
  subtitle: string
  accent: string
  camera: CameraPreset
  /** Simulation speed (days per second) used while the lesson is open. */
  speed?: number
}

export const LESSONS: LessonMeta[] = [
  {
    id: 'sun',
    title: 'The Sun',
    subtitle: 'What it is and why it shines',
    accent: '#ffb347',
    camera: { mode: 'planet', target: 'sun', distanceFactor: 1.3, azimuthDeg: 20, elevationDeg: 10 },
  },
  {
    id: 'orbits',
    title: 'Orbits',
    subtitle: 'Why planets go round and round',
    accent: '#67e8f9',
    camera: { mode: 'system', target: null },
    speed: 10,
  },
  {
    id: 'sizes',
    title: 'Planet Sizes',
    subtitle: 'How big is Jupiter, really?',
    accent: '#f0c27b',
    camera: { mode: 'planet', target: 'jupiter', distanceFactor: 1.6, azimuthDeg: 30 },
  },
  {
    id: 'distances',
    title: 'Planet Distances',
    subtitle: 'How far away is Neptune?',
    accent: '#818cf8',
    camera: { mode: 'system', target: null },
  },
  {
    id: 'gravity',
    title: 'Gravity',
    subtitle: 'The invisible pull',
    accent: '#a78bfa',
    camera: { mode: 'system', target: null },
  },
  {
    id: 'day-night',
    title: 'Day and Night',
    subtitle: 'Why the Sun “rises” and “sets”',
    accent: '#60a5fa',
    camera: { mode: 'planet', target: 'earth', distanceFactor: 0.9, azimuthDeg: 75, elevationDeg: 15 },
    speed: 0.1,
  },
  {
    id: 'seasons',
    title: 'Seasons',
    subtitle: 'Earth’s tilt makes summer and winter',
    accent: '#34d399',
    camera: { mode: 'follow', target: 'earth' },
    speed: 10,
  },
  {
    id: 'moon-phases',
    title: 'Moon Phases',
    subtitle: 'Why the Moon changes shape',
    accent: '#e5e7eb',
    camera: { mode: 'planet', target: 'earth', distanceFactor: 2.6, azimuthDeg: 0, elevationDeg: 55 },
    speed: 1,
  },
]
