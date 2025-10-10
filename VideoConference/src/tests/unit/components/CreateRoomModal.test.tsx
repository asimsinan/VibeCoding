/**
 * CreateRoomModal Component Tests
 * Tests for the CreateRoomModal component with form validation
 */

import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { CreateRoomModal } from '@/components/CreateRoomModal';

describe('CreateRoomModal Component', () => {
  const mockOnCreateRoom = jest.fn();
  const mockOnClose = jest.fn();

  const defaultProps = {
    isOpen: true,
    onClose: mockOnClose,
    onCreateRoom: mockOnCreateRoom,
    isLoading: false
  };

  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('renders modal when open', () => {
    render(<CreateRoomModal {...defaultProps} />);
    
    expect(screen.getByText('Create New Room')).toBeInTheDocument();
    expect(screen.getByLabelText('Room Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Max Participants')).toBeInTheDocument();
    expect(screen.getByText('Room Settings')).toBeInTheDocument();
  });

  it('does not render when closed', () => {
    render(<CreateRoomModal {...defaultProps} isOpen={false} />);
    
    expect(screen.queryByText('Create New Room')).not.toBeInTheDocument();
  });

  it('validates required fields', async () => {
    render(<CreateRoomModal {...defaultProps} />);
    
    const createButton = screen.getByText('Create Room');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Room name is required')).toBeInTheDocument();
    });
    
    expect(mockOnCreateRoom).not.toHaveBeenCalled();
  });

  it('validates room name length', async () => {
    render(<CreateRoomModal {...defaultProps} />);
    
    const nameInput = screen.getByLabelText('Room Name');
    fireEvent.change(nameInput, { target: { value: 'ab' } });
    
    const createButton = screen.getByText('Create Room');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Room name must be at least 3 characters')).toBeInTheDocument();
    });
  });

  it('validates max participants range', async () => {
    render(<CreateRoomModal {...defaultProps} />);
    
    const nameInput = screen.getByLabelText('Room Name');
    fireEvent.change(nameInput, { target: { value: 'Test Room' } });
    
    const maxParticipantsInput = screen.getByLabelText('Max Participants');
    fireEvent.change(maxParticipantsInput, { target: { value: '0' } });
    
    const createButton = screen.getByText('Create Room');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Max participants must be at least 1')).toBeInTheDocument();
    });
  });

  it('submits form with valid data', async () => {
    render(<CreateRoomModal {...defaultProps} />);
    
    const nameInput = screen.getByLabelText('Room Name');
    fireEvent.change(nameInput, { target: { value: 'Test Room' } });
    
    const maxParticipantsInput = screen.getByLabelText('Max Participants');
    fireEvent.change(maxParticipantsInput, { target: { value: '10' } });
    
    const createButton = screen.getByText('Create Room');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(mockOnCreateRoom).toHaveBeenCalledWith({
        name: 'Test Room',
        maxParticipants: 10,
        settings: {
          allowScreenShare: true,
          allowChat: true,
          allowCamera: true,
          allowMicrophone: true,
          recordingEnabled: false
        }
      });
    });
  });

  it('handles settings toggles', () => {
    render(<CreateRoomModal {...defaultProps} />);
    
    const screenShareCheckbox = screen.getByLabelText('Allow Screen Sharing');
    const chatCheckbox = screen.getByLabelText('Allow Chat');
    const cameraCheckbox = screen.getByLabelText('Allow Camera');
    const microphoneCheckbox = screen.getByLabelText('Allow Microphone');
    const recordingCheckbox = screen.getByLabelText('Enable Recording');
    
    // Toggle all settings
    fireEvent.click(screenShareCheckbox);
    fireEvent.click(chatCheckbox);
    fireEvent.click(cameraCheckbox);
    fireEvent.click(microphoneCheckbox);
    fireEvent.click(recordingCheckbox);
    
    expect(screenShareCheckbox).not.toBeChecked();
    expect(chatCheckbox).not.toBeChecked();
    expect(cameraCheckbox).not.toBeChecked();
    expect(microphoneCheckbox).not.toBeChecked();
    expect(recordingCheckbox).toBeChecked();
  });

  it('shows loading state', () => {
    render(<CreateRoomModal {...defaultProps} isLoading={true} />);
    
    expect(screen.getByText('Creating...')).toBeInTheDocument();
    expect(screen.getByText('Create Room')).toBeDisabled();
  });

  it('closes modal when cancel is clicked', () => {
    render(<CreateRoomModal {...defaultProps} />);
    
    const cancelButton = screen.getByText('Cancel');
    fireEvent.click(cancelButton);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('closes modal when overlay is clicked', () => {
    render(<CreateRoomModal {...defaultProps} />);
    
    const overlay = screen.getByRole('presentation');
    fireEvent.click(overlay);
    
    expect(mockOnClose).toHaveBeenCalled();
  });

  it('resets form when closed', () => {
    const { rerender } = render(<CreateRoomModal {...defaultProps} />);
    
    const nameInput = screen.getByLabelText('Room Name');
    fireEvent.change(nameInput, { target: { value: 'Test Room' } });
    
    // Close modal
    rerender(<CreateRoomModal {...defaultProps} isOpen={false} />);
    
    // Reopen modal
    rerender(<CreateRoomModal {...defaultProps} isOpen={true} />);
    
    expect(screen.getByLabelText('Room Name')).toHaveValue('');
  });

  it('clears errors when user starts typing', async () => {
    render(<CreateRoomModal {...defaultProps} />);
    
    const createButton = screen.getByText('Create Room');
    fireEvent.click(createButton);
    
    await waitFor(() => {
      expect(screen.getByText('Room name is required')).toBeInTheDocument();
    });
    
    const nameInput = screen.getByLabelText('Room Name');
    fireEvent.change(nameInput, { target: { value: 'Test' } });
    
    await waitFor(() => {
      expect(screen.queryByText('Room name is required')).not.toBeInTheDocument();
    });
  });

  it('handles form submission with Enter key', async () => {
    render(<CreateRoomModal {...defaultProps} />);
    
    const nameInput = screen.getByLabelText('Room Name');
    fireEvent.change(nameInput, { target: { value: 'Test Room' } });
    
    fireEvent.keyPress(nameInput, { key: 'Enter', code: 'Enter' });
    
    await waitFor(() => {
      expect(mockOnCreateRoom).toHaveBeenCalled();
    });
  });
});
