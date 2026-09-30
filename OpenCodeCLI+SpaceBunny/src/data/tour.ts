import type { TourStage } from '../types'

/**
 * The guided cinematic tour. `duration` is in seconds of *simulated* wall time;
 * the camera rig eases continuously so there are no cuts.
 */
export const TOUR_STAGES: TourStage[] = [
  {
    id: 'overview',
    title: 'Our Solar System',
    narration:
      'Welcome aboard. Eight planets, one star, and a lot of empty space. Everything you see is orbiting the same ball of fire at the centre.',
    target: 'system',
    distanceFactor: 1,
    sweep: 0.45,
    duration: 9,
  },
  {
    id: 'approach-sun',
    title: 'Approaching the Sun',
    narration:
      'We are flying in towards the Sun. It looks small from out here only because it is far away — up close it would fill the entire sky.',
    target: 'sun',
    distanceFactor: 2.6,
    sweep: 0.3,
    duration: 8,
  },
  {
    id: 'sun-explain',
    title: 'The Sun — a nuclear furnace',
    narration:
      'The Sun is a star. In its core, hydrogen is being crushed together to make helium, and that reaction pours out light and heat. It does this 600 million tonnes at a time, every second.',
    target: 'sun',
    distanceFactor: 1.5,
    sweep: -0.35,
    duration: 11,
  },
  {
    id: 'mercury',
    title: 'Mercury',
    narration:
      'First stop: Mercury, the smallest planet. With almost no atmosphere it cannot hold on to heat, so its day side sizzles at 430 °C while the night side freezes.',
    target: 'mercury',
    distanceFactor: 4.2,
    sweep: 0.5,
    duration: 8,
  },
  {
    id: 'venus',
    title: 'Venus',
    narration:
      'Venus is almost exactly Earth’s size but went completely the other way. Thick clouds trapped the heat and boiled its oceans away. Now it is the hottest planet of all.',
    target: 'venus',
    distanceFactor: 4,
    sweep: -0.45,
    duration: 8,
  },
  {
    id: 'earth-approach',
    title: 'Approaching Earth',
    narration:
      'Here it is. The only world we know of with oceans of liquid water, an oxygen atmosphere and life on the surface.',
    target: 'earth',
    distanceFactor: 5.5,
    sweep: 0.4,
    duration: 8,
  },
  {
    id: 'earth-close',
    title: 'Earth, up close',
    narration:
      'Look closely. Blue oceans, swirling white clouds, and a thin blue line of air — that atmosphere is the only reason anything lives out here.',
    target: 'earth',
    distanceFactor: 2.1,
    sweep: -0.3,
    duration: 9,
  },
  {
    id: 'moon',
    title: 'The Moon',
    narration:
      'Earth’s Moon keeps our axis steady as we spin, which keeps our seasons from wobbling. It is tidally locked, so we always see the same face.',
    target: 'moon',
    distanceFactor: 3.4,
    sweep: 0.35,
    duration: 8,
  },
  {
    id: 'mars',
    title: 'Mars',
    narration:
      'Red dust, giant volcanoes and a canyon 4,000 kilometres long. Mars has seasons too, because its axis is tilted just like ours.',
    target: 'mars',
    distanceFactor: 4,
    sweep: -0.4,
    duration: 8,
  },
  {
    id: 'jupiter',
    title: 'Jupiter',
    narration:
      'Hold on. Jupiter is a gas giant bigger than every other planet combined — more than 1,300 Earths inside it. The Great Red Spot has been raging for centuries.',
    target: 'jupiter',
    distanceFactor: 3.6,
    sweep: 0.55,
    duration: 10,
  },
  {
    id: 'saturn',
    title: 'Saturn and its rings',
    narration:
      'Saturn’s rings are not solid sheets. They are billions of pieces of ice and rock, each one orbiting on its own. From a distance they look like a sheet of glass.',
    target: 'saturn',
    distanceFactor: 3.2,
    sweep: -0.7,
    duration: 10,
  },
  {
    id: 'uranus',
    title: 'Uranus',
    narration:
      'Uranus got knocked onto its side. Instead of a day, each pole gets 42 years of continuous sunlight followed by 42 years of darkness.',
    target: 'uranus',
    distanceFactor: 4,
    sweep: 0.5,
    duration: 8,
  },
  {
    id: 'neptune',
    title: 'Neptune',
    narration:
      'Last stop. Neptune has the fastest winds in the Solar System — over 2,000 kilometres per hour — and takes 165 Earth years to complete one lap.',
    target: 'neptune',
    distanceFactor: 4,
    sweep: -0.5,
    duration: 8,
  },
  {
    id: 'reveal',
    title: 'Back to the beginning',
    narration:
      'And back out. Eight worlds, one star, and a universe of reasons to keep looking up. Now it is your turn — click anything, or take a mission and fly there yourself.',
    target: 'system',
    distanceFactor: 1.05,
    sweep: 0.6,
    duration: 10,
  },
]