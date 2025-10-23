'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useCampaigns, useFeaturedCampaigns } from '../../hooks';

export default function CampaignsPage() {
  const [filters, setFilters] = useState({
    category: '',
    status: '',
    search: '',
    page: 1,
    limit: 12
  });

  const { data: campaignsResponse, loading, error } = useCampaigns(filters);
  const campaigns = (campaignsResponse as any)?.data || [];
  const pagination = (campaignsResponse as any)?.pagination || { page: 1, totalPages: 1 };
  const { data: featuredCampaigns } = useFeaturedCampaigns();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setFilters(prev => ({ ...prev, search: (e.target as any).search.value, page: 1 }));
  };

  const handleCategoryChange = (category: string) => {
    setFilters(prev => ({ ...prev, category, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'TECHNOLOGY', label: 'Technology' },
    { value: 'ART', label: 'Art' },
    { value: 'EDUCATION', label: 'Education' },
    { value: 'HEALTH', label: 'Health' },
    { value: 'ENVIRONMENT', label: 'Environment' },
    { value: 'OTHER', label: 'Other' }
  ];

  const statuses = [
    { value: '', label: 'All Status' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'OPEN', label: 'Open' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'DRAFT', label: 'Draft' }
  ];

  const handleStatusChange = (status: string) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaigns...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 mb-4">
            Discover Amazing Campaigns
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Support creators and bring their ideas to life. Every contribution makes a difference.
          </p>
        </div>

        {/* Featured Campaigns */}
        {featuredCampaigns && featuredCampaigns.length > 0 && (
          <div className="mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-8 text-center">Featured Campaigns</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCampaigns.slice(0, 3).map((campaign) => (
                <div key={campaign.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <Link href={`/campaigns/${campaign.id}`}>
                    {campaign.images && campaign.images.length > 0 && (
                      <div className="h-56 bg-gray-200">
                        <img
                          src={campaign.images[0]}
                          alt={campaign.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-6">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <span className="bg-primary text-white px-3 py-1 rounded-full text-xs font-medium flex-shrink-0">
                          {campaign.category}
                        </span>
                        <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                          {campaign.status === 'DRAFT' ? 'Draft' :
                           campaign.status === 'COMPLETED' ? 'Completed' :
                           campaign.status === 'CANCELLED' ? 'Cancelled' :
                           campaign.status === 'SUSPENDED' ? 'Suspended' :
                           campaign.current >= campaign.goal ? 'Ended' : 
                           Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) > 0 ? 
                           `${Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left` : 'Ended'}
                        </span>
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3 line-clamp-2">
                        {campaign.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {campaign.description}
                      </p>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Raised</span>
                          <span className="font-bold text-primary">${campaign.current.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-3">
                          <div
                            className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((campaign.current / campaign.goal) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>${campaign.goal.toLocaleString()} goal</span>
                          <span className="font-semibold">{Math.round((campaign.current / campaign.goal) * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Search and Filters */}
        <div className="mb-8">
          <form onSubmit={handleSearch} className="mb-6">
            <div className="flex flex-col sm:flex-row gap-4 max-w-2xl mx-auto">
              <div className="flex-1">
                <input
                  name="search"
                  placeholder="Search campaigns..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                />
              </div>
              <button type="submit" className="btn-primary sm:w-auto">
                Search
              </button>
            </div>
          </form>

          {/* Category Filters */}
          <div className="flex flex-wrap gap-3 justify-center mb-4">
            {categories.map((category) => (
              <button
                key={category.value}
                onClick={() => handleCategoryChange(category.value)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                  filters.category === category.value
                    ? 'bg-primary-600 text-white shadow-lg border-2 border-primary-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          {/* Status Filters */}
          <div className="flex flex-wrap gap-3 justify-center">
            {statuses.map((status) => (
              <button
                key={status.value}
                onClick={() => handleStatusChange(status.value)}
                className={`px-6 py-3 rounded-full text-sm font-medium transition-all duration-200 ${
                  filters.status === status.value
                    ? 'bg-secondary-600 text-white shadow-lg border-2 border-secondary-600'
                    : 'bg-white text-gray-700 hover:bg-gray-50 border-2 border-gray-200 hover:border-gray-300 hover:shadow-md'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Campaigns Grid */}
        {error ? (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Campaigns</h2>
              <p className="text-gray-600 mb-6">{error}</p>
              <button onClick={() => window.location.reload()} className="btn-primary">
                Try Again
              </button>
            </div>
          </div>
        ) : campaigns && campaigns.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <Link href={`/campaigns/${campaign.id}`}>
                    {campaign.images && campaign.images.length > 0 && (
                      <div className="h-48 bg-gray-200">
                        <img
                          src={campaign.images[0]}
                          alt={campaign.title}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}
                    <div className="p-5">
                      <div className="flex items-start justify-between mb-3 gap-2">
                        <span className="bg-primary text-white px-2 py-1 rounded-full text-xs font-medium flex-shrink-0">
                          {campaign.category}
                        </span>
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                            campaign.status === 'ACTIVE' || campaign.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {campaign.status}
                          </span>
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {campaign.status === 'DRAFT' ? 'Draft' :
                             campaign.status === 'COMPLETED' ? 'Completed' :
                             campaign.status === 'CANCELLED' ? 'Cancelled' :
                             campaign.status === 'SUSPENDED' ? 'Suspended' :
                             campaign.current >= campaign.goal ? 'Ended' : 
                             Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) > 0 ? 
                             `${Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left` : 'Ended'}
                          </span>
                        </div>
                      </div>
                      <h3 className="text-lg font-bold text-gray-900 mb-2 line-clamp-2">
                        {campaign.title}
                      </h3>
                      <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                        {campaign.description}
                      </p>
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-600">Raised</span>
                          <span className="font-bold text-primary">${campaign.current.toLocaleString()}</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full transition-all duration-300"
                            style={{ width: `${Math.min((campaign.current / campaign.goal) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600">
                          <span>${campaign.goal.toLocaleString()} goal</span>
                          <span className="font-semibold">{Math.round((campaign.current / campaign.goal) * 100)}%</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page === 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Previous
                </button>
                
                {Array.from({ length: Math.min(5, pagination.totalPages) }, (_, i) => {
                  const page = i + 1;
                  return (
                    <button
                      key={page}
                      onClick={() => handlePageChange(page)}
                      className={`px-4 py-2 rounded-lg transition-colors ${
                        pagination.page === page 
                          ? 'bg-primary text-white' 
                          : 'border border-gray-300 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  );
                })}
                
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page === pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-12">
            <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
              <h2 className="text-2xl font-bold text-gray-900 mb-4">No Campaigns Found</h2>
              <p className="text-gray-600 mb-6">
                {filters.search || filters.category 
                  ? 'Try adjusting your search criteria or browse all campaigns.'
                  : 'Be the first to create a campaign!'
                }
              </p>
              <button 
                onClick={() => setFilters({ category: '', status: 'ACTIVE', search: '', page: 1, limit: 12 })}
                className="btn-primary"
              >
                {filters.search || filters.category ? 'Clear Filters' : 'Create Campaign'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
