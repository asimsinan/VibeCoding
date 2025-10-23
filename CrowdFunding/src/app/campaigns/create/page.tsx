'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '../../../contexts/AuthContext';

export default function CreateCampaignPage() {
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: '',
    deadline: '',
    category: 'TECHNOLOGY',
    imageUrl: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const { user } = useAuth();
  const router = useRouter();

  const categories = [
    { value: 'TECHNOLOGY', label: 'Technology' },
    { value: 'ART', label: 'Art' },
    { value: 'EDUCATION', label: 'Education' },
    { value: 'HEALTH', label: 'Health' },
    { value: 'ENVIRONMENT', label: 'Environment' },
    { value: 'OTHER', label: 'Other' }
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user || !user.id) {
      setError('Please log in to create a campaign');
      router.push('/auth/login');
      return;
    }

    setLoading(true);
    setError('');

    // Validate form
    if (!formData.title || !formData.description || !formData.goal || !formData.deadline) {
      setError('Please fill in all required fields');
      setLoading(false);
      return;
    }

    if (parseFloat(formData.goal) < 1) {
      setError('Goal must be at least $1');
      setLoading(false);
      return;
    }

    const deadlineDate = new Date(formData.deadline);
    const now = new Date();
    if (deadlineDate <= now) {
      setError('Deadline must be in the future');
      setLoading(false);
      return;
    }

    try {
      const response = await fetch('/api/v1/campaigns', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          goal: parseFloat(formData.goal),
          deadline: deadlineDate.toISOString(),
          category: formData.category,
          imageUrl: formData.imageUrl || undefined
        })
      });

      const result = await response.json();

      if (response.ok && result.success && result.campaign && result.campaign.id) {
        // Success - redirect to the new campaign
        router.push(`/campaigns/${result.campaign.id}`);
      } else {
        setError(result.error || 'Failed to create campaign');
      }
    } catch (error) {
      console.error('Create campaign error:', error);
      setError('Network error. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">You need to be logged in to create a campaign.</p>
          <button 
            onClick={() => router.push('/auth/login')}
            className="btn-primary"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
            Create Your Campaign
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Share your vision with the world and bring your project to life through crowdfunding
          </p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-lg">
                {error}
              </div>
            )}

            {/* Campaign Title */}
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Title *
              </label>
              <input
                id="title"
                name="title"
                type="text"
                required
                value={formData.title}
                onChange={handleChange}
                placeholder="What's your campaign about?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-lg"
              />
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                name="description"
                required
                rows={6}
                value={formData.description}
                onChange={handleChange}
                placeholder="Tell your story. What problem are you solving? How will you use the funds?"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
              />
            </div>

            {/* Goal and Deadline */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
                  Funding Goal ($) *
                </label>
                <input
                  id="goal"
                  name="goal"
                  type="number"
                  min="1"
                  step="0.01"
                  required
                  value={formData.goal}
                  onChange={handleChange}
                  placeholder="1000"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
              <div>
                <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Deadline *
                </label>
                <input
                  id="deadline"
                  name="deadline"
                  type="datetime-local"
                  required
                  value={formData.deadline}
                  onChange={handleChange}
                  min={new Date().toISOString().slice(0, 16)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
            </div>

            {/* Category */}
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                Category *
              </label>
              <select
                id="category"
                name="category"
                required
                value={formData.category}
                onChange={handleChange}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              >
                {categories.map((category) => (
                  <option key={category.value} value={category.value}>
                    {category.label}
                  </option>
                ))}
              </select>
            </div>

            {/* Image URL */}
            <div>
              <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                Campaign Image URL (Optional)
              </label>
              <input
                id="imageUrl"
                name="imageUrl"
                type="url"
                value={formData.imageUrl}
                onChange={handleChange}
                placeholder="https://example.com/image.jpg"
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
              />
              <p className="mt-2 text-sm text-gray-500">
                Add an image URL to make your campaign more appealing
              </p>
            </div>

            {/* Preview */}
            {formData.imageUrl && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image Preview
                </label>
                <div className="border border-gray-300 rounded-lg overflow-hidden">
                  <img
                    src={formData.imageUrl}
                    alt="Campaign preview"
                    className="w-full h-48 object-cover"
                    onError={(e) => {
                      e.currentTarget.style.display = 'none';
                    }}
                  />
                </div>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4 pt-6">
              <button
                type="button"
                onClick={() => router.back()}
                className="px-6 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className={`px-8 py-3 rounded-lg font-semibold text-lg transition-all duration-200 ${
                  loading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'btn-primary hover:shadow-lg'
                }`}
              >
                {loading ? 'Creating Campaign...' : 'Create Campaign'}
              </button>
            </div>
          </form>
        </div>

        {/* Tips */}
        <div className="mt-8 bg-blue-50 rounded-2xl p-6">
          <h3 className="text-lg font-semibold text-blue-900 mb-4">💡 Campaign Tips</h3>
          <ul className="space-y-2 text-blue-800">
            <li>• Write a compelling title that clearly describes your project</li>
            <li>• Tell your story and explain why your project matters</li>
            <li>• Set a realistic funding goal based on your actual needs</li>
            <li>• Choose an appropriate deadline (30-90 days is recommended)</li>
            <li>• Add a high-quality image to make your campaign stand out</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
