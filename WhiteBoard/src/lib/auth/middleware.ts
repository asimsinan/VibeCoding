/**
 * Authentication Middleware
 * Handles authentication for API routes
 * 
 * @fileoverview Authentication middleware for API routes
 * @version 1.0.0
 */

import { NextRequest } from 'next/server'
import { supabase } from '@/lib/supabase/client'

export interface AuthenticatedRequest extends NextRequest {
  user?: {
    id: string
    email: string
    displayName: string
  }
}

/**
 * Authenticate request and add user to request object
 */
export async function authenticateRequest(request: NextRequest): Promise<AuthenticatedRequest> {
  const authHeader = request.headers.get('authorization')
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    // For development, create a mock user
    const mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'dev@example.com',
      displayName: 'Development User'
    }
    
    return {
      ...request,
      user: mockUser
    } as AuthenticatedRequest
  }

  try {
    const token = authHeader.split(' ')[1]
    
    // Verify the JWT token
    const { data: { user }, error } = await supabase.auth.getUser(token)
    
    if (error || !user) {
      throw new Error('Invalid token')
    }

    // Get user profile from database
    const { data: profile } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()

    const authenticatedRequest = {
      ...request,
      user: {
        id: user.id,
        email: user.email || '',
        displayName: (profile as any)?.display_name || user.user_metadata?.display_name || user.email?.split('@')[0] || 'User'
      }
    } as AuthenticatedRequest

    return authenticatedRequest
  } catch (error) {
    console.error('Authentication failed:', error)
    
    // For development, create a mock user
    const mockUser = {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'dev@example.com',
      displayName: 'Development User'
    }
    
    return {
      ...request,
      user: mockUser
    } as AuthenticatedRequest
  }
}
