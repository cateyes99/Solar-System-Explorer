const numberFormat = new Intl.NumberFormat('en-US')

export function formatNumber(value: number, maximumFractionDigits = 0): string {
  return value.toLocaleString('en-US', { maximumFractionDigits })
}

export function formatKm(km: number): string {
  if (km >= 1e9) return `${formatNumber(km / 1e9, 2)} billion km`
  if (km >= 1e6) return `${formatNumber(km / 1e6, 1)} million km`
  return `${numberFormat.format(Math.round(km))} km`
}

export function formatDays(days: number): string {
  const years = days / 365.25
  if (years >= 1e6) return `≈ ${formatNumber(years / 1e6, 0)} million years`
  if (years >= 2) return `${formatNumber(years, 1)} Earth years`
  if (days >= 2) return `${formatNumber(days, 0)} Earth days`
  return `${formatNumber(days * 24, 1)} hours`
}

export function formatHours(hours: number): string {
  if (hours >= 72) return `${formatNumber(hours / 24, 0)} Earth days`
  return `${formatNumber(hours, 1)} hours`
}

export function formatTemperature(celsius: number): string {
  return `${celsius > 0 ? '' : celsius < 0 ? '−' : ''}${numberFormat.format(Math.abs(celsius))}°C`
}

export function formatDuration(seconds: number): string {
  if (seconds < 60) return `${formatNumber(seconds, 1)} seconds`
  const minutes = seconds / 60
  if (minutes < 60) {
    const m = Math.floor(minutes)
    const s = Math.round(seconds - m * 60)
    return s > 0 ? `${m} min ${s} s` : `${m} minutes`
  }
  const hours = minutes / 60
  if (hours < 48) return `${formatNumber(hours, 1)} hours`
  const days = hours / 24
  if (days < 730) return `${formatNumber(days, 0)} days`
  return `${formatNumber(days / 365.25, days > 3650 ? 0 : 1)} years`
}

const dateFormat = new Intl.DateTimeFormat('en-GB', {
  day: 'numeric',
  month: 'short',
  year: 'numeric',
  timeZone: 'UTC',
})

export function formatDate(date: Date): string {
  if (Number.isNaN(date.getTime())) return '—'
  const year = date.getUTCFullYear()
  if (year < 1 || year > 9999) return `Year ${year}`
  return dateFormat.format(date)
}

export function formatSpeedLabel(daysPerSecond: number): string {
  if (daysPerSecond === 0) return 'Paused'
  if (daysPerSecond < 1) return `1 second = ${formatNumber(daysPerSecond * 24, 1)} hours`
  if (daysPerSecond === 1) return '1 second = 1 day'
  if (daysPerSecond < 28) return `1 second = ${formatNumber(daysPerSecond, 0)} days`
  if (daysPerSecond < 360) return `1 second = ${formatNumber(daysPerSecond / 30.44, 0)} month${daysPerSecond >= 45 ? 's' : ''}`
  return `1 second = ${formatNumber(daysPerSecond / 365.25, 1)} year${daysPerSecond >= 548 ? 's' : ''}`
}
