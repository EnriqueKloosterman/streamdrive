import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, X } from 'lucide-react'
import api from '../lib/api'

export default function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState(null)
  const [open, setOpen] = useState(false)
  const [searching, setSearching] = useState(false)
  const [highlightedIdx, setHighlightedIdx] = useState(-1)
  const navigate = useNavigate()
  const ref = useRef(null)
  const debounceRef = useRef(null)
  const inputRef = useRef(null)

  useEffect(() => {
    const handleClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  useEffect(() => {
    return () => clearTimeout(debounceRef.current)
  }, [])

  const handleChange = (e) => {
    const val = e.target.value
    setQuery(val)
    setHighlightedIdx(-1)

    clearTimeout(debounceRef.current)
    if (!val.trim()) {
      setResults(null)
      setOpen(false)
      setSearching(false)
      return
    }

    setSearching(true)
    debounceRef.current = setTimeout(async () => {
      try {
        const res = await api.get(`/api/search?q=${encodeURIComponent(val)}`)
        setResults(res.data)
        setOpen(true)
      } catch {
        setResults(null)
      } finally {
        setSearching(false)
      }
    }, 300)
  }

  const itemCount = (results?.courses?.length || 0) + (results?.lessons?.length || 0)

  const handleKeyDown = (e) => {
    if (!open || itemCount === 0) return
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setHighlightedIdx(prev => (prev + 1) % itemCount)
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setHighlightedIdx(prev => (prev <= 0 ? itemCount - 1 : prev - 1))
    } else if (e.key === 'Enter' && highlightedIdx >= 0) {
      e.preventDefault()
      let idx = 0
      for (const c of (results?.courses || [])) {
        if (idx === highlightedIdx) { navigate(`/course/${c.id}`); clear(); return }
        idx++
      }
      for (const l of (results?.lessons || [])) {
        if (idx === highlightedIdx) { navigate(`/course/${l.course_id}`); clear(); return }
        idx++
      }
    } else if (e.key === 'Escape') {
      setOpen(false)
      inputRef.current?.blur()
    }
  }

  const clear = () => {
    setQuery('')
    setResults(null)
    setOpen(false)
    setSearching(false)
  }

  return (
    <div ref={ref} className="relative w-72">
      <div className="relative">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} />
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          placeholder="Search courses..."
          className="w-full pl-9 pr-8 py-2 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          style={{
            backgroundColor: 'var(--card-bg)',
            borderColor: 'var(--border)',
            color: 'var(--text-primary)',
          }}
        />
        {query && (
          <button onClick={clear} className="absolute right-2 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }}>
            <X size={14} />
          </button>
        )}
      </div>

      {open && (
        <div className="absolute top-full mt-2 w-full border rounded-lg shadow-xl z-50 max-h-80 overflow-y-auto"
          style={{ backgroundColor: 'var(--card-bg)', borderColor: 'var(--border)' }}>
          {searching ? (
            <p className="text-sm text-center py-4" style={{ color: 'var(--text-secondary)' }}>Searching...</p>
          ) : results ? (
            <>
              {results.courses?.length > 0 && (
                <div className="p-2">
                  <p className="text-xs uppercase tracking-wider px-2 py-1" style={{ color: 'var(--text-secondary)' }}>Courses</p>
                  {results.courses.map((c, i) => (
                    <button
                      key={c.id}
                      onClick={() => { navigate(`/course/${c.id}`); clear() }}
                      className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors"
                      style={{
                        color: 'var(--text-primary)',
                        backgroundColor: highlightedIdx === i ? 'var(--surface-hover)' : 'transparent',
                      }}
                      onMouseEnter={() => setHighlightedIdx(i)}
                    >
                      {c.title}
                    </button>
                  ))}
                </div>
              )}
              {results.lessons?.length > 0 && (
                <div className="p-2 border-t" style={{ borderColor: 'var(--border)' }}>
                  <p className="text-xs uppercase tracking-wider px-2 py-1" style={{ color: 'var(--text-secondary)' }}>Lessons</p>
                  {results.lessons.map((l, i) => {
                    const idx = (results.courses?.length || 0) + i
                    return (
                      <button
                        key={l.id}
                        onClick={() => { navigate(`/course/${l.course_id}`); clear() }}
                        className="w-full text-left px-3 py-2 rounded-md text-sm transition-colors"
                        style={{
                          color: 'var(--text-primary)',
                          backgroundColor: highlightedIdx === idx ? 'var(--surface-hover)' : 'transparent',
                        }}
                        onMouseEnter={() => setHighlightedIdx(idx)}
                      >
                        {l.title}
                      </button>
                    )
                  })}
                </div>
              )}
              {results.courses?.length === 0 && results.lessons?.length === 0 && (
                <p className="text-sm text-center py-4" style={{ color: 'var(--text-secondary)' }}>No results</p>
              )}
            </>
          ) : null}
        </div>
      )}
    </div>
  )
}
