import { RefreshCw } from 'lucide-react'

export default function SyncButton({ syncing, onSync }) {
  return (
    <button
      onClick={onSync}
      disabled={syncing}
      className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-800 disabled:cursor-not-allowed text-white rounded-lg transition-colors text-sm font-medium"
    >
      <RefreshCw size={16} className={syncing ? 'animate-spin' : ''} />
      {syncing ? 'Syncing...' : 'Sync'}
    </button>
  )
}
