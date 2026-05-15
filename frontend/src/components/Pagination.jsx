import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useI18n } from '../contexts/I18nContext'

export default function Pagination({ page, totalPages, onPageChange }) {
  const { t } = useI18n()
  if (totalPages <= 1) return null

  const pages = []
  const start = Math.max(1, page - 2)
  const end = Math.min(totalPages, page + 2)

  if (start > 1) pages.push(1)
  if (start > 2) pages.push('...')

  for (let i = start; i <= end; i++) pages.push(i)

  if (end < totalPages - 1) pages.push('...')
  if (end < totalPages) pages.push(totalPages)

  const btn = 'px-3 py-1.5 rounded-lg text-sm font-medium transition-colors'

  return (
    <div className="flex items-center justify-center gap-1 mt-8">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className={`${btn} flex items-center gap-1 ${page <= 1 ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80'}`}
        style={{ color: 'var(--text-secondary)' }}
      >
        <ChevronLeft size={16} />
        {t('pagination.prev')}
      </button>

      {pages.map((p, i) =>
        p === '...' ? (
          <span key={`ellipsis-${i}`} className="px-2" style={{ color: 'var(--text-secondary)' }}>...</span>
        ) : (
          <button
            key={p}
            onClick={() => onPageChange(p)}
            className={`${btn} ${p === page ? 'bg-indigo-600 text-white' : ''}`}
            style={p !== page ? { backgroundColor: 'var(--card-bg)', color: 'var(--text-primary)' } : {}}
          >
            {p}
          </button>
        )
      )}

      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className={`${btn} flex items-center gap-1 ${page >= totalPages ? 'opacity-40 cursor-not-allowed' : 'hover:opacity-80'}`}
        style={{ color: 'var(--text-secondary)' }}
      >
        {t('pagination.next')}
        <ChevronRight size={16} />
      </button>
    </div>
  )
}
