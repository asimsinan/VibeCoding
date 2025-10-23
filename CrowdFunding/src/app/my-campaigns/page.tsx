'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useMyCampaigns } from '../../hooks';
import { useAuth } from '../../contexts/AuthContext';

export default function MyCampaignsPage() {
  // ALL HOOKS MUST BE CALLED FIRST - NO CONDITIONAL LOGIC BEFORE THIS
  const [filters, setFilters] = useState({
    status: '',
    page: 1,
    limit: 12
  });

  // Delete modal state
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [campaignToDelete, setCampaignToDelete] = useState<{id: string, title: string} | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const { user, loading: authLoading } = useAuth();
  const { data: campaignsResponse, loading, error, refetch } = useMyCampaigns(filters);

  // Clean up modals when user changes (logout/login)
  useEffect(() => {
    if (!user) {
      // User logged out - clean up any open modals
      setShowDeleteModal(false);
      setCampaignToDelete(null);
      setDeleteLoading(false);
    }
  }, [user]);

  // Additional cleanup on component unmount
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      setShowDeleteModal(false);
      setCampaignToDelete(null);
      setDeleteLoading(false);
    };
  }, []);

  // Variable assignments and debug logging after all hooks
  const campaigns = Array.isArray(campaignsResponse) ? campaignsResponse : [];
  const pagination = { page: 1, totalPages: 1 }; // Default pagination since campaignsResponse is the array

  // Debug logging
  console.log('My Campaigns Debug:', {
    filters,
    campaignsResponse,
    campaignsResponseType: typeof campaignsResponse,
    campaignsResponseIsArray: Array.isArray(campaignsResponse),
    campaignsResponseLength: Array.isArray(campaignsResponse) ? campaignsResponse.length : 0,
    campaigns,
    campaignsLength: campaigns.length,
    user: user?.id,
    timestamp: new Date().toISOString()
  });

  const handleStatusChange = (status: string) => {
    setFilters(prev => ({ ...prev, status, page: 1 }));
  };

  const handlePageChange = (page: number) => {
    setFilters(prev => ({ ...prev, page }));
  };

  const statuses = [
    { value: '', label: 'All Status' },
    { value: 'DRAFT', label: 'Draft' },
    { value: 'ACTIVE', label: 'Active' },
    { value: 'OPEN', label: 'Open' },
    { value: 'COMPLETED', label: 'Completed' },
    { value: 'CANCELLED', label: 'Cancelled' }
  ];

  const updateCampaignStatus = async (campaignId: string, newStatus: string) => {
    try {
      console.log('Updating campaign status:', { campaignId, newStatus });
      
      const response = await fetch(`/api/v1/campaign-by-id?id=${campaignId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({ status: newStatus })
      });

      console.log('Status update response:', { status: response.status, ok: response.ok });
      const result = await response.json();
      console.log('Status update result:', result);

      if (response.ok && result.success) {
        // Refresh the campaigns data
        refetch();
      } else {
        console.error('Update failed:', result.error);
      }
    } catch (error) {
      console.error('Update campaign status error:', error);
    }
  };

  const openDeleteModal = (campaignId: string, campaignTitle: string) => {
    setCampaignToDelete({ id: campaignId, title: campaignTitle });
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    if (!campaignToDelete) return;

    setDeleteLoading(true);
    try {
      const response = await fetch(`/api/v1/campaign-by-id?id=${campaignToDelete.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        }
      });

      if (response.ok) {
        // 204 No Content response means successful deletion
        console.log('Campaign deleted successfully');
        // Close modal and refresh campaigns data
        setShowDeleteModal(false);
        setCampaignToDelete(null);
        refetch();
      } else {
        // Try to parse error response only if there's content
        let errorMessage = 'Failed to delete campaign. Please try again.';
        try {
          const result = await response.json();
          errorMessage = result.error || errorMessage;
        } catch (parseError) {
          // If we can't parse JSON, use the status text
          errorMessage = response.statusText || errorMessage;
        }
        
        console.error('Delete failed:', errorMessage);
      }
    } catch (error) {
      console.error('Delete campaign error:', error);
    } finally {
      setDeleteLoading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
          <div className="w-16 h-16 border-4 border-primary-200 border-t-primary-600 rounded-full animate-spin mx-auto mb-6"></div>
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Loading...</h2>
          <p className="text-gray-600">Verifying your authentication...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Login Required</h2>
          <p className="text-gray-600 mb-6">Please log in to view your campaigns.</p>
          <Link href="/auth/login" className="btn-primary">
            Login
          </Link>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your campaigns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50 flex items-center justify-center">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Error Loading Campaigns</h2>
          <p className="text-gray-600 mb-6">{error}</p>
          <button onClick={() => window.location.reload()} className="btn-primary">
            Try Again
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
            My Campaigns
          </h1>
          <p className="text-xl text-gray-600 max-w-3xl mx-auto">
            Manage and track all your crowdfunding campaigns in one place
          </p>
        </div>

        {/* Status Filters */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-8">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Filter by Status</h3>
          <div className="flex flex-wrap gap-3">
            {statuses.map((status) => (
              <button
                key={status.value}
                onClick={() => handleStatusChange(status.value)}
                className={`px-4 py-2 rounded-lg font-medium transition-all duration-200 ${
                  filters.status === status.value
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {status.label}
              </button>
            ))}
          </div>
        </div>

        {/* Create Campaign Button */}
        <div className="text-center mb-8">
          <Link href="/campaigns/create">
            <button className="btn-primary px-8 py-3 text-lg">
              + Create New Campaign
            </button>
          </Link>
        </div>

        {/* Campaigns Grid */}
        {loading ? (
          <div className="text-center py-16">
            <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading your campaigns...</p>
          </div>
        ) : Array.isArray(campaigns) && campaigns.length > 0 ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
              {campaigns.map((campaign) => (
                <div key={campaign.id} className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-all duration-300 hover:-translate-y-1">
                  <Link href={`/campaigns/${campaign.id}`}>
                    {campaign.imageUrl && (
                      <div className="h-48 bg-gray-200">
                        <img
                          src={campaign.imageUrl}
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
                        <div className="flex flex-col items-end gap-1">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            campaign.status === 'ACTIVE' || campaign.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                            campaign.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                            campaign.status === 'DRAFT' ? 'bg-yellow-100 text-yellow-800' :
                            campaign.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
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
                        <div className="flex justify-between items-center">
                          <span className="text-sm text-gray-600 font-medium">Progress</span>
                          <span className="text-sm font-bold text-primary">
                            {Math.round((campaign.current / campaign.goal) * 100)}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-gradient-to-r from-primary to-primary-dark h-2 rounded-full transition-all duration-500"
                            style={{ width: `${Math.min((campaign.current / campaign.goal) * 100, 100)}%` }}
                          ></div>
                        </div>
                        <div className="flex justify-between items-center text-sm">
                          <span className="text-gray-600">${campaign.current.toLocaleString()}</span>
                          <span className="text-gray-600">${campaign.goal.toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                  
                  {/* Campaign Actions */}
                  <div className="px-6 pb-6">
                    <div className="flex gap-2">
                      {campaign.status === 'DRAFT' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            updateCampaignStatus(campaign.id, 'ACTIVE');
                          }}
                          className="flex-1 bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Activate
                        </button>
                      )}
                      {campaign.status === 'ACTIVE' && (
                        <button
                          onClick={(e) => {
                            e.preventDefault();
                            updateCampaignStatus(campaign.id, 'COMPLETED');
                          }}
                          className="flex-1 bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                        >
                          Complete
                        </button>
                      )}
                      <Link href={`/campaigns/${campaign.id}/edit`} className="flex-1">
                        <button className="w-full bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
                          Edit
                        </button>
                      </Link>
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          openDeleteModal(campaign.id, campaign.title);
                        }}
                        className="flex-1 bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.totalPages > 1 && (
              <div className="flex justify-center items-center space-x-2">
                <button
                  onClick={() => handlePageChange(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Previous
                </button>
                <span className="px-4 py-2 text-gray-600">
                  Page {pagination.page} of {pagination.totalPages}
                </span>
                <button
                  onClick={() => handlePageChange(pagination.page + 1)}
                  disabled={pagination.page >= pagination.totalPages}
                  className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Next
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 mb-4">No Campaigns Yet</h3>
            <p className="text-gray-600 mb-8 max-w-md mx-auto">
              You haven't created any campaigns yet. Start your first campaign and begin raising funds for your project!
            </p>
            <Link href="/campaigns/create">
              <button className="btn-primary px-8 py-3 text-lg">
                Create Your First Campaign
              </button>
            </Link>
          </div>
        )}
      </div>

      {/* Stylish Delete Confirmation Modal */}
      {showDeleteModal && campaignToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6">
            {/* Header with warning icon */}
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Delete Campaign</h2>
              <p className="text-gray-600">
                Are you sure you want to delete <span className="font-semibold text-gray-900">"{campaignToDelete.title}"</span>?
              </p>
            </div>

            {/* Warning message */}
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex items-start">
                <svg className="w-5 h-5 text-red-600 mt-0.5 mr-3 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <h4 className="text-sm font-medium text-red-800 mb-1">This action cannot be undone</h4>
                  <p className="text-sm text-red-700">
                    All campaign data, donations, and comments will be permanently deleted.
                  </p>
                </div>
              </div>
            </div>

            {/* Action buttons */}
            <div className="flex space-x-3">
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setCampaignToDelete(null);
                }}
                disabled={deleteLoading}
                className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                onClick={confirmDelete}
                disabled={deleteLoading}
                className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                  deleteLoading
                    ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                    : 'bg-red-600 hover:bg-red-700 text-white'
                }`}
              >
                {deleteLoading ? (
                  <div className="flex items-center justify-center">
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></div>
                    Deleting...
                  </div>
                ) : (
                  'Delete Campaign'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
