/**
 * Supabase Client Configuration
 * Provides configured Supabase client for client-side operations
 * 
 * @fileoverview Supabase client setup and configuration
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

// Use environment variables or fallback to provided Supabase credentials
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rnugtlgygqbvtbklnmhn.supabase.co'
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'sb_publishable_TkyJdjZ2UppYRodIEvNioA_Y4qcekX4'

// Validate that we have proper values
if (!supabaseUrl) {
  console.error('❌ Supabase URL is not configured. Please set NEXT_PUBLIC_SUPABASE_URL environment variable.')
}

if (!supabaseAnonKey) {
  console.error('❌ Supabase anon key is not configured. Please set NEXT_PUBLIC_SUPABASE_ANON_KEY environment variable.')
}

// Create a singleton instance to avoid multiple GoTrueClient instances
let supabaseInstance: ReturnType<typeof createClient<Database>> | null = null

export const supabase = (() => {
  if (!supabaseInstance) {
    supabaseInstance = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: true,
        persistSession: true,
        detectSessionInUrl: true
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    })

    // Initialize connection monitoring
    if (typeof window !== 'undefined') {
      console.log('🔧 Initializing real-time connection monitoring')
      
      // Initialize connection monitoring
      import('@/lib/whiteboard/services/realtimeService').then(({ RealtimeService }) => {
        RealtimeService.initializeConnectionMonitoring()
      })
    }
  }
  return supabaseInstance
})()

export { createClient }
export default supabase
