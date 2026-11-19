import type { LessonId } from '../types'

export interface LessonDefinition {
  id: LessonId
  number: string
  title: string
  subtitle: string
  duration: string
}

export const LESSONS: LessonDefinition[] = [
  { id: 'sun', number: '01', title: 'Our star', subtitle: 'Why the Sun shines', duration: '3 min' },
  { id: 'sizes', number: '02', title: 'Planet sizes', subtitle: 'How big is big?', duration: '4 min' },
  { id: 'distances', number: '03', title: 'Cosmic distances', subtitle: 'Space is mostly space', duration: '4 min' },
  { id: 'gravity', number: '04', title: 'Gravity lab', subtitle: 'The invisible pull', duration: '5 min' },
  { id: 'day-night', number: '05', title: 'Day & night', subtitle: 'A spinning world', duration: '3 min' },
  { id: 'seasons', number: '06', title: 'Seasons', subtitle: 'A little tilt changes everything', duration: '4 min' },
  { id: 'moon-phases', number: '07', title: 'Moon phases', subtitle: 'A monthly light show', duration: '5 min' },
  { id: 'orbits', number: '08', title: 'Orbits', subtitle: 'Falling around the Sun', duration: '4 min' },
]
