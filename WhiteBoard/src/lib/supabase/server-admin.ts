/**
 * Supabase Server Admin Client
 * Provides admin access to Supabase for server-side operations
 * 
 * @fileoverview Server admin client that bypasses RLS
 * @version 1.0.0
 */

import { createClient } from '@supabase/supabase-js'
import { Database } from './types'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://rnugtlgygqbvtbklnmhn.supabase.co'
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key'

// Create a singleton admin client to avoid multiple instances
let supabaseAdminInstance: ReturnType<typeof createClient<Database>> | null = null

export const supabaseAdmin = (() => {
  if (!supabaseAdminInstance) {
    supabaseAdminInstance = createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    })
  }
  return supabaseAdminInstance
})()

export default supabaseAdmin
