import type { PlanetData, ScaleMode } from '../types'

export const SCALE_LABELS: Record<ScaleMode, { name: string; short: string; description: string }> = {
  educational: {
    name: 'Educational scale',
    short: 'Balanced',
    description: 'Planet sizes and distances are gently compressed so every world is easy to discover.',
  },
  relative: {
    name: 'Relative size',
    short: 'True planet ratios',
    description: 'Planet diameters keep their real ratios. The Sun is reduced separately to fit the scene.',
  },
  distances: {
    name: 'Distances emphasized',
    short: 'Logarithmic distances',
    description: 'Orbital distances are spread using a logarithm. This reveals the pattern without a vast empty scene.',
  },
  custom: {
    name: 'Custom scale',
    short: 'Your laboratory',
    description: 'Adjust planet size and orbital spacing independently. This is a visual experiment, not a physical model.',
  },
}

export function getBodyRadius(
  body: PlanetData,
  mode: ScaleMode,
  customSize = 1,
): number {
  if (body.id === 'moon') return 0.22 * customSize
  if (body.id === 'sun') {
    if (mode === 'relative') return 12 * customSize
    return body.educationalRadius * customSize
  }

  if (mode === 'relative') {
    return Math.max(0.16, (body.diameterKm / 12742) * 0.52) * customSize
  }
  return body.educationalRadius * customSize
}

export function getOrbitRadius(
  body: PlanetData,
  mode: ScaleMode,
  customDistance = 1,
): number {
  if (body.id === 'moon') return 2.05
  if (mode === 'distances') {
    return 8 + Math.log10(body.distanceFromSunKm / 57_900_000 + 1) * 24
  }
  const base = mode === 'relative' ? body.orbitRadius * 1.55 : body.orbitRadius
  return base * customDistance
}

export function formatDistance(kilometres: number): string {
  if (kilometres === 0) return '0 km — it is the centre!'
  if (kilometres >= 1_000_000_000) return `${(kilometres / 1_000_000_000).toFixed(2)} billion km`
  return `${(kilometres / 1_000_000).toFixed(kilometres < 10_000_000 ? 2 : 0)} million km`
}

export function formatNumber(value: number): string {
  return new Intl.NumberFormat('en-US').format(Math.round(value))
}

export function formatYear(days: number): string {
  if (days === 0) return '—'
  if (days < 2) return `${days.toFixed(2)} Earth days`
  if (days < 730) return `${Math.round(days).toLocaleString()} Earth days`
  return `${(days / 365.25).toFixed(days < 40_000 ? 1 : 0)} Earth years`
}

export function formatDay(hours: number): string {
  const absolute = Math.abs(hours)
  const direction = hours < 0 ? ' (backwards)' : ''
  if (absolute < 48) return `${absolute.toFixed(1)} hours${direction}`
  return `${(absolute / 24).toFixed(absolute > 1000 ? 0 : 1)} Earth days${direction}`
}
