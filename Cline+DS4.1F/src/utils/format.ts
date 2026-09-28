/** Human-friendly number formatting for the UI. Children should never see raw floats. */

const numberFormat = new Intl.NumberFormat('en-US', { maximumFractionDigits: 0 })

export function formatKm(value: number): string {
  if (!Number.isFinite(value)) return '—'
  const abs = Math.abs(value)
  if (abs >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(2)} billion km`
  if (abs >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} million km`
  return `${numberFormat.format(value)} km`
}

export function formatKmExact(value: number): string {
  if (!Number.isFinite(value)) return '—'
  return `${numberFormat.format(value)} km`
}

export function formatDays(days: number): string {
  const abs = Math.abs(days)
  if (abs >= 365.25) {
    const years = days / 365.25
    return `${years.toFixed(years >= 10 ? 0 : 1)} Earth years`
  }
  if (abs >= 1) return `${days.toFixed(1)} Earth days`
  return `${(days * 24).toFixed(1)} hours`
}

export function formatRotation(hours: number): string {
  const direction = hours < 0 ? ' (backwards)' : ''
  const abs = Math.abs(hours)
  if (abs >= 48) {
    const days = abs / 24
    return `${days.toFixed(days >= 10 ? 0 : 1)} Earth days${direction}`
  }
  return `${abs.toFixed(1)} hours${direction}`
}

export function formatTemperature(celsius: number): string {
  return `${celsius > 0 ? '' : ''}${Math.round(celsius)} °C`
}

export function formatSpeedMultiplier(daysPerSecond: number): string {
  if (!Number.isFinite(daysPerSecond) || daysPerSecond <= 0) return 'paused'
  // One second of real time advancing one whole day is 86,400 times faster than
  // real life — worth spelling out, because it is the number that surprises people.
  const realTimeMultiplier = daysPerSecond * 86_400
  if (realTimeMultiplier >= 1_000_000_000) {
    return `${(realTimeMultiplier / 1_000_000_000).toFixed(1)} billion × real time`
  }
  if (realTimeMultiplier >= 1_000_000) {
    return `${(realTimeMultiplier / 1_000_000).toFixed(1)} million × real time`
  }
  return `${numberFormat.format(realTimeMultiplier)}× real time`
}

export function formatDaysPerSecond(daysPerSecond: number): string {
  if (daysPerSecond >= 365) {
    const years = daysPerSecond / 365.25
    return `${years.toFixed(years >= 10 ? 0 : 1)} years / second`
  }
  if (daysPerSecond >= 1) return `${daysPerSecond} day${daysPerSecond === 1 ? '' : 's'} / second`
  return `${(daysPerSecond * 24).toFixed(1)} hours / second`
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: '2-digit',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatSimDate(timeMs: number): string {
  return dateFormat.format(new Date(timeMs))
}

export function formatDistanceUnits(value: number): string {
  return `${value.toFixed(2)} units`
}

export function formatPercent(value: number): string {
  return `${Math.round(value * 100)}%`
}