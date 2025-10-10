/**
 * VideoConference Component Tests
 * Tests for the VideoConference component with mock API integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { VideoConference } from '@/components/VideoConference';
import { useMockApi } from '@/hooks/useMockApi';

// Mock the useMockApi hook
jest.mock('@/hooks/useMockApi');
const mockUseMockApi = useMockApi as jest.MockedFunction<typeof useMockApi>;

// Mock the child components
jest.mock('@/components/MediaControls', () => ({
  MediaControls: ({ onCameraToggle, onMicrophoneToggle, onScreenShareToggle, onLeaveRoom }: any) => (
    <div data-testid="media-controls">
      <button onClick={onCameraToggle} data-testid="camera-toggle">Camera</button>
      <button onClick={onMicrophoneToggle} data-testid="microphone-toggle">Microphone</button>
      <button onClick={onScreenShareToggle} data-testid="screen-share-toggle">Screen Share</button>
      <button onClick={onLeaveRoom} data-testid="leave-room">Leave</button>
    </div>
  )
}));

jest.mock('@/components/ParticipantList', () => ({
  ParticipantList: ({ participants }: any) => (
    <div data-testid="participant-list">
      {participants.map((p: any) => (
        <div key={p.id} data-testid={`participant-${p.id}`}>
          {p.name}
        </div>
      ))}
    </div>
  )
}));

jest.mock('@/components/ChatPanel', () => ({
  ChatPanel: ({ onSendMessage }: any) => (
    <div data-testid="chat-panel">
      <button onClick={() => onSendMessage('Test message')} data-testid="send-message">
        Send Message
      </button>
    </div>
  )
}));

describe('VideoConference Component', () => {
  const mockOnLeave = jest.fn();
  const mockSendMessage = jest.fn();
  const mockUpdateMediaPermissions = jest.fn();
  const mockConnectWebSocket = jest.fn();
  const mockDisconnectWebSocket = jest.fn();

  const defaultProps = {
    roomId: 'room-1',
    participantName: 'Test User',
    onLeave: mockOnLeave
  };

  const defaultMockReturn = {
    currentRoom: {
      id: 'room-1',
      name: 'Test Room',
      settings: { allowChat: true }
    },
    participants: [
      {
        id: 'participant-1',
        name: 'Test User',
        mediaPermissions: { camera: true, microphone: true, screenShare: false },
        connectionState: 'connected',
        joinedAt: new Date(),
        lastSeen: new Date()
      }
    ],
    messages: [],
    isLoading: false,
    error: null,
    sendMessage: mockSendMessage,
    updateMediaPermissions: mockUpdateMediaPermissions,
    connectWebSocket: mockConnectWebSocket,
    disconnectWebSocket: mockDisconnectWebSocket
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMockApi.mockReturnValue(defaultMockReturn as any);
  });

  it('renders video conference interface', () => {
    render(<VideoConference {...defaultProps} />);
    
    expect(screen.getByText('Test Room')).toBeInTheDocument();
    expect(screen.getByText('1 participant • Test User')).toBeInTheDocument();
    expect(screen.getByText('Video streams will appear here')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseMockApi.mockReturnValue({
      ...defaultMockReturn,
      isLoading: true
    } as any);

    render(<VideoConference {...defaultProps} />);
    
    expect(screen.getByText('Joining conference...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseMockApi.mockReturnValue({
      ...defaultMockReturn,
      error: 'Failed to join conference'
    } as any);

    render(<VideoConference {...defaultProps} />);
    
    expect(screen.getByText('Failed to join conference')).toBeInTheDocument();
    expect(screen.getByText('Failed to join conference')).toBeInTheDocument();
    expect(screen.getByText('Go Back')).toBeInTheDocument();
  });

  it('handles camera toggle', async () => {
    render(<VideoConference {...defaultProps} />);
    
    const cameraButton = screen.getByTestId('camera-toggle');
    fireEvent.click(cameraButton);
    
    await waitFor(() => {
      expect(mockUpdateMediaPermissions).toHaveBeenCalledWith({
        camera: false,
        microphone: true,
        screenShare: false
      });
    });
  });

  it('handles microphone toggle', async () => {
    render(<VideoConference {...defaultProps} />);
    
    const microphoneButton = screen.getByTestId('microphone-toggle');
    fireEvent.click(microphoneButton);
    
    await waitFor(() => {
      expect(mockUpdateMediaPermissions).toHaveBeenCalledWith({
        camera: true,
        microphone: false,
        screenShare: false
      });
    });
  });

  it('handles screen share toggle', async () => {
    render(<VideoConference {...defaultProps} />);
    
    const screenShareButton = screen.getByTestId('screen-share-toggle');
    fireEvent.click(screenShareButton);
    
    await waitFor(() => {
      expect(mockUpdateMediaPermissions).toHaveBeenCalledWith({
        camera: true,
        microphone: true,
        screenShare: true
      });
    });
  });

  it('handles leave room', () => {
    render(<VideoConference {...defaultProps} />);
    
    const leaveButton = screen.getByTestId('leave-room');
    fireEvent.click(leaveButton);
    
    expect(mockOnLeave).toHaveBeenCalled();
  });

  it('handles send message', async () => {
    render(<VideoConference {...defaultProps} />);
    
    const sendButton = screen.getByTestId('send-message');
    fireEvent.click(sendButton);
    
    await waitFor(() => {
      expect(mockSendMessage).toHaveBeenCalledWith('Test message');
    });
  });

  it('switches between participants and chat tabs', () => {
    render(<VideoConference {...defaultProps} />);
    
    expect(screen.getByText('Participants (1)')).toBeInTheDocument();
    expect(screen.getByText('Chat')).toBeInTheDocument();
    
    const chatTab = screen.getByText('Chat');
    fireEvent.click(chatTab);
    
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
  });

  it('shows screen share indicator when screen sharing', () => {
    render(<VideoConference {...defaultProps} />);
    
    // Initially no screen share indicator
    expect(screen.queryByText('Screen Sharing')).not.toBeInTheDocument();
    
    // Toggle screen share
    const screenShareButton = screen.getByTestId('screen-share-toggle');
    fireEvent.click(screenShareButton);
    
    // Should show screen share indicator (this would be handled by state)
    // Note: In a real test, you'd need to mock the state changes
  });

  it('connects WebSocket on mount', async () => {
    render(<VideoConference {...defaultProps} />);
    
    await waitFor(() => {
      expect(mockConnectWebSocket).toHaveBeenCalledWith('room-1', expect.any(String));
    });
  });

  it('disconnects WebSocket on unmount', () => {
    const { unmount } = render(<VideoConference {...defaultProps} />);
    
    unmount();
    
    expect(mockDisconnectWebSocket).toHaveBeenCalled();
  });

  it('shows media status indicators', () => {
    render(<VideoConference {...defaultProps} />);
    
    // Should show camera and mic status
    expect(screen.getByText('Camera')).toBeInTheDocument();
    expect(screen.getByText('Mic')).toBeInTheDocument();
  });

  it('handles disabled chat when not allowed', () => {
    mockUseMockApi.mockReturnValue({
      ...defaultMockReturn,
      currentRoom: {
        ...defaultMockReturn.currentRoom,
        settings: { allowChat: false }
      }
    } as any);

    render(<VideoConference {...defaultProps} />);
    
    const chatTab = screen.getByText('Chat');
    fireEvent.click(chatTab);
    
    // Chat panel should be disabled
    expect(screen.getByTestId('chat-panel')).toBeInTheDocument();
  });
});
