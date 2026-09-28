const AU_KM = 149_600_000

export function formatDiameter(km: number): string {
  return `${Math.round(km).toLocaleString()} km`
}

export function formatDistance(km: number): string {
  const au = km / AU_KM
  if (km >= 1_000_000_000) {
    return `${(km / 1_000_000_000).toFixed(2)} billion km (${au.toFixed(1)} AU)`
  }
  return `${(km / 1_000_000).toFixed(1)} million km (${au.toFixed(2)} AU)`
}

export function formatOrbitalPeriod(days: number): string {
  if (days >= 500) {
    return `${(days / 365.25).toFixed(1)} Earth years`
  }
  return `${Math.round(days)} Earth days`
}

export function formatRotationPeriod(hours: number): string {
  const abs = Math.abs(hours)
  const label = abs >= 48 ? `${(abs / 24).toFixed(1)} Earth days` : `${abs.toFixed(1)} hours`
  return hours < 0 ? `${label} (spins backwards!)` : label
}
