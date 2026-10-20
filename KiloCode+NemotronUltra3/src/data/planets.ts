import type { PlanetData, MoonData, ScaleMode } from '../types';

const MIN_ORBIT_RADIUS = 20;

function getSafeScaleDistance(planet: PlanetData, mode: ScaleMode): number {
  const baseDistance = getScaleValue(planet, mode, 'distance');
  return Math.max(baseDistance, MIN_ORBIT_RADIUS + planet.scaleRadius[mode] * 2);
}

export const planetsData: PlanetData[] = [
  {
    id: 'sun',
    name: 'Sun',
    type: 'star',
    diameterKm: 1392700,
    distanceFromSunKm: 0,
    orbitalPeriodDays: 0,
    rotationPeriodHours: 609.12,
    moons: 0,
    temperatureC: 5500,
    axialTiltDeg: 7.25,
    orbitalInclinationDeg: 0,
    longitudeOfAscendingNodeDeg: 0,
    color: '#ffcc00',
    description: 'Our Sun is a star at the center of the Solar System. It\'s a nearly perfect ball of hot plasma that provides light and heat to all the planets.',
    facts: [
      'The Sun contains 99.86% of all mass in the Solar System',
      'Over 1 million Earths could fit inside the Sun',
      'The Sun\'s core temperature is about 15 million°C',
      'Light from the Sun takes 8 minutes 20 seconds to reach Earth',
      'The Sun is about 4.6 billion years old'
    ],
    textureFeatures: {
      hasAtmosphere: true,
    },
    orbitalSpeed: 0,
    orbitalRadius: 0,
    scaleRadius: { educational: 15, 'relative-size': 109, distances: 15, custom: 15 },
    scaleDistance: { educational: 0, 'relative-size': 0, distances: 0, custom: 0 },
  },
  {
    id: 'mercury',
    name: 'Mercury',
    type: 'terrestrial',
    diameterKm: 4879,
    distanceFromSunKm: 57909000,
    orbitalPeriodDays: 87.97,
    rotationPeriodHours: 1407.6,
    moons: 0,
    temperatureC: 167,
    axialTiltDeg: 0.03,
    orbitalInclinationDeg: 7.0,
    longitudeOfAscendingNodeDeg: 48.3,
    color: '#b5b5b5',
    description: 'Mercury is the smallest planet and closest to the Sun. It has no atmosphere, so it\'s covered in craters like our Moon.',
    facts: [
      'A year on Mercury is only 88 Earth days',
      'It has the biggest temperature swings: -173°C to 427°C',
      'Mercury has no moons and no rings',
      'It\'s shrinking as its iron core cools',
      'One day on Mercury lasts 176 Earth days'
    ],
    textureFeatures: { hasCraters: true },
    orbitalSpeed: 47.36,
    orbitalRadius: 0.39,
    scaleRadius: { educational: 1.2, 'relative-size': 0.38, distances: 0.8, custom: 1.2 },
    scaleDistance: { educational: 25, 'relative-size': 25, distances: 15, custom: 25 },
  },
  {
    id: 'venus',
    name: 'Venus',
    type: 'terrestrial',
    diameterKm: 12104,
    distanceFromSunKm: 108200000,
    orbitalPeriodDays: 224.7,
    rotationPeriodHours: 5832.5,
    moons: 0,
    temperatureC: 464,
    axialTiltDeg: 177.4,
    orbitalInclinationDeg: 3.39,
    longitudeOfAscendingNodeDeg: 76.7,
    color: '#e6c87a',
    description: 'Venus is Earth\'s "sister planet" but very different! It has a thick, toxic atmosphere that traps heat, making it the hottest planet.',
    facts: [
      'Venus spins backwards compared to other planets',
      'A day on Venus is longer than its year!',
      'It\'s the brightest object in the night sky after the Moon',
      'The pressure on Venus is like being 900m underwater',
      'It rains sulfuric acid (but it evaporates before hitting ground)'
    ],
    textureFeatures: { hasClouds: true, hasAtmosphere: true },
    orbitalSpeed: 35.02,
    orbitalRadius: 0.72,
    scaleRadius: { educational: 2.0, 'relative-size': 0.95, distances: 1.2, custom: 2.0 },
    scaleDistance: { educational: 40, 'relative-size': 40, distances: 25, custom: 40 },
  },
  {
    id: 'earth',
    name: 'Earth',
    type: 'terrestrial',
    diameterKm: 12756,
    distanceFromSunKm: 149600000,
    orbitalPeriodDays: 365.25,
    rotationPeriodHours: 23.93,
    moons: 1,
    temperatureC: 15,
    axialTiltDeg: 23.44,
    orbitalInclinationDeg: 0.0,
    longitudeOfAscendingNodeDeg: 0.0,
    color: '#2196f3',
    description: 'Our home! Earth is the only planet known to support life. It has liquid water, a protective atmosphere, and a perfect temperature range.',
    facts: [
      '71% of Earth\'s surface is covered by oceans',
      'Earth\'s atmosphere protects us from harmful radiation',
      'We have one Moon that causes ocean tides',
      'Earth is the only planet with plate tectonics',
      'Our magnetic field shields us from solar wind'
    ],
    textureFeatures: { hasClouds: true, hasAtmosphere: true },
    orbitalSpeed: 29.78,
    orbitalRadius: 1.0,
    scaleRadius: { educational: 2.1, 'relative-size': 1.0, distances: 1.3, custom: 2.1 },
    scaleDistance: { educational: 55, 'relative-size': 55, distances: 35, custom: 55 },
  },
  {
    id: 'mars',
    name: 'Mars',
    type: 'terrestrial',
    diameterKm: 6792,
    distanceFromSunKm: 227900000,
    orbitalPeriodDays: 687,
    rotationPeriodHours: 24.62,
    moons: 2,
    temperatureC: -65,
    axialTiltDeg: 25.19,
    orbitalInclinationDeg: 1.85,
    longitudeOfAscendingNodeDeg: 49.6,
    color: '#e74c3c',
    description: 'Mars is the Red Planet, named for its rusty iron surface. It has the tallest volcano and deepest canyon in the Solar System.',
    facts: [
      'Olympus Mons is 3x taller than Mount Everest',
      'Valles Marineris canyon stretches across the US',
      'Mars has dust storms that cover the whole planet',
      'There\'s frozen water at the poles and underground',
      'A day on Mars is only 37 minutes longer than Earth'
    ],
    textureFeatures: { hasAtmosphere: true },
    orbitalSpeed: 24.07,
    orbitalRadius: 1.52,
    scaleRadius: { educational: 1.6, 'relative-size': 0.53, distances: 1.0, custom: 1.6 },
    scaleDistance: { educational: 80, 'relative-size': 80, distances: 50, custom: 80 },
  },
  {
    id: 'jupiter',
    name: 'Jupiter',
    type: 'gas-giant',
    diameterKm: 142984,
    distanceFromSunKm: 778500000,
    orbitalPeriodDays: 4333,
    rotationPeriodHours: 9.93,
    moons: 95,
    temperatureC: -110,
    axialTiltDeg: 3.13,
    orbitalInclinationDeg: 1.3,
    longitudeOfAscendingNodeDeg: 100.5,
    color: '#d4a574',
    description: 'Jupiter is the king of planets! It\'s a gas giant so big that all other planets could fit inside it. The Great Red Spot is a storm bigger than Earth.',
    facts: [
      'Over 1,300 Earths could fit inside Jupiter',
      'The Great Red Spot has raged for 350+ years',
      'Jupiter has 95 known moons (4 big ones like Earth\'s Moon)',
      'It has a faint ring system discovered in 1979',
      'Jupiter\'s gravity protects inner planets from asteroids'
    ],
    textureFeatures: { hasGreatRedSpot: true, hasClouds: true, hasAtmosphere: true },
    orbitalSpeed: 13.07,
    orbitalRadius: 5.2,
    scaleRadius: { educational: 10, 'relative-size': 11.2, distances: 4, custom: 10 },
    scaleDistance: { educational: 180, 'relative-size': 180, distances: 120, custom: 180 },
  },
  {
    id: 'saturn',
    name: 'Saturn',
    type: 'gas-giant',
    diameterKm: 120536,
    distanceFromSunKm: 1433500000,
    orbitalPeriodDays: 10759,
    rotationPeriodHours: 10.66,
    moons: 146,
    temperatureC: -140,
    axialTiltDeg: 26.73,
    orbitalInclinationDeg: 2.49,
    longitudeOfAscendingNodeDeg: 113.7,
    color: '#f4e4bc',
    description: 'Saturn is famous for its spectacular rings made of ice and rock. It\'s the least dense planet — it would float in water!',
    facts: [
      'Saturn\'s rings are mostly water ice chunks',
      'It has 146 moons — more than any other planet!',
      'Titan (its biggest moon) has lakes of liquid methane',
      'Saturn would float in a bathtub big enough',
      'Winds at Saturn\'s equator reach 1,800 km/h'
    ],
    textureFeatures: { hasRings: true, hasClouds: true, ringColor: '#c9b896', ringInnerRadius: 1.2, ringOuterRadius: 2.2 },
    orbitalSpeed: 9.69,
    orbitalRadius: 9.54,
    scaleRadius: { educational: 9, 'relative-size': 9.45, distances: 3.5, custom: 9 },
    scaleDistance: { educational: 320, 'relative-size': 320, distances: 220, custom: 320 },
  },
  {
    id: 'uranus',
    name: 'Uranus',
    type: 'ice-giant',
    diameterKm: 51118,
    distanceFromSunKm: 2872500000,
    orbitalPeriodDays: 30687,
    rotationPeriodHours: 17.24,
    moons: 27,
    temperatureC: -195,
    axialTiltDeg: 97.77,
    orbitalInclinationDeg: 0.77,
    longitudeOfAscendingNodeDeg: 74.0,
    color: '#7de3f4',
    description: 'Uranus is an ice giant that spins on its side! It rolls around the Sun like a ball, giving it extreme seasons.',
    facts: [
      'Uranus spins on its side (98° tilt)',
      'Each pole gets 42 years of sunlight then 42 years of darkness',
      'It has 13 faint rings and 27 moons',
      'The coldest planet: -224°C minimum',
      'Its blue-green color comes from methane gas'
    ],
    textureFeatures: { hasRings: true, hasClouds: true, ringColor: '#888888', ringInnerRadius: 1.3, ringOuterRadius: 1.8 },
    orbitalSpeed: 6.81,
    orbitalRadius: 19.22,
    scaleRadius: { educational: 5, 'relative-size': 4.0, distances: 2.5, custom: 5 },
    scaleDistance: { educational: 580, 'relative-size': 580, distances: 400, custom: 580 },
  },
  {
    id: 'neptune',
    name: 'Neptune',
    type: 'ice-giant',
    diameterKm: 49528,
    distanceFromSunKm: 4495100000,
    orbitalPeriodDays: 60190,
    rotationPeriodHours: 16.11,
    moons: 16,
    temperatureC: -200,
    axialTiltDeg: 28.32,
    orbitalInclinationDeg: 1.77,
    longitudeOfAscendingNodeDeg: 131.8,
    color: '#4b70dd',
    description: 'Neptune is the windiest planet with supersonic winds. It\'s a beautiful deep blue ice giant, the farthest major planet from the Sun.',
    facts: [
      'Winds reach 2,100 km/h — fastest in Solar System',
      'It was the first planet discovered by math, not observation',
      'Triton (its biggest moon) orbits backwards',
      'Neptune\'s year is 165 Earth years long',
      'It has 6 faint rings and 16 moons'
    ],
    textureFeatures: { hasClouds: true, hasAtmosphere: true },
    orbitalSpeed: 5.43,
    orbitalRadius: 30.05,
    scaleRadius: { educational: 4.8, 'relative-size': 3.9, distances: 2.4, custom: 4.8 },
    scaleDistance: { educational: 850, 'relative-size': 850, distances: 600, custom: 850 },
  },
];

export const moonsData: MoonData[] = [
  { id: 'moon', name: 'Moon', planetId: 'earth', diameterKm: 3475, distanceFromPlanetKm: 384400, orbitalPeriodDays: 27.3, color: '#aaaaaa', orbitalSpeed: 1.02, orbitalRadius: 5.5, scaleRadius: { educational: 0.6, 'relative-size': 0.27, distances: 0.6, custom: 0.6 }, scaleDistance: { educational: 5.5, 'relative-size': 5.5, distances: 5.5, custom: 5.5 } },
  { id: 'phobos', name: 'Phobos', planetId: 'mars', diameterKm: 22, distanceFromPlanetKm: 9376, orbitalPeriodDays: 0.32, color: '#888888', orbitalSpeed: 2.14, orbitalRadius: 2.5, scaleRadius: { educational: 0.15, 'relative-size': 0.003, distances: 0.15, custom: 0.15 }, scaleDistance: { educational: 2.5, 'relative-size': 2.5, distances: 2.5, custom: 2.5 } },
  { id: 'deimos', name: 'Deimos', planetId: 'mars', diameterKm: 12, distanceFromPlanetKm: 23460, orbitalPeriodDays: 1.26, color: '#888888', orbitalSpeed: 1.35, orbitalRadius: 4.5, scaleRadius: { educational: 0.1, 'relative-size': 0.002, distances: 0.1, custom: 0.1 }, scaleDistance: { educational: 4.5, 'relative-size': 4.5, distances: 4.5, custom: 4.5 } },
  { id: 'io', name: 'Io', planetId: 'jupiter', diameterKm: 3643, distanceFromPlanetKm: 421700, orbitalPeriodDays: 1.77, color: '#ffcc00', orbitalSpeed: 17.33, orbitalRadius: 15, scaleRadius: { educational: 0.8, 'relative-size': 0.28, distances: 0.8, custom: 0.8 }, scaleDistance: { educational: 15, 'relative-size': 15, distances: 15, custom: 15 } },
  { id: 'europa', name: 'Europa', planetId: 'jupiter', diameterKm: 3122, distanceFromPlanetKm: 671100, orbitalPeriodDays: 3.55, color: '#f5e6d3', orbitalSpeed: 13.74, orbitalRadius: 22, scaleRadius: { educational: 0.7, 'relative-size': 0.24, distances: 0.7, custom: 0.7 }, scaleDistance: { educational: 22, 'relative-size': 22, distances: 22, custom: 22 } },
  { id: 'ganymede', name: 'Ganymede', planetId: 'jupiter', diameterKm: 5268, distanceFromPlanetKm: 1070400, orbitalPeriodDays: 7.15, color: '#b8b8b8', orbitalSpeed: 10.88, orbitalRadius: 32, scaleRadius: { educational: 1.0, 'relative-size': 0.41, distances: 1.0, custom: 1.0 }, scaleDistance: { educational: 32, 'relative-size': 32, distances: 32, custom: 32 } },
  { id: 'callisto', name: 'Callisto', planetId: 'jupiter', diameterKm: 4821, distanceFromPlanetKm: 1882700, orbitalPeriodDays: 16.69, color: '#999999', orbitalSpeed: 8.20, orbitalRadius: 48, scaleRadius: { educational: 0.9, 'relative-size': 0.38, distances: 0.9, custom: 0.9 }, scaleDistance: { educational: 48, 'relative-size': 48, distances: 48, custom: 48 } },
  { id: 'titan', name: 'Titan', planetId: 'saturn', diameterKm: 5150, distanceFromPlanetKm: 1221870, orbitalPeriodDays: 15.95, color: '#d4a574', orbitalSpeed: 5.57, orbitalRadius: 30, scaleRadius: { educational: 1.0, 'relative-size': 0.40, distances: 1.0, custom: 1.0 }, scaleDistance: { educational: 30, 'relative-size': 30, distances: 30, custom: 30 } },
  { id: 'enceladus', name: 'Enceladus', planetId: 'saturn', diameterKm: 504, distanceFromPlanetKm: 238000, orbitalPeriodDays: 1.37, color: '#ffffff', orbitalSpeed: 12.63, orbitalRadius: 12, scaleRadius: { educational: 0.2, 'relative-size': 0.04, distances: 0.2, custom: 0.2 }, scaleDistance: { educational: 12, 'relative-size': 12, distances: 12, custom: 12 } },
  { id: 'triton', name: 'Triton', planetId: 'neptune', diameterKm: 2707, distanceFromPlanetKm: 354800, orbitalPeriodDays: 5.88, color: '#ffcccc', orbitalSpeed: 4.39, orbitalRadius: 18, scaleRadius: { educational: 0.6, 'relative-size': 0.21, distances: 0.6, custom: 0.6 }, scaleDistance: { educational: 18, 'relative-size': 18, distances: 18, custom: 18 } },
];

export function getPlanetById(id: string): PlanetData | undefined {
  return planetsData.find(p => p.id === id);
}

export function getMoonsForPlanet(planetId: string): MoonData[] {
  return moonsData.filter(m => m.planetId === planetId);
}

export function getScaleValue<T>(obj: { scaleRadius?: { [K in ScaleMode]: T }; scaleDistance?: { [K in ScaleMode]: T } }, mode: ScaleMode, type: 'radius' | 'distance'): T {
  const key = type === 'radius' ? 'scaleRadius' : 'scaleDistance';
  const scaleObj = obj[key];
  if (scaleObj && mode in scaleObj) {
    return scaleObj[mode];
  }
  return obj[key]?.educational as T;
}