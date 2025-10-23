import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { AuthProvider } from '../contexts/AuthContext';
import Navigation from '../components/Navigation';
import ErrorBoundary from '../components/ErrorBoundary';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NODE_ENV === 'production' 
    ? 'https://dilenci.vercel.app' 
    : (process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000')),
  title: 'Crowdfunding Platform',
  description: 'A modern crowdfunding platform for creators and supporters',
  keywords: ['crowdfunding', 'fundraising', 'projects', 'donations'],
  authors: [{ name: 'Crowdfunding Platform Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'Crowdfunding Platform',
    description: 'A modern crowdfunding platform for creators and supporters',
    type: 'website',
    locale: 'en_US',
  },
  twitter: {
    card: 'summary',
    title: 'Crowdfunding Platform',
    description: 'A modern crowdfunding platform for creators and supporters',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.className}>
      <body className="min-h-screen bg-white text-gray-900 antialiased">
        <AuthProvider>
          <ErrorBoundary>
            <Navigation />
            <div id="root" className="min-h-screen">
              <main>
                {children}
              </main>
            </div>
          </ErrorBoundary>
        </AuthProvider>
      </body>
    </html>
  );
}
