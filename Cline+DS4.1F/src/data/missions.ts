import type { TimeSpeedOption, TravelDestination } from '../types'

/**
 * Mission Control destinations. Light travel times are standard values based on
 * average Earth–planet distances (they change as the planets move, so they are
 * shown as approximate).
 */
export const TRAVEL_DESTINATIONS: TravelDestination[] = [
  {
    id: 'sun',
    name: 'The Sun',
    description: 'Fly into the glare of our star. Keep your shields up!',
    lightMinutesFromEarth: 8.3,
    funFact: 'Sunlight needs 8 minutes 20 seconds to reach Earth.',
  },
  {
    id: 'mercury',
    name: 'Mercury',
    description: 'A cratered world with scorching days and freezing nights.',
    lightMinutesFromEarth: 5.1,
    funFact: 'A year on Mercury lasts only 88 Earth days.',
  },
  {
    id: 'venus',
    name: 'Venus',
    description: 'Thick acid clouds and the hottest surface of any planet.',
    lightMinutesFromEarth: 2.1,
    funFact: 'Venus spins backwards, so the Sun rises in the west.',
  },
  {
    id: 'earth',
    name: 'Earth',
    description: 'Home sweet home. Say hello to everyone from orbit!',
    lightMinutesFromEarth: 0,
    funFact: 'You are travelling at about 107,000 km/h right now, on Earth.',
  },
  {
    id: 'moon',
    name: 'The Moon',
    description: 'Our neighbour, just 384,000 km away. Look for the craters.',
    lightMinutesFromEarth: 0.02,
    funFact: 'Light takes only 1.3 seconds to travel from the Moon to Earth.',
  },
  {
    id: 'mars',
    name: 'Mars',
    description: 'Rusty deserts, giant volcanoes and polar ice caps.',
    lightMinutesFromEarth: 4.3,
    funFact: 'Radio messages from Mars can take up to 22 minutes to reach Earth.',
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    description: 'The biggest planet, with storm bands and 95 known moons.',
    lightMinutesFromEarth: 35.5,
    funFact: 'Jupiter’s day is under 10 hours long — the shortest of all planets.',
  },
  {
    id: 'saturn',
    name: 'Saturn',
    description: 'Fly through the rings — carefully!',
    lightMinutesFromEarth: 71,
    funFact: 'Saturn’s rings are mostly water ice, from grains to house-sized chunks.',
  },
  {
    id: 'uranus',
    name: 'Uranus',
    description: 'A pale blue-green ice giant lying on its side.',
    lightMinutesFromEarth: 148,
    funFact: 'Uranus is the coldest planet, dipping to about -224 °C.',
  },
  {
    id: 'neptune',
    name: 'Neptune',
    description: 'The far frontier: deep blue, windy and very cold.',
    lightMinutesFromEarth: 250,
    funFact: 'Sunlight takes over 4 hours to reach Neptune.',
  },
  {
    id: 'pluto',
    name: 'Pluto',
    description: 'The dwarf planet at the edge of the family, with its icy heart.',
    lightMinutesFromEarth: 275,
    funFact: 'Pluto is smaller than our Moon, and New Horizons flew past it in 2015.',
  },
  {
    id: 'halley',
    name: 'Halley’s Comet',
    description: 'Chase the famous comet on its huge, stretched orbit.',
    lightMinutesFromEarth: 200,
    funFact: 'Halley comes back about every 76 years — next time in 2061.',
  },
]

/** Simulation speeds, from a slow drift to a whole year per second. */
export const TIME_SPEEDS: TimeSpeedOption[] = [
  { id: 'slow', label: 'Slow', shortLabel: '0.1 d/s', daysPerSecond: 0.1 },
  { id: 'normal', label: 'Normal', shortLabel: '1 d/s', daysPerSecond: 1 },
  { id: 'fast', label: 'Fast', shortLabel: '1 wk/s', daysPerSecond: 7 },
  { id: 'very-fast', label: 'Very Fast', shortLabel: '1 mo/s', daysPerSecond: 30 },
  { id: 'year', label: 'A Year a Second', shortLabel: '1 yr/s', daysPerSecond: 365 },
  { id: 'hyper', label: 'Hyperdrive', shortLabel: '10 yr/s', daysPerSecond: 3_650 },
]

export function findClosestSpeed(daysPerSecond: number): number {
  let bestIndex = 0
  let bestDelta = Number.POSITIVE_INFINITY
  TIME_SPEEDS.forEach((speed, index) => {
    const delta = Math.abs(speed.daysPerSecond - daysPerSecond)
    if (delta < bestDelta) {
      bestDelta = delta
      bestIndex = index
    }
  })
  return bestIndex
}