import { useState, useRef, useCallback } from 'react'
import api from '../lib/api'

const POLL_INTERVAL = 5000
const MAX_POLLS = 120

export function useSync() {
  const [syncing, setSyncing] = useState(false)
  const [syncStatus, setSyncStatus] = useState(null)
  const intervalRef = useRef(null)
  const pollCountRef = useRef(0)

  const stopPolling = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current)
      intervalRef.current = null
    }
    pollCountRef.current = 0
  }, [])

  const pollStatus = useCallback(async () => {
    pollCountRef.current = 0
    intervalRef.current = setInterval(async () => {
      try {
        const res = await api.get('/api/sync/status')
        if (!res.data.inProgress) {
          setSyncStatus(res.data)
          setSyncing(false)
          stopPolling()
        } else {
          setSyncStatus(res.data)
        }
        pollCountRef.current += 1
        if (pollCountRef.current >= MAX_POLLS) {
          stopPolling()
          setSyncing(false)
        }
      } catch {
        stopPolling()
        setSyncing(false)
      }
    }, POLL_INTERVAL)
  }, [stopPolling])

  const triggerSync = useCallback(async () => {
    stopPolling()
    setSyncing(true)
    try {
      await api.post('/api/sync')
      pollStatus()
    } catch (err) {
      console.error('Sync error:', err)
      setSyncing(false)
    }
  }, [pollStatus, stopPolling])

  return { syncing, syncStatus, triggerSync }
}
