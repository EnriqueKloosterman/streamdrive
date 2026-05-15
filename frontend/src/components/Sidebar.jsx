import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { Home, BookOpen, CheckCircle, ChevronDown, ChevronRight, X, BarChart3 } from 'lucide-react'
import { useI18n } from '../contexts/I18nContext'

function fmt(s) {
  if (!s || s < 60) return s ? `${s}s` : ''
  const m = Math.floor(s / 60)
  const sec = s % 60
  return `${m}:${sec.toString().padStart(2, '0')}`
}

export default function Sidebar({ lessons, currentLessonId, onSelectLesson, progress = {}, onClose }) {
  const { t } = useI18n()
  const navigate = useNavigate()
  const location = useLocation()
  const isDashboard = location.pathname === '/dashboard'
  const [collapsed, setCollapsed] = useState({})
  const completedCount = (lessons || []).filter(l => progress[l.id]?.completed).length
  const totalCount = (lessons || []).length
  const progressPct = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0

  const groups = {}
  for (const lesson of lessons || []) {
    const key = lesson.section || '__root__'
    if (!groups[key]) groups[key] = { name: lesson.section, lessons: [] }
    groups[key].lessons.push(lesson)
  }
  const groupKeys = Object.keys(groups).sort((a, b) => {
    if (a === '__root__') return 1
    if (b === '__root__') return -1
    return (groups[a].name || '').localeCompare(groups[b].name || '')
  })

  return (
    <aside className="w-64 h-full flex flex-col border-r" style={{ backgroundColor: 'var(--surface-bg)', borderColor: 'var(--border)' }}>
      <div className="p-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--border)' }}>
        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: 'var(--text-primary)' }}>
          <BookOpen size={20} className="text-indigo-400" />
          {t('sidebar.brand')}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="lg:hidden transition-colors"
            style={{ color: 'var(--text-secondary)' }}
            title={t('sidebar.close')}
          >
            <X size={18} />
          </button>
        )}
      </div>

      {totalCount > 0 && (
        <div className="px-4 py-2 border-b" style={{ borderColor: 'var(--border)' }}>
          <div className="flex items-center justify-between text-xs mb-1" style={{ color: 'var(--text-secondary)' }}>
            <span className="flex items-center gap-1"><BarChart3 size={12} /> {t('sidebar.progress')}</span>
            <span>{t('sidebar.completed')} {completedCount}/{totalCount} ({progressPct}%)</span>
          </div>
          <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'var(--border)' }}>
            <div
              className="h-full rounded-full transition-all duration-500"
              style={{ width: `${progressPct}%`, backgroundColor: progressPct === 100 ? '#22c55e' : '#818cf8' }}
            />
          </div>
        </div>
      )}

      <nav className="p-3">
        <button
          onClick={() => navigate('/dashboard')}
          className={`w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm transition-colors ${
            isDashboard ? 'text-white' : ''
          }`}
          style={{
            backgroundColor: isDashboard ? 'var(--card-bg)' : 'transparent',
            color: isDashboard ? 'var(--text-primary)' : 'var(--text-secondary)',
          }}
        >
          <Home size={16} />
          {t('sidebar.dashboard')}
        </button>
      </nav>

      {lessons && lessons.length > 0 && (
        <div className="flex-1 overflow-y-auto p-3 pt-0">
          <p className="text-xs uppercase tracking-wider mb-2 px-3" style={{ color: 'var(--text-secondary)' }}>{t('sidebar.lessons')}</p>
          {groupKeys.map((key) => {
            const group = groups[key]
            const isRoot = key === '__root__'
            const isCollapsed = collapsed[key]
            return (
              <div key={key} className="mb-2">
                {!isRoot && (
                  <button
                    onClick={() => setCollapsed(prev => ({ ...prev, [key]: !prev[key] }))}
                    className="w-full flex items-center gap-1 px-2 py-1 rounded text-xs font-semibold uppercase tracking-wider mb-1 transition-colors"
                    style={{ color: 'var(--text-secondary)' }}
                  >
                    {isCollapsed ? <ChevronRight size={12} /> : <ChevronDown size={12} />}
                    {group.name}
                  </button>
                )}
                {(!isCollapsed || isRoot) && group.lessons.map((lesson) => (
                  <button
                    key={lesson.id}
                    onClick={() => onSelectLesson(lesson.id)}
                    className={`w-full text-left px-3 py-2 rounded-lg text-sm mb-0.5 transition-colors ${
                      currentLessonId === lesson.id
                        ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                        : 'border border-transparent'
                    }`}
                    style={currentLessonId !== lesson.id ? { color: 'var(--text-secondary)' } : undefined}
                  >
                    {lesson.thumbnail_url && (
                      <img
                        src={lesson.thumbnail_url}
                        alt=""
                        className="w-10 h-7 rounded object-cover mr-2 shrink-0"
                      />
                    )}
                    <span className="text-xs mr-2" style={{ color: 'var(--text-secondary)' }}>{lesson.order}.</span>
                    <span className="flex-1 truncate">{lesson.title}</span>
                    {progress[lesson.id]?.completed ? (
                      <CheckCircle size={14} className="text-green-500 shrink-0" />
                    ) : progress[lesson.id]?.currentTime > 0 ? (
                      <span className="text-xs shrink-0" style={{ color: 'var(--text-secondary)' }}>
                        {fmt(progress[lesson.id].currentTime)}
                      </span>
                    ) : null}
                  </button>
                ))}
              </div>
            )
          })}
        </div>
      )}
    </aside>
  )
}
