require('@testing-library/jest-dom');

// Polyfill TextEncoder for Node.js environment
const { TextEncoder, TextDecoder } = require('util');

global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Mock WebRTC APIs
global.RTCPeerConnection = class MockRTCPeerConnection {
  constructor(config) {
    this.config = config;
    this.connectionState = 'new';
    this.iceConnectionState = 'new';
    this.signalingState = 'stable';
    this.senders = [];
    this.onconnectionstatechange = null;
    this.onicecandidate = null;
    this.ontrack = null;
    this.onerror = null;
  }

  createOffer(options) {
    return Promise.resolve({
      type: 'offer',
      sdp: 'mock-sdp-offer'
    });
  }

  createAnswer() {
    return Promise.resolve({
      type: 'answer',
      sdp: 'mock-sdp-answer'
    });
  }

  setLocalDescription(description) {
    return Promise.resolve();
  }

  setRemoteDescription(description) {
    return Promise.resolve();
  }

  addIceCandidate(candidate) {
    return Promise.resolve();
  }

  addTrack(track, stream) {
    const sender = { track, stream };
    this.senders.push(sender);
    return sender;
  }

  removeTrack(sender) {
    const index = this.senders.indexOf(sender);
    if (index > -1) {
      this.senders.splice(index, 1);
    }
  }

  getSenders() {
    return this.senders;
  }

  close() {
    this.connectionState = 'closed';
  }
};

global.RTCIceCandidate = class MockRTCIceCandidate {
  constructor(candidateInit) {
    this.candidate = candidateInit.candidate;
    this.sdpMLineIndex = candidateInit.sdpMLineIndex;
    this.sdpMid = candidateInit.sdpMid;
  }
};

global.RTCSessionDescription = class MockRTCSessionDescription {
  constructor(descriptionInit) {
    this.type = descriptionInit.type;
    this.sdp = descriptionInit.sdp;
  }
};

// Mock MediaStream
global.MediaStream = class MockMediaStream {
  constructor() {
    this.tracks = [];
  }

  getTracks() {
    return this.tracks;
  }

  getVideoTracks() {
    return this.tracks.filter(track => track.kind === 'video');
  }

  getAudioTracks() {
    return this.tracks.filter(track => track.kind === 'audio');
  }

  addTrack(track) {
    this.tracks.push(track);
  }
};

// Mock MediaStreamTrack
global.MediaStreamTrack = class MockMediaStreamTrack {
  constructor() {
    this.kind = 'video';
    this.enabled = true;
    this.muted = false;
  }

  stop() {
    this.enabled = false;
  }
};

// Mock navigator.mediaDevices
global.navigator = {
  mediaDevices: {
    getUserMedia: jest.fn().mockResolvedValue(new MediaStream()),
    enumerateDevices: jest.fn().mockResolvedValue([
      { kind: 'videoinput', deviceId: 'video1', label: 'Camera 1' },
      { kind: 'audioinput', deviceId: 'audio1', label: 'Microphone 1' }
    ])
  }
};

// Mock crypto.randomUUID
global.crypto = {
  randomUUID: () => 'mock-uuid-' + Math.random().toString(36).substr(2, 9)
};
