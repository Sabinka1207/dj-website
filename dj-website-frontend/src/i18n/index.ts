import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import de from './locales/de/translation.json'
import en from './locales/en/translation.json'
import ua from './locales/ua/translation.json'

function detectLanguage(): string {
  const saved = localStorage.getItem('lang')
  if (saved === 'de' || saved === 'en' || saved === 'ua') return saved

  const browser = navigator.language.toLowerCase()
  if (browser.startsWith('de')) return 'de'
  if (browser.startsWith('uk') || browser.startsWith('ru')) return 'ua'
  return 'en'
}

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
    ua: { translation: ua },
  },
  lng: detectLanguage(),
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export default i18n
