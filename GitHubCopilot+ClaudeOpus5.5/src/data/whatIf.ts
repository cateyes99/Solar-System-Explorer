import type { CameraPreset } from './lessons'

export type WhatIfId = 'two-moons' | 'big-earth' | 'no-sun' | 'still-earth'

export interface WhatIfScenario {
  id: WhatIfId
  question: string
  summary: string
  points: string[]
  camera: CameraPreset
  speed?: number
}

export const WHAT_IFS: WhatIfScenario[] = [
  {
    id: 'two-moons',
    question: 'What if Earth had two moons?',
    summary: 'A second, smaller moon now circles Earth alongside our real Moon.',
    points: [
      'Night skies would often be brighter, with two moons showing different phases.',
      'Both moons would pull on the oceans, so tides would be more complicated.',
      'Two moons would also tug on each other. Over a long time, their orbits could change a lot – real systems like this can be unstable.',
    ],
    camera: { mode: 'planet', target: 'earth', distanceFactor: 3.2, azimuthDeg: 20, elevationDeg: 40 },
    speed: 2,
  },
  {
    id: 'big-earth',
    question: 'What if Earth were the size of Jupiter?',
    summary: 'Earth grows until it is as wide as Jupiter – about 11 times wider than it really is.',
    points: [
      'More than 1,300 normal-sized Earths would fit inside this giant Earth.',
      'If the giant Earth were made of the same rock, its surface gravity would be about 11 times stronger. You would feel 11 times heavier!',
      'Mountains, trees and even people would struggle to stand up under such strong gravity.',
    ],
    camera: { mode: 'planet', target: 'earth', distanceFactor: 1.5, azimuthDeg: 40, elevationDeg: 10 },
    speed: 0.5,
  },
  {
    id: 'no-sun',
    question: 'What if the Sun disappeared?',
    summary:
      'The Sun vanishes. Its last light – and the change in its gravity – spread outward at the speed of light (the glowing wave).',
    points: [
      'Nothing changes on Earth for about 8 minutes and 20 seconds: that is how long light and gravity take to travel from the Sun to us.',
      'When the wave arrives, a planet goes dark and stops curving around the Sun – it flies off in a straight line.',
      'Faraway Neptune would not notice anything for about 4 hours!',
      'Don’t worry: the Sun cannot just disappear. It will keep shining for billions of years.',
    ],
    camera: { mode: 'system', target: null },
    speed: 2,
  },
  {
    id: 'still-earth',
    question: 'What if Earth stopped spinning?',
    summary: 'Earth stops spinning but keeps going around the Sun.',
    points: [
      'One “day” would last a whole year: about six months of daylight, then about six months of night.',
      'The day side would get very hot and the night side very cold.',
      'If Earth stopped suddenly, the air and oceans would keep moving – causing gigantic winds and waves. Luckily, this cannot happen suddenly in real life.',
    ],
    camera: { mode: 'planet', target: 'earth', distanceFactor: 1.2, azimuthDeg: 80, elevationDeg: 10 },
    speed: 10,
  },
]
