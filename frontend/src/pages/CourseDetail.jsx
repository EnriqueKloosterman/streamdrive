import { useState, useRef, useEffect, useCallback } from 'react'
import { useParams } from 'react-router-dom'
import { useFetch } from '../hooks/useFetch'
import Sidebar from '../components/Sidebar'
import Player from '../components/Player'
import MarkdownRenderer from '../components/MarkdownRenderer'
import { ChevronLeft, FileText, Video, FileDown, Sun, Moon, Edit3, Menu, X as CloseIcon, BarChart3, Languages } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useTheme } from '../contexts/ThemeContext'
import { useI18n } from '../contexts/I18nContext'
import { useToast } from '../contexts/ToastContext'
import api from '../lib/api'

export default function CourseDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { data: course, loading, error } = useFetch(`/api/courses/${id}`)
  const [localLessons, setLocalLessons] = useState(null)
  const [selectedLessonId, setSelectedLessonId] = useState(null)
  const [editingSummary, setEditingSummary] = useState(false)
  const [summaryText, setSummaryText] = useState('')
  const [progress, setProgress] = useState({})
  const summaryRef = useRef(null)
  const { theme, toggle: toggleTheme } = useTheme()
  const { t, language, toggleLanguage } = useI18n()
  const toast = useToast()
  const [sidebarOpen, setSidebarOpen] = useState(window.innerWidth >= 1024)

  const lessons = localLessons || course?.lessons || []
  const selectedLesson = lessons.find(l => l.id === selectedLessonId) || lessons?.[0]
  const streamUrl = selectedLesson ? `/api/lessons/${selectedLesson.id}/stream` : null
  const initialTime = selectedLesson ? (progress[selectedLesson.id]?.currentTime || 0) : 0
  const completedCount = lessons.filter(l => progress[l.id]?.completed).length
  const progressPct = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0

  useEffect(() => {
    if (!course?.id) return
    api.get(`/api/progress/${course.id}`).then(r => setProgress(r.data)).catch(() => {})
  }, [course?.id])

  useEffect(() => {
    if (selectedLesson) document.title = t('courseDetail.title', { lesson: selectedLesson.title, course: course?.title || 'Course' })
    else if (course) document.title = t('courseDetail.titleNoLesson', { course: course.title })
  }, [course, selectedLesson])

  const handleProgress = useCallback((currentTime) => {
    if (!selectedLesson) return
    api.post('/api/progress', {
      lessonId: selectedLesson.id,
      currentTime,
    }).catch(() => {})
  }, [selectedLesson])

  const handleToggleComplete = useCallback(async () => {
    if (!selectedLesson) return
    const current = progress[selectedLesson.id]
    const wasCompleted = current?.completed
    const completed = !wasCompleted
    setProgress(prev => ({
      ...prev,
      [selectedLesson.id]: { ...prev[selectedLesson.id], completed, currentTime: 0 },
    }))
    try {
      if (completed) {
        await api.post('/api/progress/complete', { lessonId: selectedLesson.id })
      } else {
        await api.post('/api/progress', { lessonId: selectedLesson.id, currentTime: 0, completed: false })
      }
    } catch (e) {
      toast.error(t('courseDetail.completionFailed'))
      console.error('Failed to toggle completion:', e)
    }
  }, [selectedLesson, progress])

  const handleAutoComplete = useCallback(() => {
    if (!selectedLesson) return
    setProgress(prev => ({
      ...prev,
      [selectedLesson.id]: { ...prev[selectedLesson.id], completed: true, currentTime: 0 },
    }))
    api.post('/api/progress/complete', { lessonId: selectedLesson.id }).catch(() => {})
  }, [selectedLesson])

  const handleThumbnailCaptured = useCallback(() => {
    if (!selectedLesson) return
    setLocalLessons(prev =>
      (prev || course?.lessons || []).map(l =>
        l.id === selectedLesson.id ? { ...l, thumbnail_url: `/thumbnails/${selectedLesson.id}.jpg` } : l
      )
    )
  }, [selectedLesson, course])

  const handleSaveSummary = async () => {
    if (!selectedLesson) return
    try {
      await api.put(`/api/lessons/${selectedLesson.id}`, { summary: summaryText })
      setLocalLessons(prev =>
        (prev || course.lessons).map(l =>
          l.id === selectedLesson.id ? { ...l, summary: summaryText } : l
        )
      )
      setEditingSummary(false)
      toast.success(t('courseDetail.summarySaved'))
    } catch (err) {
      toast.error(t('courseDetail.summarySaveFailed'))
      console.error('Failed to save summary:', err)
    }
  }

  const handleExportPdf = () => {
    if (!selectedLesson || !summaryRef.current) return
    const content = summaryRef.current.innerHTML
    const win = window.open('', '_blank', 'noopener,noreferrer')
    if (!win) return
    win.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${selectedLesson.title}</title>
        <style>
          body { font-family: system-ui, sans-serif; padding: 2rem; line-height: 1.6; color: #111; max-width: 800px; margin: 0 auto; }
          h1 { font-size: 1.5rem; margin-bottom: 0.5rem; }
          pre, code { background: #f4f4f4; padding: 0.2em 0.4em; border-radius: 3px; font-size: 0.9em; }
          pre code { padding: 0; }
          pre { padding: 1rem; overflow-x: auto; }
          img { max-width: 100%; }
          @media print { body { padding: 0; } }
        </style>
      </head>
      <body>
        <h1>${selectedLesson.title}</h1>
        <hr>
        ${content}
      </body>
      </html>
    `)
    win.document.close()
    win.print()
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
        <p style={{ color: 'var(--text-secondary)' }}>{t('courseDetail.loading')}</p>
      </div>
    )
  }

  if (error || !course) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--page-bg)' }}>
        <p className="text-red-400">{error?.message || t('courseDetail.notFound')}</p>
      </div>
    )
  }

  const handleChaptersChange = async (chapters) => {
    if (!selectedLesson) return
    setLocalLessons(prev =>
      (prev || course.lessons).map(l =>
        l.id === selectedLesson.id ? { ...l, chapters } : l
      )
    )
    try {
      await api.put(`/api/lessons/${selectedLesson.id}`, { chapters })
    } catch (err) {
      toast.error(t('courseDetail.chaptersSaveFailed'))
      console.error('Failed to save chapters:', err)
    }
  }

  return (
    <div className="h-screen flex" style={{ backgroundColor: 'var(--page-bg)' }}>
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
      <div className={`${sidebarOpen ? 'fixed left-0 top-0 z-40 lg:relative lg:z-auto' : 'hidden lg:flex'}`}>
        <Sidebar
          lessons={lessons}
          currentLessonId={selectedLesson?.id}
          onSelectLesson={(id) => { setSelectedLessonId(id); setSidebarOpen(false) }}
          progress={progress}
          onClose={() => setSidebarOpen(false)}
        />
      </div>

      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="border-b px-4 py-3 flex items-center gap-3" style={{ backgroundColor: 'var(--surface-bg)', borderColor: 'var(--border)' }}>
          <button
            onClick={() => setSidebarOpen(prev => !prev)}
            className="lg:hidden relative z-50 p-2 rounded-lg transition-colors"
            style={{
              color: 'var(--text-primary)',
              backgroundColor: 'var(--card-bg)',
              border: '1px solid var(--border)',
            }}
            title={sidebarOpen ? t('courseDetail.closeSidebar') : t('courseDetail.openSidebar')}
          >
            {sidebarOpen ? <CloseIcon size={18} /> : <Menu size={18} />}
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <ChevronLeft size={20} />
          </button>
          <button
            onClick={toggleTheme}
            className="p-1.5 rounded-lg transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title={t('theme.switch', { theme: theme === 'dark' ? t('theme.light') : t('theme.dark') })}
          >
            {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
          </button>
          <button
            onClick={toggleLanguage}
            className="p-1.5 rounded-lg transition-colors flex items-center gap-1"
            style={{ color: 'var(--text-secondary)' }}
            title={language === 'en' ? t('language.switch') : t('language.switchEs')}
          >
            <Languages size={14} />
            <span className="text-xs font-medium uppercase">{language}</span>
          </button>
          <div className="flex-1 min-w-0">
            <h1 className="text-lg font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{course?.title}</h1>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 max-w-40 h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{ width: `${progressPct}%`, backgroundColor: progressPct === 100 ? '#22c55e' : '#818cf8' }}
                />
              </div>
              <span className="text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>
                <BarChart3 size={12} className="inline mr-0.5" />
                {completedCount}/{lessons.length}
              </span>
            </div>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col overflow-y-auto p-6">
            {course?.image_url && (
              <div className="mb-6 rounded-xl overflow-hidden max-w-4xl">
                <img
                  src={course.image_url}
                  alt={course.title}
                  className="w-full object-cover max-h-48"
                  onError={e => { e.target.style.display = 'none' }}
                />
              </div>
            )}
            {selectedLesson && (
              <>
                <div className="mb-4 flex items-center gap-2">
                  <Video size={16} className="text-indigo-400" />
                  <h2 className="text-xl font-semibold" style={{ color: 'var(--text-primary)' }}>{selectedLesson.title}</h2>
                  <button
                    onClick={handleToggleComplete}
                    className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors"
                    style={{
                      backgroundColor: progress[selectedLesson.id]?.completed ? 'rgba(34,197,94,0.15)' : 'var(--card-bg)',
                      color: progress[selectedLesson.id]?.completed ? '#22c55e' : 'var(--text-secondary)',
                      border: `1px solid ${progress[selectedLesson.id]?.completed ? 'rgba(34,197,94,0.3)' : 'var(--border)'}`,
                    }}
                  >
                    {progress[selectedLesson.id]?.completed ? t('courseDetail.completed') : t('courseDetail.markComplete')}
                  </button>
                </div>

                {streamUrl && (
                  <div className="mb-6 max-w-4xl">
                    <Player
                      lessonId={selectedLesson.id}
                      src={streamUrl}
                      chapters={selectedLesson.chapters || []}
                      subtitles={selectedLesson.subtitles || []}
                      onChaptersChange={handleChaptersChange}
                      initialTime={initialTime}
                      onProgress={handleProgress}
                      onComplete={handleAutoComplete}
                      thumbnailUrl={selectedLesson.thumbnail_url}
                      onThumbnailCaptured={handleThumbnailCaptured}
                      qualities={selectedLesson.qualities}
                    />
                  </div>
                )}

                <div className="mt-4 max-w-4xl">
                  <div className="flex items-center gap-2 mb-4">
                    <FileText size={16} className="text-indigo-400" />
                    <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">{t('courseDetail.technicalSummary')}</h3>
                    <button
                      onClick={() => {
                        setSummaryText(selectedLesson.summary || '')
                        setEditingSummary(true)
                      }}
                      className="flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      title={t('courseDetail.editSummary')}
                    >
                      <Edit3 size={14} />
                      {t('courseDetail.edit')}
                    </button>
                    <button
                      onClick={handleExportPdf}
                      className="flex items-center gap-1 px-2.5 py-1 rounded text-xs transition-colors"
                      style={{ color: 'var(--text-secondary)' }}
                      title={t('courseDetail.printPdf')}
                    >
                      <FileDown size={14} />
                      {t('courseDetail.pdf')}
                    </button>
                  </div>

                  <div ref={summaryRef}>
                  {editingSummary ? (
                    <div className="space-y-3">
                      <textarea
                        className="w-full h-48 border rounded-lg p-4 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                        style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)', color: 'var(--text-primary)' }}
                        value={summaryText}
                        onChange={e => setSummaryText(e.target.value)}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleSaveSummary}
                          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-sm transition-colors"
                        >
                          {t('courseDetail.save')}
                        </button>
                        <button
                          onClick={() => setEditingSummary(false)}
                          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded-lg text-sm transition-colors"
                        >
                          {t('courseDetail.cancel')}
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="group">
                      <MarkdownRenderer content={selectedLesson.summary} />
                    </div>
                  )}
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
