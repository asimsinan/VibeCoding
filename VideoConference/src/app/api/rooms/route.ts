import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/lib/video-conferencing/services/service.factory';
import { DatabaseService } from '@/lib/video-conferencing/services/database.service';
import { AuthMiddleware } from '@/lib/auth/auth.middleware';

// Initialize services
const databaseService = DatabaseService.getInstance();
const serviceFactory = ServiceFactory.getInstance(databaseService);
const authMiddleware = new AuthMiddleware();

// GET /api/rooms - Get all rooms or search rooms
export async function GET(_request: NextRequest) {
  try {
    await serviceFactory.initialize();
    const roomService = serviceFactory.getRoomService();
    
    const { searchParams } = new URL(_request.url);
    const query = searchParams.get('q');
    const limit = parseInt(searchParams.get('limit') || '20');
    const offset = parseInt(searchParams.get('offset') || '0');

    let rooms;
    if (query) {
      rooms = await roomService.searchRooms(query, limit);
    } else {
      rooms = await roomService.getRecentRooms(limit);
    }

    return NextResponse.json({
      success: true,
      data: rooms,
      pagination: {
        limit,
        offset,
        total: rooms.length
      }
    });
  } catch (error) {
    console.error('Error fetching rooms:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch rooms',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/rooms - Create a new room
export async function POST(_request: NextRequest) {
  return authMiddleware.requireAuth(_request, async (authenticatedRequest) => {
    try {
      await serviceFactory.initialize();
      const videoConferencingService = serviceFactory.getVideoConferencingService({
        websocketUrl: process.env.WEBSOCKET_URL || 'ws://localhost:3001',
        maxParticipants: 2,
        enableScreenShare: true,
        enableChat: true,
        enableRecording: false
      });

      // Initialize the video conferencing service
      await videoConferencingService.initialize();

      const body = await _request.json();
      const { name, maxParticipants, settings, participantName } = body;
      const userId = authenticatedRequest.user!.id;

      // Validate required fields
      if (!name || !participantName) {
        return NextResponse.json(
          {
            success: false,
            error: 'Validation error',
            message: 'Room name and participant name are required'
          },
          { status: 400 }
        );
      }

      // Create room with host participant
      const result = await videoConferencingService.createRoom({
        name,
        maxParticipants: maxParticipants || 2,
        settings,
        participantName,
        createdBy: userId
      });

      return NextResponse.json({
        success: true,
        data: {
          room: result.room
        }
      }, { status: 201 });
    } catch (error) {
      console.error('❌ Error creating room:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to create room',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}