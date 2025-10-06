'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorBoundary from '@/components/ErrorBoundary'

/**
 * Whiteboard List Page
 * 
 * Modern, stylish whiteboard management page with enhanced UI/UX.
 * Displays a list of all whiteboards with CRUD operations and beautiful design.
 */
export default function WhiteboardListPage() {
  const [whiteboards, setWhiteboards] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [newWhiteboardName, setNewWhiteboardName] = useState('')
  const [newWhiteboardWidth, setNewWhiteboardWidth] = useState(1920)
  const [newWhiteboardHeight, setNewWhiteboardHeight] = useState(1080)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  // Load whiteboards
  useEffect(() => {
    loadWhiteboards()
  }, [])

  const loadWhiteboards = async () => {
    try {
      setIsLoading(true)
      setError(null)

      const { data, error } = await (supabase as any)
        .from('whiteboards')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
          setError('Database not set up. Please run the migration to create the required tables.')
          setWhiteboards([])
          return
        }
        throw error
      }

      setWhiteboards(data || [])
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load whiteboards')
    } finally {
      setIsLoading(false)
    }
  }

  // Create new whiteboard
  const handleCreateWhiteboard = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!newWhiteboardName.trim()) return

    try {
      setIsCreating(true)
      setError(null)

      const { data, error } = await (supabase as any)
        .from('whiteboards')
        .insert({
          name: newWhiteboardName.trim(),
          settings: {
            width: newWhiteboardWidth,
            height: newWhiteboardHeight,
            backgroundColor: '#ffffff'
          }
        })
        .select()
        .single()

      if (error) {
        if (error.code === 'PGRST205' || error.message.includes('Could not find the table')) {
          setError('Database not set up. Please run the migration to create the required tables.')
          return
        }
        throw error
      }

      setWhiteboards(prev => [data, ...prev])
      setNewWhiteboardName('')
      setNewWhiteboardWidth(1920)
      setNewWhiteboardHeight(1080)
      setShowCreateForm(false)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create whiteboard')
    } finally {
      setIsCreating(false)
    }
  }

  // Delete whiteboard
  const handleDeleteWhiteboard = async (id: string, name: string) => {
    setDeleteConfirm({ id, name })
  }

  // Confirm delete
  const confirmDelete = async () => {
    if (!deleteConfirm) return

    try {
      setIsDeleting(true)
      setError(null)

      const { error } = await (supabase as any)
        .from('whiteboards')
        .delete()
        .eq('id', deleteConfirm.id)

      if (error) throw error

      setWhiteboards(prev => prev.filter(wb => wb.id !== deleteConfirm.id))
      setDeleteConfirm(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete whiteboard')
    } finally {
      setIsDeleting(false)
    }
  }

  // Cancel delete
  const cancelDelete = () => {
    setDeleteConfirm(null)
  }

  // Logout function
  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut()
      if (error) throw error
      
      // Redirect to login page
      window.location.href = '/auth/login'
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to logout')
    }
  }

  // Format date
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'N/A'
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      })
    } catch (error) {
      return 'Invalid Date'
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg animate-pulse">
            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
            </svg>
          </div>
          <LoadingSpinner />
          <p className="mt-4 text-gray-600">Loading your whiteboards...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <style jsx>{`
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(30px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes slideIn {
          from { opacity: 0; transform: translateX(-20px); }
          to { opacity: 1; transform: translateX(0); }
        }
        
        .animate-fade-in-up {
          animation: fadeInUp 0.6s ease-out forwards;
        }
        
        .animate-slide-in {
          animation: slideIn 0.4s ease-out forwards;
        }
        
        .whiteboard-card {
          transition: all 0.3s ease;
        }
        
        .whiteboard-card:hover {
          transform: translateY(-8px);
          box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
        }
        
        .create-form {
          transition: all 0.3s ease;
        }
      `}</style>
      
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        {/* Header */}
        <header className="bg-white/80 backdrop-blur-sm shadow-lg border-b border-white/20">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-8">
              <div className="animate-slide-in">
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold text-gray-900">My Whiteboards</h1>
                    <p className="mt-2 text-lg text-gray-600">
                      Create and manage your collaborative whiteboards
                    </p>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center space-x-4">
                <button
                  onClick={() => setShowCreateForm(!showCreateForm)}
                  className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg animate-slide-in"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    <span>New Whiteboard</span>
                  </div>
                </button>
                
                <button
                  onClick={handleLogout}
                  className="bg-gradient-to-r from-red-500 to-red-600 text-white px-4 py-3 rounded-xl font-semibold hover:from-red-600 hover:to-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg animate-slide-in"
                  title="Logout"
                >
                  <div className="flex items-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                    </svg>
                    <span>Logout</span>
                  </div>
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          {/* Create New Whiteboard Form */}
          {showCreateForm && (
            <div className="bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 mb-12 create-form">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Create New Whiteboard</h2>
                <button
                  onClick={() => setShowCreateForm(false)}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <form onSubmit={handleCreateWhiteboard} className="space-y-6">
                <div>
                  <label htmlFor="whiteboardName" className="block text-sm font-semibold text-gray-700 mb-2">
                    Whiteboard Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                      </svg>
                    </div>
                    <input
                      id="whiteboardName"
                      type="text"
                      value={newWhiteboardName}
                      onChange={(e) => setNewWhiteboardName(e.target.value)}
                      placeholder="Enter whiteboard name..."
                      className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 text-gray-900 placeholder-gray-500"
                      disabled={isCreating}
                    />
                  </div>
                </div>

                {/* Dimensions Section */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold text-gray-800 flex items-center">
                    <svg className="w-5 h-5 mr-2 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                    </svg>
                    Canvas Dimensions
                  </h3>
                  
                  {/* Predefined Sizes */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-3">Quick Presets</label>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {[
                        { name: 'Standard', width: 1920, height: 1080, icon: '🖥️' },
                        { name: 'Widescreen', width: 2560, height: 1440, icon: '📺' },
                        { name: 'Square', width: 1080, height: 1080, icon: '⬜' },
                        { name: 'Portrait', width: 1080, height: 1920, icon: '📱' },
                        { name: 'Presentation', width: 1920, height: 1200, icon: '📊' },
                        { name: 'Mobile', width: 375, height: 667, icon: '📱' },
                        { name: 'Tablet', width: 768, height: 1024, icon: '📱' },
                        { name: 'Custom', width: 0, height: 0, icon: '⚙️' }
                      ].map((preset) => (
                        <button
                          key={preset.name}
                          type="button"
                          onClick={() => {
                            if (preset.name === 'Custom') return
                            setNewWhiteboardWidth(preset.width)
                            setNewWhiteboardHeight(preset.height)
                          }}
                          className={`p-3 rounded-xl border-2 transition-all duration-200 ${
                            newWhiteboardWidth === preset.width && newWhiteboardHeight === preset.height
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 bg-white text-gray-700 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                          disabled={isCreating}
                        >
                          <div className="text-center">
                            <div className="text-lg mb-1">{preset.icon}</div>
                            <div className="text-sm font-medium">{preset.name}</div>
                            {preset.width > 0 && (
                              <div className="text-xs text-gray-500 mt-1">
                                {preset.width} × {preset.height}
                              </div>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Custom Dimensions */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label htmlFor="whiteboardWidth" className="block text-sm font-medium text-gray-700 mb-2">
                        Width (px)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                          </svg>
                        </div>
                        <input
                          id="whiteboardWidth"
                          type="number"
                          min="100"
                          max="4000"
                          step="10"
                          value={newWhiteboardWidth}
                          onChange={(e) => setNewWhiteboardWidth(parseInt(e.target.value) || 1920)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 text-gray-900"
                          disabled={isCreating}
                        />
                      </div>
                    </div>
                    
                    <div>
                      <label htmlFor="whiteboardHeight" className="block text-sm font-medium text-gray-700 mb-2">
                        Height (px)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6v16M8 6v16M12 6v16M16 6v16M20 6v16" />
                          </svg>
                        </div>
                        <input
                          id="whiteboardHeight"
                          type="number"
                          min="100"
                          max="4000"
                          step="10"
                          value={newWhiteboardHeight}
                          onChange={(e) => setNewWhiteboardHeight(parseInt(e.target.value) || 1080)}
                          className="block w-full pl-10 pr-3 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 text-gray-900"
                          disabled={isCreating}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Aspect Ratio Display */}
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center justify-between">
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Aspect Ratio:</span> {newWhiteboardWidth}:{newWhiteboardHeight}
                      </div>
                      <div className="text-sm text-gray-600">
                        <span className="font-medium">Total Pixels:</span> {(newWhiteboardWidth * newWhiteboardHeight).toLocaleString()}
                      </div>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end space-x-4">
                  <button
                    type="button"
                    onClick={() => setShowCreateForm(false)}
                    className="px-6 py-3 border border-gray-300 text-gray-700 rounded-xl font-semibold hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreating || !newWhiteboardName.trim()}
                    className="px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                  >
                    {isCreating ? (
                      <div className="flex items-center space-x-2">
                        <LoadingSpinner />
                        <span>Creating...</span>
                      </div>
                    ) : (
                      'Create Whiteboard'
                    )}
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-6 py-4 rounded-xl mb-8 animate-fade-in-up">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-red-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div className="flex-1">
                  <div className="font-semibold">{error}</div>
                  {error.includes('Database not set up') && (
                    <div className="mt-3 text-sm">
                      <p className="mb-2">To set up the database:</p>
                      <ol className="list-decimal list-inside space-y-1 text-xs">
                        <li>Go to your Supabase dashboard</li>
                        <li>Navigate to the SQL Editor</li>
                        <li>Run the migration script from <code className="bg-red-200 px-1 rounded">supabase/migrations/001_initial_schema.sql</code></li>
                        <li>Or use the Supabase CLI: <code className="bg-red-200 px-1 rounded">supabase db push</code></li>
                      </ol>
                    </div>
                  )}
                </div>
                <button
                  onClick={loadWhiteboards}
                  className="ml-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                >
                  Retry
                </button>
              </div>
            </div>
          )}

          {/* Whiteboards Grid */}
          {whiteboards.length === 0 ? (
            <div className="text-center py-20 animate-fade-in-up">
              <div className="w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-3">No whiteboards yet</h3>
              <p className="text-gray-600 mb-8 text-lg">Create your first whiteboard to get started with collaborative drawing</p>
              <button
                onClick={() => setShowCreateForm(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
              >
                Create Your First Whiteboard
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
              {whiteboards.map((whiteboard, index) => (
                <div
                  key={whiteboard.id}
                  className="whiteboard-card bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 overflow-hidden animate-fade-in-up"
                  style={{ animationDelay: `${index * 0.1}s` }}
                >
                  {/* Whiteboard Preview */}
                  <div className="h-48 bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-blue-100/50 to-purple-100/50"></div>
                    <div className="relative z-10 text-center">
                      <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-purple-500 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
                        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                        </svg>
                      </div>
                      <p className="text-sm text-gray-600 font-medium">Interactive Canvas</p>
                    </div>
                  </div>

                  {/* Whiteboard Info */}
                  <div className="p-6">
                    <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                      {whiteboard.name}
                    </h3>
                    <div className="text-sm text-gray-500 space-y-2 mb-6">
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
                        </svg>
                        {whiteboard.settings.width} × {whiteboard.settings.height}
                      </div>
                      <div className="flex items-center">
                        <svg className="w-4 h-4 mr-2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        Created {formatDate(whiteboard.created_at)}
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3">
                      <Link
                        href={`/whiteboard/${whiteboard.id}`}
                        className="flex-1 px-4 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-center rounded-xl font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                      >
                        <div className="flex items-center justify-center space-x-2">
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                          </svg>
                          <span>Open</span>
                        </div>
                      </Link>
                      <button
                        onClick={() => handleDeleteWhiteboard(whiteboard.id, whiteboard.name)}
                        className="px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg"
                      >
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </main>

        {/* Delete Confirmation Modal */}
        {deleteConfirm && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full animate-slide-in">
              <div className="p-6">
                {/* Header */}
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-red-100 rounded-xl flex items-center justify-center">
                    <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 19.5c-.77.833.192 2.5 1.732 2.5z" />
                    </svg>
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-900">Delete Whiteboard</h3>
                    <p className="text-sm text-gray-600">This action cannot be undone</p>
                  </div>
                </div>

                {/* Content */}
                <div className="mb-6">
                  <p className="text-gray-700">
                    Are you sure you want to delete <span className="font-semibold text-gray-900">&quot;{deleteConfirm.name}&quot;</span>?
                  </p>
                  <p className="text-sm text-red-600 mt-2">
                    All drawings, sticky notes, and data in this whiteboard will be permanently deleted.
                  </p>
                </div>

                {/* Actions */}
                <div className="flex space-x-3">
                  <button
                    onClick={cancelDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 bg-gray-100 text-gray-700 rounded-xl font-semibold hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    disabled={isDeleting}
                    className="flex-1 px-4 py-3 bg-red-500 text-white rounded-xl font-semibold hover:bg-red-600 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
                  >
                    {isDeleting ? (
                      <>
                        <LoadingSpinner />
                        <span>Deleting...</span>
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        <span>Delete</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </ErrorBoundary>
  )
}