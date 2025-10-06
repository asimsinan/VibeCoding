'use client'

import React, { Suspense } from 'react'
import Link from 'next/link'
import { WhiteboardProvider } from '@/lib/whiteboard/context/WhiteboardContext'
import { useAuth } from '@/lib/auth/AuthContext'
import WhiteboardCanvas from '@/components/WhiteboardCanvas'
import WhiteboardToolbar from '@/components/WhiteboardToolbar'
// import WhiteboardControls from '@/components/WhiteboardControls' // Removed duplicate controls
import UserPresence from '@/components/UserPresence'
// import LoadingSpinner from '@/components/LoadingSpinner'
import PerformanceMonitor from '@/components/PerformanceMonitor'

// Simple ErrorBoundary component inline to avoid import issues
class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean; error?: Error }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen bg-gray-100 flex items-center justify-center">
          <div className="max-w-md w-full bg-white rounded-lg shadow-md p-6 text-center">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Something went wrong</h2>
            <p className="text-gray-600 mb-4">
              We&apos;re sorry, but something unexpected happened. Please try refreshing the page.
            </p>
            <div className="space-y-2">
              <button
                onClick={() => window.location.reload()}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Refresh Page
              </button>
              <button
                onClick={() => window.location.href = '/'}
                className="w-full px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
              >
                Go Home
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

interface WhiteboardPageProps {
  params: {
    id: string
  }
}

/**
 * Whiteboard Page
 * 
 * Main whiteboard canvas page with full collaborative functionality.
 * Integrates all whiteboard components with real-time synchronization.
 * 
 * @param params - Route parameters containing whiteboard ID
 */
export default function WhiteboardPage({ params }: WhiteboardPageProps) {
  const { id: whiteboardId } = params
  
  let user, loading, isClient
  try {
    const auth = useAuth()
    user = auth.user
    loading = auth.loading
    isClient = auth.isClient
  } catch (error) {
    console.error('Auth error:', error)
    user = null
    loading = false
    isClient = false
  }

  // Prevent hydration mismatch by not rendering auth-dependent content on server
  if (!isClient) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Whiteboard</h2>
          <p className="text-gray-600 mb-6">Preparing your workspace...</p>
        </div>
      </div>
    )
  }

  // Show loading while authentication is being checked
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-20 h-20 bg-gradient-to-r from-blue-600 to-purple-600 rounded-3xl flex items-center justify-center mx-auto mb-6 animate-pulse shadow-2xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Loading Whiteboard</h2>
          <p className="text-gray-600 mb-6">Authenticating and preparing your workspace...</p>
          <div className="flex items-center justify-center space-x-2 mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"></div>
            <div className="w-2 h-2 bg-purple-500 rounded-full animate-bounce" style={{animationDelay: '0.1s'}}></div>
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></div>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium"
          >
            Retry Loading
          </button>
        </div>
      </div>
    )
  }

  // Redirect to login if not authenticated
  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-red-50 via-white to-orange-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-auto px-6">
          <div className="w-20 h-20 bg-gradient-to-r from-red-500 to-orange-500 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl">
            <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">Authentication Required</h1>
          <p className="text-gray-600 mb-8 text-lg">Please log in to access your collaborative whiteboard workspace.</p>
          <div className="space-y-4">
            <a 
              href="/auth/login" 
              className="block w-full px-8 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-semibold text-lg"
            >
              Go to Login
            </a>
            <button
              onClick={() => window.location.reload()}
              className="block w-full px-8 py-3 bg-white text-gray-700 rounded-xl hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1 font-medium border border-gray-200"
            >
              Retry Authentication
            </button>
          </div>
        </div>
      </div>
    )
  }

  const userId = user.id

  return (
    <ErrorBoundary>
      <style jsx>{`
        @keyframes fadeInUp {
          from { 
            opacity: 0; 
            transform: translateY(20px); 
          }
          to { 
            opacity: 1; 
            transform: translateY(0); 
          }
        }
        
        @keyframes slideIn {
          from { 
            opacity: 0; 
            transform: translateX(-20px); 
          }
          to { 
            opacity: 1; 
            transform: translateX(0); 
          }
        }
        
        @keyframes pulse {
          0%, 100% { 
            opacity: 1; 
          }
          50% { 
            opacity: 0.7; 
          }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-slide-in {
          animation: slideIn 0.6s ease-out forwards;
        }
        
        .animate-pulse-slow {
          animation: pulse 2s ease-in-out infinite;
        }
        
        .glass-morphism {
          background: rgba(255, 255, 255, 0.1);
          backdrop-filter: blur(10px);
          border: 1px solid rgba(255, 255, 255, 0.2);
        }
        
        .card-hover {
          transition: all 0.3s ease;
        }
        
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 10px 25px rgba(0, 0, 0, 0.1);
        }
      `}</style>
      
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex flex-col">
        <WhiteboardProvider whiteboardId={whiteboardId} userId={userId}>
          {/* Modern Header */}
          <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20 sticky top-0 z-50">
            <div className="px-6 py-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4 animate-slide-in">
                  {/* Home Button */}
                  <Link 
                    href="/whiteboard"
                    className="w-12 h-12 bg-gradient-to-r from-gray-600 to-gray-700 rounded-xl flex items-center justify-center shadow-lg hover:from-gray-700 hover:to-gray-800 transition-all duration-200 transform hover:scale-105 active:scale-95"
                    title="Back to Whiteboards"
                  >
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                    </svg>
                  </Link>
                  
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-2xl font-bold text-gray-900">Collaborative Whiteboard</h1>
                    <div className="flex items-center space-x-2 text-sm text-gray-600">
                      <span className="px-2 py-1 bg-blue-100 text-blue-700 rounded-full font-medium">
                        ID: {whiteboardId.slice(0, 8)}...
                      </span>
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse-slow"></div>
                      <span>Live Collaboration</span>
                    </div>
                  </div>
                </div>
                
                {/* User Presence */}
                <div className="animate-slide-in">
                  <UserPresence whiteboardId={whiteboardId} currentUserId={userId} />
                </div>
              </div>
            </div>
          </header>

          {/* Main Content */}
          <main className="flex-1 flex flex-col">
            {/* Enhanced Toolbar */}
            <div className="bg-white/90 backdrop-blur-sm border-b border-white/20 shadow-sm">
              <div className="px-6 py-4">
                <Suspense fallback={
                  <div className="flex items-center space-x-4">
                    <div className="w-8 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="w-24 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                    <div className="w-16 h-8 bg-gray-200 rounded-lg animate-pulse"></div>
                  </div>
                }>
                  <WhiteboardToolbar />
                </Suspense>
              </div>
            </div>

            {/* Canvas Area */}
            <div className="flex-1 relative overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100" style={{ minHeight: 'calc(100vh - 200px)' }}>
              <div className="absolute inset-0">
                <Suspense fallback={
                  <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 animate-pulse-slow">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      <p className="text-gray-600 font-medium">Loading Canvas...</p>
                    </div>
                  </div>
                }>
                  <WhiteboardCanvas whiteboardId={whiteboardId} userId={userId} />
                </Suspense>
              </div>
              
              {/* Canvas Overlay Elements */}
              <div className="absolute top-4 left-4 z-20">
              </div>
              
              <div className="absolute bottom-4 right-4 z-20">
                <div className="glass-morphism rounded-xl px-4 py-2 shadow-lg">
                  <div className="flex items-center space-x-2 text-sm text-gray-700">
                    <svg className="w-4 h-4 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    <span className="font-medium">Real-time Sync</span>
                  </div>
                </div>
              </div>
            </div>
          </main>

          {/* Performance Monitor */}
          <div className="animate-fade-in-up">
            <PerformanceMonitor />
          </div>
        </WhiteboardProvider>
      </div>
    </ErrorBoundary>
  )
}