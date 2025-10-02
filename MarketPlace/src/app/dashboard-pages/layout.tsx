'use client';

// Dashboard Layout
// Layout component for dashboard routes

import React, { useState } from 'react';
import { Sidebar } from '../../components/layout/Sidebar/Sidebar';
import { useAuth } from '../../lib/hooks/useAuth';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const { user } = useAuth();

  const handleSidebarClose = () => {
    setIsSidebarOpen(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="flex">
        <Sidebar
          isOpen={isSidebarOpen}
          onClose={handleSidebarClose}
          {...(user && {
            user: {
              id: user.id,
              username: user.username,
              email: user.email,
            }
          })}
        />
        <main className="flex-1 lg:ml-64">
          {children}
        </main>
      </div>
    </div>
  );
}
