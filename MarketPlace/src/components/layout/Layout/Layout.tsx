'use client';

// Layout component
// Main layout component for the marketplace application

import React from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/hooks/useAuth';
import { Header } from '../Header/Header';
import { Footer } from '../Footer/Footer';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const router = useRouter();
  const { user, logout } = useAuth();

  const handleLogin = () => {
    router.push('/login');
  };

  const handleRegister = () => {
    router.push('/register');
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Header
        user={user}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onRegister={handleRegister}
      />
      
      <main className="flex-1">
        {children}
      </main>
      
      <Footer />
    </div>
  );
};
