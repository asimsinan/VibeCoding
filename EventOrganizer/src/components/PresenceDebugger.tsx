import React, { useState, useEffect } from 'react'
import { ServerPresenceTracker } from '@/lib/services/ServerPresenceTracker'

interface PresenceDebuggerProps {
  eventId: string
  userId: string
}

export const PresenceDebugger: React.FC<PresenceDebuggerProps> = ({ eventId, userId }) => {
  const [debugInfo, setDebugInfo] = useState<any>(null)
  const [isVisible, setIsVisible] = useState(false)

  const fetchDebugInfo = async () => {
    try {
      const info = await ServerPresenceTracker.getDebugInfo(eventId)
      setDebugInfo(info)
    } catch (error) {
    }
  }

  useEffect(() => {
    if (isVisible) {
      fetchDebugInfo()
      const interval = setInterval(fetchDebugInfo, 5000) // Update every 5 seconds
      return () => clearInterval(interval)
    }
  }, [isVisible, eventId])

  if (!isVisible) {
    return (
      <button
        onClick={() => setIsVisible(true)}
        className="fixed bottom-4 right-4 bg-red-500 text-white px-3 py-2 rounded text-xs z-50"
      >
        Debug Presence
      </button>
    )
  }

  return (
    <div className="fixed bottom-4 right-4 bg-white border rounded-lg p-4 shadow-lg max-w-md z-50">
      <div className="flex justify-between items-center mb-2">
        <h3 className="font-semibold text-sm">Presence Debug</h3>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-500 hover:text-gray-700"
        >
          ×
        </button>
      </div>
      
      {debugInfo ? (
        <div className="text-xs space-y-2">
          <div>
            <strong>All Presence Records:</strong> {debugInfo.allPresence?.length || 0}
          </div>
          <div>
            <strong>Active Users:</strong> {debugInfo.activeUsers?.length || 0}
          </div>
          <div>
            <strong>Heartbeat Intervals:</strong> {debugInfo.heartbeatIntervals?.length || 0}
          </div>
          
          {debugInfo.allPresence && debugInfo.allPresence.length > 0 && (
            <div>
              <strong>Presence Details:</strong>
              <div className="mt-1 space-y-1">
                {debugInfo.allPresence.map((presence: any, index: number) => (
                  <div key={index} className="bg-gray-50 p-1 rounded text-xs">
                    <div>User: {presence.user_id?.slice(0, 8)}...</div>
                    <div>Online: {presence.is_online ? 'Yes' : 'No'}</div>
                    <div>Status: {presence.status}</div>
                    <div>Last Seen: {new Date(presence.last_seen).toLocaleTimeString()}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
          
          {debugInfo.errors && (debugInfo.errors.allError || debugInfo.errors.activeError) && (
            <div className="text-red-600">
              <strong>Errors:</strong>
              {debugInfo.errors.allError && <div>All: {debugInfo.errors.allError.message}</div>}
              {debugInfo.errors.activeError && <div>Active: {debugInfo.errors.activeError.message}</div>}
            </div>
          )}
        </div>
      ) : (
        <div className="text-xs text-gray-500">Loading debug info...</div>
      )}
      
      <button
        onClick={fetchDebugInfo}
        className="mt-2 w-full bg-blue-500 text-white px-2 py-1 rounded text-xs"
      >
        Refresh
      </button>
    </div>
  )
}
