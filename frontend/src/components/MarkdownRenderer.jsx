import ReactMarkdown from 'react-markdown'
import { useI18n } from '../contexts/I18nContext'

export default function MarkdownRenderer({ content, className = '' }) {
  const { t } = useI18n()
  if (!content) {
    return <p className="italic" style={{ color: 'var(--text-secondary)' }}>{t('markdown.noSummary')}</p>
  }

  return (
    <div className={`max-w-none ${className}`} style={{ color: 'var(--text-primary)' }}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
