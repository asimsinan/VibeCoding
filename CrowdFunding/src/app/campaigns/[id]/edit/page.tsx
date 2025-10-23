'use client';

import React, { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useAuth } from '../../../../contexts/AuthContext';
import { useCampaign } from '../../../../hooks';

export default function EditCampaignPage() {
  const router = useRouter();
  const params = useParams();
  const campaignId = params.id as string;
  const { user } = useAuth();
  const { data: campaign, loading, error } = useCampaign(campaignId);
  const campaignData = campaign?.data || null;

  const [formData, setFormData] = useState({
    title: '',
    description: '',
    goal: '',
    deadline: '',
    category: '',
    imageUrl: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (campaignData) {
      setFormData({
        title: campaignData.title || '',
        description: campaignData.description || '',
        goal: campaignData.goal?.toString() || '',
        deadline: campaignData.deadline ? new Date(campaignData.deadline).toISOString().split('T')[0] : '',
        category: campaignData.category || '',
        imageUrl: campaignData.images?.[0] || ''
      });
    }
  }, [campaignData]);

  const categories = [
    'TECHNOLOGY',
    'HEALTHCARE', 
    'EDUCATION',
    'ENVIRONMENT',
    'ARTS',
    'SPORTS',
    'BUSINESS',
    'OTHER'
  ];

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      console.error('Authentication Required: Please log in to edit campaigns.');
      return;
    }

    setIsSubmitting(true);

    try {
      const token = localStorage.getItem('authToken');
      console.log('Update request:', { campaignId, token: token ? 'present' : 'missing' });
      
      const response = await fetch(`/api/v1/campaign-by-id?id=${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: formData.title,
          description: formData.description,
          goal: parseFloat(formData.goal),
          deadline: formData.deadline,
          category: formData.category,
          images: formData.imageUrl ? [formData.imageUrl] : []
        })
      });

      const result = await response.json();
      console.log('Update response:', { status: response.status, ok: response.ok, result });

      if (response.ok) {
        if (result.success) {
          console.log('Campaign updated successfully!');
          setTimeout(() => {
            router.push(`/campaigns/${campaignId}`);
          }, 1500);
        } else {
          console.error('Update failed:', result.error);
        }
      } else {
        console.error('Update failed:', result.error || `Server error: ${response.status} ${response.statusText}`);
      }
    } catch (error) {
      console.error('Update campaign error:', error);
      console.error('Network error:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to edit campaigns.</p>
          <button onClick={() => router.push('/auth/login')} className="btn-primary">
            Login
          </button>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !campaign) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h2>
          <p className="text-gray-600 mb-6">The campaign you're looking for doesn't exist or you don't have permission to edit it.</p>
          <button onClick={() => router.push('/my-campaigns')} className="btn-primary">
            Back to My Campaigns
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">

      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
            Edit Campaign
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Update your campaign details and settings
          </p>
        </div>

        {/* Form */}
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Title */}
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
                  Campaign Title *
                </label>
                <input
                  type="text"
                  id="title"
                  name="title"
                  value={formData.title}
                  onChange={handleInputChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  placeholder="Enter your campaign title"
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
                  value={formData.description}
                  onChange={handleInputChange}
                  required
                  rows={6}
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200 resize-none"
                  placeholder="Describe your campaign in detail..."
                />
              </div>

              {/* Goal and Deadline */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="goal" className="block text-sm font-medium text-gray-700 mb-2">
                    Funding Goal ($) *
                  </label>
                  <input
                    type="number"
                    id="goal"
                    name="goal"
                    value={formData.goal}
                    onChange={handleInputChange}
                    required
                    min="0.01"
                    step="0.01"
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="1000"
                  />
                </div>
                <div>
                  <label htmlFor="deadline" className="block text-sm font-medium text-gray-700 mb-2">
                    Deadline *
                  </label>
                  <input
                    type="date"
                    id="deadline"
                    name="deadline"
                    value={formData.deadline}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  />
                </div>
              </div>

              {/* Category and Image URL */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-2">
                    Category *
                  </label>
                  <select
                    id="category"
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                  >
                    <option value="">Select a category</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category.charAt(0) + category.slice(1).toLowerCase()}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700 mb-2">
                    Image URL
                  </label>
                  <input
                    type="url"
                    id="imageUrl"
                    name="imageUrl"
                    value={formData.imageUrl}
                    onChange={handleInputChange}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-transparent transition-all duration-200"
                    placeholder="https://example.com/image.jpg"
                  />
                </div>
              </div>

              {/* Submit Buttons */}
              <div className="flex gap-4 pt-6">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? 'Updating...' : 'Update Campaign'}
                </button>
                <button
                  type="button"
                  onClick={() => router.push(`/campaigns/${campaignId}`)}
                  className="flex-1 bg-gray-500 hover:bg-gray-600 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
