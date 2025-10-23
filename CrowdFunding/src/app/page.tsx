'use client';

import React from 'react';
import Link from 'next/link';
import { useFeaturedCampaigns, useTrendingCampaigns, usePlatformStats } from '../hooks';
import { useAuth } from '../contexts/AuthContext';

export default function HomePage() {
  const { user } = useAuth();
  const { data: featuredCampaigns, loading: featuredLoading } = useFeaturedCampaigns();
  const { data: trendingCampaigns, loading: trendingLoading } = useTrendingCampaigns();
  const { data: platformStats, loading: statsLoading } = usePlatformStats();

  return (
    <main className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-r from-primary to-primary-dark text-white py-20">
        <div className="container mx-auto px-4 text-center">
          <h1 className="text-5xl md:text-6xl font-bold mb-6">
            Fund Your Beggars
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Join thousands of creators and supporters making amazing projects come to life through crowdfunding.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href={user ? "/campaigns/create" : "/auth/register"}>
              <button className="btn-primary">
                Start Your Campaign
              </button>
            </Link>
            <Link href="/campaigns">
              <button className="btn-outline">
                Browse Campaigns
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                {statsLoading ? '...' : `$${(platformStats as any)?.totalRaised?.toLocaleString() || '0'}`}
              </div>
              <div className="text-gray-600">Total Raised</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                {statsLoading ? '...' : `${(platformStats as any)?.totalCampaigns?.toLocaleString() || '0'}`}
              </div>
              <div className="text-gray-600">Campaigns</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                {statsLoading ? '...' : `${(platformStats as any)?.totalUsers?.toLocaleString() || '0'}`}
              </div>
              <div className="text-gray-600">Supporters</div>
            </div>
            <div>
              <div className="text-4xl font-bold text-primary mb-2">
                {statsLoading ? '...' : `${(platformStats as any)?.successRate || '0'}%`}
              </div>
              <div className="text-gray-600">Success Rate</div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Campaigns */}
      <section className="py-20 bg-gradient-to-br from-primary-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-primary to-primary-dark rounded-full mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
              </svg>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Featured Campaigns
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Hand-picked projects that showcase the best of our community and inspire change
            </p>
          </div>

          {featuredLoading ? (
            <div className="flex justify-center py-16">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gradient-to-r from-primary to-primary-dark"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading featured campaigns...</p>
              </div>
            </div>
          ) : featuredCampaigns && Array.isArray(featuredCampaigns) && featuredCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
              {featuredCampaigns.slice(0, 3).map((campaign, index) => (
                <div key={campaign.id} className="group relative">
                  {/* Featured Badge */}
                  <div className="absolute -top-3 -right-3 z-10">
                    <div className="bg-gradient-to-r from-primary to-primary-dark text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      ⭐ Featured
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2 group-hover:scale-105">
                    <Link href={`/campaigns/${campaign.id}`}>
                      {campaign.images && campaign.images.length > 0 && (
                        <div className="relative h-48 bg-gray-200 overflow-hidden">
                          <img
                            src={campaign.images[0]}
                            alt={campaign.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          <div className="absolute top-4 left-4">
                            <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">
                              {campaign.category}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-gray-500 font-medium">
                              {campaign.status === 'DRAFT' ? 'Draft' :
                               campaign.status === 'COMPLETED' ? 'Completed' :
                               campaign.status === 'CANCELLED' ? 'Cancelled' :
                               campaign.status === 'SUSPENDED' ? 'Suspended' :
                               campaign.current >= campaign.goal ? 'Ended' : 
                               Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) > 0 ? 
                               `${Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left` : 'Ended'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs font-semibold text-gray-600">Featured</span>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                          {campaign.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {campaign.description}
                        </p>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-medium">Progress</span>
                            <span className="text-sm font-bold text-primary">
                              {Math.round((campaign.current / campaign.goal) * 100)}%
                            </span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-primary to-primary-dark h-3 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${Math.min((campaign.current / campaign.goal) * 100, 100)}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex flex-col">
                              <span className="text-gray-600">Raised</span>
                              <span className="font-bold text-gray-900">${campaign.current.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-gray-600">Goal</span>
                              <span className="font-bold text-gray-900">${campaign.goal.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-dark rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  {campaign.owner?.name?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <span className="text-xs text-gray-600">by {campaign.owner?.name || 'Anonymous'}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-primary">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Featured Campaigns Yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">Be the first to discover amazing campaigns that are making a difference!</p>
              <Link href="/campaigns">
                <button className="btn-primary px-8 py-3 text-lg">Explore All Campaigns</button>
              </Link>
            </div>
          )}
          
          {/* View All Button */}
          {featuredCampaigns && Array.isArray(featuredCampaigns) && featuredCampaigns.length > 0 && (
            <div className="text-center mt-12">
              <Link href="/campaigns">
                <button className="bg-gradient-to-r from-primary to-primary-dark hover:from-primary-dark hover:to-primary text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                  View All Featured Campaigns
                  <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Trending Campaigns */}
      <section className="py-20 bg-gradient-to-br from-gray-50 to-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-r from-orange-400 to-red-500 rounded-full mb-6">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Trending Now
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto leading-relaxed">
              Campaigns that are gaining momentum and capturing hearts across our community
            </p>
          </div>

          {trendingLoading ? (
            <div className="flex justify-center py-16">
              <div className="flex flex-col items-center">
                <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-gradient-to-r from-orange-400 to-red-500"></div>
                <p className="mt-4 text-gray-600 font-medium">Loading trending campaigns...</p>
              </div>
            </div>
          ) : trendingCampaigns && Array.isArray(trendingCampaigns) && trendingCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {trendingCampaigns.slice(0, 4).map((campaign, index) => (
                <div key={campaign.id} className="group relative">
                  {/* Trending Badge */}
                  <div className="absolute -top-3 -right-3 z-10">
                    <div className="bg-gradient-to-r from-orange-400 to-red-500 text-white text-xs font-bold px-3 py-1 rounded-full shadow-lg">
                      #{index + 1} Trending
                    </div>
                  </div>
                  
                  <div className="bg-white rounded-2xl shadow-xl overflow-hidden hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-2 group-hover:scale-105">
                    <Link href={`/campaigns/${campaign.id}`}>
                      {campaign.images && campaign.images.length > 0 && (
                        <div className="relative h-48 bg-gray-200 overflow-hidden">
                          <img
                            src={campaign.images[0]}
                            alt={campaign.title}
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent"></div>
                          <div className="absolute top-4 left-4">
                            <span className="bg-white/90 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-xs font-semibold">
                              {campaign.category}
                            </span>
                          </div>
                        </div>
                      )}
                      <div className="p-6">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-2">
                            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                            <span className="text-xs text-gray-500 font-medium">
                              {campaign.status === 'DRAFT' ? 'Draft' :
                               campaign.status === 'COMPLETED' ? 'Completed' :
                               campaign.status === 'CANCELLED' ? 'Cancelled' :
                               campaign.status === 'SUSPENDED' ? 'Suspended' :
                               campaign.current >= campaign.goal ? 'Ended' : 
                               Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))) > 0 ? 
                               `${Math.max(0, Math.ceil((new Date(campaign.deadline).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)))} days left` : 'Ended'}
                            </span>
                          </div>
                          <div className="flex items-center space-x-1">
                            <svg className="w-4 h-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                            </svg>
                            <span className="text-xs font-semibold text-gray-600">Hot</span>
                          </div>
                        </div>
                        
                        <h3 className="text-lg font-bold text-gray-900 mb-3 line-clamp-2 group-hover:text-primary transition-colors">
                          {campaign.title}
                        </h3>
                        
                        <p className="text-gray-600 text-sm mb-4 line-clamp-2 leading-relaxed">
                          {campaign.description}
                        </p>
                        
                        <div className="space-y-3">
                          <div className="flex justify-between items-center">
                            <span className="text-sm text-gray-600 font-medium">Progress</span>
                            <span className="text-sm font-bold text-primary">
                              {Math.round((campaign.current / campaign.goal) * 100)}%
                            </span>
                          </div>
                          
                          <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden">
                            <div
                              className="bg-gradient-to-r from-primary to-primary-dark h-3 rounded-full transition-all duration-500 ease-out"
                              style={{ width: `${Math.min((campaign.current / campaign.goal) * 100, 100)}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex justify-between items-center text-sm">
                            <div className="flex flex-col">
                              <span className="text-gray-600">Raised</span>
                              <span className="font-bold text-gray-900">${campaign.current.toLocaleString()}</span>
                            </div>
                            <div className="flex flex-col text-right">
                              <span className="text-gray-600">Goal</span>
                              <span className="font-bold text-gray-900">${campaign.goal.toLocaleString()}</span>
                            </div>
                          </div>
                        </div>
                        
                        <div className="mt-4 pt-4 border-t border-gray-100">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-2">
                              <div className="w-8 h-8 bg-gradient-to-r from-primary to-primary-dark rounded-full flex items-center justify-center">
                                <span className="text-white text-xs font-bold">
                                  {campaign.owner?.name?.charAt(0) || 'U'}
                                </span>
                              </div>
                              <span className="text-xs text-gray-600">by {campaign.owner?.name || 'Anonymous'}</span>
                            </div>
                            <div className="flex items-center space-x-1 text-primary">
                              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                              </svg>
                            </div>
                          </div>
                        </div>
                      </div>
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-4">No Trending Campaigns Yet</h3>
              <p className="text-gray-600 mb-8 max-w-md mx-auto">Be the first to discover amazing campaigns that are gaining momentum!</p>
              <Link href="/campaigns">
                <button className="btn-primary px-8 py-3 text-lg">Explore All Campaigns</button>
              </Link>
            </div>
          )}
          
          {/* View All Button */}
          {trendingCampaigns && Array.isArray(trendingCampaigns) && trendingCampaigns.length > 0 && (
            <div className="text-center mt-12">
              <Link href="/campaigns">
                <button className="bg-gradient-to-r from-orange-400 to-red-500 hover:from-orange-500 hover:to-red-600 text-white px-8 py-4 rounded-full font-semibold text-lg transition-all duration-300 transform hover:scale-105 hover:shadow-xl">
                  View All Trending Campaigns
                  <svg className="w-5 h-5 ml-2 inline" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-primary-600 text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Ready to Make a Difference?
          </h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto opacity-90">
            Join our community of creators and supporters today
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/register">
              <button className="btn-primary">
                Get Started
              </button>
            </Link>
            <Link href="/campaigns">
              <button className="btn-outline">
                Explore Campaigns
              </button>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}
