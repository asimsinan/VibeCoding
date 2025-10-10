import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/lib/video-conferencing/services/service.factory';
import { DatabaseService } from '@/lib/video-conferencing/services/database.service';

// Initialize services
const databaseService = DatabaseService.getInstance();
const serviceFactory = new ServiceFactory(databaseService);

// PUT /api/rooms/[id]/participants/[participantId]/media - Update participant media permissions
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; participantId: string } }
) {
  try {
    await serviceFactory.initialize();
    const participantRepo = serviceFactory.getRepositoryFactory().getParticipantRepository();
    
    const body = await request.json();
    const { camera, microphone, screenShare } = body;

    // Validate required fields
    if (camera === undefined || microphone === undefined || screenShare === undefined) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'Camera, microphone, and screenShare permissions are required'
        },
        { status: 400 }
      );
    }

    const { id: roomId, participantId } = params;

    // Update participant media permissions
    const updatedParticipant = await participantRepo.update(participantId, {
      mediaPermissions: {
        camera,
        microphone,
        screenShare
      }
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
    console.error('Error updating participant media permissions:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update media permissions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
