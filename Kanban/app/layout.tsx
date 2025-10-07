import type { Metadata, Viewport } from 'next';
import './globals.css';
import { ApiProvider } from '../src/lib/api/providers/ApiProvider';
import { ProgressiveEnhancementScript } from '../src/lib/progressive-enhancement/ProgressiveEnhancementScript';

export const metadata: Metadata = {
  title: 'Kanban Project Management',
  description: 'A modern Kanban project management application',
  manifest: '/manifest.json',
  icons: {
    icon: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  themeColor: '#0ea5e9',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="no-js">
      <head>
        <ProgressiveEnhancementScript />
      </head>
      <body className="antialiased">
        <ApiProvider>
          {children}
        </ApiProvider>
      </body>
    </html>
  );
}