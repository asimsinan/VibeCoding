/**
 * Root Template Component
 * 
 * Provides consistent layout template for all pages
 * 
 * @fileoverview Root Template for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

import React from 'react'

interface TemplateProps {
  children: React.ReactNode
}

export default function Template({ children }: TemplateProps) {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {children}
    </div>
  )
}
