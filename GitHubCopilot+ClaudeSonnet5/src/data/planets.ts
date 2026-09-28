/**
 * Core astronomical data model.
 *
 * All numeric values are real-world, rounded for readability (see `description`
 * fields for the "kid-friendly" framing). Values are approximate — this file is
 * the single source of truth so no planetary facts are hard-coded in components.
 */

export type PlanetId =
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'

/** Determines which procedural texture generator is used for a body. */
export type SurfaceStyle = 'cratered' | 'hazy' | 'earthlike' | 'rocky' | 'bands' | 'ice-giant'

export interface Planet {
  id: PlanetId
  name: string
  type: string
  diameterKm: number
  distanceFromSunKm: number
  orbitalPeriodDays: number
  /** Negative values indicate retrograde (backwards) axial rotation. */
  rotationPeriodHours: number
  axialTiltDeg: number
  moons: number
  temperatureC: string
  color: string
  secondaryColor: string
  bandColors?: string[]
  hasRings?: boolean
  ringColor?: string
  surface: SurfaceStyle
  description: string
  didYouKnow: string
  facts: string[]
}

export interface MoonInfo {
  id: string
  name: string
  parent: PlanetId
  diameterKm: number
  distanceFromPlanetKm: number
  orbitalPeriodDays: number
  color: string
  description: string
}

export interface SunInfo {
  id: 'sun'
  name: string
  type: string
  diameterKm: number
  surfaceTempC: number
  coreTempC: number
  ageBillionYears: number
  description: string
  didYouKnow: string
  facts: string[]
}

export const SUN: SunInfo = {
  id: 'sun',
  name: 'The Sun',
  type: 'Yellow Dwarf Star',
  diameterKm: 1_392_700,
  surfaceTempC: 5500,
  coreTempC: 15_000_000,
  ageBillionYears: 4.6,
  description:
    'The Sun is our home star — a giant, glowing ball of hydrogen and helium. It is so big that more than one million Earths could fit inside it!',
  didYouKnow:
    'The Sun makes its energy through nuclear fusion, squeezing hydrogen atoms together so hard they turn into helium and release incredible light and heat.',
  facts: [
    'The Sun is about 4.6 billion years old — and it has enough fuel to keep shining for billions more years.',
    'Light from the Sun takes about 8 minutes to reach Earth.',
    'The Sun is so large that it makes up more than 99% of all the mass in the whole Solar System.',
    'Without the Sun\u2019s gravity, the planets would fly off in straight lines into space instead of orbiting.',
  ],
}

export const PLANETS: Planet[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'Rocky Planet',
    diameterKm: 4_879,
    distanceFromSunKm: 57_900_000,
    orbitalPeriodDays: 88,
    rotationPeriodHours: 1408,
    axialTiltDeg: 0.03,
    moons: 0,
    temperatureC: '-180\u00b0C to 430\u00b0C',
    color: '#9c9088',
    secondaryColor: '#5f574f',
    surface: 'cratered',
    description:
      'Mercury is the smallest planet and the closest one to the Sun. It is covered in craters, just like our Moon, because it has almost no atmosphere to protect it from space rocks.',
    didYouKnow:
      'A year on Mercury (one trip around the Sun) is only 88 Earth days — but a single day there lasts longer than that!',
    facts: [
      'Mercury has almost no atmosphere, so its surface temperature swings wildly between day and night.',
      'It is the fastest planet, zipping around the Sun at about 47 km every second.',
      'Mercury has no moons at all.',
      'Despite being closest to the Sun, Mercury is not the hottest planet — Venus is!',
    ],
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'Rocky Planet',
    diameterKm: 12_104,
    distanceFromSunKm: 108_200_000,
    orbitalPeriodDays: 225,
    rotationPeriodHours: -5832,
    axialTiltDeg: 177.4,
    moons: 0,
    temperatureC: '~465\u00b0C',
    color: '#e8cf9a',
    secondaryColor: '#c9a06a',
    surface: 'hazy',
    description:
      'Venus is wrapped in thick, golden clouds that trap heat like a blanket, making it the hottest planet in our Solar System — even hotter than Mercury!',
    didYouKnow:
      'A day on Venus (one full spin) takes longer than its entire year! It also spins backwards compared to most planets.',
    facts: [
      'Venus spins in the opposite direction to most planets — the Sun would rise in the west!',
      'Its thick clouds are made of carbon dioxide with droplets of sulfuric acid.',
      'Venus is the brightest natural object in our night sky after the Moon.',
      'Venus and Earth are similar in size, so they are sometimes called "sister planets."',
    ],
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'Rocky Planet',
    diameterKm: 12_742,
    distanceFromSunKm: 149_600_000,
    orbitalPeriodDays: 365.25,
    rotationPeriodHours: 24,
    axialTiltDeg: 23.4,
    moons: 1,
    temperatureC: '-88\u00b0C to 58\u00b0C',
    color: '#2f6fb0',
    secondaryColor: '#3f8f4f',
    surface: 'earthlike',
    description:
      'Earth is our home — the only planet we know of with oceans, air, and life! From space it looks like a beautiful blue marble swirled with white clouds.',
    didYouKnow:
      'Earth is the only planet in the Solar System not named after a Greek or Roman god.',
    facts: [
      'Earth\u2019s surface is about 71% water, which is why it looks blue from space.',
      'Our atmosphere protects us from harmful radiation and burns up most space rocks before they hit the ground.',
      'Earth has one large Moon, which helps stabilize our seasons and creates ocean tides.',
      'Earth travels around the Sun at about 107,000 km/h.',
    ],
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'Rocky Planet',
    diameterKm: 6_779,
    distanceFromSunKm: 227_900_000,
    orbitalPeriodDays: 687,
    rotationPeriodHours: 24.6,
    axialTiltDeg: 25.2,
    moons: 2,
    temperatureC: '-140\u00b0C to 20\u00b0C',
    color: '#b8502f',
    secondaryColor: '#7a3016',
    surface: 'rocky',
    description:
      'Mars is called the "Red Planet" because iron minerals in its soil have rusted, giving it a rusty-orange color. It has the largest volcano and the deepest canyon in the Solar System!',
    didYouKnow:
      'Mars has two tiny, lumpy moons named Phobos and Deimos — their names mean "fear" and "dread"!',
    facts: [
      'Olympus Mons on Mars is the largest volcano in the Solar System — nearly three times taller than Mount Everest.',
      'A day on Mars is very close to an Earth day — about 24 hours and 40 minutes.',
      'Mars has seasons like Earth because it is also tilted on its axis.',
      'Scientists have sent many rovers to explore Mars, searching for clues about water and ancient life.',
    ],
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'Gas Giant',
    diameterKm: 139_820,
    distanceFromSunKm: 778_500_000,
    orbitalPeriodDays: 4_333,
    rotationPeriodHours: 9.9,
    axialTiltDeg: 3.1,
    moons: 95,
    temperatureC: '~-110\u00b0C',
    color: '#d8b48c',
    secondaryColor: '#a9714a',
    bandColors: ['#e8cba8', '#c99a6b', '#a9714a', '#e2b98f', '#8c5a3a'],
    hasRings: false,
    surface: 'bands',
    description:
      'Jupiter is the biggest planet of all — a giant ball of swirling gas with colorful stripes. It has a giant storm called the Great Red Spot that is bigger than Earth!',
    didYouKnow:
      'Jupiter is so big that more than 1,000 Earths could fit inside it.',
    facts: [
      'The Great Red Spot is a giant storm that has been raging for at least 150 years.',
      'Jupiter has the shortest day of any planet, spinning all the way around in under 10 hours.',
      'Jupiter acts like a cosmic shield, using its huge gravity to pull in asteroids and comets that might otherwise hit Earth.',
      'Jupiter has dozens of moons, including four huge ones discovered by Galileo in 1610.',
    ],
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'Gas Giant',
    diameterKm: 116_460,
    distanceFromSunKm: 1_434_000_000,
    orbitalPeriodDays: 10_759,
    rotationPeriodHours: 10.7,
    axialTiltDeg: 26.7,
    moons: 146,
    temperatureC: '~-140\u00b0C',
    color: '#e3cf9d',
    secondaryColor: '#c2a878',
    bandColors: ['#f0e2bd', '#e3cf9d', '#c2a878', '#d8c298'],
    hasRings: true,
    ringColor: '#d8c9a8',
    surface: 'bands',
    description:
      'Saturn is famous for its spectacular rings made of billions of chunks of ice and rock. It is the least dense planet — Saturn would actually float in a giant bathtub!',
    didYouKnow:
      'Saturn\u2019s rings are made almost entirely of ice and rock, and some pieces are as tiny as a grain of sand while others are as big as a house.',
    facts: [
      'Saturn\u2019s rings span up to 280,000 km across but are usually less than a kilometer thick.',
      'Saturn has 146 confirmed moons, more than any other planet.',
      'Saturn is the least dense planet — it is lighter than water!',
      'Winds in Saturn\u2019s atmosphere can reach 1,800 km/h, among the fastest in the Solar System.',
    ],
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'Ice Giant',
    diameterKm: 50_724,
    distanceFromSunKm: 2_871_000_000,
    orbitalPeriodDays: 30_687,
    rotationPeriodHours: -17.2,
    axialTiltDeg: 97.8,
    moons: 28,
    temperatureC: '~-195\u00b0C',
    color: '#a6e3e0',
    secondaryColor: '#7dc4c2',
    surface: 'ice-giant',
    description:
      'Uranus is a pale blue-green ice giant that rolls around the Sun on its side, like a ball rolling instead of a spinning top!',
    didYouKnow:
      'Uranus is tilted so much (almost 98 degrees) that scientists think a huge collision knocked it onto its side billions of years ago.',
    facts: [
      'Uranus rotates on its side, so its poles take turns facing the Sun for decades at a time.',
      'It is the coldest planet in the Solar System, even though Neptune is farther away.',
      'Uranus is made of a slushy mix of water, ammonia, and methane ices around a rocky core.',
      'Its faint rings were only discovered in 1977.',
    ],
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'Ice Giant',
    diameterKm: 49_244,
    distanceFromSunKm: 4_495_000_000,
    orbitalPeriodDays: 60_190,
    rotationPeriodHours: 16.1,
    axialTiltDeg: 28.3,
    moons: 16,
    temperatureC: '~-200\u00b0C',
    color: '#3a5fcf',
    secondaryColor: '#26408f',
    surface: 'ice-giant',
    description:
      'Neptune is the farthest planet from the Sun — a deep blue world with the fastest winds ever recorded, howling at over 2,000 km/h!',
    didYouKnow:
      'Neptune was the first planet discovered using math before it was ever seen — scientists predicted exactly where to look!',
    facts: [
      'Neptune has the strongest winds in the Solar System, reaching supersonic speeds.',
      'It takes Neptune about 165 Earth years to orbit the Sun once.',
      'Neptune has 16 known moons; the largest, Triton, orbits backwards and may be a captured object.',
      'Neptune appears deep blue because methane in its atmosphere absorbs red light.',
    ],
  },
]

export const MOON: MoonInfo = {
  id: 'moon',
  name: 'The Moon',
  parent: 'earth',
  diameterKm: 3_474,
  distanceFromPlanetKm: 384_400,
  orbitalPeriodDays: 27.3,
  color: '#c9c5bd',
  description:
    'Earth\u2019s only natural satellite. It controls our ocean tides and its changing shape in the sky gives us the Moon phases.',
}

export function getPlanet(id: PlanetId): Planet {
  const planet = PLANETS.find((p) => p.id === id)
  if (!planet) throw new Error(`Unknown planet id: ${id}`)
  return planet
}
