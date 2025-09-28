'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useMoodData } from '@/app/hooks/useMoodData'
import { MoodEntry } from '@/lib/mood-core/models'
import { getDateRangeLocal } from '@/lib/utils/dateUtils'

export default function MoodHistoryPage() {
  const router = useRouter()
  const {
    moodEntries,
    isLoading,
    isInitialized,
    error,
    deleteMoodEntry,
    refreshMoodEntries,
    clearError
  } = useMoodData({
    autoSync: true
  })
  
  const [filter, setFilter] = useState<'all' | 'week' | 'month' | 'year'>('all')
  const [filteredMoods, setFilteredMoods] = useState<MoodEntry[]>([])
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [moodToDelete, setMoodToDelete] = useState<MoodEntry | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => {
    const now = new Date()
    let startDate: string | undefined

    switch (filter) {
      case 'week':
        startDate = getDateRangeLocal(7).startDate
        break
      case 'month':
        startDate = getDateRangeLocal(30).startDate
        break
      case 'year':
        startDate = getDateRangeLocal(365).startDate
        break
      default:
        startDate = undefined
    }

    let filtered: MoodEntry[]
    if (startDate) {
      filtered = moodEntries.filter(mood => mood.entryDate >= startDate!)
    } else {
      filtered = moodEntries
    }

    // Sort by date (newest first)
    filtered.sort((a, b) => new Date(b.entryDate + 'T00:00:00').getTime() - new Date(a.entryDate + 'T00:00:00').getTime())
    setFilteredMoods(filtered)
  }, [moodEntries, filter])

  const handleDeleteMood = (mood: MoodEntry) => {
    setMoodToDelete(mood)
    setShowDeleteModal(true)
  }

  const confirmDelete = async () => {
    if (!moodToDelete) return

    try {
      setIsDeleting(true)
      await deleteMoodEntry(moodToDelete.id)
      setShowDeleteModal(false)
      setMoodToDelete(null)
    } catch (err) {
      console.error('Failed to delete mood entry:', err)
    } finally {
      setIsDeleting(false)
    }
  }

  const cancelDelete = () => {
    setShowDeleteModal(false)
    setMoodToDelete(null)
  }

  const handleEditMood = (moodId: string) => {
    // Navigate to mood page with the mood ID as a query parameter
    // The mood page will handle loading the existing mood data
    router.push(`/mood?edit=${moodId}`)
  }

  const getMoodColor = (rating: number) => {
    if (rating <= 2) return 'text-red-700 bg-red-50 border-red-200'
    if (rating <= 4) return 'text-orange-700 bg-orange-50 border-orange-200'
    if (rating <= 6) return 'text-yellow-700 bg-yellow-50 border-yellow-200'
    if (rating <= 8) return 'text-blue-700 bg-blue-50 border-blue-200'
    return 'text-green-700 bg-green-50 border-green-200'
  }

  const getMoodEmoji = (rating: number) => {
    if (rating <= 2) return '😢'
    if (rating <= 4) return '😔'
    if (rating <= 6) return '😐'
    if (rating <= 8) return '😊'
    return '😄'
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip link for accessibility */}
      <a href="#main-content" className="skip-link">
        Skip to main content
      </a>

      {/* Navigation */}
      <nav className="bg-white shadow-sm border-b border-gray-200" role="navigation" aria-label="Main navigation">
        <div className="container mx-auto px-4">
          <div className="flex justify-between items-center h-16">
            <Link href="/" className="text-xl font-bold text-blue-600 hover:text-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded">
              MoodTracker
            </Link>
            <div className="flex space-x-4">
              <Link 
                href="/mood" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Log Mood
              </Link>
              <Link 
                href="/mood/history" 
                className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium bg-blue-50"
                aria-current="page"
              >
                History
              </Link>
              <Link 
                href="/trends" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Trends
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Main content */}
      <main id="main-content" className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Mood History
              </h1>
              <p className="text-lg text-gray-600">
                Review your mood entries and track your emotional journey
              </p>
            </div>
            <Link
              href="/mood"
              className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
              <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Log New Mood
            </Link>
          </div>

          {/* Filter Controls */}
          <div className="bg-white rounded-lg shadow-md p-4 mb-6">
            <div className="flex flex-wrap gap-2">
              <span className="text-sm font-medium text-gray-700 mr-4">Filter by:</span>
              {[
                { value: 'all', label: 'All Time' },
                { value: 'week', label: 'Last 7 Days' },
                { value: 'month', label: 'Last 30 Days' },
                { value: 'year', label: 'Last Year' }
              ].map((option) => (
                <button
                  key={option.value}
                  onClick={() => setFilter(option.value as any)}
                  className={`px-3 py-1 text-sm font-medium rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    filter === option.value
                      ? 'bg-blue-100 text-blue-800'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-3 text-gray-600">Loading mood history...</span>
            </div>
          ) : error ? (
            <div className="bg-red-50 border border-red-200 rounded-md p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : filteredMoods.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-8 text-center">
              <svg className="mx-auto h-12 w-12 text-gray-400 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No mood entries found</h3>
              <p className="text-gray-600 mb-4">
                {filter === 'all' 
                  ? "You haven't logged any moods yet. Start tracking your emotional journey today!"
                  : `No mood entries found for the selected time period. Try selecting a different filter or log a new mood.`
                }
              </p>
              <Link
                href="/mood"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
              >
                Log Your First Mood
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredMoods.map((mood) => (
                <div key={mood.id} className="bg-white rounded-lg shadow-md p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center space-x-3 mb-3">
                        <span className="text-2xl">{getMoodEmoji(mood.rating)}</span>
                        <div>
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getMoodColor(mood.rating)}`}>
                              {mood.rating}/10
                            </span>
                            <span className="text-sm text-gray-500">
                              {new Date(mood.entryDate + 'T00:00:00').toLocaleDateString('en-US', { 
                                weekday: 'long', 
                                year: 'numeric', 
                                month: 'long', 
                                day: 'numeric' 
                              })}
                            </span>
                          </div>
                        </div>
                      </div>
                      
                      {mood.notes && (
                        <div className="mt-3">
                          <p className="text-gray-700 text-sm leading-relaxed">
                            {mood.notes}
                          </p>
                        </div>
                      )}
                      
                      <div className="mt-3 text-xs text-gray-500">
                        Logged on {new Date(mood.createdAt).toLocaleDateString('en-US', { 
                          month: 'short', 
                          day: 'numeric', 
                          year: 'numeric' 
                        })} at {new Date(mood.createdAt).toLocaleTimeString('en-US', { 
                          hour: 'numeric', 
                          minute: '2-digit' 
                        })}
                        {mood.updatedAt !== mood.createdAt && (
                          <span> • Updated on {new Date(mood.updatedAt).toLocaleDateString('en-US', { 
                            month: 'short', 
                            day: 'numeric', 
                            year: 'numeric' 
                          })} at {new Date(mood.updatedAt).toLocaleTimeString('en-US', { 
                            hour: 'numeric', 
                            minute: '2-digit' 
                          })}</span>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2 ml-4">
                      <button
                        onClick={() => handleEditMood(mood.id)}
                        className="text-gray-400 hover:text-blue-600 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 rounded"
                        title="Edit mood entry"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDeleteMood(mood)}
                        className="text-gray-400 hover:text-red-600 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 rounded"
                        title="Delete mood entry"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Summary Stats */}
          {filteredMoods.length > 0 && (
            <div className="mt-8 bg-white rounded-lg shadow-md p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Summary</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{filteredMoods.length}</div>
                  <div className="text-sm text-gray-600">Total Entries</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {(filteredMoods.reduce((sum: number, mood: MoodEntry) => sum + mood.rating, 0) / filteredMoods.length).toFixed(1)}
                  </div>
                  <div className="text-sm text-gray-600">Average Rating</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {filteredMoods.filter((mood: MoodEntry) => mood.notes && mood.notes.trim().length > 0).length}
                  </div>
                  <div className="text-sm text-gray-600">With Notes</div>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && moodToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Delete Mood Entry</h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  Are you sure you want to delete this mood entry? This action cannot be undone.
                </p>
                
                <div className="bg-gray-50 rounded-md p-4">
                  <div className="flex items-center space-x-3">
                    <span className="text-2xl">{getMoodEmoji(moodToDelete.rating)}</span>
                    <div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${getMoodColor(moodToDelete.rating)}`}>
                          {moodToDelete.rating}/10
                        </span>
                        <span className="text-sm text-gray-500">
                          {new Date(moodToDelete.entryDate + 'T00:00:00').toLocaleDateString('en-US', { 
                            weekday: 'long', 
                            year: 'numeric', 
                            month: 'long', 
                            day: 'numeric' 
                          })}
                        </span>
                      </div>
                      {moodToDelete.notes && (
                        <p className="text-sm text-gray-700 mt-2 line-clamp-2">
                          {moodToDelete.notes}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={cancelDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  disabled={isDeleting}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isDeleting ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Deleting...
                    </span>
                  ) : (
                    'Delete Entry'
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
