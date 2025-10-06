'use client'

import React from 'react'
import { UserPresence as UserPresenceComponent } from '@/lib/whiteboard/components/UserPresence'

interface UserPresenceProps {
  whiteboardId: string
  currentUserId: string
}

/**
 * UserPresence Component
 * 
 * User presence component that integrates with the whiteboard context.
 * Displays active users and their collaboration status.
 * 
 * @param whiteboardId - Unique identifier for the whiteboard
 * @param currentUserId - Current user identifier
 */
export default function UserPresence({ whiteboardId, currentUserId }: UserPresenceProps) {
  return (
    <UserPresenceComponent
      whiteboardId={whiteboardId}
      currentUserId={currentUserId}
      className="flex-shrink-0"
    />
  )
}
