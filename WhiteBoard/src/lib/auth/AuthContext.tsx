'use client'

import React, { createContext, useContext, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabase/client'

interface AuthUser {
  id: string
  email: string
  displayName: string
}

interface AuthContextType {
  user: AuthUser | null
  loading: boolean
  isClient: boolean
  signIn: (email: string, password: string) => Promise<{ success: boolean; error?: string }>
  signUp: (email: string, password: string, displayName: string) => Promise<{ success: boolean; error?: string }>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (context === undefined) {
    // Return default values during SSR to prevent hydration mismatch
    if (typeof window === 'undefined') {
      return {
        user: null,
        loading: true,
        isClient: false,
        signIn: async () => ({ success: false, error: 'Not available during SSR' }),
        signUp: async () => ({ success: false, error: 'Not available during SSR' }),
        signOut: async () => {}
      }
    }
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}

interface AuthProviderProps {
  children: React.ReactNode
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<AuthUser | null>(null)
  const [loading, setLoading] = useState(true)
  const [isClient, setIsClient] = useState(false)

  useEffect(() => {
    setIsClient(true)
    
    // Development Auth Bypass - Use real user ID for testing
    console.log('🔧 Using development auth bypass for real-time testing')
    
    const mockUser = {
      id: '1e0d0ad9-e372-4086-ae7f-7d0fdb35000a', // Real user ID from Supabase test
      email: 'dev@example.com',
      displayName: 'Development User'
    }
    
    setUser(mockUser)
    setLoading(false)
    
    // Original authentication code (commented out for development)
    /*
    // Get initial session with timeout protection
    const getInitialSession = async () => {
      try {
        // Add timeout to prevent infinite loading - increased to 30 seconds
        const timeoutPromise = new Promise<never>((_, reject) => {
          setTimeout(() => reject(new Error('Authentication timeout')), 30000) // 30 second timeout
        })
        
        const sessionPromise = supabase.auth.getSession()
        const { data: { session } } = await Promise.race([sessionPromise, timeoutPromise])
        
        if (session?.user) {
          await handleUser(session.user)
        }
      } catch (error) {
        console.error('Error getting initial session:', error)
        // Set user to null if there's an error
        setUser(null)
      } finally {
        setLoading(false)
      }
    }

    getInitialSession()

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          await handleUser(session.user)
        } else {
          setUser(null)
        }
        setLoading(false)
      }
    )

    return () => subscription.unsubscribe()
    */
  }, [])

  // const handleUser = async (supabaseUser: SupabaseUser) => {
  //   try {
  //     // Add timeout to prevent infinite loading - increased to 30 seconds
  //     const timeoutPromise = new Promise<never>((_, reject) => {
  //       setTimeout(() => reject(new Error('User handling timeout')), 30000) // 30 second timeout
  //     })
  //     
  //     const userPromise = (async () => {
  //       // Get or create user profile
  //       const { data: profile, error } = await supabase
  //         .from('users')
  //         .select('*')
  //         .eq('id', supabaseUser.id)
  //         .single()

  //       if (error && error.code === 'PGRST116') {
  //         // User doesn't exist, create profile
  //         const { error: insertError } = await (supabase as any)
  //           .from('users')
  //           .insert({
  //             id: supabaseUser.id,
  //             display_name: supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0] || 'User',
  //             last_seen: new Date().toISOString()
  //           })

  //         if (insertError) {
  //           console.error('Error creating user profile:', insertError)
  //           throw insertError
  //         }

  //         return {
  //           id: supabaseUser.id,
  //           email: supabaseUser.email || '',
  //           displayName: supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0] || 'User'
  //         }
  //       } else if (profile) {
  //         return {
  //           id: (profile as any).id,
  //           email: supabaseUser.email || '',
  //           displayName: (profile as any).display_name
  //         }
  //       } else {
  //         throw new Error('Failed to get or create user profile')
  //       }
  //     })()
  //     
  //     const userData = await Promise.race([userPromise, timeoutPromise])
  //     setUser(userData)
  //   } catch (error) {
  //     console.error('Error handling user:', error)
  //     // Only set user to null if it's a timeout error, not other errors
  //     if (error instanceof Error && error.message === 'User handling timeout') {
  //       console.warn('User handling timed out, but continuing with basic user info')
  //       // Fallback: set basic user info without profile
  //       setUser({
  //         id: supabaseUser.id,
  //         email: supabaseUser.email || '',
  //         displayName: supabaseUser.user_metadata?.display_name || supabaseUser.email?.split('@')[0] || 'User'
  //       })
  //     } else {
  //       // For other errors, set user to null
  //       setUser(null)
  //     }
  //   }
  // }

  const signIn = async (email: string, password: string) => {
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const signUp = async (email: string, password: string, displayName: string) => {
    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      })

      if (error) {
        return { success: false, error: error.message }
      }

      return { success: true }
    } catch (error) {
      return { success: false, error: 'An unexpected error occurred' }
    }
  }

  const signOut = async () => {
    try {
      await supabase.auth.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  const value = {
    user,
    loading,
    isClient,
    signIn,
    signUp,
    signOut
  }

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  )
}
