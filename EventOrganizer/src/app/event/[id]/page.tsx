'use client'

import React, { useState, useEffect } from 'react'
import { EventService } from '@/lib/event-management/services/EventService'
import { AttendeeService } from '@/lib/event-management/services/AttendeeService'
import { Event } from '@/lib/models/Event'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { useAuth } from '@/lib/auth/context'
import { RealTimeDashboard } from '@/components/RealTimeDashboard'
import { connectionTracker } from '@/lib/services/ConnectionTracker'
import { useToast } from '@/lib/ui/Toast'
import { Button, Card, LoadingSpinner, FadeIn, SlideIn } from '@/lib/ui'
import { ThemeToggle } from '@/lib/ui/theme'

export default function PublicEventPage() {
  const { user } = useAuth()
  const { success, error, info } = useToast()
  const params = useParams()
  const eventId = params?.id as string
  
  const [event, setEvent] = useState<Event | null>(null)
  const [loading, setLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')
  const [isRegistered, setIsRegistered] = useState(false)
  const [registering, setRegistering] = useState(false)
  const [isOwner, setIsOwner] = useState(false)
  const [isAtCapacity, setIsAtCapacity] = useState(false)
  
  const eventService = new EventService()
  const attendeeService = new AttendeeService()

  useEffect(() => {
    if (eventId) {
      loadEvent()
      
      // Track user connection to this event if user is logged in
      if (user) {
        connectionTracker.trackConnection(user.id, eventId)
        
        // Update last seen periodically
        const updateInterval = setInterval(() => {
          connectionTracker.updateLastSeen(user.id, eventId)
        }, 30000) // Update every 30 seconds
        
        // Cleanup on unmount
        return () => {
          clearInterval(updateInterval)
          connectionTracker.removeConnection(user.id, eventId)
        }
      }
    }
  }, [eventId, user]) // Add user dependency to recheck registration when user changes

  const loadEvent = async () => {
    try {
      setLoading(true)
      const eventData = await eventService.getEventById(eventId)
      if (eventData) {
        setEvent(eventData)
        // Check if current user is the event owner
        setIsOwner(user?.id === eventData.organizerId)
        // Check if event is at capacity
        setIsAtCapacity(eventData.attendeeCount >= eventData.capacity)
        // Check if user is registered
        if (user) {
          const registered = await attendeeService.isUserRegistered(eventId, user.id)
          setIsRegistered(registered)
        }
      } else {
        setErrorMessage('Event not found')
        error('Event Not Found', 'The event you\'re looking for doesn\'t exist or is not public.')
      }
    } catch (err) {
      setErrorMessage('Failed to load event')
      error('Failed to Load Event', 'There was an error loading the event details.')
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async () => {
    if (!user) {
      info('Sign In Required', 'Please sign in to register for this event')
      return
    }

    try {
      setRegistering(true)
      await attendeeService.registerAttendee({
        eventId: eventId,
        userId: user.id,
        type: 'attendee',
        status: 'registered',
        metadata: {
          customFields: {}
        }
      })
      
      setIsRegistered(true)
      // Reload event to update attendee count
      await loadEvent()
      success('Registration Successful!', 'You have been successfully registered for this event.')
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to register for the event'
      error('Registration Failed', errorMsg)
    } finally {
      setRegistering(false)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
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

  if (errorMessage || !event) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-red-50 to-pink-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <FadeIn>
          <Card className="p-12 text-center bg-white dark:bg-gray-800 shadow-xl border-0 max-w-md">
            <div className="text-red-500 mb-6">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event Not Found</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">{errorMessage || 'The event you\'re looking for doesn\'t exist or is not public.'}</p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-red-500 to-pink-500 hover:from-red-600 hover:to-pink-600 shadow-lg hover:shadow-xl transition-all duration-300">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                </svg>
                Go Home
              </Button>
            </Link>
          </Card>
        </FadeIn>
      </div>
    )
  }

  // Don't show draft events to public
  if (event.status === 'draft') {
    return (
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-yellow-50 to-orange-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center">
        <FadeIn>
          <Card className="p-12 text-center bg-white dark:bg-gray-800 shadow-xl border-0 max-w-md">
            <div className="text-yellow-500 mb-6">
              <svg className="mx-auto h-16 w-16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-4">Event Not Available</h1>
            <p className="text-gray-600 dark:text-gray-400 mb-8">This event is not yet published.</p>
            <Link href="/">
              <Button className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 shadow-lg hover:shadow-xl transition-all duration-300">
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Other Events
              </Button>
            </Link>
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

      {/* Header */}
      <div className="relative overflow-hidden bg-white dark:bg-gray-800 shadow-xl">
        {/* Gradient overlay */}
        <div className="absolute inset-0 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 opacity-50"></div>
        
        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <FadeIn delay={0}>
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-6">
                <Link href="/" className="group flex items-center text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors duration-300">
                  <svg className="w-5 h-5 mr-2 group-hover:-translate-x-1 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  Back to Home
                </Link>
                <div>
                  <h1 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-2">{event.title}</h1>
                  <div className="flex items-center space-x-4">
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold shadow-sm ${getStatusColor(event.status)}`}>
                      {event.status}
                    </span>
                    <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                      <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      {event.attendeeCount} / {event.capacity} attendees
                    </div>
                  </div>
                </div>
              </div>
            
            <div className="flex flex-wrap items-center gap-3">
              {user ? (
                <>
                  {isRegistered ? (
                    <div className="flex items-center space-x-3">
                      <span className="px-4 py-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded-lg text-sm font-semibold shadow-sm">
                        <svg className="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Registered
                      </span>
                      <Link href="/my-events">
                        <Button variant="outline" className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                          </svg>
                          View My Events
                        </Button>
                      </Link>
                    </div>
                  ) : (
                    <button
                      onClick={handleRegister}
                      disabled={registering || !event.registrationOpen || isAtCapacity}
                      className="group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-3 rounded-xl shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-300 transform hover:-translate-y-1 disabled:transform-none disabled:cursor-not-allowed"
                    >
                      <div className="flex items-center space-x-2">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                        <span className="font-semibold">
                          {registering ? 'Registering...' : isAtCapacity ? 'Event Full' : 'Register Now'}
                        </span>
                      </div>
                    </button>
                  )}
                  {isOwner && (
                    <Link href={`/events/${eventId}`}>
                      <Button variant="outline" className="bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 transition-all duration-300">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                        Manage Event
                      </Button>
                    </Link>
                  )}
                </>
              ) : (
                <Link href="/signin">
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300">
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                    </svg>
                    Sign In to Register
                  </Button>
                </Link>
              )}
            </div>
            </div>
          </FadeIn>
        </div>
      </div>

      {/* Event Info */}
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-8">
            {/* About This Event */}
            <SlideIn delay={100} direction="up">
              <Card className="group relative overflow-hidden bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-500 border-0">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-gray-700 dark:to-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative p-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-6 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors duration-300">About This Event</h2>
                  <p className="text-gray-700 dark:text-gray-300 leading-relaxed text-lg">{event.description}</p>
                </div>
              </Card>
            </SlideIn>

            {/* Event Details */}
            <SlideIn delay={200} direction="up">
              <Card className="group relative overflow-hidden bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-500 border-0">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative p-8">
                  <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-8 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">Event Details</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Start Date</label>
                        <p className="text-gray-900 dark:text-white mt-2 font-medium">{formatDate(event.startDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">End Date</label>
                        <p className="text-gray-900 dark:text-white mt-2 font-medium">{formatDate(event.endDate)}</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                        </svg>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Capacity</label>
                        <p className="text-gray-900 dark:text-white mt-2 font-medium">{event.capacity} attendees</p>
                      </div>
                    </div>
                    <div className="flex items-start space-x-4">
                      <div className="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center flex-shrink-0">
                        <svg className="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                      </div>
                      <div>
                        <label className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">Type</label>
                        <p className="text-gray-900 dark:text-white mt-2 font-medium capitalize">{event.type}</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            </SlideIn>

            {/* Real-time Dashboard for Registered Users */}
            {user && isRegistered && (
              <SlideIn delay={300} direction="up">
                <Card className="bg-white dark:bg-gray-800 shadow-xl border-0">
                  <RealTimeDashboard eventId={eventId} userId={user.id} />
                </Card>
              </SlideIn>
            )}
          </div>

          {/* Sidebar */}
          <div className="space-y-8">
            {/* Registration Status */}
            <SlideIn delay={100} direction="left">
              <Card className="group relative overflow-hidden bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-500 border-0">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-gray-700 dark:to-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative p-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 group-hover:text-green-600 dark:group-hover:text-green-400 transition-colors duration-300">Registration</h3>
                  {user ? (
                    <div className="space-y-4">
                      {isRegistered ? (
                        <div className="text-center">
                          <div className="w-16 h-16 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg">
                            <svg className="w-8 h-8 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                          <p className="text-green-600 dark:text-green-400 font-semibold text-lg">You're registered!</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">Check your email for details</p>
                        </div>
                      ) : (
                        <div className="text-center">
                          <button
                            onClick={handleRegister}
                            disabled={registering || !event.registrationOpen || isAtCapacity}
                            className="w-full group relative overflow-hidden bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 disabled:from-gray-400 disabled:to-gray-500 text-white px-6 py-4 rounded-xl shadow-lg hover:shadow-xl disabled:shadow-none transition-all duration-300 transform hover:-translate-y-1 disabled:transform-none disabled:cursor-not-allowed font-semibold"
                          >
                            <div className="flex items-center justify-center space-x-2">
                              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                              </svg>
                              <span>
                                {registering ? 'Registering...' : isAtCapacity ? 'Event Full' : 'Register Now'}
                              </span>
                            </div>
                          </button>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-3">
                            {event.attendeeCount} of {event.capacity} spots taken
                            {isAtCapacity && <span className="text-red-600 dark:text-red-400 font-semibold"> - FULL</span>}
                          </p>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-gray-600 dark:text-gray-400 mb-6">Sign in to register for this event</p>
                      <Link href="/signin">
                        <Button className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 shadow-lg hover:shadow-xl transition-all duration-300">
                          <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                          </svg>
                          Sign In
                        </Button>
                      </Link>
                    </div>
                  )}
                </div>
              </Card>
            </SlideIn>

            {/* Event Settings */}
            {event.metadata && (
              <SlideIn delay={200} direction="left">
                <Card className="group relative overflow-hidden bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-500 border-0">
                  {/* Gradient overlay */}
                  <div className="absolute inset-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-gray-700 dark:to-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                  
                  <div className="relative p-8">
                    <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition-colors duration-300">Event Features</h3>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-emerald-100 dark:bg-emerald-900 flex items-center justify-center">
                            <svg className="w-4 h-4 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
                            </svg>
                          </div>
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Live Chat</span>
                        </div>
                        <span className={`text-sm font-medium ${event.metadata.chatEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {event.metadata.chatEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900 flex items-center justify-center">
                            <svg className="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </div>
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Q&A Session</span>
                        </div>
                        <span className={`text-sm font-medium ${event.metadata.qaEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {event.metadata.qaEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900 flex items-center justify-center">
                            <svg className="w-4 h-4 text-pink-600 dark:text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                            </svg>
                          </div>
                          <span className="text-sm font-semibold text-gray-600 dark:text-gray-300">Networking</span>
                        </div>
                        <span className={`text-sm font-medium ${event.metadata.networkingEnabled ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'}`}>
                          {event.metadata.networkingEnabled ? 'Enabled' : 'Disabled'}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </SlideIn>
            )}

            {/* Share Event */}
            <SlideIn delay={300} direction="left">
              <Card className="group relative overflow-hidden bg-white dark:bg-gray-800 shadow-xl hover:shadow-2xl transition-all duration-500 border-0">
                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-gray-700 dark:to-gray-600 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                
                <div className="relative p-8">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-6 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors duration-300">Share Event</h3>
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(window.location.href)
                      success('Link Copied!', 'Event URL has been copied to your clipboard.')
                    }}
                    className="w-full group relative overflow-hidden bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-6 py-4 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 font-semibold"
                  >
                    <div className="flex items-center justify-center space-x-2">
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.367 2.684 3 3 0 00-5.367-2.684z" />
                      </svg>
                      <span>Copy Event Link</span>
                    </div>
                  </button>
                </div>
              </Card>
            </SlideIn>
          </div>
        </div>
      </div>
    </div>
  )
}
