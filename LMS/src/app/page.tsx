'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import Link from 'next/link';

export default function HomePage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === 'loading') return; // Still loading
    if (session) {
      // Redirect directly to role-specific dashboard
      const role = session.user?.role;
      switch (role) {
        case 'ADMIN':
          router.push('/admin/dashboard');
          break;
        case 'INSTRUCTOR':
          router.push('/instructor/dashboard');
          break;
        case 'STUDENT':
          router.push('/student/dashboard');
          break;
        default:
          router.push('/auth/signin');
      }
    }
  }, [session, status, router]);

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white via-primary-50 to-primary-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-red-600 mx-auto"></div>
          <p className="mt-4 text-neutral-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (session) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-white via-primary-50 to-primary-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-6">
            <div>
              <h1 className="text-3xl font-bold text-neutral-900">
                ASY LMS
              </h1>
              <p className="mt-1 text-sm text-neutral-600">
                Learning Management System
              </p>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/auth/signin"
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium border-2 border-red-600"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <div className="text-center">
          <h2 className="text-4xl font-extrabold text-neutral-900 sm:text-5xl md:text-6xl">
            Welcome to the
            <span className="block text-red-600">ASY Learning Management System</span>
          </h2>
          <p className="mt-3 max-w-md mx-auto text-base text-neutral-600 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
            A comprehensive multi-tenant learning management system with role-based access control,
            course management, quiz system, and real-time monitoring.
          </p>
          <div className="mt-5 max-w-md mx-auto sm:flex sm:justify-center md:mt-8">
            <div className="rounded-md shadow">
              <Link
                href="/auth/signin"
                className="w-full flex items-center justify-center px-8 py-3 text-base font-medium rounded-md text-white bg-red-600 hover:bg-red-700 md:py-4 md:text-lg md:px-10 border-2 border-red-600"
              >
                Get Started
              </Link>
            </div>
            <div className="mt-3 rounded-md shadow sm:mt-0 sm:ml-3">
              <Link
                href="#features"
                className="w-full flex items-center justify-center px-8 py-3 border-2 border-red-600 text-base font-medium rounded-md text-red-600 bg-white hover:bg-red-50 hover:border-red-700 md:py-4 md:text-lg md:px-10"
              >
                Learn More
              </Link>
            </div>
          </div>
        </div>

        {/* Features */}
        <div id="features" className="mt-20">
          <div className="text-center">
            <h3 className="text-3xl font-extrabold text-neutral-900">
              Features
            </h3>
            <p className="mt-4 text-lg text-neutral-600">
              Everything you need for effective learning management
            </p>
          </div>

          <div className="mt-12 grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <div className="bg-white p-6 rounded-lg shadow-md border border-red-100">
              <div className="text-red-600 text-2xl font-bold mb-4">🏢</div>
              <h4 className="text-lg font-medium text-neutral-900 mb-2">
                Multi-Tenant Architecture
              </h4>
              <p className="text-neutral-600">
                Complete data isolation between organizations with secure tenant management.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-red-100">
              <div className="text-red-600 text-2xl font-bold mb-4">👥</div>
              <h4 className="text-lg font-medium text-neutral-900 mb-2">
                Role-Based Access Control
              </h4>
              <p className="text-neutral-600">
                Admin, Instructor, and Student roles with granular permissions and access control.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-red-100">
              <div className="text-red-600 text-2xl font-bold mb-4">📚</div>
              <h4 className="text-lg font-medium text-neutral-900 mb-2">
                Course Management
              </h4>
              <p className="text-neutral-600">
                Create and manage courses, modules, lessons, and educational content.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-red-100">
              <div className="text-red-600 text-2xl font-bold mb-4">📝</div>
              <h4 className="text-lg font-medium text-neutral-900 mb-2">
                Quiz System
              </h4>
              <p className="text-neutral-600">
                Interactive quizzes with multiple question types and automatic grading.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-red-100">
              <div className="text-red-600 text-2xl font-bold mb-4">📊</div>
              <h4 className="text-lg font-medium text-neutral-900 mb-2">
                Analytics & Monitoring
              </h4>
              <p className="text-neutral-600">
                Comprehensive analytics, progress tracking, and real-time monitoring.
              </p>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-md border border-red-100">
              <div className="text-red-600 text-2xl font-bold mb-4">🔒</div>
              <h4 className="text-lg font-medium text-neutral-900 mb-2">
                Security & Compliance
              </h4>
              <p className="text-neutral-600">
                Enterprise-grade security with authentication, authorization, and data protection.
              </p>
            </div>
          </div>
        </div>

        {/* Demo Credentials */}
        <div className="mt-20 bg-red-50 rounded-lg p-8 border border-red-100">
          <div className="text-center">
            <h3 className="text-2xl font-bold text-neutral-900 mb-4">
              Try the Demo
            </h3>
            <p className="text-neutral-600 mb-6">
              Use these demo credentials to explore the system:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <div className="bg-white p-4 rounded-md border border-red-100">
                <h4 className="font-medium text-neutral-900 mb-2">Admin</h4>
                <p className="text-neutral-600">admin@example.com</p>
                <p className="text-neutral-600">password</p>
              </div>
              <div className="bg-white p-4 rounded-md border border-red-100">
                <h4 className="font-medium text-neutral-900 mb-2">Instructor</h4>
                <p className="text-neutral-600">instructor@example.com</p>
                <p className="text-neutral-600">password</p>
              </div>
              <div className="bg-white p-4 rounded-md border border-red-100">
                <h4 className="font-medium text-neutral-900 mb-2">Student</h4>
                <p className="text-neutral-600">student@example.com</p>
                <p className="text-neutral-600">password</p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}