'use client';

import React, { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { useCampaign, useCampaignDonations } from '../../../hooks';
import { useAuth } from '../../../contexts/AuthContext';
import SafeModal from '../../../components/SafeModal';

export default function CampaignPage() {
  const params = useParams();
  const campaignId = params.id as string;
  const { user } = useAuth();
  
  const { data: campaign, loading, error, refetch } = useCampaign(campaignId);
  const campaignData = campaign?.data || null;
  
  // Fetch recent donations for this campaign
  const { data: donationsData, loading: donationsLoading, refetch: refetchDonations } = useCampaignDonations(campaignId, 1, 10);
  
  // State hooks must be called before useEffect
  const [showDonationModal, setShowDonationModal] = useState(false);
  const [donationAmount, setDonationAmount] = useState('');
  const [donationMessage, setDonationMessage] = useState('');
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [donationLoading, setDonationLoading] = useState(false);
  
  // Clean up modals when user changes (logout/login)
  useEffect(() => {
    if (!user) {
      // User logged out - clean up any open modals
      setShowDonationModal(false);
      setDonationAmount('');
      setDonationMessage('');
      setIsAnonymous(false);
      setDonationLoading(false);
    }
  }, [user]);

  // Additional cleanup on component unmount
  useEffect(() => {
    return () => {
      // Cleanup on unmount
      setShowDonationModal(false);
      setDonationAmount('');
      setDonationMessage('');
      setIsAnonymous(false);
      setDonationLoading(false);
    };
  }, []);

  // Variable assignments after all hooks
  const donations = Array.isArray(donationsData) ? donationsData : (donationsData as any)?.data || [];
  
  
  // Check if current user is the campaign owner
  const isOwner = user && campaignData && user.id === campaignData.ownerId;
  
  // Check if campaign is ended (reached goal or passed deadline)
  const isEnded = campaignData && (
    campaignData.status === 'COMPLETED' || 
    campaignData.status === 'CANCELLED' || 
    campaignData.status === 'SUSPENDED' ||
    campaignData.current >= campaignData.goal ||
    new Date(campaignData.deadline).getTime() < new Date().getTime()
  );
  
  // Check if campaign is active for donations
  const isActiveForDonations = campaignData && 
    (campaignData.status === 'ACTIVE' || campaignData.status === 'OPEN') && 
    !isEnded;

  const handleDonation = async () => {
    if (!donationAmount || !user) return;

    setDonationLoading(true);
    try {
      // Create donation via API
      const response = await fetch(`/api/v1/campaign-donations?campaignId=${campaignId}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`
        },
        body: JSON.stringify({
          amount: parseFloat(donationAmount),
          message: donationMessage || undefined,
          isAnonymous: isAnonymous,
          paymentMethod: 'CREDIT_CARD' // Default payment method for demo
        })
      });

      console.log('Response status:', response.status);
      const result = await response.json();
      console.log('Response data:', result);

      if (response.ok && result.success) {
        // Success - refresh campaign data
        console.log('Donation successful! Campaign updated.');
        
        // Close modal and reset form
        setShowDonationModal(false);
        setDonationAmount('');
        setDonationMessage('');
        setIsAnonymous(false);
        
        // Refresh campaign data to show updated totals
        await refetch();
        // Also refresh donations list to show the new donation
        await refetchDonations();
      } else {
        // Error - log error
        console.error('Donation failed:', result.error);
      }
    } catch (error) {
      console.error('Donation error:', error);
    } finally {
      setDonationLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading campaign...</p>
        </div>
      </div>
    );
  }

  if (error || !campaignData) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="text-center bg-white rounded-2xl shadow-lg p-8 max-w-md mx-auto">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">Campaign Not Found</h2>
          <p className="text-gray-600 mb-6">{error || 'This campaign does not exist.'}</p>
          <button onClick={() => window.history.back()} className="btn-primary">
            Go Back
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-secondary-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Campaign Header */}
          <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-8">
            {campaignData.images && campaignData.images.length > 0 && (
              <div className="h-64 md:h-96 bg-gray-200">
                <img
                  src={campaignData.images[0]}
                  alt={campaignData.title}
                  className="w-full h-full object-cover"
                />
              </div>
            )}
            
            <div className="p-6 md:p-8">
              <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between mb-6 gap-4">
                <div className="flex-1">
                  <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                    {campaignData.title}
                  </h1>
                  <div className="flex flex-wrap items-center gap-3 text-sm mb-4">
                    <span className="bg-primary text-white px-4 py-2 rounded-full font-medium">
                      {campaignData.category}
                    </span>
                    <span className={`px-4 py-2 rounded-full font-medium ${
                      isEnded ? 'bg-red-100 text-red-800' :
                      campaignData.status === 'ACTIVE' || campaignData.status === 'OPEN' ? 'bg-green-100 text-green-800' :
                      campaignData.status === 'COMPLETED' ? 'bg-blue-100 text-blue-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {isEnded ? 'Ended' : campaignData.status}
                    </span>
                  </div>
                </div>
                
                <div className="flex-shrink-0">
          <button
            onClick={() => {
              if (isOwner) {
                console.log('You cannot donate to your own campaign!');
                return;
              }
              
              if (user) {
                setShowDonationModal(true);
              } else {
                console.log('Please log in to make a donation and support this campaign!');
              }
            }}
            disabled={!isActiveForDonations || isOwner}
            className={`px-8 py-4 rounded-lg font-semibold text-lg transition-all duration-200 w-full lg:w-auto ${
              isActiveForDonations
                ? (isOwner ? 'bg-gray-300 text-gray-500 cursor-not-allowed' : 'btn-primary hover:shadow-lg')
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            {isOwner 
              ? 'Your Campaign' 
              : isActiveForDonations
                ? (user ? 'Donate Now' : 'Login to Donate') 
                : 'Campaign Ended'
            }
          </button>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-8">
                <div className="flex justify-between items-center mb-3">
                  <span className="text-2xl font-bold text-primary">
                    ${(campaignData.current || 0).toLocaleString()} raised
                  </span>
                  <span className="text-2xl font-bold text-gray-900">
                    ${(campaignData.goal || 0).toLocaleString()} goal
                  </span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                  <div
                    className="bg-gradient-to-r from-primary to-secondary h-4 rounded-full transition-all duration-500"
                    style={{ width: `${Math.min((campaignData.current / campaignData.goal) * 100, 100)}%` }}
                  ></div>
                </div>
                <div className="flex justify-between items-center text-lg">
                  <span className="font-semibold text-gray-700">{Math.min((campaignData.current / campaignData.goal) * 100, 100).toFixed(1)}% funded</span>
                  <span className="font-semibold text-gray-700">
                    {campaignData.status === 'DRAFT' ? 'Draft' :
                     campaignData.status === 'COMPLETED' ? 'Completed' :
                     campaignData.status === 'CANCELLED' ? 'Cancelled' :
                     campaignData.status === 'SUSPENDED' ? 'Suspended' :
                     campaignData.current >= campaignData.goal ? 'Ended' : 
                     Math.max(0, Math.ceil((new Date(campaignData.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) > 0 ? 
                     `${Math.max(0, Math.ceil((new Date(campaignData.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left` : 'Ended'}
                  </span>
                </div>
              </div>

              {/* Campaign Description */}
              <div className="prose max-w-none">
                <p className="text-gray-700 leading-relaxed whitespace-pre-line text-lg">
                  {campaignData.description}
                </p>
              </div>
            </div>
          </div>

          {/* Campaign Details Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Campaign Owner */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Campaign Owner</h3>
                <div className="flex items-center space-x-4">
                  {campaignData.owner.avatar ? (
                    <img
                      src={campaignData.owner.avatar}
                      alt={campaignData.owner.name}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center">
                      <span className="text-white text-xl font-bold">
                        {campaignData.owner.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <h4 className="text-xl font-bold text-gray-900">{campaignData.owner.name}</h4>
                    <p className="text-gray-600">Campaign Creator</p>
                  </div>
                </div>
              </div>

              {/* Recent Donations */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Recent Donations</h3>
                {donationsLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                  </div>
                ) : donations.length > 0 ? (
                  <div className="space-y-4">
                    {donations.map((donation: any) => (
                      <div key={donation.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                        <div className="flex items-center space-x-3">
                          {donation.isAnonymous ? (
                            <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                              <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                              </svg>
                            </div>
                          ) : (
                            <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center">
                              <span className="text-white text-sm font-bold">
                                {donation.donor?.name?.charAt(0)?.toUpperCase() || 'U'}
                              </span>
                            </div>
                          )}
                          <div>
                            <span className="text-gray-900 font-medium">
                              {donation.isAnonymous ? 'Anonymous' : donation.donor?.name || 'Unknown'}
                            </span>
                            {donation.message && (
                              <p className="text-sm text-gray-500 italic">"{donation.message}"</p>
                            )}
                            <p className="text-xs text-gray-400">
                              {new Date(donation.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <span className="font-bold text-primary text-lg">${(donation.amount || 0).toLocaleString()}</span>
                          <div className="flex items-center space-x-1 mt-1">
                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                              donation.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                              donation.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-gray-100 text-gray-800'
                            }`}>
                              {donation.status}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                    <h4 className="text-lg font-semibold text-gray-900 mb-2">No Donations Yet</h4>
                    <p className="text-gray-600 mb-4">Be the first to support this campaign!</p>
                    <button
                      onClick={() => {
                        if (isOwner) {
                          console.log('You cannot donate to your own campaign!');
                          return;
                        }
                        
                        if (user) {
                          setShowDonationModal(true);
                        } else {
                          console.log('Please log in to make a donation and support this campaign!');
                        }
                      }}
                      disabled={isOwner}
                      className={`px-6 py-2 ${
                        isOwner 
                          ? 'bg-gray-300 text-gray-500 cursor-not-allowed' 
                          : 'btn-primary'
                      }`}
                    >
                      {isOwner ? 'Your Campaign' : 'Make First Donation'}
                    </button>
                  </div>
                )}
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Donation Card */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Support This Campaign</h3>
                <div className="space-y-6">
                  <div className="grid grid-cols-2 gap-3">
                    {[25, 50, 100, 250].map((amount) => (
                      <button
                        key={amount}
                        onClick={() => setDonationAmount(amount.toString())}
                        className={`p-4 border-2 rounded-lg font-semibold transition-all duration-200 ${
                          donationAmount === amount.toString()
                            ? 'border-primary bg-primary text-white'
                            : 'border-gray-300 hover:border-primary hover:bg-primary-50'
                        }`}
                      >
                        ${amount}
                      </button>
                    ))}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Custom Amount
                    </label>
                    <input
                      type="number"
                      value={donationAmount}
                      onChange={(e) => setDonationAmount(e.target.value)}
                      placeholder="Enter amount"
                      className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors text-lg"
                    />
                  </div>
                <button
                  onClick={() => {
                    if (user) {
                      setShowDonationModal(true);
                    } else {
                      console.log('Please log in to make a donation and support this campaign!');
                    }
                  }}
                  disabled={!donationAmount || !isActiveForDonations || donationLoading || isOwner}
                  className={`w-full p-4 rounded-lg font-semibold text-lg transition-all duration-200 ${
                    !donationAmount || !isActiveForDonations || donationLoading || isOwner
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'btn-primary hover:shadow-lg'
                  }`}
                >
                  {donationLoading ? 'Processing...' : isOwner ? 'Your Campaign' : (user ? `Donate $${donationAmount || '0'}` : 'Login to Donate')}
                </button>
                </div>
              </div>

              {/* Campaign Stats */}
              <div className="bg-white rounded-2xl shadow-lg p-6">
                <h3 className="text-2xl font-bold text-gray-900 mb-6">Campaign Stats</h3>
                <div className="space-y-4">
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Goal</span>
                    <span className="font-bold text-lg">${(campaignData.goal || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Raised</span>
                    <span className="font-bold text-primary text-lg">${(campaignData.current || 0).toLocaleString()}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b border-gray-100">
                    <span className="text-gray-600 font-medium">Donors</span>
                    <span className="font-bold text-lg">{campaignData.stats?.uniqueDonors || 0}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-gray-600 font-medium">Days Left</span>
                    <span className="font-bold text-lg">
                      {campaignData.status === 'DRAFT' ? 'Draft' :
                       campaignData.status === 'COMPLETED' ? 'Completed' :
                       campaignData.status === 'CANCELLED' ? 'Cancelled' :
                       campaignData.status === 'SUSPENDED' ? 'Suspended' :
                       campaignData.current >= campaignData.goal ? 'Ended' : 
                       Math.max(0, Math.ceil((new Date(campaignData.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) > 0 ? 
                       Math.max(0, Math.ceil((new Date(campaignData.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) : 'Ended'}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Donation Modal */}
        <SafeModal
          isOpen={showDonationModal}
          onClose={() => setShowDonationModal(false)}
        >
          <h2 className="text-2xl font-bold text-gray-900 mb-6">Make a Donation</h2>
              
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount
                  </label>
                  <input
                    type="number"
                    value={donationAmount}
                    onChange={(e) => setDonationAmount(e.target.value)}
                    placeholder="Enter donation amount"
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message (Optional)
                  </label>
                  <textarea
                    value={donationMessage}
                    onChange={(e) => setDonationMessage(e.target.value)}
                    placeholder="Leave a message of support..."
                    rows={3}
                    className="w-full p-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary focus:border-primary transition-colors resize-none"
                  />
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="anonymous"
                    checked={isAnonymous}
                    onChange={(e) => setIsAnonymous(e.target.checked)}
                    className="h-4 w-4 text-primary focus:ring-primary border-gray-300 rounded"
                  />
                  <label htmlFor="anonymous" className="ml-2 text-sm text-gray-700">
                    Make this donation anonymous
                  </label>
                </div>
                
                <div className="flex space-x-3 pt-4">
                  <button
                    onClick={() => setShowDonationModal(false)}
                    className="flex-1 px-4 py-3 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleDonation}
                    disabled={!donationAmount || donationLoading || isOwner || !isActiveForDonations}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium transition-colors ${
                      !donationAmount || donationLoading || isOwner || !isActiveForDonations
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'btn-primary'
                    }`}
                  >
                    {donationLoading ? 'Processing...' : isOwner ? 'Your Campaign' : `Donate $${donationAmount || '0'}`}
                  </button>
                </div>
              </div>
        </SafeModal>
      </div>
  );
}
