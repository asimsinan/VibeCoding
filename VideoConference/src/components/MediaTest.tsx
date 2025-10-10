/**
 * MediaTest Component
 * Dedicated component for testing camera and microphone functionality
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';

interface MediaTestProps {
  onClose: () => void;
}

export const MediaTest: React.FC<MediaTestProps> = ({ onClose }) => {
  const [isTesting, setIsTesting] = useState(false);
  const [testResults, setTestResults] = useState<{
    camera: 'testing' | 'working' | 'failed' | 'not-tested';
    microphone: 'testing' | 'working' | 'failed' | 'not-tested';
    error: string | null;
  }>({
    camera: 'not-tested',
    microphone: 'not-tested',
    error: null
  });
  
  const [micVolume, setMicVolume] = useState(0);
  const [showVideoPreview, setShowVideoPreview] = useState(false);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const volumeCheckIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const cleanup = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (volumeCheckIntervalRef.current) {
      clearInterval(volumeCheckIntervalRef.current);
      volumeCheckIntervalRef.current = null;
    }
    setShowVideoPreview(false);
    setMicVolume(0);
  };

  const testCamera = async () => {
    try {
      setTestResults(prev => ({ ...prev, camera: 'testing', error: null }));
      
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 } 
      });
      
      
      // Ensure video element is available
      setShowVideoPreview(true);
      
      // Wait a bit for the element to be rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Wait for video to be ready and playing
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
              setTestResults(prev => ({ ...prev, camera: 'working' }));
            }).catch(err => {
              console.error('❌ Error playing video:', err);
              setTestResults(prev => ({ ...prev, camera: 'failed' }));
            });
          };
        } else {
          console.error('❌ Video element not found after timeout');
          setTestResults(prev => ({ ...prev, camera: 'failed' }));
        }
      }, 100);
      
      streamRef.current = stream;
    } catch (err) {
      console.error('❌ Camera test failed:', err);
      setTestResults(prev => ({ 
        ...prev, 
        camera: 'failed', 
        error: err instanceof Error ? err.message : 'Camera access failed' 
      }));
    }
  };

  const testMicrophone = async () => {
    try {
      setTestResults(prev => ({ ...prev, microphone: 'testing', error: null }));
      
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      // Create audio context to test microphone
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      source.connect(analyser);
      analyser.fftSize = 256;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let isWorking = false;
      let checkCount = 0;
      const maxChecks = 30; // 3 seconds at 100ms intervals
      
      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        // Update volume level (0-100)
        const volumeLevel = Math.min(100, (average / 128) * 100);
        setMicVolume(volumeLevel);
        
        if (average > 5) { // Threshold for detecting audio
          isWorking = true;
          setTestResults(prev => ({ ...prev, microphone: 'working' }));
          return;
        }
        
        checkCount++;
        if (!isWorking && checkCount < maxChecks) {
          volumeCheckIntervalRef.current = setTimeout(checkAudio, 100);
        } else if (!isWorking) {
          setTestResults(prev => ({ ...prev, microphone: 'failed' }));
        }
      };
      
      checkAudio();
      
      // Store references for cleanup
      streamRef.current = stream;
      audioContextRef.current = audioContext;
      
    } catch (err) {
      setTestResults(prev => ({ 
        ...prev, 
        microphone: 'failed', 
        error: err instanceof Error ? err.message : 'Microphone access failed' 
      }));
    }
  };

  const testBoth = async () => {
    setIsTesting(true);
    setTestResults({
      camera: 'not-tested',
      microphone: 'not-tested',
      error: null
    });
    
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 640, height: 480 }, 
        audio: true 
      });
      
      // Test camera
      setShowVideoPreview(true);
      
      // Wait a bit for the element to be rendered
      setTimeout(() => {
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          
          // Set a timeout for camera test
          const cameraTimeout = setTimeout(() => {
            if (testResults.camera === 'testing') {
              setTestResults(prev => ({ ...prev, camera: 'failed' }));
            }
          }, 5000); // 5 second timeout
          
          // Wait for video to be ready and playing
          videoRef.current.onloadedmetadata = () => {
            videoRef.current?.play().then(() => {
              clearTimeout(cameraTimeout);
              setTestResults(prev => ({ ...prev, camera: 'working' }));
            }).catch(err => {
              console.error('❌ Error playing video (testBoth):', err);
              clearTimeout(cameraTimeout);
              setTestResults(prev => ({ ...prev, camera: 'failed' }));
            });
          };
        } else {
          console.error('❌ Video element not found after timeout (testBoth)');
          setTestResults(prev => ({ ...prev, camera: 'failed' }));
        }
      }, 100);
      
      // Test microphone
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const source = audioContext.createMediaStreamSource(stream);
      const analyser = audioContext.createAnalyser();
      
      source.connect(analyser);
      analyser.fftSize = 256;
      
      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);
      
      let micWorking = false;
      let checkCount = 0;
      const maxChecks = 50; // 5 seconds at 100ms intervals
      
      const checkAudio = () => {
        analyser.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b) / bufferLength;
        
        // Update volume level (0-100)
        const volumeLevel = Math.min(100, (average / 128) * 100);
        setMicVolume(volumeLevel);
        
        if (average > 5) {
          micWorking = true;
          setTestResults(prev => ({ ...prev, microphone: 'working' }));
          return;
        }
        
        checkCount++;
        if (!micWorking && checkCount < maxChecks) {
          volumeCheckIntervalRef.current = setTimeout(checkAudio, 100);
        } else if (!micWorking) {
          setTestResults(prev => ({ ...prev, microphone: 'failed' }));
        }
      };
      
      checkAudio();
      
      // Store references for cleanup
      streamRef.current = stream;
      audioContextRef.current = audioContext;
      
      // Stop after 5 seconds
      setTimeout(() => {
        if (!micWorking) {
          setTestResults(prev => ({ ...prev, microphone: 'failed' }));
        }
        setIsTesting(false);
      }, 5000);
      
    } catch (err) {
      setTestResults(prev => ({ 
        ...prev, 
        camera: 'failed',
        microphone: 'failed',
        error: err instanceof Error ? err.message : 'Media access failed' 
      }));
      setIsTesting(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'working':
        return <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>;
      case 'failed':
        return <div className="w-3 h-3 bg-red-500 rounded-full"></div>;
      case 'testing':
        return <div className="w-3 h-3 bg-yellow-500 rounded-full animate-spin"></div>;
      default:
        return <div className="w-3 h-3 bg-gray-400 rounded-full"></div>;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'working':
        return 'Working';
      case 'failed':
        return 'Failed';
      case 'testing':
        return 'Testing...';
      default:
        return 'Not tested';
    }
  };

  useEffect(() => {
    return cleanup;
  }, []);

  // Ensure video element gets stream when showVideoPreview becomes true
  useEffect(() => {
    if (showVideoPreview && streamRef.current && videoRef.current) {
      videoRef.current.srcObject = streamRef.current;
      
      videoRef.current.onloadedmetadata = () => {
        videoRef.current?.play().catch(err => {
          console.error('❌ Error playing video in useEffect:', err);
        });
      };
    }
  }, [showVideoPreview]);

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl p-6 max-w-md w-full mx-4 shadow-2xl">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-gray-900 dark:text-white">
            Media Device Test
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Test Results */}
        <div className="space-y-4 mb-6">
          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
              </svg>
              <span className="font-medium text-gray-900 dark:text-white">Camera</span>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(testResults.camera)}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getStatusText(testResults.camera)}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 text-gray-600 dark:text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/>
              </svg>
              <span className="font-medium text-gray-900 dark:text-white">Microphone</span>
            </div>
            <div className="flex items-center space-x-2">
              {getStatusIcon(testResults.microphone)}
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {getStatusText(testResults.microphone)}
              </span>
            </div>
          </div>
        </div>

        {/* Video Preview */}
        <div className={`mb-6 ${showVideoPreview ? 'block' : 'hidden'}`}>
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-48 bg-gray-900 rounded-lg object-cover"
            onError={(e) => console.error('❌ Video error:', e)}
          />
          <p className="text-sm text-gray-600 dark:text-gray-400 mt-2 text-center">
            Camera preview (speak to test microphone)
          </p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
            Stream: {streamRef.current ? 'Active' : 'None'} | Video: {videoRef.current?.srcObject ? 'Set' : 'Not set'}
          </p>
        </div>

        {/* Microphone Volume Indicator */}
        {testResults.microphone === 'testing' || testResults.microphone === 'working' ? (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Microphone Volume
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {Math.round(micVolume)}%
              </span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div 
                className={`h-3 rounded-full transition-all duration-100 ${
                  micVolume > 20 ? 'bg-green-500' : 
                  micVolume > 5 ? 'bg-yellow-500' : 'bg-gray-400'
                }`}
                style={{ width: `${micVolume}%` }}
              ></div>
            </div>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 text-center">
              {testResults.microphone === 'testing' ? 'Speak to test microphone...' : 'Microphone is working!'}
            </p>
          </div>
        ) : null}

        {/* Error Message */}
        {testResults.error && (
          <div className="mb-6 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
            <p className="text-sm text-red-600 dark:text-red-400">
              {testResults.error}
            </p>
          </div>
        )}

        {/* Test Buttons */}
        <div className="flex space-x-3">
          <button
            onClick={testCamera}
            disabled={isTesting}
            className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Test Camera
          </button>
          <button
            onClick={testMicrophone}
            disabled={isTesting}
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Test Mic
          </button>
        </div>

        <button
          onClick={testBoth}
          disabled={isTesting}
          className="w-full mt-3 bg-purple-600 hover:bg-purple-700 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg font-medium transition-colors"
        >
          {isTesting ? 'Testing...' : 'Test Both'}
        </button>

        <div className="mt-4 text-xs text-gray-500 dark:text-gray-400 text-center">
          Make sure to allow camera and microphone permissions when prompted
        </div>
      </div>
    </div>
  );
};
