import { createContext, useContext, useState, useCallback } from 'react'
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react'

const ToastContext = createContext(null)

let toastId = 0

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const addToast = useCallback((message, type = 'info', duration = 4000) => {
    const id = ++toastId
    setToasts(prev => [...prev, { id, message, type }])
    if (duration > 0) {
      setTimeout(() => {
        setToasts(prev => prev.filter(t => t.id !== id))
      }, duration)
    }
    return id
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  const toast = {
    success: (msg, dur) => addToast(msg, 'success', dur),
    error: (msg, dur) => addToast(msg, 'error', dur),
    info: (msg, dur) => addToast(msg, 'info', dur),
  }

  return (
    <ToastContext.Provider value={toast}>
      {children}
      <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
        {toasts.map(t => (
          <div
            key={t.id}
            className="flex items-start gap-2 px-4 py-3 rounded-lg shadow-xl text-sm animate-slide-up"
            style={{
              backgroundColor: t.type === 'error' ? '#7f1d1d' : t.type === 'success' ? '#14532d' : '#1e293b',
              border: `1px solid ${
                t.type === 'error' ? '#fca5a5' : t.type === 'success' ? '#86efac' : '#64748b'
              }`,
              color: '#f1f5f9',
            }}
          >
            {t.type === 'error' ? <AlertCircle size={16} className="shrink-0 mt-0.5 text-red-300" /> :
             t.type === 'success' ? <CheckCircle size={16} className="shrink-0 mt-0.5 text-green-300" /> :
             <Info size={16} className="shrink-0 mt-0.5 text-blue-300" />}
            <p className="flex-1">{t.message}</p>
            <button onClick={() => removeToast(t.id)} className="shrink-0 opacity-60 hover:opacity-100 transition-opacity">
              <X size={14} />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}