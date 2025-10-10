/**
 * RoomList Component
 * Displays a list of rooms with search and filter capabilities
 */

'use client';

import React, { useState, useEffect } from 'react';
import { RoomCard } from './RoomCard';
import { CreateRoomModal } from './CreateRoomModal';
import { DeleteRoomModal } from './DeleteRoomModal';
import { useClientApi } from '@/hooks/useClientApi';

interface RoomListProps {
  onJoinRoom?: (roomId: string, participantName: string) => void;
}

export const RoomList: React.FC<RoomListProps> = ({ onJoinRoom }) => {
  const {
    rooms,
    isLoading,
    error,
    currentUser,
    isAuthChecking,
    isAuthenticated,
    createRoom,
    joinRoom,
    getRooms,
    deleteRoom
  } = useClientApi();

  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [roomToDelete, setRoomToDelete] = useState<{ id: string; name: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterSettings, setFilterSettings] = useState({
    allowScreenShare: false,
    allowChat: false,
    allowCamera: false,
    allowMicrophone: false,
    recordingEnabled: false
  });

  // Poll for room updates every 1 second for faster updates
  useEffect(() => {
    if (!isAuthenticated) return;

    // Load rooms immediately
    getRooms();

    // Set up polling interval - faster polling for better responsiveness
    const interval = setInterval(() => {
      getRooms();
    }, 1000); // Reduced from 3000ms to 1000ms

    return () => {
      clearInterval(interval);
    };
  }, [isAuthenticated]); // Remove getRooms from dependencies

  // Filter rooms based on search query and settings
  const filteredRooms = (rooms || []).filter(room => {
    const matchesSearch = room.name?.toLowerCase().includes(searchQuery.toLowerCase()) || false;
    
    const matchesSettings = Object.entries(filterSettings).every(([key, enabled]) => {
      if (!enabled) return true;
      return room.settings[key as keyof typeof room.settings] === true;
    });

    return matchesSearch && matchesSettings;
  });

  const handleCreateRoom = async (roomData: {
    name: string;
    maxParticipants: number;
    settings: {
      allowScreenShare: boolean;
      allowChat: boolean;
      allowCamera: boolean;
      allowMicrophone: boolean;
      recordingEnabled: boolean;
    };
  }) => {
    await createRoom(roomData);
  };

  const handleJoinRoom = async (roomId: string) => {
    const participantName = currentUser?.name || 'Anonymous';
    if (onJoinRoom) {
      onJoinRoom(roomId, participantName);
    } else {
      await joinRoom(roomId, participantName);
    }
  };

  const handleDeleteRoom = async (roomId: string, roomName: string) => {
    setRoomToDelete({ id: roomId, name: roomName });
    setShowDeleteModal(true);
  };

  const confirmDeleteRoom = async () => {
    if (!roomToDelete) return;
    
    try {
      setIsDeleting(true);
      await deleteRoom(roomToDelete.id);
      setShowDeleteModal(false);
      setRoomToDelete(null);
    } catch (error) {
      console.error('Failed to delete room:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const cancelDeleteRoom = () => {
    setShowDeleteModal(false);
    setRoomToDelete(null);
  };

  const handleFilterChange = (setting: string, value: boolean) => {
    setFilterSettings(prev => ({
      ...prev,
      [setting]: value
    }));
  };

  const clearFilters = () => {
    setFilterSettings({
      allowScreenShare: false,
      allowChat: false,
      allowCamera: false,
      allowMicrophone: false,
      recordingEnabled: false
    });
    setSearchQuery('');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header with glass morphism */}
        <div className="mb-8">
          <div className="glass-card p-8 mb-8 fade-in">
            <div className="flex flex-col lg:flex-row lg:justify-between lg:items-center space-y-4 lg:space-y-0">
              <div className="text-center lg:text-left">
                <div className="flex items-center justify-center lg:justify-start mb-4">
                  <div className="w-12 h-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl flex items-center justify-center mr-4 shadow-xl">
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                  </div>
                  <div>
                    <h1 className="text-4xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                      Zuumcuk Rooms
                    </h1>
                    <p className="mt-2 text-gray-600 dark:text-gray-400 text-lg">
                      Join existing rooms or create your own
                    </p>
                  </div>
                </div>
              </div>
              <div className="flex justify-center lg:justify-end">
                <button
                  onClick={() => setIsCreateModalOpen(true)}
                  className="btn btn-primary px-6 py-3 text-base font-semibold shadow-xl hover:shadow-2xl"
                >
                  <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                  </svg>
                  Create Room
                </button>
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="glass-card p-6 slide-in">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Search */}
              <div>
                <label htmlFor="search" className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Search Rooms
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                  </div>
                  <input
                    type="text"
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="input w-full pl-12"
                    placeholder="Search by room name..."
                  />
                </div>
              </div>

              {/* Filters */}
              <div>
                <label className="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
                  Filter by Features
                </label>
                <div className="flex flex-wrap gap-2">
                  {Object.entries(filterSettings).map(([key, enabled]) => (
                    <button
                      key={key}
                      onClick={() => handleFilterChange(key, !enabled)}
                      className={`inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 transform hover:scale-105 ${
                        enabled
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg hover:shadow-xl'
                          : 'bg-white/20 backdrop-blur-md border border-white/30 text-gray-700 dark:text-gray-300 hover:bg-white/30 hover:border-white/40'
                      }`}
                    >
                      <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
                    </button>
                  ))}
                  <button
                    onClick={clearFilters}
                    className="inline-flex items-center px-4 py-2 rounded-xl text-sm font-medium text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:bg-white/20 hover:backdrop-blur-md transition-all duration-300"
                  >
                    <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                    Clear All
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Error State */}
        {error && (
          <div className="glass-card p-6 border-l-4 border-red-500 bg-red-50/20 backdrop-blur-sm mb-6 fade-in">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <svg className="h-6 w-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-4">
                <h3 className="text-lg font-semibold text-red-800 dark:text-red-200">
                  {error.includes('delete') ? 'Error deleting room' : 'Error loading rooms'}
                </h3>
                <div className="mt-2 text-red-700 dark:text-red-300">
                  {error}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="flex justify-center items-center py-16">
            <div className="glass-card p-8 text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-blue-200 border-t-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600 dark:text-gray-400 font-medium">Loading rooms...</p>
            </div>
          </div>
        )}

        {/* Rooms Grid */}
        {!isLoading && (
          <>
            {filteredRooms.length === 0 ? (
              <div className="glass-card p-12 text-center fade-in">
                <div className="mx-auto w-24 h-24 bg-gradient-to-r from-gray-200 to-gray-300 dark:from-gray-700 dark:to-gray-600 rounded-full flex items-center justify-center mb-6">
                  <svg className="w-12 h-12 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">No rooms found</h3>
                <p className="text-gray-600 dark:text-gray-400 mb-8">
                  {searchQuery || Object.values(filterSettings).some(Boolean)
                    ? 'Try adjusting your search or filters'
                    : 'Get started by creating a new room'
                  }
                </p>
                {!searchQuery && !Object.values(filterSettings).some(Boolean) && (
                  <button
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn btn-primary px-8 py-3 text-base font-semibold shadow-xl hover:shadow-2xl"
                  >
                    <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                    </svg>
                    Create your first room
                  </button>
                )}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                {filteredRooms.map((room, index) => (
                  <div key={room.id} className="fade-in" style={{animationDelay: `${index * 0.1}s`}}>
                    <RoomCard
                      room={room}
                      onJoin={handleJoinRoom}
                      onDelete={handleDeleteRoom}
                      isHost={!isAuthChecking && currentUser?.id === room.createdBy}
                      participantCount={room.participantCount}
                      isFull={room.participantCount >= room.maxParticipants}
                    />
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Create Room Modal */}
      <CreateRoomModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreateRoom={handleCreateRoom}
        isLoading={isLoading}
      />

      {/* Delete Room Modal */}
      <DeleteRoomModal
        isOpen={showDeleteModal}
        onClose={cancelDeleteRoom}
        onConfirm={confirmDeleteRoom}
        roomName={roomToDelete?.name || ''}
        isLoading={isDeleting}
      />
    </div>
  );
};
