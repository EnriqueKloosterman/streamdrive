import ReactMarkdown from 'react-markdown'

export default function MarkdownRenderer({ content, className = '' }) {
  if (!content) {
    return <p className="italic" style={{ color: 'var(--text-secondary)' }}>No summary available.</p>
  }

  return (
    <div className={`max-w-none ${className}`} style={{ color: 'var(--text-primary)' }}>
      <ReactMarkdown>{content}</ReactMarkdown>
    </div>
  )
}
