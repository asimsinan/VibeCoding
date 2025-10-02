'use client';

// RegisterForm component
// Registration form component for user authentication

import React, { useState } from 'react';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';

interface RegisterFormProps {
  onSubmit: (data: {
    username: string;
    email: string;
    password: string;
    confirmPassword: string;
  }) => void;
  loading?: boolean;
  error?: string | null;
  className?: string;
}

export const RegisterForm: React.FC<RegisterFormProps> = ({
  onSubmit,
  loading = false,
  error,
  className = '',
}) => {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.username) {
      newErrors.username = 'Username is required';
    } else if (formData.username.length < 3) {
      newErrors.username = 'Username must be at least 3 characters';
    } else if (formData.username.length > 50) {
      newErrors.username = 'Username is too long (maximum 50 characters)';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    } else if (formData.email.length > 254) {
      newErrors.email = 'Email is too long (maximum 254 characters)';
    }

    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    } else if (formData.password.length > 128) {
      newErrors.password = 'Password is too long (maximum 128 characters)';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateForm()) {
      onSubmit(formData);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  return (
    <form onSubmit={handleSubmit} className={`space-y-6 ${className}`}>
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-md p-4">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      <Input
        label="Username"
        type="text"
        placeholder="Enter your username"
        value={formData.username}
        onChange={(value) => handleChange('username', value)}
        {...(errors.username && { error: errors.username })}
        required
      />

      <Input
        label="Email"
        type="email"
        placeholder="Enter your email"
        value={formData.email}
        onChange={(value) => handleChange('email', value)}
        {...(errors.email && { error: errors.email })}
        required
      />

      <Input
        label="Password"
        type="password"
        placeholder="Enter your password"
        value={formData.password}
        onChange={(value) => handleChange('password', value)}
        {...(errors.password && { error: errors.password })}
        required
      />

      <Input
        label="Confirm Password"
        type="password"
        placeholder="Confirm your password"
        value={formData.confirmPassword}
        onChange={(value) => handleChange('confirmPassword', value)}
        {...(errors.confirmPassword && { error: errors.confirmPassword })}
        required
      />

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        className="w-full"
      >
        {loading ? 'Creating account...' : 'Create Account'}
      </Button>
    </form>
  );
};
