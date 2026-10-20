import type { BodyId } from './types'

export interface Mission {
  id: string
  title: string
  description: string
  targets: BodyId[]
}

export const MISSIONS: Mission[] = [
  { id: 'first-flight', title: 'First Flight', description: 'Fly from Earth to the Moon.', targets: ['moon'] },
  { id: 'red-planet', title: 'Red Planet Run', description: 'Visit rusty red Mars.', targets: ['mars'] },
  {
    id: 'hot-stuff',
    title: 'Too Hot to Handle',
    description: 'Visit the two planets closest to the Sun.',
    targets: ['mercury', 'venus'],
  },
  {
    id: 'giants',
    title: 'Giant Hunter',
    description: 'Visit the gas giants Jupiter and Saturn.',
    targets: ['jupiter', 'saturn'],
  },
  {
    id: 'ice-giants',
    title: 'Ice Giant Explorer',
    description: 'Travel to the cold outer planets.',
    targets: ['uranus', 'neptune'],
  },
  {
    id: 'grand-tour',
    title: 'The Grand Tour',
    description: 'Visit all eight planets.',
    targets: ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'],
  },
]

export const DESTINATIONS: BodyId[] = [
  'sun',
  'mercury',
  'venus',
  'earth',
  'moon',
  'mars',
  'jupiter',
  'saturn',
  'uranus',
  'neptune',
]
