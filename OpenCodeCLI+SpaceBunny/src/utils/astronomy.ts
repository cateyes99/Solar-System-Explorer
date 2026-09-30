import { AU_KM, MOONS, PLANET_BY_ID, PLANETS, SUN } from '../data/planets'
import type { BodyId, PlanetId } from '../types'

/** Light travel time between two bodies, in seconds, using current distances. */
export function lightTravelSeconds(distanceKm: number): number {
  return distanceKm / 299_792.458
}

export function formatLightTravel(distanceKm: number): string {
  const seconds = lightTravelSeconds(distanceKm)
  if (seconds < 90) return `${Math.round(seconds)} seconds`
  const minutes = seconds / 60
  if (minutes < 90) return `${minutes.toFixed(1)} minutes`
  const hours = minutes / 60
  if (hours < 48) return `${hours.toFixed(1)} hours`
  return `${(hours / 24).toFixed(1)} days`
}

export function formatDistanceKm(km: number): string {
  if (km >= 1e9) return `${(km / 1e9).toFixed(2)} billion km`
  if (km >= 1e6) return `${(km / 1e6).toFixed(1)} million km`
  if (km >= 1e3) return `${(km / 1e3).toFixed(0)},000 km`
  return `${km.toFixed(0)} km`
}

export function distanceFromSunKm(planetId: PlanetId): number {
  return PLANET_BY_ID[planetId].semiMajorAxisAU * AU_KM
}

export function formatYears(days: number): string {
  if (days < 400) return `${days.toFixed(days < 20 ? 1 : 0)} Earth days`
  const years = days / 365.256
  if (years < 1000) return `${years.toFixed(years < 10 ? 1 : 0)} Earth years`
  return `${Math.round(years).toLocaleString()} Earth years`
}

export function formatDayHours(hours: number): string {
  const abs = Math.abs(hours)
  const retrograde = hours < 0
  const body = abs >= 48 ? `${(abs / 24).toFixed(1)} Earth days` : `${abs.toFixed(1)} Earth hours`
  return retrograde ? `${body} (retrograde — spins backwards)` : body
}

export function formatTemperature(celsius: number): string {
  return `${celsius > 0 ? '' : '−'}${Math.abs(celsius).toLocaleString()} °C`
}

export function formatNumber(value: number): string {
  return value.toLocaleString('en-US')
}

/** Rough "how many Earths fit inside" for a sphere comparison. */
export function earthVolumesInside(diameterKm: number): number {
  return Math.pow(diameterKm / 12_742, 3)
}

/** Light time from the Sun to a body, e.g. "8 min 20 sec". */
export function sunLightTime(planetId: PlanetId): string {
  return formatLightTravel(distanceFromSunKm(planetId))
}

export const ALL_BODY_IDS: BodyId[] = ['sun', ...PLANETS.map((p) => p.id)]

export function bodyName(id: BodyId | 'system'): string {
  if (id === 'system') return 'The Solar System'
  if (id === 'sun') return 'The Sun'
  if (id === 'moon') return 'The Moon'
  if (id === 'comet') return 'A Comet’s Tail'
  return PLANET_BY_ID[id].name
}

/** Resolves any registry id — including moons and the comet — to a display name. */
export function resolveBodyName(id: string): string {
  if (id === 'system') return 'The Solar System'
  const known = Object.prototype.hasOwnProperty.call(PLANET_BY_ID, id) ? PLANET_BY_ID[id as PlanetId] : null
  if (known) return known.name
  const moon = MOONS.find((m) => m.id === id)
  if (moon) return moon.name
  return bodyName(id as BodyId)
}

/** Short type label used in tooltips. */
export function resolveBodyType(id: string): string {
  if (id === 'sun') return 'Star'
  if (id === 'comet') return 'Comet'
  const planet = Object.prototype.hasOwnProperty.call(PLANET_BY_ID, id) ? PLANET_BY_ID[id as PlanetId] : null
  if (planet) return planet.type
  const moon = MOONS.find((m) => m.id === id)
  if (moon) return `Moon of ${PLANET_BY_ID[moon.parentId].name}`
  return 'Body'
}

/** Diameter in km, if known. */
export function resolveDiameterKm(id: string): number | null {
  const planet = Object.prototype.hasOwnProperty.call(PLANET_BY_ID, id) ? PLANET_BY_ID[id as PlanetId] : null
  if (planet) return planet.diameterKm
  if (id === 'sun') return SUN.diameterKm
  const moon = MOONS.find((m) => m.id === id)
  return moon ? moon.diameterKm : null
}