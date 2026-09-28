import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import zh from './locales/zh-CN.json'

export const languageStorageKey = 'orbit-atlas-language'

export function resolveLanguage(language: string | null | undefined) {
  return language?.toLowerCase().startsWith('zh') ? 'zh-CN' : 'en'
}

function initialLanguage() {
  try {
    const saved = localStorage.getItem(languageStorageKey)
    if (saved === 'en' || saved === 'zh-CN') return saved
  } catch { return resolveLanguage(typeof navigator === 'undefined' ? 'en' : navigator.language) }
  return resolveLanguage(typeof navigator === 'undefined' ? 'en' : navigator.language)
}

function applyLanguage(language: string) {
  if (typeof document !== 'undefined') {
    document.documentElement.lang = language
    document.title = i18n.t('Orbit Atlas | An interactive solar system')
  }
  try { localStorage.setItem(languageStorageKey, language) } catch { return }
}

i18n.on('languageChanged', applyLanguage)
void i18n.use(initReactI18next).init({
  resources: { en: { translation: {} }, 'zh-CN': { translation: zh } },
  lng: initialLanguage(),
  fallbackLng: 'en',
  supportedLngs: ['en', 'zh-CN'],
  keySeparator: false,
  nsSeparator: false,
  interpolation: { escapeValue: false },
})

export default i18n