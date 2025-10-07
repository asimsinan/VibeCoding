'use client';

import { useState, useEffect } from 'react';

interface Invitation {
  id: string;
  status: string;
  invited_at: string;
  role: string;
  invited_by: string;
  workspaces: {
    id: string;
    name: string;
    description: string;
  };
  inviterProfile?: {
    id: string;
    name: string;
    email: string;
  };
}

interface InvitationNotificationProps {
  onInvitationAccepted?: () => void;
}

export default function InvitationNotification({ onInvitationAccepted }: InvitationNotificationProps) {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    loadInvitations();
  }, []);

  const loadInvitations = async () => {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      if (!token) return;

      const response = await fetch('/api/v1/invitations', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        const invitations = data.invitations || [];
        
        // Fetch inviter profiles for each invitation
        const invitationsWithProfiles = await Promise.all(
          invitations.map(async (invitation: Invitation) => {
            try {
              const profileResponse = await fetch('/api/v1/users', {
                headers: {
                  'Authorization': `Bearer ${token}`
                }
              });
              
              if (profileResponse.ok) {
                const users = await profileResponse.json();
                const inviterProfile = users.find((user: any) => user.id === invitation.invited_by);
                return { ...invitation, inviterProfile };
              }
            } catch (error) {
              console.error('Failed to fetch inviter profile:', error);
            }
            return invitation;
          })
        );
        
        setInvitations(invitationsWithProfiles);
      }
    } catch (error) {
      console.error('Failed to load invitations:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleInvitationAction = async (invitationId: string, action: 'accept' | 'decline') => {
    try {
      const token = localStorage.getItem('supabase.auth.token');
      const response = await fetch('/api/v1/invitations', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          invitationId,
          action
        })
      });

      if (response.ok) {
        // Remove the invitation from the list
        setInvitations(prev => prev.filter(inv => inv.id !== invitationId));
        
        if (action === 'accept' && onInvitationAccepted) {
          onInvitationAccepted();
        }
      } else {
        console.error('Failed to process invitation');
      }
    } catch (error) {
      console.error('Invitation action error:', error);
    }
  };

  if (loading) {
    return (
      <button className="relative group p-3 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 rounded-2xl transition-all duration-300 hover:bg-gray-50">
        <svg className="w-6 h-6 group-hover:scale-110 transition-transform duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        <span className="absolute -top-1 -right-1 bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center animate-pulse">
          <svg className="w-3 h-3 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </span>
      </button>
    );
  }

  const pendingInvitations = invitations.filter(inv => inv.status === 'pending');
  
  // Always show the bell, even if no invitations (for testing)
  console.log('InvitationNotification - Loading:', loading, 'Invitations:', invitations.length, 'Pending:', pendingInvitations.length);

  return (
    <>
      {/* Enhanced Notification Bell */}
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative group p-3 text-gray-600 hover:text-gray-900 focus:outline-none focus:ring-4 focus:ring-indigo-500/20 rounded-2xl transition-all duration-300 hover:bg-gray-50 hover:shadow-lg transform hover:-translate-y-1"
        title={`${pendingInvitations.length} pending invitations`}
      >
        <svg className="w-6 h-6 group-hover:scale-110 group-hover:rotate-12 transition-all duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>
        {pendingInvitations.length > 0 ? (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-red-500 to-pink-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-bold shadow-lg ">
            {pendingInvitations.length > 9 ? '9+' : pendingInvitations.length}
          </span>
        ) : (
          <span className="absolute -top-1 -right-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-xs rounded-full h-6 w-6 flex items-center justify-center font-medium">
            0
          </span>
        )}
        
        {/* Ripple effect */}
        <div className="absolute inset-0 rounded-2xl bg-indigo-500/20 scale-0 group-hover:scale-100 transition-transform duration-300 opacity-0 group-hover:opacity-100"></div>
      </button>

      {/* Enhanced Notifications Dropdown */}
      {showNotifications && (
        <div className="absolute right-0 mt-4 w-96 bg-white/95 backdrop-blur-xl rounded-3xl shadow-2xl border border-white/20 z-50 ">
          {/* Background decoration */}
          <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-10 translate-x-10 opacity-60"></div>
          <div className="absolute bottom-0 left-0 w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full translate-y-8 -translate-x-8 opacity-40"></div>
          
          {/* Header */}
          <div className="relative p-6 border-b border-gray-200/50">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-xl font-bold bg-gradient-to-r from-gray-900 to-indigo-600 bg-clip-text text-transparent">
                    Invitations
                  </h3>
                  <p className="text-sm text-gray-600 font-medium">
                    {pendingInvitations.length} pending invitation{pendingInvitations.length !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setShowNotifications(false)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-xl transition-all duration-200 group"
              >
                <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {pendingInvitations.length === 0 ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-gray-100 to-gray-200 rounded-3xl flex items-center justify-center">
                  <svg className="w-8 h-8 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                  </svg>
                </div>
                <h4 className="text-lg font-semibold text-gray-900 mb-2">No pending invitations</h4>
                <p className="text-gray-600 text-sm">You're all caught up!</p>
              </div>
            ) : (
              pendingInvitations.map((invitation, index) => (
                <div key={invitation.id} className="relative p-6 border-b border-gray-200/50 hover:bg-gradient-to-r hover:from-indigo-50/50 hover:to-purple-50/50 transition-all duration-300 group" style={{ animationDelay: `${index * 100}ms` }}>
                  {/* Background decoration */}
                  <div className="absolute top-0 right-0 w-12 h-12 bg-gradient-to-br from-indigo-100 to-purple-100 rounded-full -translate-y-6 translate-x-6 opacity-30 group-hover:opacity-50 transition-opacity duration-300"></div>
                  
                  <div className="relative flex items-start justify-between">
                    <div className="flex-1">
                      {/* Workspace info */}
                      <div className="flex items-center space-x-3 mb-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform duration-300">
                          <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                          </svg>
                        </div>
                        <div>
                          <h4 className="font-bold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors duration-300">
                            {invitation.workspaces.name}
                          </h4>
                          <p className="text-sm text-gray-600 font-medium">
                            {invitation.workspaces.description || 'No description provided'}
                          </p>
                        </div>
                      </div>
                      
                      {/* Inviter info */}
                      <div className="flex items-center space-x-2 mb-3">
                        <div className="w-6 h-6 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full flex items-center justify-center">
                          <span className="text-xs text-white font-bold">
                            {(invitation.inviterProfile?.name || invitation.inviterProfile?.email || 'U').charAt(0).toUpperCase()}
                          </span>
                        </div>
                        <span className="text-sm text-gray-600 font-medium">
                          Invited by {invitation.inviterProfile?.name || invitation.inviterProfile?.email || 'Unknown User'}
                        </span>
                      </div>
                      
                      {/* Date */}
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                        <span className="text-xs text-gray-500 font-medium">
                          {new Date(invitation.invited_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Action buttons */}
                    <div className="flex flex-col space-y-2 ml-6">
                      <button
                        onClick={() => handleInvitationAction(invitation.id, 'accept')}
                        className="group/accept px-4 py-2 bg-gradient-to-r from-green-500 to-emerald-600 text-white text-sm font-semibold rounded-xl hover:from-green-600 hover:to-emerald-700 focus:outline-none focus:ring-4 focus:ring-green-500/20 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 group-hover/accept:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          <span>Accept</span>
                        </div>
                      </button>
                      <button
                        onClick={() => handleInvitationAction(invitation.id, 'decline')}
                        className="group/decline px-4 py-2 bg-gradient-to-r from-gray-400 to-gray-500 text-white text-sm font-semibold rounded-xl hover:from-gray-500 hover:to-gray-600 focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-300 shadow-lg hover:shadow-xl transform hover:-translate-y-1"
                      >
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 group-hover/decline:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                          <span>Decline</span>
                        </div>
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
          <div className="relative p-6 border-t border-gray-200/50">
            <button
              onClick={() => setShowNotifications(false)}
              className="group w-full flex items-center justify-center space-x-2 px-6 py-3 text-sm font-semibold text-gray-600 bg-gray-50 rounded-2xl hover:bg-gray-100 hover:text-gray-800 focus:outline-none focus:ring-4 focus:ring-gray-500/20 transition-all duration-300"
            >
              <svg className="w-4 h-4 group-hover:scale-110 transition-transform duration-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Close</span>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
