import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'

import de from './locales/de/translation.json'
import en from './locales/en/translation.json'
import ua from './locales/ua/translation.json'

i18n.use(initReactI18next).init({
  resources: {
    de: { translation: de },
    en: { translation: en },
    ua: { translation: ua },
  },
  lng: 'de',
  fallbackLng: 'de',
  interpolation: { escapeValue: false },
})

export default i18n
