'use client';

// ContactForm component
// Contact form component for user inquiries

import React, { useState } from 'react';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';

interface ContactFormProps {
  onSubmit: (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => void;
  loading?: boolean;
  error?: string;
  className?: string;
}

export const ContactForm: React.FC<ContactFormProps> = ({
  onSubmit,
  loading = false,
  error,
  className = '',
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    if (!formData.name) {
      newErrors.name = 'Name is required';
    }

    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    if (!formData.subject) {
      newErrors.subject = 'Subject is required';
    }

    if (!formData.message) {
      newErrors.message = 'Message is required';
    } else if (formData.message.length < 10) {
      newErrors.message = 'Message must be at least 10 characters';
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

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Name"
          type="text"
          placeholder="Enter your name"
          value={formData.name}
          onChange={(value) => handleChange('name', value)}
          {...(errors.name && { error: errors.name })}
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
      </div>

      <Input
        label="Subject"
        type="text"
        placeholder="Enter subject"
        value={formData.subject}
        onChange={(value) => handleChange('subject', value)}
        {...(errors.subject && { error: errors.subject })}
        required
      />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Message
          <span className="text-red-500 ml-1">*</span>
        </label>
        <textarea
          value={formData.message}
          onChange={(e) => handleChange('message', e.target.value)}
          rows={6}
          className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${
            errors.message ? 'border-red-300' : 'border-gray-300'
          }`}
          placeholder="Enter your message"
          required
        />
        {errors.message && (
          <p className="mt-1 text-sm text-red-600">{errors.message}</p>
        )}
      </div>

      <Button
        type="submit"
        variant="primary"
        size="lg"
        loading={loading}
        className="w-full"
      >
        {loading ? 'Sending...' : 'Send Message'}
      </Button>
    </form>
  );
};
