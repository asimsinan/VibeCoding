/**
 * Supabase Service Role Configuration
 * 
 * This file provides a service role client for admin operations
 * that bypass RLS policies when needed.
 * 
 * @fileoverview Service Role Configuration for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

import { createClient } from '@supabase/supabase-js'

let supabaseAdminInstance: ReturnType<typeof createClient> | null = null

// Lazy initialization of Supabase admin client
function getSupabaseAdminClient() {
  if (!supabaseAdminInstance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Missing required Supabase service role environment variables')
    }

    supabaseAdminInstance = createClient(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }

  return supabaseAdminInstance
}

// Export getter function for lazy initialization
export const supabaseAdmin = new Proxy({} as ReturnType<typeof createClient>, {
  get(target, prop) {
    const client = getSupabaseAdminClient()
    return client[prop as keyof typeof client]
  }
})

export default supabaseAdmin
