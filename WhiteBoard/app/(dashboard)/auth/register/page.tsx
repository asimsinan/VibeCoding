'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase/client'
import LoadingSpinner from '@/components/LoadingSpinner'
import ErrorBoundary from '@/components/ErrorBoundary'

/**
 * Register Page
 * 
 * Modern, stylish user registration page with email/password signup.
 * Integrates with Supabase Auth for user management.
 */
export default function RegisterPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSuccess, setIsSuccess] = useState(false)

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]{4,}@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
    return emailRegex.test(email)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!email || !password || !confirmPassword || !displayName) return

    if (!validateEmail(email)) {
      setError('Please enter a valid email address')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 6) {
      setError('Password must be at least 6 characters long')
      return
    }

    try {
      setIsLoading(true)
      setError(null)

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName
          }
        }
      })

      if (error) throw error

      setIsSuccess(true)
      setError(null)
    } catch (err) {
      if (err instanceof Error) {
        if (err.message.includes('email_address_invalid')) {
          setError('Please enter a valid email address. Try using a different email format.')
        } else if (err.message.includes('Password should be at least')) {
          setError('Password must be at least 6 characters long.')
        } else if (err.message.includes('User already registered')) {
          setError('An account with this email already exists. Please try logging in instead.')
        } else {
          setError(`Failed to create account: ${err.message}`)
        }
      } else {
        setError('Failed to create account. Please try again.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  if (isSuccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-white/80 backdrop-blur-sm rounded-2xl shadow-2xl border border-white/20 p-8 text-center relative overflow-hidden">
          {/* Animated background elements */}
          <div className="absolute top-0 left-0 w-full h-full overflow-hidden">
            <div className="absolute -top-4 -left-4 w-24 h-24 bg-purple-200/30 rounded-full animate-pulse"></div>
            <div className="absolute top-1/2 -right-8 w-32 h-32 bg-blue-200/30 rounded-full animate-pulse delay-1000"></div>
            <div className="absolute -bottom-6 left-1/3 w-20 h-20 bg-purple-300/20 rounded-full animate-pulse delay-500"></div>
          </div>
          
          {/* Success content */}
          <div className="relative z-10">
            <div className="w-20 h-20 bg-gradient-to-r from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg animate-bounce">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            
            <h2 className="text-3xl font-bold text-gray-900 mb-3 animate-fade-in">
              Account Created!
            </h2>
            <p className="text-gray-600 mb-8 text-lg animate-fade-in-delay">
              Please check your email for a verification link to complete your registration.
            </p>
            
            {/* Fun animation elements */}
            <div className="flex justify-center space-x-2 mb-6">
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce"></div>
              <div className="w-2 h-2 bg-blue-400 rounded-full animate-bounce delay-100"></div>
              <div className="w-2 h-2 bg-purple-400 rounded-full animate-bounce delay-200"></div>
            </div>
            
            <Link
              href="/auth/login"
              className="inline-block px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white rounded-xl font-semibold hover:from-purple-700 hover:to-blue-700 transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg animate-fade-in-delay-2"
            >
              Go to Login
            </Link>
            
            <p className="text-xs text-gray-400 mt-6 animate-fade-in-delay-2">
              Ready to start creating amazing whiteboards!
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
      <div className="h-screen bg-gradient-to-br from-purple-50 via-white to-blue-50 flex items-center justify-center p-4 overflow-hidden">
        <div className="max-w-md w-full">
          {/* Header */}
          <div className="text-center mb-4">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-2 shadow-lg">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-900 mb-1">Create Account</h1>
            <p className="text-gray-600 text-sm">Join us and start creating amazing whiteboards</p>
          </div>

          {/* Register Form */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-xl border border-white/20 p-6">
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="space-y-2">
                <div>
                  <label htmlFor="displayName" className="block text-sm font-semibold text-gray-700 mb-1">
                    Display Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <input
                      id="displayName"
                      name="displayName"
                      type="text"
                      autoComplete="name"
                      required
                      value={displayName}
                      onChange={(e) => setDisplayName(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 text-gray-900 placeholder-gray-500 text-sm"
                      placeholder="Enter your display name"
                    />
                  </div>
                </div>

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
                      className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 text-gray-900 placeholder-gray-500 text-sm"
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
                      autoComplete="new-password"
                      required
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 text-gray-900 placeholder-gray-500 text-sm"
                      placeholder="Enter your password"
                    />
                  </div>
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-semibold text-gray-700 mb-1">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <svg className="h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      autoComplete="new-password"
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="block w-full pl-9 pr-3 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all duration-200 bg-gray-50/50 text-gray-900 placeholder-gray-500 text-sm"
                      placeholder="Confirm your password"
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

              {isSuccess && (
                <div className="bg-green-50 border border-green-200 text-green-700 px-3 py-2 rounded-lg">
                  <div className="flex items-center">
                    <svg className="w-4 h-4 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    <div className="text-xs font-medium">
                      Account created successfully! Please check your email and click the confirmation link to complete your registration.
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={isLoading || !email || !password || !confirmPassword || !displayName}
                className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-2.5 px-4 rounded-lg font-semibold hover:from-purple-700 hover:to-blue-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 transform hover:scale-[1.02] active:scale-[0.98] shadow-lg text-sm"
              >
                {isLoading ? (
                  <div className="flex items-center justify-center">
                    <LoadingSpinner />
                    <span className="ml-2">Creating account...</span>
                  </div>
                ) : (
                  'Create Account'
                )}
              </button>
            </form>

            <div className="mt-3 text-center">
              <p className="text-xs text-gray-600">
                Already have an account?{' '}
                <Link
                  href="/auth/login"
                  className="font-semibold text-purple-600 hover:text-purple-700 transition-colors duration-200"
                >
                  Sign in here
                </Link>
              </p>
            </div>
          </div>

          {/* Footer */}
          <div className="text-center mt-3">
            <p className="text-xs text-gray-500">
              Secure authentication powered by Supabase
            </p>
          </div>
        </div>
      </div>
    </ErrorBoundary>
  )
}