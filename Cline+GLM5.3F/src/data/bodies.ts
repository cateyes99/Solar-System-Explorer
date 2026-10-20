import { PLANETS } from './planets'
import type { BodyId, BodyInfo, MoonData, PlanetId, SunData } from '../types'

export const SUN: SunData = {
  id: 'sun',
  name: 'The Sun',
  type: 'Star',
  diameterKm: 1_392_700,
  distanceFromSunKm: 0,
  distanceAU: 0,
  orbitalPeriodDays: 0,
  rotationPeriodHours: 609.1,
  axialTiltDeg: 7.25,
  moons: null,
  temperatureC: 5500,
  color: '#ffb84d',
  accentColor: '#ffe08a',
  description:
    'The Sun is a gigantic ball of glowing gas — a star! It contains 99.8% of all the mass in the Solar System, and its gravity keeps every planet in orbit.',
  facts: [
    'About 1.3 million Earths could fit inside the Sun.',
    'The Sun shines by nuclear fusion — smashing hydrogen atoms together to make helium.',
    'Sunlight takes about 8 minutes and 20 seconds to reach Earth.',
    "The Sun's surface is about 5,500°C — but its core is 15 million degrees!",
    'The Sun is about 4.6 billion years old — roughly halfway through its life.',
  ],
  didYouKnow: 'The Sun is so huge that 109 Earths could line up across its face!',
}

export const MOON: MoonData = {
  id: 'moon',
  name: 'The Moon',
  type: 'Moon',
  diameterKm: 3474,
  distanceFromSunKm: 149_600_000,
  distanceAU: 1,
  distanceFromParentKm: 384_400,
  orbitalPeriodDays: 27.32,
  rotationPeriodHours: 655.7,
  axialTiltDeg: 6.7,
  moons: null,
  temperatureC: -23,
  color: '#b8b8bd',
  accentColor: '#d9d9de',
  description:
    "The Moon is Earth's only natural satellite. It has no air and no liquid water, but astronauts have walked on it — twelve people so far!",
  facts: [
    'The Moon is drifting about 3.8 cm farther from Earth every year.',
    "The Moon's gravity pulls on Earth's oceans, creating the tides.",
    "Astronauts' footprints could last millions of years — there is no wind to blow them away.",
    'The Moon always shows Earth the same face.',
  ],
  didYouKnow: 'On the Moon you can jump about six times higher than on Earth — its gravity is much weaker!',
}

const PLANETS_AS_BODIES = Object.fromEntries(
  PLANETS.map((p) => [p.id, p as BodyInfo]),
) as Record<PlanetId, BodyInfo>

/** Every selectable body, including the Sun and the Moon. */
export const ALL_BODIES: Record<BodyId, BodyInfo> = {
  sun: SUN,
  moon: MOON,
  ...PLANETS_AS_BODIES,
}

export function getBodyInfo(id: BodyId): BodyInfo {
  return ALL_BODIES[id]
}

export const BODY_ORDER: BodyId[] = [
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
