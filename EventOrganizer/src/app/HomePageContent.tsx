/**
 * Home Page Content Component
 * 
 * The actual content of the home page
 * 
 * @fileoverview Home Page Content for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { useAuth } from '@/lib/auth/context'
import { Button, Card, FadeIn, SlideIn } from '@/lib/ui'
import { ThemeToggle } from '@/lib/ui/theme'

export default function HomePageContent() {
  const { user, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Theme Toggle - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <ThemeToggle showLabel={false} className="shadow-lg" />
      </div>

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-to-br from-blue-600 to-purple-700 text-white">
        <div className="absolute inset-0 bg-black opacity-20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24">
          <FadeIn delay={0}>
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                Virtual Event Organizer
              </h1>
              <p className="text-xl md:text-2xl mb-8 text-blue-100">
                Create, manage, and host amazing virtual events with real-time features
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                {user ? (
                  <>
                    <Link href="/events">
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="bg-white text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-700"
                      >
                        My Created Events
                      </Button>
                    </Link>
                    <Link href="/my-events">
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="bg-white text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-700"
                      >
                        My Registered Events
                      </Button>
                    </Link>
                    <Link href="/create-event">
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="bg-white text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-700"
                      >
                        Create Event
                      </Button>
                    </Link>
                    <Button 
                      size="lg" 
                      variant="outline" 
                      className="border-white text-white hover:bg-white hover:text-blue-600"
                      onClick={() => signOut()}
                    >
                      Sign Out
                    </Button>
                  </>
                ) : (
                  <>
                    <Link href="/signin">
                      <Button 
                        size="lg" 
                        variant="outline" 
                        className="bg-white text-blue-600 border-blue-600 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-700"
                      >
                        Sign In
                      </Button>
                    </Link>
                  </>
                )}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-white dark:bg-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <FadeIn delay={100}>
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 dark:text-white mb-4">
                Powerful Features
              </h2>
              <p className="text-xl text-gray-600 dark:text-gray-400">
                Everything you need to host successful virtual events
              </p>
            </div>
          </FadeIn>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            <SlideIn delay={200} direction="up">
              <Card hover className="text-center">
                <div className="text-4xl mb-4">🎯</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Event Management
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Create and manage events with comprehensive tools and analytics
                </p>
              </Card>
            </SlideIn>

            <SlideIn delay={300} direction="up">
              <Card hover className="text-center">
                <div className="text-4xl mb-4">⚡</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Real-time Updates
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Live notifications, user presence, and instant event updates
                </p>
              </Card>
            </SlideIn>

            <SlideIn delay={400} direction="up">
              <Card hover className="text-center">
                <div className="text-4xl mb-4">📱</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Responsive Design
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Works perfectly on desktop, tablet, and mobile devices
                </p>
              </Card>
            </SlideIn>

            <SlideIn delay={500} direction="up">
              <Card hover className="text-center">
                <div className="text-4xl mb-4">🌙</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Dark Mode
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Beautiful dark and light themes with system preference detection
                </p>
              </Card>
            </SlideIn>

            <SlideIn delay={600} direction="up">
              <Card hover className="text-center">
                <div className="text-4xl mb-4">🔐</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Secure Authentication
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Built-in authentication with Supabase Auth
                </p>
              </Card>
            </SlideIn>

            <SlideIn delay={700} direction="up">
              <Card hover className="text-center">
                <div className="text-4xl mb-4">📊</div>
                <h3 className="text-xl font-semibold mb-2 text-gray-900 dark:text-white">
                  Analytics & Insights
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Track attendance, engagement, and event performance
                </p>
              </Card>
            </SlideIn>
          </div>
        </div>
      </section>



    </div>
  )
}
