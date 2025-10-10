/**
 * CreateRoomModal Component
 * Modal for creating new rooms
 */

import React, { useState } from 'react';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomData: {
    name: string;
    maxParticipants: number;
    settings: {
      allowScreenShare: boolean;
      allowChat: boolean;
      allowCamera: boolean;
      allowMicrophone: boolean;
      recordingEnabled: boolean;
    };
  }) => Promise<void>;
  isLoading?: boolean;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  isLoading = false
}) => {
  const [formData, setFormData] = useState({
    name: '',
    maxParticipants: 2,
    settings: {
      allowScreenShare: true,
      allowChat: true,
      allowCamera: true,
      allowMicrophone: true,
      recordingEnabled: false
    }
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleInputChange = (field: string, value: any) => {
    if (field.startsWith('settings.')) {
      const settingField = field.split('.')[1] as keyof typeof formData.settings;
      setFormData(prev => ({
        ...prev,
        settings: {
          ...prev.settings,
          [settingField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [field]: value
      }));
    }
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({
        ...prev,
        [field]: ''
      }));
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Room name is required';
    } else if (formData.name.length < 3) {
      newErrors.name = 'Room name must be at least 3 characters';
    } else if (formData.name.length > 100) {
      newErrors.name = 'Room name must be less than 100 characters';
    }

    if (formData.maxParticipants < 1) {
      newErrors.maxParticipants = 'Max participants must be at least 1';
    } else if (formData.maxParticipants > 1000) {
      newErrors.maxParticipants = 'Max participants must be less than 1000';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      await onCreateRoom(formData);
      handleClose();
    } catch (error) {
      console.error('Error creating room:', error);
    }
  };

  const handleClose = () => {
    setFormData({
      name: '',
      maxParticipants: 2,
      settings: {
        allowScreenShare: true,
        allowChat: true,
        allowCamera: true,
        allowMicrophone: true,
        recordingEnabled: false
      }
    });
    setErrors({});
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto animate-fadeIn">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay with blur */}
        <div 
          className="fixed inset-0 bg-gradient-to-br from-slate-900/80 via-purple-900/60 to-indigo-900/80 backdrop-blur-md transition-opacity"
          onClick={handleClose}
        />

        {/* Modal panel with modern glass morphism */}
        <div className="inline-block align-bottom bg-white/10 dark:bg-gray-900/20 backdrop-blur-xl rounded-3xl text-left overflow-hidden shadow-2xl border border-white/20 dark:border-gray-700/30 transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full animate-slideUp">
          <form onSubmit={handleSubmit}>
            {/* Header with modern gradient */}
            <div className="relative px-8 pt-8 pb-6 bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-500">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-600/20 to-cyan-600/20"></div>
              <div className="relative flex items-center space-x-4">
                <div className="flex-shrink-0 flex items-center justify-center h-16 w-16 rounded-2xl bg-white/20 backdrop-blur-sm shadow-xl border border-white/30">
                  <svg className="h-8 w-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-3xl font-bold text-white drop-shadow-lg">
                    Create New Room
                  </h3>
                  <p className="text-emerald-100 text-sm mt-1 font-medium">Set up your Zuumcuk room</p>
                </div>
              </div>
            </div>

            {/* Form Content */}
            <div className="px-8 pt-8 pb-6 bg-gradient-to-b from-white/5 to-transparent">
              <div className="space-y-8">
                {/* Room Name */}
                <div>
                  <label htmlFor="roomName" className="flex text-sm font-bold text-gray-800 dark:text-gray-100 mb-3 items-center">
                    <svg className="w-4 h-4 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm3 1h2v2H7V5zm0 4h2v2H7V9zm0 4h2v2H7v-2zm4-8h2v2h-2V5zm0 4h2v2h-2V9zm0 4h2v2h-2v-2z" clipRule="evenodd" />
                    </svg>
                    Room Name
                  </label>
                  <input
                    type="text"
                    id="roomName"
                    value={formData.name}
                    onChange={(e) => handleInputChange('name', e.target.value)}
                    className={`block w-full px-5 py-4 rounded-2xl border-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg transition-all duration-300 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white text-base font-medium placeholder-gray-500 dark:placeholder-gray-400 ${
                      errors.name ? 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-500'
                    }`}
                    placeholder="Enter room name"
                  />
                  {errors.name && (
                    <p className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center font-medium">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.name}
                    </p>
                  )}
                </div>

                {/* Max Participants */}
                <div>
                  <label htmlFor="maxParticipants" className="flex text-sm font-bold text-gray-800 dark:text-gray-100 mb-3 items-center">
                    <svg className="w-4 h-4 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
                    </svg>
                    Max Participants
                  </label>
                  <input
                    type="number"
                    id="maxParticipants"
                    min="1"
                    max="1000"
                    value={formData.maxParticipants}
                    onChange={(e) => handleInputChange('maxParticipants', parseInt(e.target.value) || 1)}
                    className={`block w-full px-5 py-4 rounded-2xl border-2 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm shadow-lg transition-all duration-300 focus:ring-4 focus:ring-emerald-500/20 focus:border-emerald-500 dark:text-white text-base font-medium ${
                      errors.maxParticipants ? 'border-red-400 dark:border-red-500 bg-red-50/50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-600 hover:border-emerald-300 dark:hover:border-emerald-500'
                    }`}
                  />
                  {errors.maxParticipants && (
                    <p className="mt-3 text-sm text-red-600 dark:text-red-400 flex items-center font-medium">
                      <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                      </svg>
                      {errors.maxParticipants}
                    </p>
                  )}
                </div>

                {/* Settings */}
                <div>
                  <label className="flex text-sm font-bold text-gray-800 dark:text-gray-100 mb-4 items-center">
                    <svg className="w-4 h-4 mr-2 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
                    </svg>
                    Room Settings
                  </label>
                  <div className="bg-white/60 dark:bg-gray-800/60 backdrop-blur-sm p-6 rounded-2xl border border-white/30 dark:border-gray-600/30 shadow-lg space-y-4">
                    <label className="flex items-center p-4 rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.settings.allowScreenShare}
                        onChange={(e) => handleInputChange('settings.allowScreenShare', e.target.checked)}
                        className="h-5 w-5 text-emerald-600 focus:ring-4 focus:ring-emerald-500/20 border-gray-300 dark:border-gray-600 rounded-md transition-all duration-200"
                      />
                      <div className="ml-4 flex items-center">
                        <svg className="w-5 h-5 mr-3 text-emerald-500 group-hover:text-emerald-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm0 4a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Allow Screen Sharing</span>
                      </div>
                    </label>
                    <label className="flex items-center p-4 rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.settings.allowChat}
                        onChange={(e) => handleInputChange('settings.allowChat', e.target.checked)}
                        className="h-5 w-5 text-emerald-600 focus:ring-4 focus:ring-emerald-500/20 border-gray-300 dark:border-gray-600 rounded-md transition-all duration-200"
                      />
                      <div className="ml-4 flex items-center">
                        <svg className="w-5 h-5 mr-3 text-emerald-500 group-hover:text-emerald-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M18 10c0 3.866-3.582 7-8 7a8.841 8.841 0 01-4.083-.98L2 17l1.338-3.123C2.493 12.767 2 11.434 2 10c0-3.866 3.582-7 8-7s8 3.134 8 7zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Allow Chat</span>
                      </div>
                    </label>
                    <label className="flex items-center p-4 rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.settings.allowCamera}
                        onChange={(e) => handleInputChange('settings.allowCamera', e.target.checked)}
                        className="h-5 w-5 text-emerald-600 focus:ring-4 focus:ring-emerald-500/20 border-gray-300 dark:border-gray-600 rounded-md transition-all duration-200"
                      />
                      <div className="ml-4 flex items-center">
                        <svg className="w-5 h-5 mr-3 text-emerald-500 group-hover:text-emerald-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Allow Camera</span>
                      </div>
                    </label>
                    <label className="flex items-center p-4 rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.settings.allowMicrophone}
                        onChange={(e) => handleInputChange('settings.allowMicrophone', e.target.checked)}
                        className="h-5 w-5 text-emerald-600 focus:ring-4 focus:ring-emerald-500/20 border-gray-300 dark:border-gray-600 rounded-md transition-all duration-200"
                      />
                      <div className="ml-4 flex items-center">
                        <svg className="w-5 h-5 mr-3 text-emerald-500 group-hover:text-emerald-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Allow Microphone</span>
                      </div>
                    </label>
                    <label className="flex items-center p-4 rounded-xl hover:bg-white/70 dark:hover:bg-gray-700/50 transition-all duration-200 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={formData.settings.recordingEnabled}
                        onChange={(e) => handleInputChange('settings.recordingEnabled', e.target.checked)}
                        className="h-5 w-5 text-emerald-600 focus:ring-4 focus:ring-emerald-500/20 border-gray-300 dark:border-gray-600 rounded-md transition-all duration-200"
                      />
                      <div className="ml-4 flex items-center">
                        <svg className="w-5 h-5 mr-3 text-emerald-500 group-hover:text-emerald-600 transition-colors" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                        </svg>
                        <span className="text-sm font-semibold text-gray-800 dark:text-gray-200 group-hover:text-gray-900 dark:group-hover:text-gray-100 transition-colors">Enable Recording</span>
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Footer Actions */}
            <div className="px-8 py-6 bg-gradient-to-r from-gray-50/80 to-gray-100/80 dark:from-gray-800/40 dark:to-gray-900/40 backdrop-blur-sm flex gap-4 justify-end">
              <button
                type="button"
                onClick={handleClose}
                className="px-8 py-3 rounded-2xl border-2 border-gray-300 dark:border-gray-600 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-700 dark:text-gray-300 font-bold hover:bg-white dark:hover:bg-gray-800 hover:border-gray-400 dark:hover:border-gray-500 transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isLoading}
                className="px-10 py-3 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-bold hover:from-emerald-600 hover:to-teal-600 focus:outline-none focus:ring-4 focus:ring-offset-2 focus:ring-emerald-500/50 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5"
              >
                {isLoading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Creating...
                  </span>
                ) : (
                  'Create Room'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
