import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useI18n } from '../contexts/I18nContext'
import { useTheme } from '../contexts/ThemeContext'
import {
  BookOpen, Play, RefreshCw, Search, Layers,
  Sun, Moon, Globe, ChevronRight, Sparkles, ArrowUpRight
} from 'lucide-react'

const features = [
  { icon: Play, key: 'feature1' },
  { icon: RefreshCw, key: 'feature2' },
  { icon: Search, key: 'feature3' },
  { icon: Layers, key: 'feature4' },
]

const steps = [
  { icon: BookOpen, key: 'step1' },
  { icon: RefreshCw, key: 'step2' },
  { icon: Play, key: 'step3' },
]

export default function Landing() {
  const { user } = useAuth()
  const { t, language, setLanguage } = useI18n()
  const { theme, toggle: toggleTheme } = useTheme()
  const navigate = useNavigate()

  useEffect(() => { document.title = t('landing.title') }, [t])
  useEffect(() => {
    if (user) navigate('/dashboard', { replace: true })
  }, [user, navigate])

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--page-bg)' }}>
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 backdrop-blur-md border-b" style={{ borderColor: 'var(--border)', backgroundColor: 'color-mix(in srgb, var(--page-bg) 80%, transparent)' }}>
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
              <BookOpen size={18} className="text-white" />
            </div>
            <span className="font-semibold text-lg" style={{ color: 'var(--text-primary)' }}>{t('app.title')}</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setLanguage(language === 'en' ? 'es' : 'en')}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              <Globe size={15} />
              {language.toUpperCase()}
            </button>
            <button
              onClick={toggleTheme}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm"
              style={{ color: 'var(--text-secondary)' }}
            >
              {theme === 'dark' ? <Sun size={15} /> : <Moon size={15} />}
            </button>
            <a
              href="/api/auth/google"
              className="px-5 py-2 rounded-lg font-medium text-sm transition-all hover:scale-105"
              style={{
                backgroundColor: 'var(--text-primary)',
                color: 'var(--page-bg)',
                boxShadow: '0 0 20px color-mix(in srgb, var(--text-primary) 15%, transparent)',
              }}
            >
              {t('landing.signIn')}
            </a>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="pt-36 pb-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium mb-8 animate-slide-up"
            style={{ backgroundColor: 'color-mix(in srgb, var(--text-primary) 6%, transparent)', color: 'var(--text-secondary)', border: '1px solid', borderColor: 'var(--border)' }}>
            <Sparkles size={12} />
            {t('landing.badge')}
          </div>

          <h1 className="text-5xl sm:text-6xl font-bold leading-tight mb-6"
            style={{ color: 'var(--text-primary)' }}>
            {t('landing.heroTitle')}
            <br />
            <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
              {t('landing.heroTitleAccent')}
            </span>
          </h1>

          <p className="text-lg sm:text-xl max-w-2xl mx-auto mb-10 leading-relaxed"
            style={{ color: 'var(--text-secondary)' }}>
            {t('landing.heroSubtitle')}
          </p>

          <div className="flex items-center justify-center gap-4">
            <a
              href="/api/auth/google"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-lg"
              style={{
                backgroundColor: 'var(--text-primary)',
                color: 'var(--page-bg)',
                boxShadow: '0 0 30px color-mix(in srgb, var(--text-primary) 20%, transparent)',
              }}
            >
              {t('landing.cta')}
              <ChevronRight size={18} />
            </a>
            <a href="#features"
              className="inline-flex items-center gap-2 px-7 py-3 rounded-xl font-medium transition-all hover:scale-105"
              style={{ border: '1px solid', borderColor: 'var(--border)', color: 'var(--text-secondary)' }}
            >
              {t('landing.learnMore')}
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              {t('landing.featuresTitle')}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t('landing.featuresSubtitle')}
            </p>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => {
              const Icon = f.icon
              return (
                <div
                  key={f.key}
                  className="group rounded-2xl p-6 transition-all hover:-translate-y-1"
                  style={{
                    backgroundColor: 'var(--surface-bg)',
                    border: '1px solid',
                    borderColor: 'var(--border)',
                  }}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4 text-indigo-400 transition-colors group-hover:bg-indigo-500 group-hover:text-white"
                    style={{ backgroundColor: 'color-mix(in srgb, var(--text-primary) 6%, transparent)' }}>
                    <Icon size={22} />
                  </div>
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {t(`landing.${f.key}Title`)}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {t(`landing.${f.key}Desc`)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
              {t('landing.howTitle')}
            </h2>
            <p style={{ color: 'var(--text-secondary)' }}>
              {t('landing.howSubtitle')}
            </p>
          </div>

          <div className="grid sm:grid-cols-3 gap-8">
            {steps.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.key} className="text-center">
                  <div className="relative inline-flex mb-6">
                    <div className="w-16 h-16 rounded-2xl flex items-center justify-center text-indigo-400 text-2xl"
                      style={{ backgroundColor: 'color-mix(in srgb, var(--text-primary) 6%, transparent)' }}>
                      <Icon size={28} />
                    </div>
                    <span className="absolute -top-2 -right-2 w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white bg-indigo-500">
                      {i + 1}
                    </span>
                  </div>
                  <h3 className="font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>
                    {t(`landing.${s.key}Title`)}
                  </h3>
                  <p className="text-sm leading-relaxed" style={{ color: 'var(--text-secondary)' }}>
                    {t(`landing.${s.key}Desc`)}
                  </p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-3xl mx-auto text-center rounded-3xl p-12 sm:p-16"
          style={{
            backgroundColor: 'var(--surface-bg)',
            border: '1px solid',
            borderColor: 'var(--border)',
          }}>
          <h2 className="text-3xl sm:text-4xl font-bold mb-4" style={{ color: 'var(--text-primary)' }}>
            {t('landing.ctaTitle')}
          </h2>
          <p className="mb-8" style={{ color: 'var(--text-secondary)' }}>
            {t('landing.ctaSubtitle')}
          </p>
          <a
            href="/api/auth/google"
            className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl font-semibold transition-all hover:scale-105 hover:shadow-lg text-base"
            style={{
              backgroundColor: 'var(--text-primary)',
              color: 'var(--page-bg)',
              boxShadow: '0 0 30px color-mix(in srgb, var(--text-primary) 20%, transparent)',
            }}
          >
            {t('landing.ctaButton')}
            <ArrowUpRight size={18} />
          </a>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t" style={{ borderColor: 'var(--border)' }}>
        <div className="max-w-6xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-4 text-sm" style={{ color: 'var(--text-secondary)' }}>
          <span>&copy; {new Date().getFullYear()} {t('app.title')}</span>
          <span>{t('landing.footer')}</span>
        </div>
      </footer>
    </div>
  )
}
