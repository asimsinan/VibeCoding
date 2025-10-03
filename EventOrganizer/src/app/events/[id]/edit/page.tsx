'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { EventService } from '@/lib/event-management/services/EventService'
import { Event } from '@/lib/models/Event'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import { Button, Card, LoadingSpinner, FadeIn, SlideIn } from '@/lib/ui'
import { ThemeToggle } from '@/lib/ui/theme'

export default function EditEventPage() {
  const { user } = useAuth()
  const params = useParams()
  const router = useRouter()
  const eventId = params?.id as string
  
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    startDate: '',
    endDate: '',
    capacity: 100,
    isPublic: true
  })
  
  const eventService = new EventService()

  useEffect(() => {
    if (eventId) {
      loadEvent()
    }
  }, [eventId])

  const loadEvent = async () => {
    try {
      setLoading(true)
      const eventData = await eventService.getEventById(eventId)
      if (eventData) {
        setEvent(eventData)
        // Check if current user is the event owner
        const userIsOwner = user?.id === eventData.organizerId
        setIsOwner(userIsOwner)
        
        if (!userIsOwner) {
          setError('You do not have permission to edit this event')
          return
        }
        
        setFormData({
          title: eventData.title,
          description: eventData.description,
          startDate: eventData.startDate.split('T')[0] + 'T' + eventData.startDate.split('T')[1].substring(0, 5),
          endDate: eventData.endDate.split('T')[0] + 'T' + eventData.endDate.split('T')[1].substring(0, 5),
          capacity: eventData.capacity,
          isPublic: eventData.isPublic
        })
      } else {
        setError('Event not found')
      }
    } catch (err) {
      setError('Failed to load event')
    } finally {
      setLoading(false)
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!event || !user) return

    try {
      setSaving(true)
      setError('')

      const updateData = {
        title: formData.title,
        description: formData.description,
        startDate: new Date(formData.startDate).toISOString(),
        endDate: new Date(formData.endDate).toISOString(),
        capacity: formData.capacity,
        isPublic: formData.isPublic,
        metadata: event.metadata
      }

      await eventService.updateEvent(eventId, updateData, user.id)
      setSuccess(true)
      
      // Redirect to event detail page after 2 seconds
      setTimeout(() => {
        router.push(`/events/${eventId}`)
      }, 2000)
      
    } catch (err) {
      setError('Failed to update event')
    } finally {
      setSaving(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : 
              type === 'number' ? parseInt(value) || 0 : value
    }))
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <FadeIn>
          <Card className="p-12 max-w-md text-center bg-white dark:bg-gray-800 shadow-xl border-0">
            <div className="text-red-500 mb-6">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Sign In Required</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">You must be signed in to edit events.</p>
            <Link href="/signin">
              <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </Button>
            </Link>
          </Card>
        </FadeIn>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner />
          <p className="text-gray-600 dark:text-gray-400 mt-4">Loading event...</p>
        </div>
      </div>
    )
  }

  if (error || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <FadeIn>
          <Card className="p-12 max-w-md text-center bg-white dark:bg-gray-800 shadow-xl border-0">
            <div className="text-red-500 mb-6">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">
              {error.includes('permission') ? 'Access Denied' : 'Event Not Found'}
            </h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">
              {error || 'The event you\'re trying to edit doesn\'t exist.'}
            </p>
            <div className="flex flex-col sm:flex-row gap-4">
              <Link href="/events">
                <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  Back to Events
                </Button>
              </Link>
              {event && (
                <Link href={`/events/${eventId}`}>
                  <Button variant="outline" className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View Event
                  </Button>
                </Link>
              )}
            </div>
          </Card>
        </FadeIn>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle showLabel={false} className="shadow-lg" />
      </div>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <FadeIn delay={0}>
          <div className="mb-12">
            <Link href={`/events/${eventId}`} className="group flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-300 mb-4">
              <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back to Event
            </Link>
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent dark:from-purple-400 dark:to-pink-400 mb-4">
              Edit Event
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400">Update your event details</p>
          </div>
        </FadeIn>

        {/* Success Message */}
        {success && (
          <SlideIn delay={100} direction="down">
            <div className="mb-8 p-6 bg-green-50 dark:bg-green-900 border border-green-200 dark:border-green-700 text-green-600 dark:text-green-400 rounded-xl shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="font-semibold">Event Updated!</span>
              </div>
              <p className="text-sm mt-2">
                Your event has been successfully updated. Redirecting to event page...
              </p>
            </div>
          </SlideIn>
        )}

        {/* Error Message */}
        {error && (
          <SlideIn delay={100} direction="down">
            <div className="mb-8 p-6 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 text-red-600 dark:text-red-400 rounded-xl shadow-sm">
              <div className="flex items-center">
                <svg className="w-5 h-5 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <span className="font-semibold">Error</span>
              </div>
              <p className="text-sm mt-2">{error}</p>
            </div>
          </SlideIn>
        )}

        {/* Form */}
        <SlideIn delay={200} direction="up">
          <Card className="group relative overflow-hidden bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-500 border-0">
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="relative p-8">
              <form onSubmit={handleSubmit} className="space-y-8">
            <div>
              <label htmlFor="title" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                Event Title *
              </label>
              <input
                type="text"
                id="title"
                name="title"
                required
                value={formData.title}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
                placeholder="Enter event title"
              />
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={4}
                value={formData.description}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-300 resize-none"
                placeholder="Describe your event"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div>
                <label htmlFor="startDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                  Start Date & Time *
                </label>
                <input
                  type="datetime-local"
                  id="startDate"
                  name="startDate"
                  required
                  value={formData.startDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
                />
              </div>

              <div>
                <label htmlFor="endDate" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                  End Date & Time *
                </label>
                <input
                  type="datetime-local"
                  id="endDate"
                  name="endDate"
                  required
                  value={formData.endDate}
                  onChange={handleInputChange}
                  className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
                />
              </div>
            </div>

            <div>
              <label htmlFor="capacity" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3 uppercase tracking-wide">
                Capacity *
              </label>
              <input
                type="number"
                id="capacity"
                name="capacity"
                required
                min="1"
                value={formData.capacity}
                onChange={handleInputChange}
                className="w-full px-4 py-3 border border-gray-300 dark:border-gray-600 rounded-xl shadow-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-500 dark:bg-gray-700 dark:text-white transition-all duration-300"
                placeholder="Maximum number of attendees"
              />
            </div>

            <div className="flex items-center p-4 bg-gray-50 dark:bg-gray-700 rounded-xl">
              <input
                type="checkbox"
                id="isPublic"
                name="isPublic"
                checked={formData.isPublic}
                onChange={handleInputChange}
                className="h-5 w-5 text-purple-600 focus:ring-purple-500 border-gray-300 rounded transition-colors duration-300"
              />
              <label htmlFor="isPublic" className="ml-3 block text-sm font-semibold text-gray-700 dark:text-gray-300">
                Make this event public
              </label>
            </div>

            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Link href={`/events/${eventId}`}>
                <Button
                  type="button"
                  variant="outline"
                  className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300 px-8 py-4 rounded-xl font-semibold"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    <span>Cancel</span>
                  </div>
                </Button>
              </Link>
              <button
                type="submit"
                disabled={saving}
                className="flex-1 group relative overflow-hidden bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-300 transform hover:-translate-y-1 disabled:transform-none disabled:cursor-not-allowed font-semibold"
              >
                <div className="flex items-center justify-center space-x-2">
                  {saving ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Save Changes</span>
                    </>
                  )}
                </div>
              </button>
            </div>
              </form>
            </div>
          </Card>
        </SlideIn>
      </div>
    </div>
  )
}
