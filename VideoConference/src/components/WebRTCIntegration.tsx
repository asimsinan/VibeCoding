/**
 * WebRTC Integration Component
 * Handles real WebRTC peer-to-peer connections with polling-based signaling
 */

'use client';

import React, { useEffect, useRef, useState, forwardRef, useImperativeHandle } from 'react';
import { PollingRealtimeService } from '@/lib/websocket/polling-realtime.service';

interface WebRTCIntegrationProps {
  roomId: string;
  participantId: string;
  participantName: string;
  userId: string; // User's authenticated ID for duplicate detection
  participants?: Array<{ id: string; name: string; userId?: string }>; // Room participants for name lookup
  onStreamReceived?: (stream: MediaStream) => void;
  onParticipantJoined?: (participantId: string, stream: MediaStream) => void;
  onParticipantLeft?: (participantId: string) => void;
  onMediaStateChange?: (participantId: string, mediaState: { isCameraOn: boolean; isMicrophoneOn: boolean; isScreenSharing?: boolean }) => void;
}

export interface WebRTCIntegrationRef {
  toggleCamera: () => void;
  toggleMicrophone: () => void;
  toggleScreenShare: () => void;
  toggleRecording: () => void;
}

interface ParticipantVideo {
  id: string;
  name: string;
  stream: MediaStream;
  isLocal: boolean;
  isCameraOn: boolean;
  isMicrophoneOn: boolean;
  isScreenSharing?: boolean;
}

export const WebRTCIntegration = forwardRef<WebRTCIntegrationRef, WebRTCIntegrationProps>(function WebRTCIntegration({
  roomId,
  participantId,
  participantName,
  userId,
  participants = [],
  onStreamReceived: _onStreamReceived,
  onParticipantJoined,
  onParticipantLeft,
  onMediaStateChange
}, ref) {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [participantVideos, setParticipantVideos] = useState<ParticipantVideo[]>([]);
  
  // WebRTC state management
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionsRef = useRef<Map<string, RTCPeerConnection>>(new Map());
  const signalQueueRef = useRef<Map<string, any[]>>(new Map()); // Queue for out-of-order signals
  const processedOffersRef = useRef<Set<string>>(new Set()); // Track processed offers to prevent duplicates
  const processingSignalsRef = useRef<Set<string>>(new Set()); // Track which participants are currently processing signals
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const isCameraEnabledRef = useRef(true);
  const isMicrophoneEnabledRef = useRef(true);
  const isScreenSharingRef = useRef(false);
  const isRecordingRef = useRef(false);

  // Services
  const wsServiceRef = useRef<PollingRealtimeService | null>(null);
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const hasInitializedRef = useRef(false);

  // Audio stream management - limit to 3 loudest streams
  const audioStreamManagerRef = useRef<Map<string, { stream: MediaStream; volume: number }>>(new Map());
  const maxAudioStreams = 3;
  
  const updateAudioStreamPriorities = () => {
    const audioStreams = Array.from(audioStreamManagerRef.current.entries())
      .map(([id, data]) => ({ id, ...data }))
      .sort((a, b) => b.volume - a.volume)
      .slice(0, maxAudioStreams);
    
    // Mute streams that are not in top 3
    audioStreamManagerRef.current.forEach((data, id) => {
      const isTopStream = audioStreams.some(stream => stream.id === id);
      const audioTrack = data.stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = isTopStream;
      }
    });
  };

  // Helper to get participant name by ID
  const getParticipantName = (participantId: string): string => {
    const participant = participants.find(p => p.id === participantId);
    return participant?.name || participantId;
  };

  // Process queued signals for a peer connection  
  const processQueuedSignals = (participantId: string, peerConnection: RTCPeerConnection) => {
    // Prevent multiple simultaneous processing for the same participant
    if (processingSignalsRef.current.has(participantId)) {
      return;
    }
    
    const queue = signalQueueRef.current.get(participantId);
    
    if (!queue || queue.length === 0) {
      return;
    }

    // Mark as processing
    processingSignalsRef.current.add(participantId);

    const signal = queue[0]; // Peek at first signal without removing
    if (!signal) {
      processingSignalsRef.current.delete(participantId);
      return;
    }

    // Remove signal from queue before processing
    queue.shift();

    // Process based on signal type
    if (signal.type === 'offer') {
      const offerId = `${participantId}-${signal.signal.sdp?.substring(0, 50) || 'unknown'}`;
      if (processedOffersRef.current.has(offerId)) {
        // Already processed, move to next
        processQueuedSignals(participantId, peerConnection);
        return;
      }
      
      if (peerConnection.signalingState === 'stable') {
        processedOffersRef.current.add(offerId);
        peerConnection.setRemoteDescription(signal.signal)
          .then(() => peerConnection.createAnswer())
          .then(answer => peerConnection.setLocalDescription(answer))
          .then(() => {
            if (wsServiceRef.current && peerConnection.localDescription) {
              wsServiceRef.current.sendAnswer(participantId, peerConnection.localDescription);
            }
            // Process next signal after a delay
            processingSignalsRef.current.delete(participantId);
            setTimeout(() => processQueuedSignals(participantId, peerConnection), 100);
          })
          .catch(err => {
            console.error('Error processing offer:', err);
            processingSignalsRef.current.delete(participantId);
            setTimeout(() => processQueuedSignals(participantId, peerConnection), 100);
          });
      } else {
        // Not ready, process next
        processingSignalsRef.current.delete(participantId);
        setTimeout(() => processQueuedSignals(participantId, peerConnection), 100);
      }
    } else if (signal.type === 'answer') {
      if (peerConnection.signalingState === 'have-local-offer') {
        peerConnection.setRemoteDescription(signal.signal)
          .then(() => {
            processingSignalsRef.current.delete(participantId);
            setTimeout(() => processQueuedSignals(participantId, peerConnection), 100);
          })
          .catch(err => {
            console.error('Error processing answer:', err);
            processingSignalsRef.current.delete(participantId);
            setTimeout(() => processQueuedSignals(participantId, peerConnection), 100);
          });
      } else {
        processingSignalsRef.current.delete(participantId);
        setTimeout(() => processQueuedSignals(participantId, peerConnection), 100);
      }
    } else if (signal.type === 'ice-candidate') {
      if (peerConnection.remoteDescription) {
        peerConnection.addIceCandidate(signal.signal)
          .then(() => {
            processingSignalsRef.current.delete(participantId);
            setTimeout(() => processQueuedSignals(participantId, peerConnection), 10);
          })
          .catch(err => {
            console.error('❌ Error adding ICE candidate:', err);
            processingSignalsRef.current.delete(participantId);
            setTimeout(() => processQueuedSignals(participantId, peerConnection), 10);
          });
      } else {
        // No remote description yet, skip and continue
        processingSignalsRef.current.delete(participantId);
        setTimeout(() => processQueuedSignals(participantId, peerConnection), 10);
      }
    } else {
      // Unknown signal type
      processingSignalsRef.current.delete(participantId);
      setTimeout(() => processQueuedSignals(participantId, peerConnection), 10);
    }
  };

  // Handle screen sharing end
  const handleScreenShareEnd = async () => {
    try {
      if (localStreamRef.current) {
        // Stop all tracks properly to prevent cleanup warnings
        localStreamRef.current.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
          }
        });
      }
      
      // Get camera stream back
      const cameraStream = await navigator.mediaDevices.getUserMedia({
        video: isCameraEnabledRef.current,
        audio: isMicrophoneEnabledRef.current
      });
      
      localStreamRef.current = cameraStream;
      
      // Update all peer connections with new stream
      peerConnectionsRef.current.forEach((peerConnection, _participantId) => {
        if (peerConnection.signalingState !== 'closed') {
          const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
          if (sender && cameraStream.getVideoTracks()[0]) {
            const videoTrack = cameraStream.getVideoTracks()[0];
            if (videoTrack) {
              sender.replaceTrack(videoTrack);
            }
          }
        }
      });
      
      // Update local video element
      setLocalVideoElement(cameraStream);
      
      // Update participant videos
      setParticipantVideos(prev => 
        prev.map(p => 
          p.isLocal ? { ...p, stream: cameraStream, isScreenSharing: false } : p
        )
      );
      
      isScreenSharingRef.current = false;
      
      // Send media state change
      if (wsServiceRef.current) {
        wsServiceRef.current.sendMediaStateChange('screen', false);
      }
    } catch (error) {
      console.error('Error handling screen share end:', error);
    }
  };

  // Set local video element with retry mechanism
  const setLocalVideoElement = (stream: MediaStream) => {
    const trySetVideo = (attempts = 0) => {
      if (localVideoRef.current && localVideoRef.current.isConnected) {
        localVideoRef.current.srcObject = stream;
        localVideoRef.current.play().catch((err: any) => {
          if (err.name !== 'AbortError') {
            console.error('❌ Error playing local video:', err);
          }
        });
        console.log('✅ Local video element set successfully');
      } else if (attempts < 20) { // Increased attempts
        console.log(`⏳ Attempting to set local video element, attempt ${attempts + 1}/20`);
        setTimeout(() => trySetVideo(attempts + 1), 200); // Increased delay
      } else {
        console.error('❌ Failed to set local video after 20 attempts');
        // Try alternative approach - find video element by data attribute
        const videoElement = document.querySelector('video[data-participant-id="local"]') as HTMLVideoElement;
        if (videoElement) {
          videoElement.srcObject = stream;
          videoElement.play().catch((err: any) => {
            if (err.name !== 'AbortError') {
              console.error('❌ Error playing local video via DOM query:', err);
            }
          });
          console.log('✅ Local video set via DOM query');
        }
      }
    };
    trySetVideo();
  };

  // Initialize local media stream with adaptive constraints
  const initializeLocalStream = async (): Promise<MediaStream> => {
      try {
        // Adaptive video constraints based on network conditions
        const getVideoConstraints = () => {
          const baseConstraints = {
            width: { ideal: 1280, max: 1920 },
            height: { ideal: 720, max: 1080 },
            frameRate: { ideal: 30, max: 60 }
          };
          
          // Reduce quality for mobile devices
          if (window.innerWidth < 768) {
            return {
              width: { ideal: 640, max: 1280 },
              height: { ideal: 480, max: 720 },
              frameRate: { ideal: 24, max: 30 }
            };
          }
          
          return baseConstraints;
        };

        const stream = await navigator.mediaDevices.getUserMedia({
          video: getVideoConstraints(),
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
            sampleRate: 48000
          }
        });
      
      localStreamRef.current = stream;
      
      // Add local participant to video list
      setParticipantVideos(prev => {
        const exists = prev.some(p => p.isLocal);
        if (!exists) {
          return [...prev, { 
            id: 'local', 
            name: participantName,
            stream: stream,
            isLocal: true,
            isCameraOn: isCameraEnabledRef.current,
            isMicrophoneOn: isMicrophoneEnabledRef.current,
            isScreenSharing: isScreenSharingRef.current
          }];
        }
        return prev;
      });
      
      setLocalVideoElement(stream);
      return stream;
    } catch (error) {
      console.error('Failed to initialize local stream:', error);
      throw error;
    }
  };

  // Create peer connection
  const createPeerConnection = (remoteParticipantId: string, remoteParticipantName?: string): RTCPeerConnection => {
    const peerConnection = new RTCPeerConnection({
      iceServers: [
        // Google STUN servers (most reliable)
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
        { urls: 'stun:stun2.l.google.com:19302' },
        { urls: 'stun:stun3.l.google.com:19302' },
        { urls: 'stun:stun4.l.google.com:19302' },
        
        // Cloudflare STUN servers (fast and reliable)
        { urls: 'stun:stun.cloudflare.com:3478' },
        
        // Mozilla STUN servers
        { urls: 'stun:stun.mozilla.org:3478' },
        
        // Additional reliable STUN servers
        { urls: 'stun:stun.ekiga.net' },
        { urls: 'stun:stun.ideasip.com' },
        { urls: 'stun:stun.schlund.de' },
        { urls: 'stun:stun.stunprotocol.org:3478' },
        { urls: 'stun:stun.voiparound.com' },
        { urls: 'stun:stun.voipbuster.com' },
        { urls: 'stun:stun.voipstunt.com' },
        { urls: 'stun:stun.counterpath.com' },
        { urls: 'stun:stun.1und1.de' },
        { urls: 'stun:stun.gmx.net' },
        { urls: 'stun:stun.mundofon.com' },
        { urls: 'stun:stun.online.net' },
        { urls: 'stun:stun.freenet.de' },
        { urls: 'stun:stun.voipgate.com' }
      ],
      iceCandidatePoolSize: 4, // Reduced from 10 for faster initialization
      iceTransportPolicy: 'all', // Allow both STUN and TURN
      bundlePolicy: 'max-bundle', // Reduce number of ICE candidates
      rtcpMuxPolicy: 'require' // Reduce bandwidth usage
    });

    // Add local stream to peer connection
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current!);
      });
    }

    // Handle remote stream with audio management
    peerConnection.ontrack = (event) => {
      const [remoteStream] = event.streams;
      
      if (!remoteStream) {
        return;
      }
      
      // Debug: Log when remote stream is received
      console.log('🎥 Remote stream received from:', remoteParticipantId, 'tracks:', remoteStream.getTracks().length);
      
      const participantName = remoteParticipantName || getParticipantName(remoteParticipantId) || `Participant ${remoteParticipantId}`;
      
      // Add to audio stream manager for volume-based prioritization
      const audioTrack = remoteStream.getAudioTracks()[0];
      if (audioTrack) {
        audioStreamManagerRef.current.set(remoteParticipantId, {
          stream: remoteStream,
          volume: 0 // Will be updated by volume monitoring
        });
        
        // Monitor audio volume for stream prioritization
        const audioContext = new AudioContext();
        const source = audioContext.createMediaStreamSource(remoteStream);
        const analyser = audioContext.createAnalyser();
        analyser.fftSize = 256;
        source.connect(analyser);
        
        const dataArray = new Uint8Array(analyser.frequencyBinCount);
        const monitorVolume = () => {
          analyser.getByteFrequencyData(dataArray);
          const average = dataArray.reduce((a, b) => a + b) / dataArray.length;
          
          const currentData = audioStreamManagerRef.current.get(remoteParticipantId);
          if (currentData) {
            currentData.volume = average;
            audioStreamManagerRef.current.set(remoteParticipantId, currentData);
            updateAudioStreamPriorities();
          }
        };
        
        const volumeInterval = setInterval(monitorVolume, 100);
        
        // Clean up when stream ends
        audioTrack.addEventListener('ended', () => {
          clearInterval(volumeInterval);
          audioStreamManagerRef.current.delete(remoteParticipantId);
          audioContext.close();
        });
      }
      
      setParticipantVideos(prev => {
        const existingIndex = prev.findIndex(p => p.id === remoteParticipantId);
        
        if (existingIndex !== -1) {
          // Update existing participant with stream
          const updated = [...prev];
          const existingParticipant = updated[existingIndex];
          if (existingParticipant) {
            updated[existingIndex] = {
              ...existingParticipant,
              stream: remoteStream,
              name: participantName
            };
          }
          return updated;
        } else {
          // Add new participant with stream
          return [...prev, {
            id: remoteParticipantId,
            name: participantName,
            stream: remoteStream,
            isLocal: false,
            isCameraOn: true, // Default to true, will be updated by media state changes
            isMicrophoneOn: true, // Default to true, will be updated by media state changes
            isScreenSharing: false
          }];
        }
      });
      
      if (onParticipantJoined) {
        onParticipantJoined(remoteParticipantId, remoteStream);
      }
    };

    // Handle ICE candidates with optimization
    peerConnection.onicecandidate = (event) => {
      if (event.candidate && wsServiceRef.current) {
        // Filter out low-priority candidates to reduce signaling overhead
        const candidate = event.candidate;
        if (candidate.type === 'host' || candidate.type === 'srflx' || candidate.type === 'relay') {
          wsServiceRef.current.sendIceCandidate(remoteParticipantId, candidate);
        }
      }
    };

    // Monitor ICE gathering state with timeout
    let iceGatheringTimeout: NodeJS.Timeout;
    peerConnection.onicegatheringstatechange = () => {
      console.log(`🧊 ICE gathering state for ${remoteParticipantId}:`, peerConnection.iceGatheringState);
      
      if (peerConnection.iceGatheringState === 'gathering') {
        // Set timeout for ICE gathering (5 seconds max)
        iceGatheringTimeout = setTimeout(() => {
          if (peerConnection.iceGatheringState === 'gathering') {
            console.log(`⏰ ICE gathering timeout for ${remoteParticipantId}, proceeding with available candidates`);
            // Force completion if gathering takes too long
            peerConnection.restartIce();
          }
        }, 5000);
      } else if (peerConnection.iceGatheringState === 'complete') {
        console.log(`✅ ICE gathering complete for ${remoteParticipantId}`);
        if (iceGatheringTimeout) {
          clearTimeout(iceGatheringTimeout);
        }
      }
    };

    // Handle ICE connection state changes
    peerConnection.oniceconnectionstatechange = () => {
      console.log(`🔗 ICE connection state for ${remoteParticipantId}:`, peerConnection.iceConnectionState);
      
      if (peerConnection.iceConnectionState === 'failed') {
        console.log(`❌ ICE connection failed for ${remoteParticipantId}, attempting restart`);
        // Try to restart ICE
        peerConnection.restartIce();
        
        // If restart fails, try recreating the connection after a shorter delay
        setTimeout(() => {
          if (peerConnection.iceConnectionState === 'failed') {
            console.log(`🔄 Recreating peer connection for ${remoteParticipantId}`);
            peerConnection.close();
            peerConnectionsRef.current.delete(remoteParticipantId);
            
            // Recreate the connection
            const newPeerConnection = createPeerConnection(remoteParticipantId, remoteParticipantName);
            
            // Send a new offer
            setTimeout(async () => {
              try {
                const offer = await newPeerConnection.createOffer();
                await newPeerConnection.setLocalDescription(offer);
                if (wsServiceRef.current) {
                  wsServiceRef.current.sendOffer(remoteParticipantId, offer);
                }
              } catch (error) {
                console.error('Error creating new offer after ICE failure:', error);
              }
            }, 500); // Reduced from 1000ms
          }
        }, 2000); // Reduced from 5000ms
      } else if (peerConnection.iceConnectionState === 'connected') {
        console.log(`✅ ICE connection established for ${remoteParticipantId}`);
        
        // Monitor connection quality and adapt
        const monitorConnectionQuality = () => {
          peerConnection.getStats().then(stats => {
            stats.forEach(report => {
              if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                const quality = {
                  rtt: report.currentRoundTripTime,
                  packetsLost: report.packetsLost,
                  bytesReceived: report.bytesReceived,
                  bytesSent: report.bytesSent
                };
                
                console.log(`📊 Connection quality for ${remoteParticipantId}:`, quality);
                
                // Adaptive quality adjustment based on network conditions
                if (quality.rtt > 200 || quality.packetsLost > 5) {
                  console.log(`⚠️ Poor connection detected for ${remoteParticipantId}, reducing quality`);
                  // Reduce video quality by adjusting sender parameters
                  const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
                  if (sender && sender.track) {
                    const params = sender.getParameters();
                    const encodings = (params as any).encodings;
                    if (encodings && encodings[0]) {
                      encodings[0].maxBitrate = Math.max(500000, encodings[0].maxBitrate * 0.7);
                      encodings[0].scaleResolutionDownBy = Math.min(2, (encodings[0].scaleResolutionDownBy || 1) * 1.2);
                      sender.setParameters(params);
                    }
                  }
                }
              }
            });
          });
        };
        
        // Monitor quality every 5 seconds
        const qualityInterval = setInterval(monitorConnectionQuality, 5000);
        
        // Clean up interval when connection closes
        peerConnection.addEventListener('connectionstatechange', () => {
          if (peerConnection.connectionState === 'closed') {
            clearInterval(qualityInterval);
          }
        });
      }
    };

    // Handle connection state changes
    peerConnection.onconnectionstatechange = () => {
      console.log(`🔗 Connection state for ${remoteParticipantId}:`, peerConnection.connectionState);
      
      if (peerConnection.connectionState === 'failed' || peerConnection.connectionState === 'disconnected') {
        // Clean up failed connection gracefully
        try {
          peerConnection.close();
          peerConnectionsRef.current.delete(remoteParticipantId);
          
          // Remove participant from video list
          setParticipantVideos(prev => prev.filter(p => p.id !== remoteParticipantId));
          
          // Clean up signal queue for this participant
          signalQueueRef.current.delete(remoteParticipantId);
          
          // Clean up processing signals
          processingSignalsRef.current.delete(remoteParticipantId);
          
          // Clean up processed offers
          const offerKeysToDelete = Array.from(processedOffersRef.current).filter(key => key.startsWith(remoteParticipantId));
          offerKeysToDelete.forEach(key => processedOffersRef.current.delete(key));
          
        } catch (error) {
          // Ignore cleanup errors
        }
      } else if (peerConnection.connectionState === 'connecting') {
        // Connection is being established, this is normal
      } else if (peerConnection.connectionState === 'connected') {
        // Connection established successfully
      }
    };

    // Handle signaling state changes
    peerConnection.onsignalingstatechange = () => {
      if (peerConnection.signalingState === 'closed') {
        peerConnectionsRef.current.delete(remoteParticipantId);
      }
    };

    peerConnectionsRef.current.set(remoteParticipantId, peerConnection);
    return peerConnection;
  };

  // Setup polling event listeners
  const setupPollingEventListeners = () => {
    if (!wsServiceRef.current) return;

    wsServiceRef.current.on('connected', () => {
      setIsConnected(true);
      setError(null);
    });

    wsServiceRef.current.on('disconnected', () => {
      setIsConnected(false);
    });

    wsServiceRef.current.on('error', (error: any) => {
      setError(error.message || 'Connection error');
    });

    wsServiceRef.current.on('room-info', (_data: any) => {
      // Handle room info updates if needed
    });

    wsServiceRef.current.on('participant-joined', (data: any) => {
      // Check if this participant already exists
      setParticipantVideos(prev => {
        const existingParticipant = prev.find(p => p.id === data.participantId);
        if (existingParticipant) {
          return prev;
        }
        
        // Add new remote participant (without stream initially)
        return [...prev, {
          id: data.participantId,
          name: data.participantName || getParticipantName(data.participantId),
          stream: new MediaStream(), // Empty stream initially
          isLocal: false,
          isCameraOn: true, // Default to true, will be updated by media state changes
          isMicrophoneOn: true, // Default to true, will be updated by media state changes
          isScreenSharing: false
        }];
      });
    });

    wsServiceRef.current.on('participant-left', (data: any) => {
      // Close peer connection if it exists
      const peerConnection = peerConnectionsRef.current.get(data.participantId);
      if (peerConnection) {
        peerConnection.close();
        peerConnectionsRef.current.delete(data.participantId);
      }

      // Remove participant from video list
      setParticipantVideos(prev => {
        const filtered = prev.filter(p => p.id !== data.participantId);
        return filtered;
      });

      if (onParticipantLeft) {
        onParticipantLeft(data.participantId);
      }
    });

    wsServiceRef.current.on('media-state-change', (data: any) => {
      // Don't process our own media state changes
      if (data.userId === userId) return;
      
      
      // Update participant videos with new media state
      setParticipantVideos(prev => 
        prev.map(p => {
          // Find the participant by matching participantId first, then userId as fallback
          const isTargetParticipant = p.id === data.participantId || 
            (data.userId && participants.find(participant => participant.userId === data.userId)?.id === p.id);
          
          if (isTargetParticipant && !p.isLocal) {
            const updatedParticipant = { ...p };
            
            if (data.type === 'camera') {
              updatedParticipant.isCameraOn = data.enabled;
            } else if (data.type === 'microphone') {
              updatedParticipant.isMicrophoneOn = data.enabled;
            } else if (data.type === 'screen') {
              updatedParticipant.isScreenSharing = data.enabled;
            }
            
            
            // Notify parent component of media state change
            if (onMediaStateChange) {
              onMediaStateChange(p.id, {
                isCameraOn: updatedParticipant.isCameraOn,
                isMicrophoneOn: updatedParticipant.isMicrophoneOn,
                isScreenSharing: updatedParticipant.isScreenSharing || false
              });
            }
            
            return updatedParticipant;
          }
          
          return p;
        })
      );
    });

    wsServiceRef.current.on('webrtc-signal', (data: any) => {
      const { from, type, signal: signalData } = data;
      
      // Debug: Log received signals
      console.log('📡 Received WebRTC signal:', type, 'from:', from, 'to:', participantId);
      
      // Don't process signals from ourselves
      if (from === participantId) {
        return;
      }

      let peerConnection = peerConnectionsRef.current.get(from);
      if (!peerConnection) {
        peerConnection = createPeerConnection(from, getParticipantName(from));
        // Initialize signal queue for this participant
        signalQueueRef.current.set(from, []);
      }

      if (peerConnection) {
        // Add signal to queue
        const queue = signalQueueRef.current.get(from) || [];
        queue.push({
          type,
          signal: signalData,
          timestamp: Date.now()
        });
        signalQueueRef.current.set(from, queue);
        
        // Process queued signals with a small delay to prevent race conditions
        setTimeout(() => {
          processQueuedSignals(from, peerConnection);
        }, 10);
      }
    });
  };

  // Initialize WebRTC
  useEffect(() => {
    if (!hasInitializedRef || hasInitializedRef.current) return;
    hasInitializedRef.current = true;

    const initializeWebRTC = async () => {
      try {
        // Initialize local stream
        await initializeLocalStream();
        
        // Initialize polling service
        wsServiceRef.current = new PollingRealtimeService();
        setupPollingEventListeners();
        
        // Connect to polling service
        await wsServiceRef.current.connect(roomId, participantId, participantName, userId);
        
        // Create offers for existing participants in parallel
        const existingParticipants = participants.filter(p => p.id !== participantId);
        const offerPromises = existingParticipants.map(async (participant) => {
          const peerConnection = createPeerConnection(participant.id, participant.name);
          
          // Wait briefly for peer connection to be ready
          await new Promise(resolve => setTimeout(resolve, 100));
          
          try {
            if (peerConnection.signalingState === 'stable') {
              console.log(`📤 Creating offer for existing participant: ${participant.id}`);
      const offer = await peerConnection.createOffer();
      await peerConnection.setLocalDescription(offer);
      
              if (wsServiceRef.current) {
                wsServiceRef.current.sendOffer(participant.id, offer);
                console.log(`📤 Sent offer to participant: ${participant.id}`);
              }
            } else {
              console.log(`⚠️ Peer connection not stable for ${participant.id}, state: ${peerConnection.signalingState}`);
            }
          } catch (error) {
            console.error('Error creating offer for participant:', participant.id, error);
          }
        });
        
        // Wait for all offers to be created
        await Promise.allSettled(offerPromises);
        
      } catch (error) {
        console.error('Failed to initialize WebRTC:', error);
        setError(error instanceof Error ? error.message : 'Failed to initialize WebRTC');
      }
    };

    initializeWebRTC();

    return () => {
      // Cleanup
      if (wsServiceRef.current) {
        wsServiceRef.current.disconnect();
      }
      
      // Close all peer connections
      peerConnectionsRef.current.forEach(peerConnection => {
        peerConnection.close();
      });
      peerConnectionsRef.current.clear();
      
      // Clear signal queues
      signalQueueRef.current.clear();
      
      // Clear processed offers
      processedOffersRef.current.clear();
      
      // Stop local stream properly
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => {
          if (track.readyState === 'live') {
            track.stop();
          }
        });
        localStreamRef.current = null;
      }
      
      if (hasInitializedRef) {
        hasInitializedRef.current = false;
      }
    };
  }, [roomId, participantId, participantName, userId]);

  // Re-set local video element when stream changes
  useEffect(() => {
    if (localVideoRef.current && localStreamRef.current) {
      // Check if video element is still connected to DOM
      if (!localVideoRef.current.isConnected) {
        return;
      }

      // Check if video is already playing or has a source
      if (localVideoRef.current.srcObject === localStreamRef.current && !localVideoRef.current.paused) {
        return;
      }

      // Set the stream and play
      const playTimeout = setTimeout(() => {
        if (localVideoRef.current && localStreamRef.current) {
          localVideoRef.current.srcObject = localStreamRef.current;
          localVideoRef.current.play().catch((err: any) => {
            if (err.name !== 'AbortError') {
              console.error('❌ Error playing local video in useEffect:', err);
            }
          });
        }
      }, 50);

      return () => clearTimeout(playTimeout);
    }
    return undefined;
  }, [localStreamRef.current]);

  // Sync participantVideos with participants prop - use JSON comparison to prevent unnecessary updates
  useEffect(() => {
    const participantIds = participants.map(p => p.id).sort().join(',');
    const participantNames = participants.map(p => `${p.id}:${p.name}`).sort().join(',');
    
    setParticipantVideos(prev => {
      // Get current participant IDs from props
      const currentParticipantIds = new Set(participants.map(p => p.id));
      
      // Check if there are actual changes
      const prevIds = prev.filter(p => !p.isLocal).map(p => p.id).sort().join(',');
      const prevNames = prev.filter(p => !p.isLocal).map(p => `${p.id}:${p.name}`).sort().join(',');
      
      // Only update if there are actual changes
      if (prevIds === participantIds && prevNames === participantNames) {
        return prev;
      }
      
      // Filter out participants that are no longer in the room
      const filtered = prev.filter(p => {
        // Always keep local participant
        if (p.isLocal) return true;
        // Keep remote participant only if they're still in the participants list
        return currentParticipantIds.has(p.id);
      });
      
      // Update names for existing participants
      return filtered.map(p => {
        const currentParticipant = participants.find(participant => participant.id === p.id);
        if (currentParticipant && currentParticipant.name !== p.name) {
          return { ...p, name: currentParticipant.name };
        }
        return p;
      });
    });
  }, [participants, participantId]);

  // Ensure video elements get updated when streams change
  useEffect(() => {
    participantVideos.forEach(participant => {
      if (participant.stream && participant.stream.getTracks().length > 0) {
        const videoElement = participant.isLocal ? 
          localVideoRef.current : 
          document.querySelector(`video[data-participant-id="${participant.id}"]`) as HTMLVideoElement;
        
        if (videoElement && videoElement.srcObject !== participant.stream) {
          videoElement.srcObject = participant.stream;
          videoElement.play().catch((err: any) => {
            if (err.name !== 'AbortError') {
              console.error('❌ Error playing video in useEffect:', err);
            }
          });
        }
      }
    });
  }, [participantVideos]);

  // Toggle recording functionality
  const toggleRecording = async () => {
    try {
      if (isRecordingRef.current) {
        // Stop recording
        if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
          mediaRecorderRef.current.stop();
        }
        isRecordingRef.current = false;
      } else {
        // Start recording
        if (!localStreamRef.current) {
          console.error('No local stream available for recording');
          return;
        }

        // Create MediaRecorder
        const options = {
          mimeType: 'video/webm;codecs=vp9,opus',
          videoBitsPerSecond: 2500000,
          audioBitsPerSecond: 128000
        };

        // Fallback to supported mime type
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/webm;codecs=vp8,opus';
        }
        if (!MediaRecorder.isTypeSupported(options.mimeType)) {
          options.mimeType = 'video/webm';
        }

        mediaRecorderRef.current = new MediaRecorder(localStreamRef.current, options);
        recordedChunksRef.current = [];

        // Handle data available
        mediaRecorderRef.current.ondataavailable = (event) => {
          if (event.data.size > 0) {
            recordedChunksRef.current.push(event.data);
          }
        };

        // Handle recording stop
        mediaRecorderRef.current.onstop = () => {
          const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
          const url = URL.createObjectURL(blob);
          
          // Create download link
          const a = document.createElement('a');
          a.href = url;
          a.download = `recording-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.webm`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
        };

        // Start recording
        mediaRecorderRef.current.start(1000); // Record in 1-second chunks
        isRecordingRef.current = true;
      }
    } catch (error) {
      console.error('Error toggling recording:', error);
      isRecordingRef.current = false;
    }
  };

  // Expose methods to parent component
  useImperativeHandle(ref, () => ({
    toggleCamera: () => {
      if (localStreamRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        if (videoTrack) {
          isCameraEnabledRef.current = !isCameraEnabledRef.current;
          videoTrack.enabled = isCameraEnabledRef.current;
          
          // Update local participant in video list
          setParticipantVideos(prev => 
            prev.map(p => 
              p.isLocal ? { ...p, isCameraOn: isCameraEnabledRef.current } : p
            )
          );
          
          // Send media state change
          if (wsServiceRef.current) {
            wsServiceRef.current.sendMediaStateChange('camera', isCameraEnabledRef.current);
          }
        }
      }
    },
    
    toggleMicrophone: () => {
      if (localStreamRef.current) {
        const audioTrack = localStreamRef.current.getAudioTracks()[0];
        if (audioTrack) {
          isMicrophoneEnabledRef.current = !isMicrophoneEnabledRef.current;
          audioTrack.enabled = isMicrophoneEnabledRef.current;
          
          // Update local participant in video list
          setParticipantVideos(prev => 
            prev.map(p => 
              p.isLocal ? { ...p, isMicrophoneOn: isMicrophoneEnabledRef.current } : p
            )
          );
          
          // Send media state change
          if (wsServiceRef.current) {
            wsServiceRef.current.sendMediaStateChange('microphone', isMicrophoneEnabledRef.current);
          }
        }
      }
    },
    
    toggleScreenShare: async () => {
      try {
        if (isScreenSharingRef.current) {
          // Stop screen sharing
          if (localStreamRef.current) {
            // Stop all tracks properly to prevent cleanup warnings
            localStreamRef.current.getTracks().forEach(track => {
              if (track.readyState === 'live') {
                track.stop();
              }
            });
          }
          
          // Get camera stream back
          const cameraStream = await navigator.mediaDevices.getUserMedia({
            video: isCameraEnabledRef.current,
            audio: isMicrophoneEnabledRef.current
          });
          
          localStreamRef.current = cameraStream;
          
          // Update all peer connections with new stream
          peerConnectionsRef.current.forEach((peerConnection, _participantId) => {
            if (peerConnection.signalingState !== 'closed') {
              const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
              if (sender && cameraStream.getVideoTracks()[0]) {
                const videoTrack = cameraStream.getVideoTracks()[0];
                if (videoTrack) {
                  sender.replaceTrack(videoTrack);
                }
              }
            }
          });
          
          // Update local video element
          setLocalVideoElement(cameraStream);
          
          // Update participant videos
          setParticipantVideos(prev => 
            prev.map(p => 
              p.isLocal ? { ...p, stream: cameraStream, isScreenSharing: false } : p
            )
          );
          
          isScreenSharingRef.current = false;
        } else {
          // Start screen sharing
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
            audio: true
          });
          
          // Combine screen video with microphone audio
          const audioStream = localStreamRef.current ? 
            await navigator.mediaDevices.getUserMedia({ audio: true }) : 
            null;
          
          const combinedStream = new MediaStream();
          
          // Add screen video track
          screenStream.getVideoTracks().forEach(track => {
            combinedStream.addTrack(track);
          });
          
          // Add microphone audio track if available
          if (audioStream) {
            audioStream.getAudioTracks().forEach(track => {
              combinedStream.addTrack(track);
            });
          }
          
          localStreamRef.current = combinedStream;
          
          // Update all peer connections with new stream
          peerConnectionsRef.current.forEach((peerConnection, _participantId) => {
            if (peerConnection.signalingState !== 'closed') {
              const sender = peerConnection.getSenders().find(s => s.track && s.track.kind === 'video');
              if (sender && combinedStream.getVideoTracks()[0]) {
                const videoTrack = combinedStream.getVideoTracks()[0];
                if (videoTrack) {
                  sender.replaceTrack(videoTrack);
                }
              }
            }
          });
          
          // Update local video element
          setLocalVideoElement(combinedStream);
          
          // Update participant videos
          setParticipantVideos(prev => 
            prev.map(p => 
              p.isLocal ? { ...p, stream: combinedStream, isScreenSharing: true } : p
            )
          );
          
          isScreenSharingRef.current = true;
          
          // Handle screen sharing end event
          const videoTrack = screenStream.getVideoTracks()[0];
          if (videoTrack) {
            videoTrack.onended = () => {
              // Automatically stop screen sharing when user ends it
              handleScreenShareEnd();
            };
          }
        }
        
        // Send media state change
        if (wsServiceRef.current) {
          wsServiceRef.current.sendMediaStateChange('screen', isScreenSharingRef.current);
        }
        
        // Update local state immediately
        if (onMediaStateChange) {
          onMediaStateChange(participantId, {
            isCameraOn: isCameraEnabledRef.current,
            isMicrophoneOn: isMicrophoneEnabledRef.current,
            isScreenSharing: isScreenSharingRef.current
          });
        }
        
      } catch (error) {
        console.error('Error toggling screen share:', error);
        // Reset state on error
        isScreenSharingRef.current = false;
      }
    },
    
    toggleRecording: () => {
      toggleRecording();
    }
  }));

  if (error) {
  return (
      <div className="flex items-center justify-center h-full bg-red-50 dark:bg-red-900/20 rounded-lg">
        <div className="text-center">
          <div className="text-red-600 dark:text-red-400 font-semibold mb-2">
            WebRTC Error
          </div>
          <div className="text-sm text-red-500 dark:text-red-300">
            {error}
          </div>
        </div>
      </div>
    );
  }

  if (!isConnected) {
    return (
      <div className="flex items-center justify-center h-full bg-gray-50 dark:bg-gray-800 rounded-lg">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <div className="text-gray-600 dark:text-gray-400 font-semibold">
            Connecting...
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full w-full bg-gray-900 rounded-lg overflow-hidden">
      {/* Video Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 p-4 h-full">
        {participantVideos.map((participant) => (
          <div
            key={participant.id}
            className="relative bg-gray-800 rounded-xl overflow-hidden shadow-2xl group hover:shadow-3xl transition-all duration-300"
          >
            {/* Video Element */}
            <div className="relative w-full h-full min-h-[200px] bg-gradient-to-br from-gray-700 to-gray-900">
              <video
                ref={participant.isLocal ? localVideoRef : undefined}
                autoPlay
                playsInline
                muted={true} // Always muted to bypass autoplay restrictions
                className="w-full h-full object-cover"
                onLoadedMetadata={() => {
                  // Ensure video plays when metadata is loaded
                  const video = participant.isLocal ? localVideoRef.current : 
                    document.querySelector(`video[data-participant-id="${participant.id}"]`) as HTMLVideoElement;
                  if (video && !video.paused) return;
                  if (video) {
                    video.play().catch((err: any) => {
                      if (err.name !== 'AbortError') {
                        console.error('❌ Error playing video:', err);
                      }
                    });
                  }
                }}
                onCanPlay={() => {
                  // Additional safety check for local video
                  if (participant.isLocal && participant.stream && localVideoRef.current) {
                    if (localVideoRef.current.srcObject !== participant.stream) {
                      localVideoRef.current.srcObject = participant.stream;
                    }
                  }
                }}
                data-participant-id={participant.isLocal ? 'local' : participant.id}
                {...(participant.stream && { srcObject: participant.stream } as any)}
              />
              
              {/* Participant Name Overlay */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/60 backdrop-blur-sm rounded-lg px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-white font-semibold text-sm truncate">
                      {participant.name} {participant.isLocal ? '(You)' : ''}
                    </span>
                    
                    {/* Media Status Indicators */}
                    <div className="flex items-center space-x-3">
                      {/* Camera Status */}
                      <div className="flex items-center space-x-1.5 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
                        <svg className={`w-3 h-3 ${participant.isCameraOn ? 'text-green-400' : 'text-red-400'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path d="M2 6a2 2 0 012-2h6a2 2 0 012 2v8a2 2 0 01-2 2H4a2 2 0 01-2-2V6zM14.553 7.106A1 1 0 0014 8v4a1 1 0 00.553.894l2 1A1 1 0 0018 13V7a1 1 0 00-1.447-.894l-2 1z"/>
                        </svg>
                        <div className={`w-1.5 h-1.5 rounded-full ${participant.isCameraOn ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      </div>
                      
                      {/* Microphone Status */}
                      <div className="flex items-center space-x-1.5 bg-black/40 backdrop-blur-sm rounded-full px-2 py-1">
                        <svg className={`w-3 h-3 ${participant.isMicrophoneOn ? 'text-green-400' : 'text-red-400'}`} fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M7 4a3 3 0 016 0v4a3 3 0 11-6 0V4zm4 10.93A7.001 7.001 0 0017 8a1 1 0 10-2 0A5 5 0 015 8a1 1 0 00-2 0 7.001 7.001 0 006 6.93V17H6a1 1 0 100 2h8a1 1 0 100-2h-3v-2.07z" clipRule="evenodd"/>
                        </svg>
                        <div className={`w-1.5 h-1.5 rounded-full ${participant.isMicrophoneOn ? 'bg-green-400' : 'bg-red-400'}`}></div>
                      </div>
                    </div>
                  </div>
            </div>
        </div>
      </div>
        </div>
        ))}
      </div>
    </div>
  );
});