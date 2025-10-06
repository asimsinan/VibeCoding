/**
 * Root Layout
 * Main layout component with global styles and metadata
 * 
 * @fileoverview Root layout with responsive design and progressive enhancement
 * @version 1.0.0
 */

import type { Metadata, Viewport } from 'next'
import { Inter } from 'next/font/google'
import { AuthProvider } from '@/lib/auth/AuthContext'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export const metadata: Metadata = {
  title: 'Collaborative Whiteboard',
  description: 'Real-time collaborative whiteboard with drawing and sticky notes',
  keywords: ['whiteboard', 'collaboration', 'drawing', 'sticky notes', 'real-time'],
  authors: [{ name: 'Whiteboard Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Collaborative Whiteboard',
    description: 'Real-time collaborative whiteboard with drawing and sticky notes',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Collaborative Whiteboard',
    description: 'Real-time collaborative whiteboard with drawing and sticky notes',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        <noscript>
          <div className="bg-yellow-100 border-l-4 border-yellow-500 text-yellow-700 p-4 m-4">
            <p className="font-bold">JavaScript Required</p>
            <p>This application requires JavaScript to function properly. Please enable JavaScript in your browser.</p>
          </div>
        </noscript>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}
