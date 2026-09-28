import type { PlanetId } from './planets'

/** Selectable destinations for Spacecraft Mode's Mission Control panel. */
export interface Mission {
  id: string
  targetId: PlanetId | 'sun'
  label: string
  briefing: string
}

export const MISSIONS: Mission[] = [
  { id: 'mission-sun', targetId: 'sun', label: 'Sun Flyby', briefing: 'Approach our star and feel the heat of fusion power.' },
  { id: 'mission-mercury', targetId: 'mercury', label: 'Mercury Survey', briefing: 'Scan the cratered, sun-scorched surface of Mercury.' },
  { id: 'mission-venus', targetId: 'venus', label: 'Venus Cloud-Top Pass', briefing: 'Skim the thick golden clouds of Venus.' },
  { id: 'mission-earth', targetId: 'earth', label: 'Earth Orbit', briefing: 'Return home for a victory lap around Earth and the Moon.' },
  { id: 'mission-mars', targetId: 'mars', label: 'Mars Landing Approach', briefing: 'Trace the canyons and volcanoes of the Red Planet.' },
  { id: 'mission-jupiter', targetId: 'jupiter', label: 'Jupiter Storm Watch', briefing: 'Observe the Great Red Spot from a safe distance.' },
  { id: 'mission-saturn', targetId: 'saturn', label: 'Saturn Ring Transit', briefing: 'Weave past Saturn\u2019s spectacular ring system.' },
  { id: 'mission-uranus', targetId: 'uranus', label: 'Uranus Flyby', briefing: 'Visit the ice giant that spins on its side.' },
  { id: 'mission-neptune', targetId: 'neptune', label: 'Neptune Deep Space', briefing: 'Reach the windiest, most distant planet.' },
]

export function getMission(id: string): Mission | undefined {
  return MISSIONS.find((m) => m.id === id)
}
