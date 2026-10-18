import { useMemo } from 'react'
import { localeFor, useTranslation } from '../i18n'
import type { Language, Translate } from '../i18n'

/**
 * Human-friendly number formatting for the UI.
 *
 * Children should never see raw floats, and the *words* around the numbers have
 * to change with the language — so these formatters take the active language and
 * `t()` and are created by the `useFormatters()` hook.
 */
export interface Formatters {
  km: (value: number) => string
  kmExact: (value: number) => string
  days: (days: number) => string
  rotation: (hours: number) => string
  temperature: (celsius: number) => string
  speedMultiplier: (daysPerSecond: number) => string
  daysPerSecond: (daysPerSecond: number) => string
  simDate: (timeMs: number) => string
  distanceUnits: (value: number) => string
  percent: (value: number) => string
}

export function makeFormatters(language: Language, t: Translate): Formatters {
  const locale = localeFor(language)
  const numberFormat = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 })
  const dateFormat = new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  })

  return {
    km(value) {
      if (!Number.isFinite(value)) return '—'
      const abs = Math.abs(value)
      if (abs >= 1_000_000_000)
        return t('format.billionKm', { value: (value / 1_000_000_000).toFixed(2) })
      if (abs >= 1_000_000) return t('format.millionKm', { value: (value / 1_000_000).toFixed(1) })
      return t('format.km', { value: numberFormat.format(value) })
    },

    kmExact(value) {
      if (!Number.isFinite(value)) return '—'
      return t('format.km', { value: numberFormat.format(value) })
    },

    days(days) {
      const abs = Math.abs(days)
      if (abs >= 365.25) {
        const years = days / 365.25
        return t('format.earthYears', { value: years.toFixed(years >= 10 ? 0 : 1) })
      }
      if (abs >= 1) return t('format.earthDays', { value: days.toFixed(1) })
      return t('format.hours', { value: (days * 24).toFixed(1) })
    },

    rotation(hours) {
      const direction = hours < 0 ? t('format.backwards') : ''
      const abs = Math.abs(hours)
      if (abs >= 48) {
        const days = abs / 24
        return t('format.earthDays', { value: days.toFixed(days >= 10 ? 0 : 1) }) + direction
      }
      return t('format.hours', { value: abs.toFixed(1) }) + direction
    },

    temperature(celsius) {
      return `${Math.round(celsius)} °C`
    },

    speedMultiplier(daysPerSecond) {
      if (!Number.isFinite(daysPerSecond) || daysPerSecond <= 0) return t('format.paused')
      // One second of real time advancing one whole day is 86,400 times faster
      // than real life — worth spelling out, because it surprises people.
      const realTimeMultiplier = daysPerSecond * 86_400
      if (realTimeMultiplier >= 1_000_000_000)
        return t('format.billionTimes', { value: (realTimeMultiplier / 1_000_000_000).toFixed(1) })
      if (realTimeMultiplier >= 1_000_000)
        return t('format.millionTimes', { value: (realTimeMultiplier / 1_000_000).toFixed(1) })
      return t('format.times', { value: numberFormat.format(realTimeMultiplier) })
    },

    daysPerSecond(daysPerSecond) {
      if (daysPerSecond >= 365) {
        const years = daysPerSecond / 365.25
        return t('format.yearsPerSecond', { value: years.toFixed(years >= 10 ? 0 : 1) })
      }
      if (daysPerSecond >= 1) {
        return t(daysPerSecond === 1 ? 'format.dayPerSecond' : 'format.daysPerSecond', {
          value: daysPerSecond,
        })
      }
      const hours = daysPerSecond * 24
      if (hours >= 1) return t('format.hoursPerSecond', { value: hours.toFixed(1) })
      return t('format.minutesPerSecond', { value: Math.round(hours * 60) })
    },

    simDate(timeMs) {
      return dateFormat.format(new Date(timeMs))
    },

    distanceUnits(value) {
      return t('format.units', { value: value.toFixed(2) })
    },

    percent(value) {
      return `${Math.round(value * 100)}%`
    },
  }
}

/** The formatters bound to the active language. */
export function useFormatters(): Formatters {
  const { language, t } = useTranslation()
  return useMemo(() => makeFormatters(language, t), [language, t])
}
