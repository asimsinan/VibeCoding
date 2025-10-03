/**
 * Global Loading Component
 * 
 * Shows loading state for the entire app
 * 
 * @fileoverview Global Loading Component for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

'use client'

import React from 'react'
import { LoadingSpinner } from '@/lib/ui'

export default function Loading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-gray-600 dark:text-gray-400">
          Loading...
        </p>
      </div>
    </div>
  )
}
