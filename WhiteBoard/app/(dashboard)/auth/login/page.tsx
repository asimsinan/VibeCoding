'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useAuth } from '@/lib/auth/AuthContext'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorBoundary from '@/components/ErrorBoundary'

/**
 * Login Page
 * 
 * Modern, stylish user authentication page with email/password login.
 * Integrates with Supabase Auth for user management.
 */
export default function LoginPage() {
  const router = useRouter()
  const { signIn } = useAuth()
  const [email, setEmail] = useState('sinan123@gmail.com')
  const [password, setPassword] = useState('123456')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]{4,}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password) return

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const result = await signIn(email, password)

      if (!result.success) {
        setError(result.error || 'Login failed')
        return
      }

      setIsSuccess(true)
      setError(null)
      
      setTimeout(() => {
        router.push('/whiteboard')
      }, 1500)
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('Invalid login credentials')) {
          setError('Invalid email or password. If you just signed up, please check your email and click the confirmation link first.')
        } else if (err.message.includes('email_address_invalid')) {
          setError('Please enter a valid email address.')
        } else if (err.message.includes('Email not confirmed')) {
          setError('Please check your email and click the confirmation link before signing in.')
        } else if (err.message.includes('invalid_credentials')) {
          setError('Invalid email or password. If you just signed up, please check your email and click the confirmation link first.')
        } else {
          setError(`Failed to sign in: ${err.message}`)
        }
      } else {
        setError('Failed to sign in. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 text-center relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-blue-200/30 rounded-full animate-pulse"></div>
            <div className="absolute top-1/2 -right-8 w-32 h-32 bg-purple-200/30 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute -bottom-6 left-1/3 w-20 h-20 bg-blue-300/20 rounded-full animate-pulse delay-500"></div>
          </div>
          
          {/* Success content */}
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-3 animate-fade-in">
              Welcome Back!
            </h2>
            <p className="text-gray-600 mb-8 text-lg animate-fade-in-delay">
              You have been signed in successfully.
            </p>
            
            {/* Animated progress indicator */}
            <div className="mb-6">
              <div className="flex items-center justify-center space-x-2 text-sm text-gray-500 mb-3">
                <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
                <span className="font-medium">Redirecting to your whiteboard...</span>
              </div>
              
              {/* Progress bar */}
              <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
                <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-progress-bar"></div>
              </div>
            </div>
            
            {/* Fun animation elements */}
            <div className="flex justify-center space-x-2 mb-4">
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-200"></div>
            </div>
            
            <p className="text-xs text-gray-400 animate-fade-in-delay-2">
              Get ready to create amazing whiteboards!
            </p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeInDelay {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes fadeInDelay2 {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        
        @keyframes progressBar {
          from { width: 0%; }
          to { width: 100%; }
        }
        
        .animate-fade-in {
          animation: fadeIn 0.6s ease-out forwards;
        }
        
        .animate-fade-in-delay {
          animation: fadeInDelay 0.6s ease-out 0.3s forwards;
          opacity: 0;
        }
        
        .animate-fade-in-delay-2 {
          animation: fadeInDelay2 0.6s ease-out 0.6s forwards;
          opacity: 0;
        }
        
        .animate-progress-bar {
          animation: progressBar 1.5s ease-out forwards;
        }
        
        .delay-100 {
          animation-delay: 0.1s;
        }
        
        .delay-200 {
          animation-delay: 0.2s;
        }
        
        .delay-500 {
          animation-delay: 0.5s;
        }
        
        .delay-1000 {
          animation-delay: 1s;
        }
      `}</style>
      <div className="h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 flex items-center justify-center p-4 overflow-hidden">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-6">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-3 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Welcome Back</h1>
            <p className="text-gray-600 text-sm">Sign in to continue to your whiteboard</p>
          </div>

          {/* Login Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-6">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-3">
                <div>
                  <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-1">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207" />
                      </svg>
                    </div>
                    <input
                      id="email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      required
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 text-gray-900 placeholder-gray-500 text-sm"
                      placeholder="Enter your email"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-1">
                    Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                      </svg>
                    </div>
                    <input
                      id="password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2.5 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 text-gray-900 placeholder-gray-500 text-sm"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 border border-red-200 text-red-700 px-3 py-2 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-red-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <div className="text-xs font-medium">{error}</div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email || !password}
                className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner />
                    <span className="ml-2">Signing in...</span>
                  </div>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            <div className="mt-4 text-center">
              <p className="text-xs text-gray-600">
                Don&apos;t have an account?{' '}
                <Link
                  href="/auth/register"
                  className="font-semibold text-blue-600 hover:text-blue-700 transition-colors duration-200"
                >
                  Create one here
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-4">
            <p className="text-xs text-gray-500">
              Secure authentication powered by Supabase
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}