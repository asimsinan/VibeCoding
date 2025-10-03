'use client'

import { useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function AuthCallbackPage() {
  const router = useRouter()

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        
        if (error) {
          router.push('/?error=auth_failed')
          return
        }

        if (data.session?.user) {
          // Check if user exists in our database, create if not
          const { data: existingUser, error: userError } = await supabase
            .from('users')
            .select('id')
            .eq('id', data.session.user.id)
            .single()

          if (userError && userError.code === 'PGRST116') {
            // User doesn't exist, create them
            const userName = data.session.user.user_metadata?.full_name || 
                           data.session.user.email?.split('@')[0] || 
                           'User'
            
            
            const { error: insertError } = await supabase
              .from('users')
              .insert({
                id: data.session.user.id,
                email: data.session.user.email,
                name: userName
              } as any)

            if (insertError) {
            }
          }

          // Redirect to home page
          router.push('/')
        } else {
          router.push('/?error=no_session')
        }
      } catch (error) {
        router.push('/?error=unexpected')
      }
    }

    handleAuthCallback()
  }, [router])

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-4 text-gray-600">Completing sign in...</p>
      </div>
    </div>
  )
}
