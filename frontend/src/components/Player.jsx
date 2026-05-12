import { useRef, useState, useEffect } from 'react'
import { BookmarkPlus, Trash2, Subtitles, ChevronDown, ChevronRight } from 'lucide-react'

export default function Player({ lessonId, src, chapters = [], subtitles = [], onChaptersChange, initialTime = 0, onProgress, onComplete }) {
  const videoRef = useRef(null)
  const lastSaveRef = useRef(0)
  const [currentTime, setCurrentTime] = useState(0)
  const [editing, setEditing] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [editingIndex, setEditingIndex] = useState(null)
  const [editTitle, setEditTitle] = useState('')

  const isLoadedRef = useRef(false)
  const [videoLoading, setVideoLoading] = useState(true)
  const [videoError, setVideoError] = useState(null)

  useEffect(() => {
    const el = videoRef.current
    if (!el || !src) return
    isLoadedRef.current = false
    setVideoLoading(true)
    setVideoError(null)
    el.src = src
    el.load()
    lastSaveRef.current = Date.now()
    setCurrentTime(0)

    const onMeta = () => {
      isLoadedRef.current = true
      setVideoLoading(false)
      if (initialTime > 0) el.currentTime = initialTime
      el.removeEventListener('loadedmetadata', onMeta)
    }
    const onError = () => {
      setVideoLoading(false)
      setVideoError('Failed to load video. Your session may have expired.')
    }
    el.addEventListener('loadedmetadata', onMeta)
    el.addEventListener('error', onError)
    return () => {
      el.removeEventListener('loadedmetadata', onMeta)
      el.removeEventListener('error', onError)
    }
  }, [src, lessonId])

  useEffect(() => {
    const el = videoRef.current
    if (!el || !src || !isLoadedRef.current || initialTime <= 0) return
    el.currentTime = initialTime
  }, [initialTime])

  useEffect(() => {
    const el = videoRef.current
    if (!el) return
    const handler = () => {
      const t = el.currentTime
      setCurrentTime(t)
      if (onProgress && t - lastSaveRef.current >= 15) {
        onProgress(Math.floor(t))
        lastSaveRef.current = t
      }
    }
    el.addEventListener('timeupdate', handler)

    const pauseHandler = () => {
      if (onProgress) onProgress(Math.floor(el.currentTime))
    }
    el.addEventListener('pause', pauseHandler)

    const endedHandler = () => {
      if (onComplete) onComplete()
    }
    el.addEventListener('ended', endedHandler)

    return () => {
      el.removeEventListener('timeupdate', handler)
      el.removeEventListener('pause', pauseHandler)
      el.removeEventListener('ended', endedHandler)
      const t = Math.floor(el.currentTime)
      if (onProgress && t > 0) onProgress(t)
    }
  }, [src, onProgress, onComplete])

  const seekTo = (time) => {
    const el = videoRef.current
    if (!el) return
    el.currentTime = time
    el.play()
  }

  const activeIndex = chapters.findLastIndex(ch => ch.time <= currentTime)

  const addChapter = () => {
    const el = videoRef.current
    if (!el || !newTitle.trim()) return
    const newCh = { time: Math.floor(el.currentTime), title: newTitle.trim() }
    const updated = [...chapters, newCh].sort((a, b) => a.time - b.time)
    onChaptersChange(updated)
    setNewTitle('')
  }

  const deleteChapter = (i) => {
    const updated = chapters.filter((_, idx) => idx !== i)
    onChaptersChange(updated)
  }

  const startEdit = (i) => {
    setEditingIndex(i)
    setEditTitle(chapters[i].title)
  }

  const saveEdit = (i) => {
    if (!editTitle.trim()) return
    const updated = chapters.map((ch, idx) =>
      idx === i ? { ...ch, title: editTitle.trim() } : ch
    )
    onChaptersChange(updated)
    setEditingIndex(null)
    setEditTitle('')
  }

  function parseVttToText(vtt) {
    return vtt
      .replace(/^WEBVTT[\s\S]*?\n\n/, '')
      .replace(/\d{2}:\d{2}:\d{2}\.\d{3} --> \d{2}:\d{2}:\d{2}\.\d{3}/g, '')
      .replace(/NOTE.*(\n|$)/g, '')
      .replace(/^(style|region):.*$/gmi, '')
      .replace(/\n{2,}/g, '\n')
      .trim()
  }

  const formatTime = (s) => {
    const m = Math.floor(s / 60)
    const sec = Math.floor(s % 60)
    return `${m}:${sec.toString().padStart(2, '0')}`
  }

  const [transcriptOpen, setTranscriptOpen] = useState(false)
  const [transcriptText, setTranscriptText] = useState('')
  const [transcriptLoading, setTranscriptLoading] = useState(false)

  useEffect(() => {
    setTranscriptOpen(false)
    setTranscriptText('')
  }, [lessonId])

  const loadTranscript = async () => {
    if (transcriptText || subtitles.length === 0) return
    setTranscriptLoading(true)
    try {
      const texts = []
      for (let i = 0; i < subtitles.length; i++) {
        const res = await fetch(`/api/lessons/${lessonId}/subtitles/${i}`)
        if (!res.ok) continue
        const vtt = await res.text()
        texts.push({ label: subtitles[i].label, vtt })
      }
      setTranscriptText(texts.map(t =>
        `--- ${t.label} ---\n${parseVttToText(t.vtt)}`
      ).join('\n\n'))
    } catch (err) {
      console.error('Failed to load transcript:', err)
    } finally {
      setTranscriptLoading(false)
    }
  }

  return (
    <div>
      <div className="rounded-xl overflow-hidden bg-black relative">
        {videoLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}>
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-indigo-400 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
              <p className="text-xs text-gray-400">Loading video...</p>
            </div>
          </div>
        )}
        {videoError && !videoLoading && (
          <div className="absolute inset-0 flex items-center justify-center z-10" style={{ backgroundColor: 'rgba(0,0,0,0.7)' }}>
            <div className="text-center px-4">
              <p className="text-sm text-red-400 mb-2">{videoError}</p>
              <button
                onClick={() => {
                  const el = videoRef.current
                  if (!el) return
                  setVideoError(null)
                  setVideoLoading(true)
                  el.load()
                }}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs transition-colors"
              >
                Retry
              </button>
            </div>
          </div>
        )}
        <video
          ref={videoRef}
          controls
          className="w-full aspect-video"
          preload="auto"
        >
          {subtitles.map((sub, i) => (
            <track
              key={i}
              kind="subtitles"
              src={`/api/lessons/${lessonId}/subtitles/${i}`}
              srcLang={sub.language}
              label={sub.label}
            />
          ))}
          <p>Your browser does not support the video element.</p>
        </video>
      </div>

      {subtitles.length > 0 && (
        <div className="mt-3">
          <button
            onClick={() => { setTranscriptOpen(!transcriptOpen); if (!transcriptOpen) loadTranscript() }}
            className="flex items-center gap-1.5 text-xs transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            {transcriptOpen ? <ChevronDown size={14} /> : <ChevronRight size={14} />}
            <Subtitles size={14} />
            Transcript ({subtitles.map(s => s.label).join(', ')})
          </button>
          {transcriptOpen && (
            <div
              className="mt-2 p-3 rounded-lg text-sm max-h-60 overflow-y-auto whitespace-pre-wrap"
              style={{ backgroundColor: 'var(--card-bg)', border: '1px solid var(--border)', color: 'var(--text-primary)' }}
            >
              {transcriptLoading ? 'Loading...' : transcriptText || 'No transcript available.'}
            </div>
          )}
        </div>
      )}

      <div className="mt-4">
        <div className="flex items-center justify-between mb-2">
            <h4 className="text-sm font-medium uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>
              Chapters {chapters.length > 0 && `(${chapters.length})`}
            </h4>
          <button
            onClick={() => setEditing(!editing)}
            className="text-xs text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            {editing ? 'Done' : 'Edit'}
          </button>
        </div>

        {editing && (
          <div className="mb-3 flex items-center gap-2">
            <button
              onClick={() => {
                if (!videoRef.current) return
                setNewTitle('')
                const el = videoRef.current
                el.pause()
                el.currentTime = Math.max(0, el.currentTime - 2)
              }}
              className="px-2 py-1 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded text-xs transition-colors"
              title="Rewind 2s"
            >
              -2s
            </button>
            <input
              value={newTitle}
              onChange={e => setNewTitle(e.target.value)}
              placeholder="Chapter title at current time..."
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm text-gray-200 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500"
              onKeyDown={e => e.key === 'Enter' && addChapter()}
            />
            <button
              onClick={addChapter}
              disabled={!newTitle.trim()}
              className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-lg text-xs transition-colors"
            >
              <BookmarkPlus size={14} />
              Add
            </button>
          </div>
        )}

        {chapters.length > 0 && (
          <div className="space-y-1">
            {chapters.map((ch, i) => (
              <div
                key={i}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm transition-colors ${
                  i === activeIndex
                    ? 'bg-indigo-600/20 text-indigo-300 border border-indigo-500/30'
                    : 'text-gray-400 hover:bg-gray-800'
                }`}
              >
                <button
                  onClick={() => seekTo(ch.time)}
                  className="flex-1 flex items-center gap-2 text-left"
                >
                  <span className="text-xs text-gray-500 w-10 shrink-0">{formatTime(ch.time)}</span>
                  {editing && editingIndex === i ? (
                    <input
                      value={editTitle}
                      onChange={e => setEditTitle(e.target.value)}
                      onBlur={() => saveEdit(i)}
                      onKeyDown={e => e.key === 'Enter' && saveEdit(i)}
                      className="flex-1 bg-gray-700 border border-gray-600 rounded px-1.5 py-0.5 text-gray-200 text-sm focus:outline-none focus:ring-1 focus:ring-indigo-500"
                      autoFocus
                      onClick={e => e.stopPropagation()}
                    />
                  ) : (
                    <span
                      className="flex-1"
                      onDoubleClick={() => startEdit(i)}
                    >
                      {ch.title}
                    </span>
                  )}
                </button>
                {editing && (
                  <button
                    onClick={() => deleteChapter(i)}
                    className="text-gray-500 hover:text-red-400 transition-colors shrink-0"
                    title="Delete chapter"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}

        {!editing && chapters.length === 0 && (
          <p className="text-xs italic" style={{ color: 'var(--text-secondary)' }}>Click Edit to add chapters</p>
        )}
      </div>
    </div>
  )
}
