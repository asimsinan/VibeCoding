/**
 * Home Page
 * Main landing page with redirect to whiteboard list
 * 
 * @fileoverview Home page with authentication check and redirect
 * @version 1.0.0
 */

'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase/client'

export default function HomePage() {
  const router = useRouter()

  useEffect(() => {
    // Check authentication status and redirect
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Auth error:', error)
          router.push('/auth/login')
          return
        }

        if (session?.user) {
          console.log('User authenticated, redirecting to whiteboard')
          router.push('/whiteboard')
        } else {
          console.log('No session found, redirecting to login')
          router.push('/auth/login')
        }
      } catch (err) {
        console.error('Error checking auth:', err)
        router.push('/auth/login')
      }
    }

    // Add a small delay to prevent race conditions
    const timeoutId = setTimeout(() => {
      checkAuth()
    }, 100)

    // Listen for auth state changes with better handling
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Auth state change:', event, session?.user?.email)
      
      // Only redirect on explicit sign in/out events, not on token refresh
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('User signed in, redirecting to whiteboard')
        router.push('/whiteboard')
      } else if (event === 'SIGNED_OUT') {
        console.log('User signed out, redirecting to login')
        router.push('/auth/login')
      }
      // Don't redirect on TOKEN_REFRESHED or other events
    })

    // Cleanup subscription and timeout on unmount
    return () => {
      clearTimeout(timeoutId)
      subscription.unsubscribe()
    }
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading...</p>
      </div>
    </div>
  )
}
