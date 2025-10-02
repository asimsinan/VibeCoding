// ContactSellerModal component
// Modal for contacting a seller about a specific product

'use client';

import React, { useState } from 'react';
import { Button } from '../../ui/Button/Button';
import { Input } from '../../ui/Input/Input';
import { Modal } from '../../ui/Modal/Modal';
import { ErrorMessage } from '../../ui/ErrorMessage';

interface ContactSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  seller: {
    id: string;
    username: string;
    email: string;
  };
  product: {
    id: string;
    title: string;
  };
}

export const ContactSellerModal: React.FC<ContactSellerModalProps> = ({
  isOpen,
  onClose,
  seller,
  product,
}) => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: `Inquiry about ${product.title}`,
    message: '',
  });
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          message: `Product: ${product.title}\nSeller: ${seller.username}\n\n${formData.message}`,
          sellerId: seller.id,
          productId: product.id,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to send message');
      }

      setSuccess(true);
      // Reset form
      setFormData({
        name: '',
        email: '',
        subject: `Inquiry about ${product.title}`,
        message: '',
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setError(null);
    setSuccess(false);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose}>
      <div className="p-6">
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">
            Contact Seller
          </h2>
          <p className="text-gray-600">
            Send a message to <span className="font-semibold">{seller.username}</span> about{' '}
            <span className="font-semibold">{product.title}</span>
          </p>
        </div>

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-md p-4">
            <p className="text-sm text-green-600">
              Your message has been sent successfully! The seller will get back to you soon.
            </p>
          </div>
        )}

        <ErrorMessage error={error} onDismiss={() => setError(null)} />

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
                Your Name *
              </label>
              <Input
                type="text"
                value={formData.name}
                onChange={(value) => handleInputChange('name', value)}
                placeholder="Enter your name"
                required
              />
            </div>
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                Your Email *
              </label>
              <Input
                type="email"
                value={formData.email}
                onChange={(value) => handleInputChange('email', value)}
                placeholder="Enter your email"
                required
              />
            </div>
          </div>

          <div>
            <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-1">
              Subject *
            </label>
            <Input
              type="text"
              value={formData.subject}
              onChange={(value) => handleInputChange('subject', value)}
              placeholder="Enter subject"
              required
            />
          </div>

          <div>
            <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
              Message *
            </label>
            <textarea
              id="message"
              value={formData.message}
              onChange={(e) => handleInputChange('message', e.target.value)}
              placeholder="Tell the seller what you'd like to know about this product..."
              rows={4}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div className="flex justify-end space-x-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isLoading}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              variant="primary"
              loading={isLoading}
              disabled={isLoading}
            >
              Send Message
            </Button>
          </div>
        </form>
      </div>
    </Modal>
  );
};
