import { useMemo } from 'react'
import { useSimulationStore } from '../store/simulationStore'
import { en } from './en'
import type { TranslationKey } from './en'
import { zh } from './zh'

export type { TranslationKey }

/** The languages the interface can be shown in. */
export type Language = 'en' | 'zh'

export type TranslateParams = Record<string, string | number>

/** A key-to-text lookup already bound to the current language. */
export type Translate = (key: string, params?: TranslateParams) => string

/**
 * The interface dictionaries.
 *
 * `en` is the source of truth for the key set; `zh` is typed against it, so a
 * missing Chinese string is a compile error rather than a silent English leak.
 */
const DICTIONARIES: Record<Language, Record<string, string | undefined>> = {
  en: en as unknown as Record<string, string | undefined>,
  zh: zh as unknown as Record<string, string | undefined>,
}

/** Offered in the language picker. */
export const LANGUAGES: { id: Language; native: string; english: string }[] = [
  { id: 'en', native: 'English', english: 'English' },
  { id: 'zh', native: '汉语', english: 'Hanyu (Chinese)' },
]

export const DEFAULT_LANGUAGE: Language = 'en'

/** Looks a key up in the chosen dictionary, then English, then the key itself. */
export function translate(language: Language, key: string, params?: TranslateParams): string {
  let value = DICTIONARIES[language]?.[key] ?? en[key as TranslationKey] ?? key
  if (params) {
    for (const name of Object.keys(params)) {
      value = value.split(`{${name}}`).join(String(params[name]))
    }
  }
  return value
}

/** The current language plus a `t()` bound to it. */
export function useTranslation(): { language: Language; t: Translate } {
  const language = useSimulationStore((state) => state.language)
  return useMemo(() => ({ language, t: (key, params) => translate(language, key, params) }), [
    language,
  ])
}

/** The `Intl` locale for a language, so numbers and dates follow it too. */
export function localeFor(language: Language): string {
  return language === 'zh' ? 'zh-CN' : 'en-GB'
}
