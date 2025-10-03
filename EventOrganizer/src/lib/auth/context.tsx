/**
 * Authentication Context and Hooks
 * 
 * Provides authentication state management and Supabase integration
 * 
 * @fileoverview Authentication Context for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react'
import { User, Session as SupabaseSession } from '@supabase/supabase-js'
import { supabase } from '../supabase'
import { apiClient } from '../api/frontend-client'

// Types
interface AuthUser {
  id: string
  email: string
  role: 'organizer' | 'attendee' | 'admin'
  profile?: {
    firstName?: string
    lastName?: string
    bio?: string
    avatar?: string
  }
}

interface AuthContextType {
  user: AuthUser | null
  session: SupabaseSession | null
  loading: boolean
  signUp: (email: string, password: string, name?: string) => Promise<{ error: any }>
  signIn: (email: string, password: string) => Promise<{ error: any }>
  signOut: () => Promise<{ error: any }>
  resetPassword: (email: string) => Promise<{ error: any }>
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Auth provider component
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [session, setSession] = useState<SupabaseSession | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Get initial session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session)
      setUser(session?.user ? mapSupabaseUser(session.user) : null)
      setLoading(false)
    })

    // Listen for auth changes
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      setSession(session)
      setUser(session?.user ? mapSupabaseUser(session.user) : null)
      setLoading(false)

      // Update API client auth token
      if (session?.access_token) {
        apiClient.setAuthToken(session.access_token)
      } else {
        apiClient.setAuthToken(null)
      }
    })

    return () => subscription.unsubscribe()
  }, [])

  const signUp = async (email: string, password: string, name?: string) => {
    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
        data: {
          full_name: name || email.split('@')[0]
        }
      }
    })
    return { error }
  }

  const signIn = async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    })
    return { error }
  }

  const signOut = async () => {
    const { error } = await supabase.auth.signOut()
    return { error }
  }

  const resetPassword = async (email: string) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email)
    return { error }
  }

  const value = {
    user,
    session,
    loading,
    signUp,
    signIn,
    signOut,
    resetPassword,
  }

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

// Hook to use auth context
export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

// Helper function to map Supabase user to our user type
function mapSupabaseUser(supabaseUser: User): AuthUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    role: 'attendee', // Default role, can be enhanced with user metadata
    profile: {
      firstName: supabaseUser.user_metadata?.full_name?.split(' ')[0] || supabaseUser.user_metadata?.first_name,
      lastName: supabaseUser.user_metadata?.full_name?.split(' ').slice(1).join(' ') || supabaseUser.user_metadata?.last_name,
      avatar: supabaseUser.user_metadata?.avatar_url,
    },
  }
}

// Export supabase client for direct use if needed
export { supabase }
