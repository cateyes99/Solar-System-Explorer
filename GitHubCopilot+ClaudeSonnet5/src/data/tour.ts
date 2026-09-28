import type { FocusTarget } from '../store/simulationStore'

export interface TourStep {
  id: string
  targetId: FocusTarget
  title: string
  narration: string
  /** How long (seconds) the tour lingers on this step before auto-advancing. */
  duration: number
}

/** Scripted "Cinematic Tour" sequence — see spec \u00a78. */
export const TOUR_STEPS: TourStep[] = [
  {
    id: 'overview',
    targetId: null,
    title: 'Our Solar System',
    narration: 'Welcome! Here is our entire Solar System, with the Sun at the center and eight planets orbiting around it.',
    duration: 6,
  },
  {
    id: 'sun',
    targetId: 'sun',
    title: 'The Sun',
    narration:
      'This is the Sun \u2014 a giant, glowing ball of hydrogen and helium. It is so big that more than a million Earths could fit inside it!',
    duration: 7,
  },
  {
    id: 'mercury',
    targetId: 'mercury',
    title: 'Mercury',
    narration: 'Mercury is the smallest planet and the closest to the Sun. It is covered in craters, just like our Moon.',
    duration: 6,
  },
  {
    id: 'venus',
    targetId: 'venus',
    title: 'Venus',
    narration: 'Venus is wrapped in thick, golden clouds. It is the hottest planet of all \u2014 even hotter than Mercury!',
    duration: 6,
  },
  {
    id: 'earth',
    targetId: 'earth',
    title: 'Earth',
    narration: 'This is our home! Earth is the only planet we know of with oceans, air, and life.',
    duration: 6,
  },
  {
    id: 'moon',
    targetId: 'moon',
    title: 'The Moon',
    narration: 'Earth\u2019s Moon travels around us about every 27 days, lighting up our night sky.',
    duration: 5,
  },
  {
    id: 'mars',
    targetId: 'mars',
    title: 'Mars',
    narration: 'Mars is the "Red Planet," colored by rusty iron in its soil. It has the tallest volcano in the Solar System!',
    duration: 6,
  },
  {
    id: 'jupiter',
    targetId: 'jupiter',
    title: 'Jupiter',
    narration: 'Jupiter is the biggest planet of all, with a giant storm called the Great Red Spot that is bigger than Earth.',
    duration: 7,
  },
  {
    id: 'saturn',
    targetId: 'saturn',
    title: 'Saturn',
    narration: 'Saturn\u2019s spectacular rings are made of billions of chunks of ice and rock.',
    duration: 7,
  },
  {
    id: 'uranus',
    targetId: 'uranus',
    title: 'Uranus',
    narration: 'Uranus is tipped over on its side and rolls around the Sun like a ball instead of spinning like a top.',
    duration: 6,
  },
  {
    id: 'neptune',
    targetId: 'neptune',
    title: 'Neptune',
    narration: 'Neptune is the farthest planet from the Sun, with the fastest winds ever recorded \u2014 over 2,000 km/h!',
    duration: 6,
  },
  {
    id: 'finale',
    targetId: null,
    title: 'Journey\u2019s End',
    narration: 'That\u2019s our cosmic neighborhood! Feel free to explore on your own now \u2014 what will you discover?',
    duration: 6,
  },
]
