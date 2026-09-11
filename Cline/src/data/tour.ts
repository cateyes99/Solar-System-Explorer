import type { BodyId } from '../types'

export interface TourStep {
  title: string
  text: string
  /** Body to fly toward, or 'system' for the wide overview shot. */
  target: BodyId | 'system'
  /** Preferred camera distance in scene units (optional). */
  distance?: number
  durationMs: number
}

/** The cinematic guided tour. Camera transitions are handled by the camera controller. */
export const TOUR_STEPS: TourStep[] = [
  {
    title: 'Welcome aboard!',
    text: 'This is our Solar System — one star, eight planets, and a whole lot of space in between. Buckle up, explorer!',
    target: 'system',
    durationMs: 8000,
  },
  {
    title: 'The Sun',
    text: 'Our journey starts at the Sun, the blazing heart of the Solar System. About 1.3 million Earths could fit inside it! It shines by squeezing tiny atoms together in a process called fusion.',
    target: 'sun',
    distance: 30,
    durationMs: 9000,
  },
  {
    title: 'Mercury — the speedster',
    text: 'First stop, little Mercury! It is the smallest planet and it zooms around the Sun faster than any other — its year is only 88 days long.',
    target: 'mercury',
    durationMs: 7000,
  },
  {
    title: 'Venus — the hot twin',
    text: 'Venus is almost the same size as Earth, but its thick cloudy blanket traps heat so well that it is the hottest planet of all — hot enough to melt lead!',
    target: 'venus',
    durationMs: 7000,
  },
  {
    title: 'Earth — our home',
    text: 'This blue dot is home to everyone you have ever met! Earth is the perfect distance from the Sun — not too hot, not too cold — and the only place we know of with life.',
    target: 'earth',
    distance: 6.5,
    durationMs: 8000,
  },
  {
    title: 'The Moon',
    text: 'Say hello to the Moon! Twelve astronauts have walked on it. Its gravity pulls our oceans back and forth, making the tides.',
    target: 'moon',
    distance: 3,
    durationMs: 7000,
  },
  {
    title: 'Mars — the red desert',
    text: 'Mars is covered in rusty red dust and home to the tallest volcano in the Solar System. Robot rovers are driving around on it right now, taking photos for us!',
    target: 'mars',
    durationMs: 7000,
  },
  {
    title: 'Jupiter — the giant!',
    text: 'Incoming! Jupiter is SO big that more than 1,000 Earths could fit inside it. See that giant red storm? It has been raging for hundreds of years!',
    target: 'jupiter',
    distance: 15,
    durationMs: 9000,
  },
  {
    title: 'Saturn and its rings',
    text: 'Nobody passes Saturn without saying “wow”. Its rings are made of billions of pieces of ice and rock — sparkling jewellery the size of a whole planet!',
    target: 'saturn',
    distance: 14,
    durationMs: 9000,
  },
  {
    title: 'Uranus — the sideways planet',
    text: 'Uranus is a cool, calm ice giant — but it is tipped completely on its side, rolling around the Sun like a bowling ball!',
    target: 'uranus',
    durationMs: 7000,
  },
  {
    title: 'Neptune — the windy edge',
    text: 'Last stop: deep-blue Neptune, where winds howl at 2,000 km/h — the fastest in the Solar System. Sunlight takes more than 4 hours to get here!',
    target: 'neptune',
    durationMs: 7000,
  },
  {
    title: 'Home again',
    text: 'Every planet we visited is held in a perfect cosmic dance by the Sun’s gravity. Thanks for flying with Solar System Explorer — now go click something!',
    target: 'system',
    durationMs: 8000,
  },
]
