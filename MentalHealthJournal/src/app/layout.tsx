import type { Metadata, Viewport } from 'next'
import './globals.css'
import ServiceWorkerRegistration from './components/ServiceWorkerRegistration'
import Providers from './components/Providers'

export const metadata: Metadata = {
  title: 'Mental Health Journal App',
  description: 'Track your daily mood and view trend charts to better understand your emotional patterns',
  keywords: ['mental health', 'mood tracking', 'journal', 'wellness', 'emotional patterns'],
  authors: [{ name: 'Mental Health Journal App' }],
  manifest: '/manifest.json',
  icons: {
    icon: '/icons/icon-192x192.png',
    apple: '/icons/icon-192x192.png',
  },
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#3B82F6',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className="h-full">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="h-full antialiased bg-gray-50 font-sans">
        <div id="root" className="h-full">
          <Providers>
            {children}
          </Providers>
        </div>
        <ServiceWorkerRegistration />
        <noscript>
          <div className="fixed inset-0 bg-white flex items-center justify-center p-4">
            <div className="text-center">
              <h1 className="text-2xl font-bold text-gray-900 mb-4">
                JavaScript Required
              </h1>
              <p className="text-gray-600 mb-4">
                This application requires JavaScript to function properly. 
                Please enable JavaScript in your browser settings.
              </p>
              <p className="text-sm text-gray-500">
                For basic mood logging without JavaScript, please use the form below.
              </p>
            </div>
          </div>
        </noscript>
      </body>
    </html>
  )
}