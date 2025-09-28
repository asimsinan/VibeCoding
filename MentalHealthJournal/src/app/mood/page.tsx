'use client'

import { useState, useEffect, Suspense } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useMoodData } from '@/app/hooks/useMoodData'
import { MoodEntry } from '@/lib/mood-core/models'
import { getTodayLocal } from '@/lib/utils/dateUtils'

function MoodLoggingContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const {
    moodEntries,
    todayMood,
    isLoading,
    isInitialized,
    error,
    createMoodEntry,
    updateMoodEntry,
    clearError
  } = useMoodData({
    autoSync: true
  })
  
  const [rating, setRating] = useState<number | null>(null)
  const [notes, setNotes] = useState('')
  const [existingMood, setExistingMood] = useState<MoodEntry | null>(null)
  const [isEditingSpecificMood, setIsEditingSpecificMood] = useState(false)
  const [localError, setLocalError] = useState<string | null>(null)
  const [showDuplicateConfirm, setShowDuplicateConfirm] = useState(false)
  const [pendingMoodData, setPendingMoodData] = useState<{rating: number, notes: string} | null>(null)

  useEffect(() => {
    const editId = searchParams.get('edit')
    
    if (editId) {
      // Find the specific mood entry to edit
      const moodToEdit = moodEntries.find(mood => mood.id === editId)
      if (moodToEdit) {
        setExistingMood(moodToEdit)
        setRating(moodToEdit.rating)
        setNotes(moodToEdit.notes || '')
        setIsEditingSpecificMood(true)
      } else {
        // If mood not found, clear the edit state
        setExistingMood(null)
        setRating(null)
        setNotes('')
        setIsEditingSpecificMood(false)
      }
    } else if (todayMood) {
      // Normal behavior - edit today's mood
      setExistingMood(todayMood)
      setRating(todayMood.rating)
      setNotes(todayMood.notes || '')
      setIsEditingSpecificMood(false)
    } else {
      // No existing mood
      setExistingMood(null)
      setRating(null)
      setNotes('')
      setIsEditingSpecificMood(false)
    }
  }, [todayMood, moodEntries, searchParams])

  const handleRatingChange = (newRating: number) => {
    setRating(newRating)
    clearError()
    setLocalError(null)
  }

  const handleNotesChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setNotes(e.target.value)
    clearError()
    setLocalError(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (rating === null) {
      return
    }

    try {
      clearError()

      // Check if there's already a mood entry for today (in case existingMood wasn't set properly)
      const today = getTodayLocal()
      const todayMoodEntry = moodEntries.find(entry => entry.entryDate === today)

      if (existingMood || todayMoodEntry) {
        // Update existing mood
        const moodToUpdate = existingMood || todayMoodEntry
        await updateMoodEntry(moodToUpdate!.id, {
          rating,
          notes: notes.trim() || undefined
        })
      } else {
        // Check if there's already a mood entry for today that we might have missed
        const hasExistingEntry = moodEntries.some(entry => entry.entryDate === today)
        
        if (hasExistingEntry) {
          // Show confirmation popup
          setPendingMoodData({ rating, notes: notes.trim() })
          setShowDuplicateConfirm(true)
          return
        }

        // Create new mood
        await createMoodEntry({
          rating,
          notes: notes.trim() || undefined,
          entryDate: today
        })
      }

      // Redirect to home page after successful save
      router.push('/?mood=saved')
    } catch (err: any) {
      // Error is handled by the hook
      console.error('Failed to save mood:', err)
      
      // If it's a duplicate entry error, show popup instead of error message
      if (err.message && (err.message.includes('already have a mood entry for this date') || err.message.includes('DUPLICATE_ENTRY'))) {
        // Show confirmation popup for duplicate entry
        setPendingMoodData({ rating, notes: notes.trim() })
        setShowDuplicateConfirm(true)
        return
      }
      
      // For other errors, show the error message
      setLocalError('Failed to save mood entry. Please try again.')
    }
  }

  const handleConfirmDuplicate = async () => {
    if (!pendingMoodData) return

    try {
      clearError()
      
      // Find the existing mood entry for today
      const today = getTodayLocal()
      const todayMoodEntry = moodEntries.find(entry => entry.entryDate === today)
      
      if (todayMoodEntry) {
        // Update the existing mood entry
        await updateMoodEntry(todayMoodEntry.id, {
          rating: pendingMoodData.rating,
          notes: pendingMoodData.notes || undefined
        })
        
        // Redirect to home page after successful save
        router.push('/?mood=updated')
      }
    } catch (err: any) {
      console.error('Failed to update mood:', err)
      setLocalError('Failed to update your mood entry. Please try again.')
    } finally {
      setShowDuplicateConfirm(false)
      setPendingMoodData(null)
    }
  }

  const handleCancelDuplicate = () => {
    setShowDuplicateConfirm(false)
    setPendingMoodData(null)
  }

  const moodDescriptions = {
    1: 'Very Low - Extremely difficult day',
    2: 'Low - Very challenging day',
    3: 'Low - Difficult day',
    4: 'Low - Somewhat difficult day',
    5: 'Neutral - Average day',
    6: 'Good - Slightly positive day',
    7: 'Good - Positive day',
    8: 'High - Very positive day',
    9: 'High - Excellent day',
    10: 'Very High - Outstanding day'
  }

  const getMoodColors = (value: number) => {
    if (value <= 2) {
      return {
        bg: 'bg-red-50',
        border: 'border-red-300',
        text: 'text-red-700',
        hover: 'hover:border-red-400 hover:bg-red-100',
        selected: 'border-red-500 bg-red-100 text-red-800'
      }
    } else if (value <= 4) {
      return {
        bg: 'bg-orange-50',
        border: 'border-orange-300',
        text: 'text-orange-700',
        hover: 'hover:border-orange-400 hover:bg-orange-100',
        selected: 'border-orange-500 bg-orange-100 text-orange-800'
      }
    } else if (value <= 6) {
      return {
        bg: 'bg-yellow-50',
        border: 'border-yellow-300',
        text: 'text-yellow-700',
        hover: 'hover:border-yellow-400 hover:bg-yellow-100',
        selected: 'border-yellow-500 bg-yellow-100 text-yellow-800'
      }
    } else if (value <= 8) {
      return {
        bg: 'bg-blue-50',
        border: 'border-blue-300',
        text: 'text-blue-700',
        hover: 'hover:border-blue-400 hover:bg-blue-100',
        selected: 'border-blue-500 bg-blue-100 text-blue-800'
      }
    } else {
      return {
        bg: 'bg-green-50',
        border: 'border-green-300',
        text: 'text-green-700',
        hover: 'hover:border-green-400 hover:bg-green-100',
        selected: 'border-green-500 bg-green-100 text-green-800'
      }
    }
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
                className="text-blue-600 px-3 py-2 rounded-md text-sm font-medium bg-blue-50"
                aria-current="page"
              >
                Log Mood
              </Link>
              <Link 
                href="/mood/history" 
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
        <div className="max-w-2xl mx-auto">
          {!isInitialized ? (
            <div className="flex items-center justify-center py-16">
              <div className="text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Initializing Database</h2>
                <p className="text-gray-600">Setting up your mood tracking environment...</p>
              </div>
            </div>
          ) : (
            <>
              {/* Header */}
              <div className="text-center mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  {existingMood ? (isEditingSpecificMood ? 'Edit Mood Entry' : 'Update Today\'s Mood') : 'Log Today\'s Mood'}
                </h1>
                <p className="text-lg text-gray-600">
                  {isEditingSpecificMood && existingMood 
                    ? new Date(existingMood.entryDate).toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                    : new Date().toLocaleDateString('en-US', { 
                        weekday: 'long', 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })
                  }
                </p>
              </div>

          {/* Mood Logging Form */}
          <div className="bg-white rounded-lg shadow-md p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Mood Rating */}
              <div>
                <label htmlFor="mood-rating" className="block text-sm font-medium text-gray-700 mb-4">
                  How are you feeling today? (1-10)
                </label>
                <div className="grid grid-cols-5 gap-2 mb-4">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10].map((value) => {
                    const colors = getMoodColors(value)
                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => handleRatingChange(value)}
                        className={`h-12 w-full rounded-lg border-2 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
                          rating === value
                            ? `${colors.selected} focus:ring-${colors.border.split('-')[1]}-500`
                            : `${colors.bg} ${colors.border} ${colors.text} ${colors.hover} focus:ring-${colors.border.split('-')[1]}-500`
                        }`}
                        aria-pressed={rating === value}
                      >
                        {value}
                      </button>
                    )
                  })}
                </div>
                {rating && (
                  <p className={`text-sm text-center font-medium ${getMoodColors(rating).text}`}>
                    {moodDescriptions[rating as keyof typeof moodDescriptions]}
                  </p>
                )}
              </div>

              {/* Notes */}
              <div>
                <label htmlFor="mood-notes" className="block text-sm font-medium text-gray-700 mb-2">
                  Notes (optional)
                </label>
                <textarea
                  id="mood-notes"
                  name="notes"
                  rows={4}
                  value={notes}
                  onChange={handleNotesChange}
                  placeholder="How was your day? What contributed to your mood? Any specific thoughts or feelings you'd like to remember?"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                  maxLength={500}
                />
                <div className="mt-1 text-sm text-gray-500 text-right">
                  {notes.length}/500 characters
                </div>
              </div>

              {/* Error Message */}
              {(error || localError) && (
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
                        <p>{error || localError}</p>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Submit Button */}
              <div className="flex justify-end space-x-4">
                <Link
                  href="/"
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </Link>
                <button
                  type="submit"
                  disabled={isLoading || rating === null}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Saving...
                    </span>
                  ) : (
                    existingMood ? 'Update Mood' : 'Save Mood'
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Help Text */}
          <div className="mt-8 bg-blue-50 border border-blue-200 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-blue-800">Tips for mood tracking</h3>
                <div className="mt-2 text-sm text-blue-700">
                  <ul className="list-disc list-inside space-y-1">
                    <li>Be honest with yourself - this is for your personal growth</li>
                    <li>Consider your overall emotional state, not just one moment</li>
                    <li>Notes help identify patterns and triggers over time</li>
                    <li>You can always update your mood entry later in the day</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
            </>
          )}
        </div>
      </main>

      {/* Duplicate Entry Confirmation Popup */}
      {showDuplicateConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="flex-shrink-0">
                  <svg className="h-6 w-6 text-yellow-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">Mood Already Logged</h3>
                </div>
              </div>
              
              <div className="mb-6">
                <p className="text-sm text-gray-600 mb-4">
                  You already have a mood entry for today. Would you like to update it with your new rating and notes?
                </p>
                
                {pendingMoodData && (
                  <div className="bg-gray-50 rounded-md p-3">
                    <p className="text-sm text-gray-700">
                      <span className="font-medium">New Rating:</span> {pendingMoodData.rating}/10
                    </p>
                    {pendingMoodData.notes && (
                      <p className="text-sm text-gray-700 mt-1">
                        <span className="font-medium">New Notes:</span> {pendingMoodData.notes}
                      </p>
                    )}
                  </div>
                )}
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleCancelDuplicate}
                  className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmDuplicate}
                  className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                >
                  Update Entry
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function MoodLoggingPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">Loading...</h2>
          <p className="text-gray-600">Preparing mood logging interface...</p>
        </div>
      </div>
    }>
      <MoodLoggingContent />
    </Suspense>
  )
}
