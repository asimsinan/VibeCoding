// Profile Dashboard Page
// Profile management page for dashboard

'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../lib/hooks/useAuth';
import { Card } from '../../../components/ui/Card/Card';
import { Button } from '../../../components/ui/Button/Button';
import { Input } from '../../../components/ui/Input/Input';
import { LoadingSpinner } from '../../../components/ui/LoadingSpinner';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  const [formData, setFormData] = useState({
    username: user?.username || '',
    email: user?.email || '',
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Redirect if not authenticated
  React.useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  // const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   const { name, value } = e.target;
  //   setFormData(prev => ({
  //     ...prev,
  //     [name]: value
  //   }));
  //   setError(null);
  //   setSuccess(null);
  // };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('auth_tokens');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const authData = JSON.parse(token);
      const authHeader = `Bearer ${authData.accessToken}`;

      // Update profile information
      const response = await fetch('/api/users/profile', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update profile');
      }

      const result = await response.json();
      
      // Update the form data with the new values
      setFormData(prev => ({
        ...prev,
        username: result.data.username,
        email: result.data.email
      }));

      setSuccess('Profile updated successfully!');
      setIsEditing(false);
      
      // Refresh the page to show updated data
      setTimeout(() => {
        window.location.reload();
      }, 1500);
    } catch (err) {
      console.error('Error updating profile:', err);
      setError(err instanceof Error ? err.message : 'Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const handleChangePassword = async () => {
    if (!user) return;

    if (formData.newPassword !== formData.confirmPassword) {
      setError('New passwords do not match');
      return;
    }

    if (formData.newPassword.length < 6) {
      setError('New password must be at least 6 characters');
      return;
    }

    setIsSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const token = localStorage.getItem('auth_tokens');
      if (!token) {
        throw new Error('No authentication token found');
      }

      const authData = JSON.parse(token);
      const authHeader = `Bearer ${authData.accessToken}`;

      const response = await fetch('/api/users/change-password', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': authHeader
        },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to change password');
      }

      setSuccess('Password changed successfully! You will be logged out for security.');
      setFormData(prev => ({
        ...prev,
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      }));

      // Log out the user after successful password change for security
      setTimeout(async () => {
        await logout();
        router.push('/');
      }, 2000); // Give user time to see the success message
    } catch (err) {
      console.error('Error changing password:', err);
      setError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <LoadingSpinner size="lg" className="mx-auto mb-4" />
          <p className="text-gray-600">Loading profile...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return null; // Will redirect
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container-main py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Profile</h1>
          <p className="text-gray-600">Manage your account information and settings</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Profile Information */}
          <Card title="Profile Information">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Username
                </label>
                {isEditing ? (
                  <Input
                    value={formData.username}
                    onChange={(value) => setFormData(prev => ({ ...prev, username: value }))}
                    placeholder="Enter username"
                  />
                ) : (
                  <p className="text-gray-900">{user.username}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                {isEditing ? (
                  <Input
                    type="email"
                    value={formData.email}
                    onChange={(value) => setFormData(prev => ({ ...prev, email: value }))}
                    placeholder="Enter email"
                  />
                ) : (
                  <p className="text-gray-900">{user.email}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  User ID
                </label>
                <p className="text-gray-500 text-sm font-mono">{user.id}</p>
              </div>

              {isEditing ? (
                <div className="flex space-x-2">
                  <Button
                    variant="primary"
                    onClick={handleSaveProfile}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    {isSaving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Saving...
                      </>
                    ) : (
                      'Save Changes'
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setIsEditing(false)}
                    className="flex-1"
                  >
                    Cancel
                  </Button>
                </div>
              ) : (
                <Button
                  variant="outline"
                  onClick={() => setIsEditing(true)}
                >
                  Edit Profile
                </Button>
              )}
            </div>
          </Card>

          {/* Account Settings */}
          <Card title="Account Settings">
            <div className="space-y-6">
              {/* Change Password */}
              <div>
                <h3 className="text-lg font-medium text-gray-900 mb-4">Change Password</h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Current Password
                    </label>
                    <Input
                      type="password"
                      value={formData.currentPassword}
                      onChange={(value) => setFormData(prev => ({ ...prev, currentPassword: value }))}
                      placeholder="Enter current password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      New Password
                    </label>
                    <Input
                      type="password"
                      value={formData.newPassword}
                      onChange={(value) => setFormData(prev => ({ ...prev, newPassword: value }))}
                      placeholder="Enter new password"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Confirm New Password
                    </label>
                    <Input
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(value) => setFormData(prev => ({ ...prev, confirmPassword: value }))}
                      placeholder="Confirm new password"
                    />
                  </div>
                  <Button
                    variant="primary"
                    onClick={handleChangePassword}
                    disabled={isSaving || !formData.currentPassword || !formData.newPassword}
                    className="w-full"
                  >
                    {isSaving ? (
                      <>
                        <LoadingSpinner size="sm" className="mr-2" />
                        Changing...
                      </>
                    ) : (
                      'Change Password'
                    )}
                  </Button>
                </div>
              </div>

              {/* Danger Zone */}
              <div className="border-t pt-6">
                <h3 className="text-lg font-medium text-red-900 mb-4">Danger Zone</h3>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full text-red-600 hover:text-red-800 border-red-300 hover:border-red-400"
                >
                  Logout
                </Button>
              </div>
            </div>
          </Card>
        </div>

        {/* Messages */}
        {(error || success) && (
          <div className="mt-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <p className="text-red-800 text-sm">{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-green-800 text-sm">{success}</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
