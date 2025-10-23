'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useAuth } from '../contexts/AuthContext';

export default function Navigation() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

  const handleLogout = () => {
    logout();
    setIsMenuOpen(false);
  };

  return (
    <nav className="bg-white shadow-lg border-b border-neutral-200 sticky top-0 z-40">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2">
              <div className="w-8 h-8 bg-gradient-to-r from-primary-600 to-secondary-600 rounded-lg flex items-center justify-center">
                <span className="text-white font-bold text-lg">D</span>
              </div>
              <span className="text-xl font-bold text-neutral-900">Dilenci</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-8">
            <Link href="/" className="nav-link">
              Home
            </Link>
            <Link href="/campaigns" className="nav-link">
              Browse Campaigns
            </Link>
            {user && (
              <>
                <Link href="/my-campaigns" className="nav-link">
                  My Campaigns
                </Link>
                <Link href="/campaigns/create" className="nav-link">
                  Create Campaign
                </Link>
              </>
            )}
          </div>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center space-x-4">
            {user ? (
              <div className="flex items-center space-x-4">
                <div className="flex items-center space-x-2">
                  <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-semibold">
                      {user.name?.charAt(0).toUpperCase()}
                    </span>
                  </div>
                  <span className="text-sm font-medium text-neutral-700">{user.name}</span>
                </div>
                <button
                  onClick={handleLogout}
                  className="btn-ghost text-sm"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <Link href="/auth/login" className="nav-link">
                  Login
                </Link>
                <Link href="/auth/register" className="nav-button">
                  Sign Up
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMenu}
              className="text-neutral-600 hover:text-neutral-900 focus:outline-none focus:text-neutral-900"
            >
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                {isMenuOpen ? (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3 bg-white border-t border-neutral-200">
              <Link
                href="/"
                className="block px-3 py-2 rounded-md text-base font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Home
              </Link>
              <Link
                href="/campaigns"
                className="block px-3 py-2 rounded-md text-base font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                onClick={() => setIsMenuOpen(false)}
              >
                Browse Campaigns
              </Link>
              {user && (
                <>
                  <Link
                    href="/my-campaigns"
                    className="block px-3 py-2 rounded-md text-base font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    My Campaigns
                  </Link>
                  <Link
                    href="/campaigns/create"
                    className="block px-3 py-2 rounded-md text-base font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Create Campaign
                  </Link>
                </>
              )}
              
              {user ? (
                <div className="border-t border-neutral-200 pt-3 mt-3">
                  <div className="flex items-center px-3 py-2">
                    <div className="w-8 h-8 bg-primary-600 rounded-full flex items-center justify-center mr-3">
                      <span className="text-white text-sm font-semibold">
                        {user.name?.charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-neutral-700">{user.name}</span>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                  >
                    Logout
                  </button>
                </div>
              ) : (
                <div className="border-t border-neutral-200 pt-3 mt-3 space-y-1">
                  <Link
                    href="/auth/login"
                    className="block px-3 py-2 rounded-md text-base font-medium text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Login
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block px-3 py-2 rounded-md text-base font-medium bg-primary-600 text-white hover:bg-primary-700"
                    onClick={() => setIsMenuOpen(false)}
                  >
                    Sign Up
                  </Link>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
