import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/lib/video-conferencing/services/service.factory';
import { DatabaseService } from '@/lib/video-conferencing/services/database.service';

// Initialize services
const databaseService = DatabaseService.getInstance();
const serviceFactory = ServiceFactory.getInstance(databaseService);

// POST /api/rooms/[id]/leave - Leave a room
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await serviceFactory.initialize();
    // For now, just return success without actual implementation
    // In a real implementation, you would handle participant leaving

    const roomId = params.id;
    const body = await _request.json();
    const { participantId } = body;

    // Validate required fields
    if (!participantId) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'Participant ID is required'
        },
        { status: 400 }
      );
    }

    // Check if participant is in the room
    const roomService = serviceFactory.getRoomService();
    const participants = await roomService.getRoomParticipants(roomId);
    const participant = participants.find(p => p.id === participantId);

    if (!participant) {
      return NextResponse.json(
        {
          success: false,
          error: 'Participant not found',
          message: 'Participant is not in this room'
        },
        { status: 404 }
      );
    }

    // Mark participant as disconnected instead of deleting to preserve message history
    const participantRepo = serviceFactory.getRepositoryFactory().getParticipantRepository();
    
    
    // Mark as disconnected instead of deleting
    const updatedParticipant = await participantRepo.updateConnectionState(
      participantId, 
      false, 
      'disconnected'
    );
    
    if (!updatedParticipant) {
      console.warn(`Participant ${participantId} not found in room ${roomId}`);
      return NextResponse.json(
        {
          success: false,
          error: 'Participant not found',
          message: 'Participant was not found in this room'
        },
        { status: 404 }
      );
    }
    

    return NextResponse.json({
      success: true,
      message: 'Successfully left the room'
    });
  } catch (error) {
    console.error('Error leaving room:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to leave room',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
