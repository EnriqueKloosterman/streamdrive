import { createContext, useContext, useState, useCallback } from 'react'

import en from '../i18n/en.json'
import es from '../i18n/es.json'

const LOCALES = { en, es }
const STORAGE_KEY = 'streamdrive_language'

function getInitialLanguage() {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'es') return saved
  } catch {}
  return navigator.language?.startsWith('es') ? 'es' : 'en'
}

const I18nContext = createContext(null)

export function I18nProvider({ children }) {
  const [language, setLanguageState] = useState(getInitialLanguage)

  const setLanguage = useCallback((lang) => {
    setLanguageState(lang)
    try { localStorage.setItem(STORAGE_KEY, lang) } catch {}
  }, [])

  const t = useCallback((key, params = {}) => {
    const dict = LOCALES[language] || en
    let value = dict[key]
    if (value === undefined) {
      value = en[key] || key
    }
    return value.replace(/\{\{(\w+)\}\}/g, (_, k) => params[k] !== undefined ? params[k] : `{{${k}}}`)
  }, [language])

  const toggleLanguage = useCallback(() => {
    setLanguage(language === 'en' ? 'es' : 'en')
  }, [language, setLanguage])

  return (
    <I18nContext.Provider value={{ t, language, setLanguage, toggleLanguage }}>
      {children}
    </I18nContext.Provider>
  )
}

export function useI18n() {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n must be used within I18nProvider')
  return ctx
}
