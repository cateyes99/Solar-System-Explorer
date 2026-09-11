import * as THREE from 'three'
import { simClock } from './clock'

export const AU_KM = 149_600_000
export const J2000_MS = Date.UTC(2000, 0, 1, 12, 0, 0)
export const DEG = Math.PI / 180
export const TAU = Math.PI * 2

/** Real days since J2000 plus simulated days advanced since the page opened. */
export function totalDaysSinceJ2000(): number {
  return (simClock.epochMs - J2000_MS) / 86_400_000 + simClock.simDays
}

/** Mean orbital angle in radians (approximation — circular orbits, mean longitudes). */
export function planetAngle(phase0Deg: number, periodDays: number): number {
  return phase0Deg * DEG + (TAU * totalDaysSinceJ2000()) / periodDays
}

/** Counterclockwise (prograde) orbit position when viewed from ecliptic north. */
export function orbitalPosition(radius: number, angle: number, out: THREE.Vector3): THREE.Vector3 {
  out.set(Math.cos(angle) * radius, 0, -Math.sin(angle) * radius)
  return out
}

export function moonAngle(): number {
  return 218.3 * DEG + (TAU * totalDaysSinceJ2000()) / 27.32
}

/** Current spin of a body. Negative rotation periods mean retrograde spin. */
export function spinAngle(rotationPeriodHours: number): number {
  const turns = (totalDaysSinceJ2000() * 24) / rotationPeriodHours
  return (turns % 1) * TAU
}

export function formatNumber(n: number): string {
  return n.toLocaleString('en-US')
}

export function formatKm(km: number): string {
  if (km >= 1_000_000) {
    return `${(km / 1_000_000).toLocaleString('en-US', { maximumFractionDigits: 1 })} million km`
  }
  return `${formatNumber(Math.round(km))} km`
}

export function formatTemperature(c: number): string {
  return `${c > 0 ? '+' : ''}${c}°C`
}

export function formatSimDate(ms: number): string {
  return new Date(ms).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

export function formatPeriod(days: number): string {
  if (days <= 0) return '—'
  if (days < 500) {
    return `${days.toLocaleString('en-US', { maximumFractionDigits: 1 })} Earth days`
  }
  return `${(days / 365.25).toLocaleString('en-US', { maximumFractionDigits: 1 })} Earth years`
}

export function formatRotation(hours: number): string {
  const abs = Math.abs(hours)
  const dir = hours < 0 ? ' (backwards!)' : ''
  if (abs < 48) return `${abs.toFixed(1)} hours${dir}`
  return `${(abs / 24).toFixed(1)} Earth days${dir}`
}
