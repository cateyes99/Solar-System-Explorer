import type { BodyId } from './types'

export type TourTarget = BodyId | 'system'

export interface TourStep {
  id: string
  target: TourTarget
  mode: 'system' | 'planet' | 'follow'
  title: string
  narration: string
  /** How long the step stays on screen (including the camera flight). */
  seconds: number
  flightSeconds?: number
  distanceFactor?: number
  azimuthDeg?: number
  elevationDeg?: number
}

export const TOUR_STEPS: TourStep[] = [
  {
    id: 'intro',
    target: 'system',
    mode: 'system',
    title: 'Welcome to our Solar System',
    narration:
      'Eight planets, hundreds of moons and millions of asteroids all travel around one star: the Sun. Let’s go and visit them!',
    seconds: 9,
    flightSeconds: 3.5,
  },
  {
    id: 'sun',
    target: 'sun',
    mode: 'planet',
    title: 'The Sun',
    narration:
      'Our star is a gigantic ball of glowing gas. Deep inside, tiny atoms smash together and release enormous energy – that’s why the Sun shines.',
    seconds: 11,
    flightSeconds: 4,
    distanceFactor: 1.1,
    azimuthDeg: 25,
    elevationDeg: 12,
  },
  {
    id: 'mercury',
    target: 'mercury',
    mode: 'planet',
    title: 'Mercury',
    narration: 'The smallest planet races around the Sun every 88 days. It is scorching by day and freezing at night.',
    seconds: 9,
    azimuthDeg: 35,
  },
  {
    id: 'venus',
    target: 'venus',
    mode: 'planet',
    title: 'Venus',
    narration: 'Venus is wrapped in thick clouds that trap heat. It is the hottest planet of all – about 464°C!',
    seconds: 9,
    azimuthDeg: -30,
  },
  {
    id: 'earth',
    target: 'earth',
    mode: 'planet',
    title: 'Earth – our home',
    narration: 'There it is: the blue planet. Earth is the only place we know of where there is life.',
    seconds: 9,
    distanceFactor: 1.8,
    azimuthDeg: 45,
  },
  {
    id: 'earth-close',
    target: 'earth',
    mode: 'planet',
    title: 'Zooming in on Earth',
    narration:
      'Blue oceans, green land and swirling white clouds. As Earth spins, places move from daytime into night-time.',
    seconds: 10,
    flightSeconds: 3,
    distanceFactor: 0.8,
    azimuthDeg: 70,
    elevationDeg: 10,
  },
  {
    id: 'moon',
    target: 'moon',
    mode: 'planet',
    title: 'The Moon',
    narration:
      'Our Moon is about 384,000 km away. It doesn’t make its own light – it shines by reflecting sunlight.',
    seconds: 9,
    distanceFactor: 1.4,
    azimuthDeg: 40,
  },
  {
    id: 'mars',
    target: 'mars',
    mode: 'planet',
    title: 'Mars',
    narration: 'The red planet is rusty and dusty. It has the tallest volcano in the Solar System, and robot rovers explore it today.',
    seconds: 9,
    azimuthDeg: 30,
  },
  {
    id: 'jupiter',
    target: 'jupiter',
    mode: 'planet',
    title: 'Behold… Jupiter!',
    narration:
      'The giant of the Solar System! More than 1,300 Earths could fit inside it, and the Great Red Spot is a storm bigger than our whole planet.',
    seconds: 12,
    flightSeconds: 4.5,
    distanceFactor: 1.5,
    azimuthDeg: 55,
    elevationDeg: 8,
  },
  {
    id: 'saturn',
    target: 'saturn',
    mode: 'planet',
    title: 'Saturn and its rings',
    narration:
      'Saturn’s rings are made of billions of pieces of ice and rock – some as small as sand, some as big as houses.',
    seconds: 12,
    flightSeconds: 4.5,
    distanceFactor: 1.6,
    azimuthDeg: 40,
    elevationDeg: 22,
  },
  {
    id: 'uranus',
    target: 'uranus',
    mode: 'planet',
    title: 'Uranus',
    narration: 'An icy giant tipped right over on its side, so it rolls around the Sun like a ball.',
    seconds: 9,
    flightSeconds: 4,
    azimuthDeg: 30,
  },
  {
    id: 'neptune',
    target: 'neptune',
    mode: 'planet',
    title: 'Neptune',
    narration:
      'The farthest planet, where winds blow faster than 2,000 km/h. Sunlight takes about 4 hours to reach it.',
    seconds: 10,
    flightSeconds: 4,
    azimuthDeg: -35,
  },
  {
    id: 'outro',
    target: 'system',
    mode: 'system',
    title: 'Our cosmic neighbourhood',
    narration:
      'And that is our Solar System! Everything you saw is held together by the Sun’s gravity. Where would you like to explore next?',
    seconds: 10,
    flightSeconds: 5,
  },
]
