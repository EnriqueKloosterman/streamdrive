import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { useTheme } from '../contexts/ThemeContext'
import { useFetch } from '../hooks/useFetch'
import { useSync } from '../hooks/useSync'
import SearchBar from '../components/SearchBar'
import SyncButton from '../components/SyncButton'
import CourseCard from '../components/CourseCard'
import { useToast } from '../contexts/ToastContext'
import { LogOut, BookOpen, CheckCircle, XCircle, Sun, Moon } from 'lucide-react'

export default function Dashboard() {
  const { user, logout } = useAuth()
  const { theme, toggle: toggleTheme } = useTheme()
  const toast = useToast()
  const [filterTag, setFilterTag] = useState(null)
  const { data: courses, loading, error, refetch } = useFetch(`/api/courses${filterTag ? `?tag=${encodeURIComponent(filterTag)}` : ''}`)
  const { syncing, syncStatus, triggerSync } = useSync()

  useEffect(() => { document.title = 'Dashboard - StreamDrive Hub' }, [])

  const allTags = [...new Set((courses || []).flatMap(c => c.tags || []))].sort()
  const filteredCourses = courses || []

  const handleSync = () => {
    triggerSync()
  }

  useEffect(() => {
    if (!syncStatus || syncStatus.inProgress) return
    if (syncStatus.lastSyncResult?.error) {
      toast.error(`Sync failed: ${syncStatus.lastSyncResult.error}`)
    } else if (syncStatus.lastSyncResult) {
      const r = syncStatus.lastSyncResult
      toast.success(`Sync complete: ${r.totalCourses} courses, ${r.totalLessons} lessons`)
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
        <p style={{ color: 'var(--text-secondary)' }}>Loading courses...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
        <div className="text-center max-w-md">
          <XCircle size={48} className="mx-auto mb-4 text-red-400" />
          <p className="text-lg text-red-400 mb-2">Failed to load courses</p>
          <p className="text-sm mb-4" style={{ color: 'var(--text-secondary)' }}>{typeof error === 'string' ? error : error?.message || 'An unexpected error occurred'}</p>
          <button
            onClick={refetch}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors"
          >
            Retry
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
            <h1 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>StreamDrive Hub</h1>
          </div>
          <div className="flex items-center gap-4">
            <SearchBar />
            <SyncButton syncing={syncing} onSync={handleSync} />
            <button
              onClick={toggleTheme}
              className="p-2 rounded-lg transition-colors"
              style={{ color: 'var(--text-secondary)' }}
              title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} theme`}
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
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
                  title="Logout"
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
            <h2 className="text-2xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Courses</h2>
            <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Browse your learning content</p>
          </div>
          {syncStatus && !syncing && (
            <div className="text-right text-xs text-gray-500">
              {syncStatus.lastSyncResult?.error ? (
                <span className="flex items-center gap-1 text-red-400">
                  <XCircle size={12} /> Sync failed: {syncStatus.lastSyncResult.error}
                </span>
              ) : syncStatus.lastSyncAt ? (
                <span className="flex items-center gap-1 text-green-400">
                  <CheckCircle size={12} /> Last sync: {formatTime(syncStatus.lastSyncAt)}
                  {syncStatus.lastSyncResult?.totalCourses !== undefined && (
                    <> &middot; {syncStatus.lastSyncResult.totalCourses} courses, {syncStatus.lastSyncResult.totalLessons} lessons</>
                  )}
                </span>
              ) : null}
            </div>
          )}
        </div>

        {allTags.length > 0 && (
          <div className="mb-4 flex flex-wrap gap-2">
            <button
              onClick={() => setFilterTag(null)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${!filterTag ? 'bg-indigo-600 text-white' : ''}`}
              style={!filterTag ? {} : { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}
            >
              All
            </button>
            {allTags.map(tag => (
              <button
                key={tag}
                onClick={() => setFilterTag(tag)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-colors ${filterTag === tag ? 'bg-indigo-600 text-white' : ''}`}
                style={filterTag === tag ? {} : { backgroundColor: 'var(--card-bg)', color: 'var(--text-secondary)' }}
              >
                {tag}
              </button>
            ))}
          </div>
        )}

        {filteredCourses.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredCourses.map(course => (
              <CourseCard key={course.id} course={course} />
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <BookOpen size={48} className="mx-auto mb-4" style={{ color: 'var(--text-secondary)' }} />
            <p className="text-lg" style={{ color: 'var(--text-secondary)' }}>
              {filterTag ? `No courses with tag "${filterTag}"` : 'No courses yet'}
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              {filterTag ? 'Try a different filter' : 'Click Sync to fetch content from Google Drive'}
            </p>
          </div>
        )}
      </main>
    </div>
  )
}
