/**
 * Not Found Component
 * 
 * Handles 404 errors when pages are not found
 * 
 * @fileoverview 404 Not Found Page for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

'use client'

import React from 'react'
import Link from 'next/link'
import { Button, Card, FadeIn } from '@/lib/ui'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-4">
      <Card className="max-w-md w-full p-8 text-center">
        <FadeIn delay={0}>
          <div className="text-8xl mb-6">🔍</div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            404
          </h1>
          <h2 className="text-xl font-semibold text-gray-700 dark:text-gray-300 mb-4">
            Page Not Found
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-8">
            Sorry, we couldn't find the page you're looking for. It might have been moved, deleted, or you entered the wrong URL.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/" className="flex-1">
              <Button className="w-full">
                Go Home
              </Button>
            </Link>
            <Link href="/realtime-demo" className="flex-1">
              <Button variant="outline" className="w-full">
                View Demo
              </Button>
            </Link>
          </div>
        </FadeIn>
      </Card>
    </div>
  )
}
