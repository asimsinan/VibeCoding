import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/lib/video-conferencing/services/service.factory';
import { DatabaseService } from '@/lib/video-conferencing/services/database.service';

// Initialize services
const databaseService = DatabaseService.getInstance();
const serviceFactory = ServiceFactory.getInstance(databaseService);

// CORS headers
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

// Handle preflight requests
export async function OPTIONS() {
  return new NextResponse(null, { status: 200, headers: corsHeaders });
}

// GET /api/rooms/[id]/participants - Get room participants
export async function GET(
  __request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await serviceFactory.initialize();
    const roomService = serviceFactory.getRoomService();
    
    const roomId = params.id;
    const participants = await roomService.getRoomParticipants(roomId);

    return NextResponse.json({
      success: true,
      data: participants
    }, { headers: corsHeaders });
  } catch (error) {
    console.error('Error fetching participants:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch participants',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// PUT /api/rooms/[id]/participants/[participantId] - Update participant
export async function PUT(
  _request: NextRequest,
  { params: _params }: { params: { id: string } }
) {
  try {
    await serviceFactory.initialize();
    const participantRepo = serviceFactory.getRepositoryFactory().getParticipantRepository();
    
    const body = await _request.json();
    const { participantId, mediaPermissions } = body;

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

    // Update participant
    const updatedParticipant = await participantRepo.update(participantId, {
      mediaPermissions
    });

    if (!updatedParticipant) {
      return NextResponse.json(
        {
          success: false,
          error: 'Participant not found',
          message: 'The requested participant does not exist'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedParticipant
    });
  } catch (error) {
    console.error('Error updating participant:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update participant',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
