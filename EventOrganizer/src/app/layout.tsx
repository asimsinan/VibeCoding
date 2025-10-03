/**
 * Root Layout Component
 * 
 * Provides the root layout with providers and global styles
 * 
 * @fileoverview Root Layout for Virtual Event Organizer
 * @version 1.0.0
 * @author Virtual Event Organizer Team
 */

'use client'

import './globals.css'
import { AuthProvider } from '@/lib/auth/context'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { RealTimeNotificationProvider } from '@/components/RealTimeNotificationProvider'
import { ThemeProvider } from '@/lib/ui/theme'
import { ToastProvider } from '@/lib/ui/Toast'
import { useState } from 'react'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Create a new QueryClient instance for each render
  // In production, you might want to use a singleton pattern
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 60 * 1000, // 5 minutes
        retry: 1,
        refetchOnWindowFocus: false,
      },
    },
  }))

  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <QueryClientProvider client={queryClient}>
          <ThemeProvider>
            <ToastProvider>
              <AuthProvider>
                <RealTimeNotificationProvider>
                  {children}
                </RealTimeNotificationProvider>
              </AuthProvider>
            </ToastProvider>
          </ThemeProvider>
          <ReactQueryDevtools initialIsOpen={false} />
        </QueryClientProvider>
      </body>
    </html>
  )
}