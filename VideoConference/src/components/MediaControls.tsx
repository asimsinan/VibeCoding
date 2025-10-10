/**
 * Media Controls Component
 * Provides controls for camera, microphone, and screen sharing
 */

'use client';

import React from 'react';

interface MediaControlsProps {
  isCameraOn: boolean;
  isMicrophoneOn: boolean;
  isScreenSharing: boolean;
  isRecording: boolean;
  onCameraToggle: () => void;
  onMicrophoneToggle: () => void;
  onScreenShareToggle: () => void;
  onRecordToggle: () => void;
  onLeaveRoom: () => void;
}

export const MediaControls: React.FC<MediaControlsProps> = ({
  isCameraOn,
  isMicrophoneOn,
  isScreenSharing,
  isRecording,
  onCameraToggle,
  onMicrophoneToggle,
  onScreenShareToggle,
  onRecordToggle,
  onLeaveRoom
}) => {
  return (
    <div className="glass-card mx-4 mb-4 p-6 shadow-xl">
      <div className="flex items-center justify-center space-x-6">
        {/* Camera Toggle */}
        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={onCameraToggle}
            className={`group relative p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-2xl ${
              isCameraOn
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/25'
                : 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/25'
            }`}
            title={isCameraOn ? 'Turn off camera' : 'Turn on camera'}
          >
            <svg className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
            </svg>
            {/* Status indicator */}
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              isCameraOn ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
          </button>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            {isCameraOn ? 'Camera On' : 'Camera Off'}
          </span>
        </div>

        {/* Microphone Toggle */}
        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={onMicrophoneToggle}
            className={`group relative p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-2xl ${
              isMicrophoneOn
                ? 'bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg shadow-green-500/25'
                : 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/25'
            }`}
            title={isMicrophoneOn ? 'Mute microphone' : 'Unmute microphone'}
          >
            <svg className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
            </svg>
            {/* Status indicator */}
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              isMicrophoneOn ? 'bg-green-400' : 'bg-red-400'
            }`}></div>
          </button>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            {isMicrophoneOn ? 'Mic On' : 'Mic Off'}
          </span>
        </div>

        {/* Screen Share Toggle */}
        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={onScreenShareToggle}
            className={`group relative p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-2xl ${
              isScreenSharing
                ? 'bg-gradient-to-r from-blue-500 to-blue-600 shadow-lg shadow-blue-500/25'
                : 'bg-gradient-to-r from-gray-500 to-gray-600 shadow-lg shadow-gray-500/25'
            }`}
            title={isScreenSharing ? 'Stop screen sharing' : 'Share screen'}
          >
            <svg className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
            {/* Status indicator */}
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              isScreenSharing ? 'bg-blue-400' : 'bg-gray-400'
            }`}></div>
          </button>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            {isScreenSharing ? 'Sharing' : 'Share'}
          </span>
        </div>

        {/* Record Toggle */}
        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={onRecordToggle}
            className={`group relative p-4 rounded-2xl transition-all duration-300 transform hover:scale-110 hover:shadow-2xl ${
              isRecording
                ? 'bg-gradient-to-r from-red-500 to-red-600 shadow-lg shadow-red-500/25'
                : 'bg-gradient-to-r from-gray-500 to-gray-600 shadow-lg shadow-gray-500/25'
            }`}
            title={isRecording ? 'Stop recording' : 'Start recording'}
          >
            <svg className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {isRecording ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 10l4.553-2.276A1 1 0 0121 8.618v6.764a1 1 0 01-1.447.894L15 14M5 18h8a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
              )}
            </svg>
            {/* Recording indicator */}
            <div className={`absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
              isRecording ? 'bg-red-400 animate-pulse' : 'bg-gray-400'
            }`}></div>
          </button>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            {isRecording ? 'Recording' : 'Record'}
          </span>
        </div>

        {/* Divider */}
        <div className="w-px h-16 bg-gradient-to-b from-transparent via-gray-300 dark:via-gray-600 to-transparent"></div>

        {/* Leave Room */}
        <div className="flex flex-col items-center space-y-2">
          <button
            onClick={onLeaveRoom}
            className="group relative p-4 rounded-2xl bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white transition-all duration-300 transform hover:scale-110 hover:shadow-2xl shadow-lg shadow-red-500/25"
            title="Leave room"
          >
            <svg className="w-7 h-7 text-white transition-transform duration-300 group-hover:scale-110" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {/* Pulse animation for leave button */}
            <div className="absolute inset-0 rounded-2xl bg-red-500 opacity-0 group-hover:opacity-20 transition-opacity duration-300 animate-pulse"></div>
          </button>
          <span className="text-xs font-semibold text-gray-600 dark:text-gray-400">
            Leave
          </span>
        </div>
      </div>
    </div>
  );
};