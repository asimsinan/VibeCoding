// Contact Page
// Contact page component

'use client';

import React, { useState } from 'react';
import { ContactForm } from '../../components/forms/ContactForm/ContactForm';
import { Card } from '../../components/ui/Card/Card';
import { ErrorMessage } from '../../components/ui/ErrorMessage';

export default function ContactPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (data: {
    name: string;
    email: string;
    subject: string;
    message: string;
  }) => {
    setIsLoading(true);
    setError(null);
    setSuccess(false);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit message');
      }

      setSuccess(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit message');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="p-6">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Contact Us</h1>
      
      <div className="max-w-4xl mx-auto">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card title="Get in Touch">
            {success && (
              <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
                <p className="text-sm text-green-600">
                  Thank you for your message! We'll get back to you soon.
                </p>
              </div>
            )}
            
            <ErrorMessage error={error} onDismiss={() => setError(null)} />
            
            <ContactForm
              onSubmit={handleSubmit}
              loading={isLoading}
              error={error}
            />
          </Card>

          <div className="space-y-6">
            <Card title="Contact Information">
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold text-gray-900">Email</h3>
                  <p className="text-gray-600">support@marketplace.com</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Phone</h3>
                  <p className="text-gray-600">+1 (555) 123-4567</p>
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Address</h3>
                  <p className="text-gray-600">
                    123 Marketplace Street<br />
                    City, State 12345<br />
                    Country
                  </p>
                </div>
              </div>
            </Card>

            <Card title="Business Hours">
              <div className="space-y-2">
                <p className="text-gray-600">Monday - Friday: 9:00 AM - 6:00 PM</p>
                <p className="text-gray-600">Saturday: 10:00 AM - 4:00 PM</p>
                <p className="text-gray-600">Sunday: Closed</p>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
