/**
 * Auth Layout
 * Layout for authentication pages (login, register)
 * 
 * @fileoverview Authentication layout component
 * @version 1.0.0
 */

import React from 'react'

interface AuthLayoutProps {
  children: React.ReactNode
}

export default function AuthLayout({ children }: AuthLayoutProps): JSX.Element {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900">Collaborative Whiteboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Real-time collaboration for teams
          </p>
        </div>
      </div>
      
      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {children}
        </div>
      </div>
    </div>
  )
}
