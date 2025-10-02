// Header component
// Main header component for the marketplace application

import React from 'react';
import Link from 'next/link';
import { Button } from '../../ui/Button/Button';
import { CartIcon } from '../../ui/CartIcon/CartIcon';

interface HeaderProps {
  user?: {
    id: string;
    username: string;
    email: string;
  };
  onLogin?: () => void;
  onLogout?: () => void;
  onRegister?: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  onLogin,
  onLogout,
  onRegister,
}) => {
  return (
    <header className="bg-white shadow-sm border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex-shrink-0">
            <Link href="/" className="text-2xl font-bold text-blue-600">
              Marketplace
            </Link>
          </div>

          {/* Navigation */}
          <nav className="hidden md:flex space-x-8">
            <Link href="/products" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              Products
            </Link>
            <Link href="/categories" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              Categories
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
              About
            </Link>
          </nav>

          {/* User Actions */}
          <div className="flex items-center space-x-4">
            {/* Cart Icon */}
            <CartIcon />
            
            {user ? (
              <div className="flex items-center space-x-4">
                <Link href="/dashboard" className="text-gray-700 hover:text-blue-600 px-3 py-2 text-sm font-medium">
                  Dashboard
                </Link>
                <Button variant="outline" size="sm" onClick={onLogout || (() => {})}>
                  Logout
                </Button>
              </div>
            ) : (
              <div className="flex items-center space-x-2">
                <Button variant="ghost" size="sm" onClick={onLogin || (() => {})}>
                  Login
                </Button>
                <Button variant="primary" size="sm" onClick={onRegister || (() => {})}>
                  Register
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
