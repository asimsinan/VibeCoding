'use client'

import React, { useState, useEffect } from 'react'
import { useAuth } from '@/lib/auth/context'
import { AttendeeService } from '@/lib/event-management/services/AttendeeService'
import { EventService } from '@/lib/event-management/services/EventService'
import { Event } from '@/lib/models/Event'
import { Attendee } from '@/lib/models/Attendee'
import Link from 'next/link'
import { Button, Card, LoadingSpinner, FadeIn, SlideIn } from '@/lib/ui'
import { ThemeToggle } from '@/lib/ui/theme'

export default function MyRegisteredEventsPage() {
  const { user, loading: authLoading } = useAuth()
  const [registeredEvents, setRegisteredEvents] = useState<Array<{ event: Event; attendee: Attendee }>>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  
  const attendeeService = new AttendeeService()
  const eventService = new EventService()

  useEffect(() => {
    if (!authLoading && user) {
      loadRegisteredEvents()
    }
  }, [user, authLoading])

  const loadRegisteredEvents = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Get all attendees for this user
      const attendees = await attendeeService.getAttendeesByUser(user!.id)
      
      // Ensure attendees is an array
      if (!attendees || !Array.isArray(attendees)) {
        setRegisteredEvents([])
        return
      }
      
      // Get event details for each registration
      const eventsWithAttendees = await Promise.all(
        attendees.map(async (attendee) => {
          try {
            const event = await eventService.getEventById(attendee.eventId)
            if (event) {
              return { event, attendee }
            }
            return null
          } catch (err) {
            return null
          }
        })
      )
      
      // Filter out null results (events that couldn't be loaded)
      const validEvents = eventsWithAttendees.filter(item => item !== null) as Array<{ event: Event; attendee: Attendee }>
      
      setRegisteredEvents(validEvents)
    } catch (err) {
      setError('Failed to load registered events. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'draft': return 'bg-gray-100 text-gray-800'
      case 'published': return 'bg-blue-100 text-blue-800'
      case 'live': return 'bg-green-100 text-green-800'
      case 'ended': return 'bg-red-100 text-red-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const getRegistrationStatusColor = (status: string) => {
    switch (status) {
      case 'registered': return 'bg-green-100 text-green-800'
      case 'checked_in': return 'bg-blue-100 text-blue-800'
      case 'cancelled': return 'bg-red-100 text-red-800'
      default: return 'bg-gray-100 text-gray-800'
    }
  }

  const handleCancelRegistration = async (attendeeId: string, eventTitle: string) => {
    if (!confirm(`Are you sure you want to cancel your registration for "${eventTitle}"?`)) {
      return
    }

    try {
      setDeletingId(attendeeId)
      await attendeeService.cancelAttendeeRegistration(attendeeId)
      
      // Remove the cancelled registration from the list
      setRegisteredEvents(prev => 
        prev.filter(({ attendee }) => attendee.id !== attendeeId)
      )
    } catch (err) {
      setError('Failed to cancel registration. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  if (authLoading || !user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle showLabel={false} className="shadow-lg" />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <FadeIn delay={0}>
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent dark:from-blue-400 dark:to-purple-400 mb-4">
              My Registered Events
            </h1>
            <p className="text-xl text-gray-600 dark:text-gray-400 max-w-2xl mx-auto">
              Events you've registered for and are participating in
            </p>
          </div>
        </FadeIn>

        {/* Navigation */}
        <FadeIn delay={100}>
          <div className="flex flex-col sm:flex-row items-center justify-center space-y-4 sm:space-y-0 sm:space-x-4 mb-12">
            <Link href="/events">
              <Button variant="outline" className="w-full sm:w-auto bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl transition-all duration-300">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                My Created Events
              </Button>
            </Link>
            <Link href="/create-event">
              <Button className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                Create New Event
              </Button>
            </Link>
          </div>
        </FadeIn>

        {/* Events List */}
        {loading ? (
          <FadeIn delay={200}>
            <div className="flex justify-center py-20">
              <div className="text-center">
                <LoadingSpinner />
                <p className="text-gray-600 dark:text-gray-400 mt-4">Loading your events...</p>
              </div>
            </div>
          </FadeIn>
        ) : error ? (
          <FadeIn delay={200}>
            <Card className="p-12 text-center bg-white dark:bg-gray-800 shadow-xl border-0">
              <div className="text-red-500 mb-6">
                <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">Oops! Something went wrong</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8">{error}</p>
              <Button onClick={loadRegisteredEvents} className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600">
                Try Again
              </Button>
            </Card>
          </FadeIn>
        ) : registeredEvents.length === 0 ? (
          <FadeIn delay={200}>
            <Card className="p-12 text-center bg-white dark:bg-gray-800 shadow-xl border-0">
              <div className="text-gray-400 mb-6">
                <svg className="mx-auto h-20 w-20" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">No registered events yet</h3>
              <p className="text-gray-600 dark:text-gray-400 mb-8 text-lg">
                You haven't registered for any events yet. Discover amazing events and join the community!
              </p>
              <Link href="/">
                <Button className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300">
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                  Browse Events
                </Button>
              </Link>
            </Card>
          </FadeIn>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {registeredEvents.map(({ event, attendee }, index) => (
              <SlideIn key={event.id} delay={200 + index * 100} direction="up">
                <Card className="group relative overflow-hidden bg-white dark:bg-gray-800 shadow-lg hover:shadow-2xl transition-all duration-500 border-0 transform hover:-translate-y-2">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-700 dark:to-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative p-8">
                    {/* Header with status badges */}
                    <div className="flex items-start justify-between mb-6">
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white line-clamp-2 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">
                        {event.title}
                      </h3>
                      <div className="flex flex-col space-y-2 ml-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getStatusColor(event.status)}`}>
                          {event.status}
                        </span>
                        <span className={`px-3 py-1 rounded-full text-xs font-semibold shadow-sm ${getRegistrationStatusColor(attendee.status)}`}>
                          {attendee.status}
                        </span>
                      </div>
                    </div>
                    
                    {/* Description */}
                    <p className="text-gray-600 dark:text-gray-400 text-sm mb-6 line-clamp-3 leading-relaxed">
                      {event.description}
                    </p>
                    
                    {/* Event details */}
                    <div className="space-y-3 mb-6">
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <div className="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                          </svg>
                        </div>
                        <span className="font-medium">{formatDate(event.startDate)}</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <div className="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                          </svg>
                        </div>
                        <span className="font-medium">{event.attendeeCount} / {event.capacity} attendees</span>
                      </div>
                      <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                        <div className="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center mr-3">
                          <svg className="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <span className="font-medium">Registered: {formatDate(attendee.registrationDate)}</span>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex space-x-3">
                      <Link href={`/event/${event.id}`} className="flex-1">
                        <Button variant="outline" className="w-full bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View Event
                        </Button>
                      </Link>
                      {event.status === 'live' && (
                        <Link href={`/event/${event.id}`} className="flex-1">
                          <Button className="w-full bg-gradient-to-r from-green-500 to-emerald-500 hover:from-green-600 hover:to-emerald-600 shadow-lg hover:shadow-xl transition-all duration-300">
                            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.828 14.828a4 4 0 01-5.656 0M9 10h1m4 0h1m-6 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                            Join Live
                          </Button>
                        </Link>
                      )}
                    </div>
                    
                    {/* Cancel Registration Button */}
                    {attendee.status !== 'cancelled' && (
                      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                        <Button
                          onClick={() => handleCancelRegistration(attendee.id, event.title)}
                          disabled={deletingId === attendee.id}
                          variant="outline"
                          className="w-full bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 hover:bg-red-100 dark:hover:bg-red-900/40 hover:border-red-300 dark:hover:border-red-700 transition-all duration-300"
                        >
                          {deletingId === attendee.id ? (
                            <>
                              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-600 mr-2"></div>
                              Cancelling...
                            </>
                          ) : (
                            <>
                              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                              Cancel Registration
                            </>
                          )}
                        </Button>
                      </div>
                    )}
                  </div>
                </Card>
              </SlideIn>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
