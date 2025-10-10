/**
 * RoomList Component Tests
 * Tests for the RoomList component with mock API integration
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { RoomList } from '@/components/RoomList';
import { useMockApi } from '@/hooks/useMockApi';

// Mock the useMockApi hook
jest.mock('@/hooks/useMockApi');
const mockUseMockApi = useMockApi as jest.MockedFunction<typeof useMockApi>;

// Mock the child components
jest.mock('@/components/RoomCard', () => ({
  RoomCard: ({ room, onJoin, onDelete }: any) => (
    <div data-testid={`room-card-${room.id}`}>
      <h3>{room.name}</h3>
      <button onClick={() => onJoin(room.id)} data-testid={`join-${room.id}`}>
        Join Room
      </button>
      <button onClick={() => onDelete(room.id)} data-testid={`delete-${room.id}`}>
        Delete
      </button>
    </div>
  )
}));

jest.mock('@/components/CreateRoomModal', () => ({
  CreateRoomModal: ({ isOpen, onClose, onCreateRoom }: any) => (
    isOpen ? (
      <div data-testid="create-room-modal">
        <button onClick={onClose} data-testid="close-modal">Close</button>
        <button onClick={() => onCreateRoom({ name: 'Test Room', maxParticipants: 10, settings: {} })} data-testid="create-room">
          Create
        </button>
      </div>
    ) : null
  )
}));

describe('RoomList Component', () => {
  const mockRooms = [
    {
      id: 'room-1',
      name: 'Test Room 1',
      maxParticipants: 10,
      createdAt: new Date('2023-01-01'),
      updatedAt: new Date('2023-01-01'),
      isActive: true,
      settings: {
        allowScreenShare: true,
        allowChat: true,
        allowCamera: true,
        allowMicrophone: true,
        recordingEnabled: false
      }
    },
    {
      id: 'room-2',
      name: 'Test Room 2',
      maxParticipants: 5,
      createdAt: new Date('2023-01-02'),
      updatedAt: new Date('2023-01-02'),
      isActive: true,
      settings: {
        allowScreenShare: false,
        allowChat: true,
        allowCamera: false,
        allowMicrophone: true,
        recordingEnabled: true
      }
    }
  ];

  const defaultMockReturn = {
    rooms: mockRooms,
    isLoading: false,
    error: null,
    createRoom: jest.fn(),
    joinRoom: jest.fn(),
    getRooms: jest.fn()
  };

  beforeEach(() => {
    jest.clearAllMocks();
    mockUseMockApi.mockReturnValue(defaultMockReturn as any);
  });

  it('renders room list correctly', () => {
    render(<RoomList />);
    
    expect(screen.getByText('Zuumcuk Rooms')).toBeInTheDocument();
    expect(screen.getByText('Join existing rooms or create your own')).toBeInTheDocument();
    expect(screen.getByText('Create Room')).toBeInTheDocument();
  });

  it('displays rooms when available', () => {
    render(<RoomList />);
    
    expect(screen.getByTestId('room-card-room-1')).toBeInTheDocument();
    expect(screen.getByTestId('room-card-room-2')).toBeInTheDocument();
    expect(screen.getByText('Test Room 1')).toBeInTheDocument();
    expect(screen.getByText('Test Room 2')).toBeInTheDocument();
  });

  it('shows loading state', () => {
    mockUseMockApi.mockReturnValue({
      ...defaultMockReturn,
      isLoading: true
    } as any);

    render(<RoomList />);
    
    expect(screen.getByText('Joining conference...')).toBeInTheDocument();
  });

  it('shows error state', () => {
    mockUseMockApi.mockReturnValue({
      ...defaultMockReturn,
      error: 'Failed to load rooms'
    } as any);

    render(<RoomList />);
    
    expect(screen.getByText('Error loading rooms')).toBeInTheDocument();
    expect(screen.getByText('Failed to load rooms')).toBeInTheDocument();
  });

  it('shows empty state when no rooms', () => {
    mockUseMockApi.mockReturnValue({
      ...defaultMockReturn,
      rooms: []
    } as any);

    render(<RoomList />);
    
    expect(screen.getByText('No rooms found')).toBeInTheDocument();
    expect(screen.getByText('Get started by creating a new room')).toBeInTheDocument();
  });

  it('opens create room modal when create button is clicked', () => {
    render(<RoomList />);
    
    const createButton = screen.getByText('Create Room');
    fireEvent.click(createButton);
    
    expect(screen.getByTestId('create-room-modal')).toBeInTheDocument();
  });

  it('filters rooms by search query', () => {
    render(<RoomList />);
    
    const searchInput = screen.getByPlaceholderText('Search by room name...');
    fireEvent.change(searchInput, { target: { value: 'Room 1' } });
    
    expect(screen.getByText('Test Room 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Room 2')).not.toBeInTheDocument();
  });

  it('filters rooms by settings', () => {
    render(<RoomList />);
    
    const screenShareFilter = screen.getByText('Allow Screen Share');
    fireEvent.click(screenShareFilter);
    
    // Only room 1 should be visible (has screen share enabled)
    expect(screen.getByText('Test Room 1')).toBeInTheDocument();
    expect(screen.queryByText('Test Room 2')).not.toBeInTheDocument();
  });

  it('clears filters when clear button is clicked', () => {
    render(<RoomList />);
    
    const screenShareFilter = screen.getByText('Allow Screen Share');
    fireEvent.click(screenShareFilter);
    
    const clearButton = screen.getByText('Clear All');
    fireEvent.click(clearButton);
    
    // Both rooms should be visible again
    expect(screen.getByText('Test Room 1')).toBeInTheDocument();
    expect(screen.getByText('Test Room 2')).toBeInTheDocument();
  });

  it('calls onJoinRoom when room is joined', () => {
    const mockOnJoinRoom = jest.fn();
    render(<RoomList onJoinRoom={mockOnJoinRoom} />);
    
    const joinButton = screen.getByTestId('join-room-1');
    fireEvent.click(joinButton);
    
    expect(mockOnJoinRoom).toHaveBeenCalledWith('room-1');
  });

  it('calls joinRoom when no onJoinRoom prop is provided', async () => {
    const mockJoinRoom = jest.fn();
    mockUseMockApi.mockReturnValue({
      ...defaultMockReturn,
      joinRoom: mockJoinRoom
    } as any);

    render(<RoomList />);
    
    const joinButton = screen.getByTestId('join-room-1');
    fireEvent.click(joinButton);
    
    // Should prompt for participant name
    expect(screen.getByText('Enter your name:')).toBeInTheDocument();
  });

  it('calls createRoom when room is created', async () => {
    const mockCreateRoom = jest.fn();
    mockUseMockApi.mockReturnValue({
      ...defaultMockReturn,
      createRoom: mockCreateRoom
    } as any);

    render(<RoomList />);
    
    const createButton = screen.getByText('Create Room');
    fireEvent.click(createButton);
    
    const createRoomButton = screen.getByTestId('create-room');
    fireEvent.click(createRoomButton);
    
    await waitFor(() => {
      expect(mockCreateRoom).toHaveBeenCalledWith({
        name: 'Test Room',
        maxParticipants: 10,
        settings: {}
      });
    });
  });

  it('calls getRooms on mount', () => {
    const mockGetRooms = jest.fn();
    mockUseMockApi.mockReturnValue({
      ...defaultMockReturn,
      getRooms: mockGetRooms
    } as any);

    render(<RoomList />);
    
    expect(mockGetRooms).toHaveBeenCalled();
  });
});
