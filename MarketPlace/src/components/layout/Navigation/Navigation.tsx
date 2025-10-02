'use client';

// Navigation component
// Main navigation component for the marketplace application

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

interface NavigationProps {
  user?: {
    id: string;
    username: string;
    email: string;
  };
  onLogin?: () => void;
  onLogout?: () => void;
  onRegister?: () => void;
}

export const Navigation: React.FC<NavigationProps> = ({
  user: _user,
  onLogin: _onLogin,
  onLogout: _onLogout,
  onRegister: _onRegister,
}) => {
  const pathname = usePathname();

  const navigationItems = [
    { name: 'Products', href: '/products' },
    { name: 'Categories', href: '/categories' },
    { name: 'About', href: '/about' },
    { name: 'Contact', href: '/contact' },
  ];

  return (
    <nav className="hidden md:flex space-x-8">
      {navigationItems.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={`px-3 py-2 text-sm font-medium transition-colors ${
            pathname === item.href
              ? 'text-blue-600 border-b-2 border-blue-600'
              : 'text-gray-700 hover:text-blue-600'
          }`}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  );
};
