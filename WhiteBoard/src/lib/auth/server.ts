/**
 * Server-side Authentication Utilities
 * Handles authentication in API routes and server components
 * 
 * @fileoverview Server-side auth utilities for API routes
 * @version 1.0.0
 */

import { NextRequest } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase/server-admin'

export interface AuthenticatedUser {
  id: string
  email: string
  displayName: string
}

/**
 * Get authenticated user from request headers
 */
export async function getAuthenticatedUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.split(' ')[1]
    
    // Verify the JWT token
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token)
    
    if (error || !user) {
      return null
    }

    // Get user profile from database
    const { data: profile } = await supabaseAdmin
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    return {
      id: user.id,
      email: user.email || '',
      displayName: (profile as any)?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'
    }
  } catch (error) {
    console.error('Error getting authenticated user:', error)
    return null
  }
}

/**
 * Get user ID from request (fallback for development)
 */
export function getUserIdFromRequest(request: NextRequest): string {
  // For development, we can use a query parameter or header
  const userId = request.nextUrl.searchParams.get('userId') || 
                 request.headers.get('x-user-id') ||
                 '550e8400-e29b-41d4-a716-446655440000' // Fallback for development
  
  return userId
}
