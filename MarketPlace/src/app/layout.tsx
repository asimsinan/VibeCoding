// Root Layout
// Main layout component for the Next.js App Router

import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { ClientLayout } from '../components/layout/ClientLayout';
import { CartProvider } from '../lib/contexts/CartContext';
import { AuthProvider } from '../lib/contexts/AuthContext';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  metadataBase: new URL('https://marketplace-app-woad-one.vercel.app'),
  title: 'MarketPlace - Buy and Sell Anything',
  description: 'A modern marketplace platform for buying and selling products online',
  keywords: ['marketplace', 'ecommerce', 'buy', 'sell', 'products'],
  authors: [{ name: 'MarketPlace Team' }],
  robots: 'index, follow',
  openGraph: {
    title: 'MarketPlace - Buy and Sell Anything',
    description: 'A modern marketplace platform for buying and selling products online',
    type: 'website',
    locale: 'en_US',
    url: '/',
    siteName: 'MarketPlace',
    images: [
      {
        url: '/og-image.jpg',
        width: 1200,
        height: 630,
        alt: 'MarketPlace - Buy and Sell Anything',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'MarketPlace - Buy and Sell Anything',
    description: 'A modern marketplace platform for buying and selling products online',
    images: ['/twitter-image.jpg'],
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
    <html lang="en" className="h-full">
      <body className={`${inter.className} h-full bg-gray-50`}>
        <div id="root" className="min-h-full">
          <AuthProvider>
            <CartProvider>
              <ClientLayout>
                {children}
              </ClientLayout>
            </CartProvider>
          </AuthProvider>
        </div>
      </body>
    </html>
  );
}