import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { useFetch } from '../hooks/useFetch'
import { useSync } from '../hooks/useSync'
import SearchBar from '../components/SearchBar'
import SyncButton from '../components/SyncButton'
import CourseCard from '../components/CourseCard'
import Pagination from '../components/Pagination'
import { useToast } from '../contexts/ToastContext'
import { LogOut, BookOpen, CheckCircle, XCircle, Sun, Moon, Languages } from 'lucide-react'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const { t, language, toggleLanguage } = useI18n()
  const toast = useToast()
  const [filterTag, setFilterTag] = useState(null)
  const [page, setPage] = useState(1)

  const params = new URLSearchParams()
  if (filterTag) params.set('tag', filterTag)
  params.set('page', page)
  params.set('limit', '12')

  const { data, loading, error, refetch } = useFetch(`/api/courses?${params}`)
  const { syncing, syncStatus, triggerSync } = useSync()

  const courses = data?.courses || []
  const totalPages = data?.totalPages || 0

  const handleTagClick = (tag) => {
    setFilterTag(tag)
    setPage(1)
  }

  useEffect(() => { document.title = t('dashboard.title') }, [t])

  const allTags = [...new Set((courses || []).flatMap(c => c.tags || []))].sort()

  const handleSync = () => {
    triggerSync()
  }

  useEffect(() => {
    if (!syncStatus || syncStatus.inProgress) return
    if (syncStatus.lastSyncResult?.error) {
      toast.error(t('dashboard.syncFailed', { error: syncStatus.lastSyncResult.error }))
    } else if (syncStatus.lastSyncResult) {
      const r = syncStatus.lastSyncResult
      toast.success(t('dashboard.syncComplete', { courses: r.totalCourses, lessons: r.totalLessons }))
    }
    refetch()
  }, [syncStatus])

  const formatTime = (date) => {
    if (!date) return ''
    return new Date(date).toLocaleTimeString()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>{t('dashboard.loading')}</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className="text-center max-w-md">
          <XCircle size={48} className="mx-auto mb-4 text-red-400" />
          <p className="text-lg text-red-400 mb-2">{t('dashboard.error.title')}</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{typeof error === 'string' ? error : error?.message || 'An unexpected error occurred'}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors"
          >
            {t('dashboard.error.retry')}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--page-bg)' }}>
      <header className="border-b sticky top-0 z-10 backdrop-blur-sm" style={{ backgroundColor: 'var(--surface-bg)', borderColor: 'var(--border)' }}>
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpen size={24} className="text-indigo-400" />
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{t('app.title')}</h1>
          </div>
          <div className="flex items-center gap-4">
            <SearchBar />
            <SyncButton syncing={syncing} onSync={handleSync} />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title={t('theme.switch', { theme: theme === 'dark' ? t('theme.light') : t('theme.dark') })}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button
              onClick={toggleLanguage}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title={language === 'en' ? t('language.switch') : t('language.switchEs')}
            >
              <Languages size={18} />
              <span className="text-xs ml-1 font-medium uppercase">{language}</span>
            </button>
            {user && (
              <div className="flex items-center gap-3">
                <img
                  src={user.picture}
                  alt={user.name}
                  className="w-8 h-8 rounded-full"
                />
                <button
                  onClick={logout}
                  className="transition-colors"
                  style={{ color: 'var(--text-secondary)' }}
                  title={t('dashboard.logout')}
                >
                  <LogOut size={18} />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>{t('dashboard.courses')}</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>{t('dashboard.subtitle')}</p>
          </div>
          {syncStatus && !syncing && (
            <div className="text-right text-xs text-gray-500">
              {syncStatus.lastSyncResult?.error ? (
                <span className="flex items-center gap-1 text-red-400">
                  <XCircle size={12} /> {t('dashboard.syncFailed', { error: syncStatus.lastSyncResult.error })}
                </span>
              ) : syncStatus.lastSyncAt ? (
                <span className="flex items-center gap-1 text-green-400">
                  <CheckCircle size={12} /> {t('dashboard.lastSync', { time: formatTime(syncStatus.lastSyncAt) })}
                  {syncStatus.lastSyncResult?.totalCourses !== undefined && (
                    <> &middot; {t('dashboard.syncStats', { courses: syncStatus.lastSyncResult.totalCourses, lessons: syncStatus.lastSyncResult.totalLessons })}</>
                  )}
                </span>
              ) : null}
            </div>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => handleTagClick(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!filterTag ? 'bg-indigo-600 text-white' : ''}`}
              style={!filterTag ? {} : { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}
            >
              {t('dashboard.filterAll')}
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => handleTagClick(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterTag === tag ? 'bg-indigo-600 text-white' : ''}`}
                style={filterTag === tag ? {} : { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {courses.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map(course => (
                <CourseCard key={course.id} course={course} />
              ))}
            </div>
            <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
          </>
        ) : (
          <div className="text-center py-20">
            <BookOpen size={48} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              {filterTag ? t('dashboard.noCourses.tag', { tag: filterTag }) : t('dashboard.noCourses')}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {filterTag ? t('dashboard.noCourses.tagHint') : t('dashboard.noCourses.hint')}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
