/**
 * Core celestial-body data model.
 * Scientific values are kept here (separate from presentation) so new objects
 * can be added later without touching components.
 *
 * Values are rounded, student-friendly approximations of NASA/JPL figures.
 */

export type BodyId =
  | 'sun'
  | 'mercury'
  | 'venus'
  | 'earth'
  | 'mars'
  | 'jupiter'
  | 'saturn'
  | 'uranus'
  | 'neptune'
  | 'moon'

/** J2000 Keplerian-style orbital elements used for simplified positioning. */
export interface OrbitalElements {
  /** Semi-major axis in AU */
  semiMajorAxisAu: number
  /** Eccentricity (0 = circle) */
  eccentricity: number
  /** Orbital inclination to the ecliptic, degrees */
  inclinationDeg: number
  /** Mean longitude at J2000, degrees */
  meanLongitudeDeg: number
  /** Longitude of perihelion at J2000, degrees */
  longitudePerihelionDeg: number
}

export interface Body {
  id: BodyId
  name: string
  /** Human readable classification, e.g. "Terrestrial planet" */
  type: string
  diameterKm: number
  /** Mean distance from the Sun in km */
  distanceFromSunKm: number
  /** Orbital period in Earth days (negative is not used; prograde always) */
  orbitalPeriodDays: number
  /** Sidereal rotation period in hours — negative means retrograde spin */
  rotationPeriodHours: number
  /** Axial tilt in degrees */
  axialTiltDeg: number
  /** Number of moons (approximate) */
  moons: number
  /** Average surface temperature in °C */
  temperatureC: number
  /** Accent colour used for orbits, UI chips and labels */
  color: string
  /** One-sentence, child friendly summary */
  description: string
  /** 4–6 interesting facts, child friendly */
  facts: string[]
  /** "Did you know?" highlight */
  didYouKnow: string
  /** Whether this body renders a ring system */
  hasRings: boolean
  elements: OrbitalElements
}

export const SUN: Body = {
  id: 'sun',
  name: 'The Sun',
  type: 'G-type main-sequence star',
  diameterKm: 1_392_700,
  distanceFromSunKm: 0,
  orbitalPeriodDays: 0,
  rotationPeriodHours: 609.12,
  axialTiltDeg: 7.25,
  moons: 0,
  temperatureC: 5_505,
  color: '#ffb347',
  description:
    'The Sun is the giant star at the centre of our Solar System. Its gravity holds every planet in place.',
  facts: [
    'The Sun is a very ordinary star — there are billions just like it in our galaxy.',
    'The Sun holds 99.8% of all the mass in the Solar System.',
    'Light from the Sun takes about 8 minutes and 20 seconds to reach Earth.',
    'The Sun is made of hot gas called plasma, mostly hydrogen and helium.',
    'The Sun has no solid surface — it is a giant ball of glowing gas.',
  ],
  didYouKnow:
    'About one million Earths could fit inside the Sun — it is that enormous!',
  hasRings: false,
  elements: {
    semiMajorAxisAu: 0,
    eccentricity: 0,
    inclinationDeg: 0,
    meanLongitudeDeg: 0,
    longitudePerihelionDeg: 0,
  },
}

export const MOON = {
  id: 'moon' as const,
  name: 'The Moon',
  diameterKm: 3474.8,
  distanceFromSunKm: 149_600_000,
  orbitalPeriodDays: 27.32,
  rotationPeriodHours: 655.7,
  color: '#cfcfcf',
  description:
    "Earth's Moon lights up our night sky. It has no air and no weather, so footprints last forever.",
  facts: [
    'The Moon always shows us the same face — it spins once for every orbit it makes.',
    'The Moon is slowly drifting away from Earth, about 3.8 cm every year.',
    'Moon dust smells like burnt charcoal after a campfire.',
    'There is no wind on the Moon, so an astronaut footprint can last millions of years.',
  ],
  didYouKnow:
    'Without the Moon, Earth would wobble like a spinning top — seasons would become wild and unpredictable.',
}

export const PLANETS: Body[] = [
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'Terrestrial planet',
    diameterKm: 4_879,
    distanceFromSunKm: 57_900_000,
    orbitalPeriodDays: 87.97,
    rotationPeriodHours: 1_407.6,
    axialTiltDeg: 0.03,
    moons: 0,
    temperatureC: 167,
    color: '#9c8e83',
    description:
      'Mercury is the smallest planet and the closest to the Sun. It is a rocky, cratered world of extremes.',
    facts: [
      'Mercury races around the Sun faster than any other planet.',
      'A day on Mercury (sunrise to sunrise) lasts about 176 Earth days — that is two of its years!',
      'Mercury has almost no atmosphere, so it is boiling hot by day and freezing cold by night.',
      'Despite being closest to the Sun, Venus is actually the hottest planet.',
    ],
    didYouKnow:
      'Mercury is covered in craters because it has almost no air to burn up incoming space rocks.',
    hasRings: false,
    elements: {
      semiMajorAxisAu: 0.3871,
      eccentricity: 0.2056,
      inclinationDeg: 7.0,
      meanLongitudeDeg: 252.25,
      longitudePerihelionDeg: 77.46,
    },
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'Terrestrial planet',
    diameterKm: 12_104,
    distanceFromSunKm: 108_200_000,
    orbitalPeriodDays: 224.7,
    rotationPeriodHours: -5_832.5,
    axialTiltDeg: 177.4,
    moons: 0,
    temperatureC: 464,
    color: '#e8c07a',
    description:
      'Venus is Earth’s twin in size, wrapped in thick golden clouds that trap heat like a giant blanket.',
    facts: [
      'Venus spins backwards — the Sun rises in the west there.',
      'A day on Venus is longer than a year on Venus.',
      'Venus is the hottest planet in the Solar System, hot enough to melt lead.',
      'Venus is the brightest natural object in our night sky after the Moon.',
      'Its surface is hidden under clouds of sulfuric acid.',
    ],
    didYouKnow:
      'If you stood on Venus, it would feel like being 900 metres under the ocean — the air presses down that hard!',
    hasRings: false,
    elements: {
      semiMajorAxisAu: 0.7233,
      eccentricity: 0.0068,
      inclinationDeg: 3.39,
      meanLongitudeDeg: 181.98,
      longitudePerihelionDeg: 131.53,
    },
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'Terrestrial planet',
    diameterKm: 12_756,
    distanceFromSunKm: 149_600_000,
    orbitalPeriodDays: 365.25,
    rotationPeriodHours: 23.93,
    axialTiltDeg: 23.44,
    moons: 1,
    temperatureC: 15,
    color: '#4ea3ff',
    description:
      'Earth is our home — the only world we know with liquid oceans, green forests and living things.',
    facts: [
      'Earth is the only planet not named after a Greek or Roman god.',
      'About 71% of Earth’s surface is covered by water.',
      'Earth’s magnetic field acts like an invisible shield against the solar wind.',
      'Our planet is hurtling around the Sun at about 107,000 km/h.',
      'The Moon helps keep Earth’s steady 24-hour day.',
    ],
    didYouKnow:
      'Every person who has ever lived — more than 100 billion humans — has lived on this one small blue dot.',
    hasRings: false,
    elements: {
      semiMajorAxisAu: 1.0,
      eccentricity: 0.0167,
      inclinationDeg: 0.0,
      meanLongitudeDeg: 100.46,
      longitudePerihelionDeg: 102.94,
    },
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'Terrestrial planet',
    diameterKm: 6_779,
    distanceFromSunKm: 227_900_000,
    orbitalPeriodDays: 686.98,
    rotationPeriodHours: 24.62,
    axialTiltDeg: 25.19,
    moons: 2,
    temperatureC: -65,
    color: '#e2704a',
    description:
      'Mars is the rusty red world with the tallest volcano and the deepest canyon in the Solar System.',
    facts: [
      'Mars gets its red colour from iron rust in its soil.',
      'Olympus Mons on Mars is almost three times taller than Mount Everest.',
      'Mars has seasons like Earth because it is tilted in a similar way.',
      'Robots — rovers — are exploring Mars for us right now.',
      'Mars has polar ice caps made of water and frozen carbon dioxide.',
    ],
    didYouKnow:
      'Sunsets on Mars are blue! Fine dust in the air scatters red light and lets blue light through.',
    hasRings: false,
    elements: {
      semiMajorAxisAu: 1.5237,
      eccentricity: 0.0934,
      inclinationDeg: 1.85,
      meanLongitudeDeg: 355.45,
      longitudePerihelionDeg: 336.04,
    },
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'Gas giant',
    diameterKm: 139_820,
    distanceFromSunKm: 778_500_000,
    orbitalPeriodDays: 4_331,
    rotationPeriodHours: 9.93,
    axialTiltDeg: 3.13,
    moons: 95,
    temperatureC: -110,
    color: '#d9a066',
    description:
      'Jupiter is the biggest planet — a swirly gas giant with a storm larger than Earth that never stops.',
    facts: [
      'Jupiter is so big that more than 1,300 Earths could fit inside it.',
      'The Great Red Spot is a storm that has been raging for over 350 years.',
      'Jupiter spins faster than any other planet — a day lasts under 10 hours.',
      'Jupiter has no solid surface; you could never stand on it.',
      'Jupiter acts like a cosmic vacuum cleaner, pulling in comets with its gravity.',
    ],
    didYouKnow:
      'Jupiter’s gravity is so strong it helps protect the inner planets by deflecting asteroids.',
    hasRings: false,
    elements: {
      semiMajorAxisAu: 5.2029,
      eccentricity: 0.0484,
      inclinationDeg: 1.3,
      meanLongitudeDeg: 34.4,
      longitudePerihelionDeg: 14.73,
    },
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'Gas giant',
    diameterKm: 116_460,
    distanceFromSunKm: 1_432_000_000,
    orbitalPeriodDays: 10_747,
    rotationPeriodHours: 10.66,
    axialTiltDeg: 26.73,
    moons: 146,
    temperatureC: -140,
    color: '#e8d3a0',
    description:
      'Saturn is the jewel of the Solar System, wrapped in shimmering rings made of billions of pieces of ice.',
    facts: [
      'Saturn’s rings are mostly made of ice and rock, some pieces as small as grains of sand.',
      'Saturn is less dense than water — it would float in a big enough bathtub.',
      'Saturn has a giant hexagon-shaped storm around its north pole.',
      'Saturn has more moons than any other planet — over 140 confirmed.',
      'One of its moons, Enceladus, shoots water geysers into space.',
    ],
    didYouKnow:
      'Saturn’s rings are huge across — about 280,000 km wide — but often less than 100 metres thick.',
    hasRings: true,
    elements: {
      semiMajorAxisAu: 9.5367,
      eccentricity: 0.0539,
      inclinationDeg: 2.49,
      meanLongitudeDeg: 49.95,
      longitudePerihelionDeg: 92.59,
    },
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'Ice giant',
    diameterKm: 50_724,
    distanceFromSunKm: 2_867_000_000,
    orbitalPeriodDays: 30_589,
    rotationPeriodHours: -17.24,
    axialTiltDeg: 97.77,
    moons: 28,
    temperatureC: -195,
    color: '#8fe3e8',
    description:
      'Uranus rolls around the Sun on its side like a spinning ball — an ice giant of pale blue-green.',
    facts: [
      'Uranus is tipped over on its side, so it rolls along its orbit.',
      'It is the coldest planet in the Solar System, colder than Neptune.',
      'Uranus was the first planet discovered with a telescope.',
      'It appears blue-green because methane gas absorbs red light.',
      'Each pole gets 21 years of sunlight, then 21 years of darkness.',
    ],
    didYouKnow:
      'If you could stand on Uranus (you can’t — it’s a gas giant), the Sun would look like a very bright star.',
    hasRings: true,
    elements: {
      semiMajorAxisAu: 19.189,
      eccentricity: 0.0473,
      inclinationDeg: 0.77,
      meanLongitudeDeg: 313.24,
      longitudePerihelionDeg: 170.95,
    },
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'Ice giant',
    diameterKm: 49_244,
    distanceFromSunKm: 4_515_000_000,
    orbitalPeriodDays: 59_800,
    rotationPeriodHours: 16.11,
    axialTiltDeg: 28.32,
    moons: 16,
    temperatureC: -200,
    color: '#4f7dff',
    description:
      'Neptune is the farthest planet — a deep blue world with the fastest winds in the Solar System.',
    facts: [
      'Neptune has winds faster than 2,000 km/h — the fastest ever measured on a planet.',
      'It takes Neptune about 165 Earth years to orbit the Sun once.',
      'Neptune was found by mathematics before anyone saw it through a telescope.',
      'Neptune’s moon Triton orbits backwards and is probably a captured Kuiper Belt object.',
      'Sunlight here is about 900 times dimmer than on Earth.',
    ],
    didYouKnow:
      'Neptune was the first planet to be discovered using predictions from mathematics.',
    hasRings: true,
    elements: {
      semiMajorAxisAu: 30.07,
      eccentricity: 0.0086,
      inclinationDeg: 1.77,
      meanLongitudeDeg: 304.88,
      longitudePerihelionDeg: 44.97,
    },
  },
]

/** The Moon as a full Body so the information panel can render it. */
export const MOON_BODY: Body = {
  id: 'moon',
  name: 'The Moon',
  type: 'Natural satellite (of Earth)',
  diameterKm: 3_475,
  distanceFromSunKm: 149_600_000,
  orbitalPeriodDays: 27.32,
  rotationPeriodHours: 655.7,
  axialTiltDeg: 6.68,
  moons: 0,
  temperatureC: -20,
  color: '#cfcfcf',
  description: MOON.description,
  facts: MOON.facts,
  didYouKnow: MOON.didYouKnow,
  hasRings: false,
  elements: {
    semiMajorAxisAu: 1.0,
    eccentricity: 0.0549,
    inclinationDeg: 5.15,
    meanLongitudeDeg: 218.3,
    longitudePerihelionDeg: 83.35,
  },
}

export const BODIES: Body[] = [SUN, ...PLANETS]

export const BODY_BY_ID: Record<string, Body> = Object.fromEntries(
  [...BODIES, MOON_BODY].map((b) => [b.id, b]),
)

export function isPlanetId(id: string | null): id is BodyId {
  return id !== null && id !== 'sun' && PLANETS.some((p) => p.id === id)
}
