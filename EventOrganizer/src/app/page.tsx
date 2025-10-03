/**
 * Home Page
 * 
 * Main landing page for the Event Organizer app
 * 
 * @fileoverview Home Page for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

'use client'

import dynamic from 'next/dynamic'
import React from 'react'

// Dynamically import components to avoid SSR issues
const HomePageContent = dynamic(() => import('./HomePageContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
        <p className="text-gray-600 dark:text-gray-400">Loading...</p>
      </div>
    </div>
  )
})

export default function HomePage() {
  return <HomePageContent />
}