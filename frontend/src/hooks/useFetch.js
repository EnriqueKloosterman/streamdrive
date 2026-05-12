import { useState, useEffect } from 'react'
import api from '../lib/api'

export function useFetch(url, options = {}) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetchData = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(url)
      setData(res.data)
    } catch (err) {
      setError(err.response?.data?.error || err.message)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (options.skip) return
    fetchData()
  }, [url, options.skip])

  return { data, loading, error, refetch: fetchData }
}
