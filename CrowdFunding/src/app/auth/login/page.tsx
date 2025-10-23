'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

export default function LoginPage() {
  const [formData, setFormData] = useState({
    email: 'demo@example.com',
    password: 'demo123'
  });
  const [loading, setLoading] = useState(false);

  const { login, user } = useAuth();
  const router = useRouter();

  // Redirect if already authenticated
  useEffect(() => {
    if (user) {
      router.push('/campaigns');
    }
  }, [user, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return; // Prevent double submission
    
    setLoading(true);

    const result = await login(formData.email, formData.password);
    
    if (result.success) {
      console.log('Login successful!');
      // Redirect immediately - no artificial delay
      router.push('/campaigns');
    } else {
      console.error('Login failed:', result.error);
      setLoading(false); // Only reset loading on failure
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-primary mb-2">Welcome Back</h1>
          <h2 className="text-2xl font-semibold text-gray-900 mb-2">
            Sign in to your account
          </h2>
          <p className="text-gray-600 mb-2">
            Demo credentials are pre-filled below for easy testing
          </p>
          <p className="text-gray-600">
            Or{' '}
            <Link href="/auth/register" className="font-medium text-primary hover:text-primary-700 transition-colors">
              create a new account
            </Link>
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow-xl rounded-2xl sm:px-10 border border-gray-100">
          <form className="space-y-6" onSubmit={handleSubmit}>

            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email address
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Demo</span>
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={formData.email}
                onChange={handleChange}
                placeholder="Enter your email"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
                <span className="ml-2 bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full">Demo</span>
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Enter your password"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
            </div>

            <div className="flex items-center">
              <input
                id="remember-me"
                name="remember-me"
                type="checkbox"
                className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
              />
              <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900">
                Remember me
              </label>
            </div>

            <div>
              <button
                type="submit"
                disabled={loading}
                className="w-full btn-primary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Signing in...' : 'Sign in'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
