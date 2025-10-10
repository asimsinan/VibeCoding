import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/lib/video-conferencing/services/service.factory';
import { DatabaseService } from '@/lib/video-conferencing/services/database.service';
import { AuthMiddleware } from '@/lib/auth/auth.middleware';

// Initialize services
const databaseService = DatabaseService.getInstance();
const serviceFactory = ServiceFactory.getInstance(databaseService);
const authMiddleware = new AuthMiddleware();

// GET /api/rooms/[id] - Get room by ID
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await serviceFactory.initialize();
    const roomService = serviceFactory.getRoomService();
    
    const roomId = params.id;
    const room = await roomService.getRoom(roomId);

    if (!room) {
      return NextResponse.json(
        {
          success: false,
          error: 'Room not found',
          message: 'The requested room does not exist'
        },
        { status: 404 }
      );
    }

    // Get room statistics
    const statistics = await roomService.getRoomStatistics(roomId);
    const participants = await roomService.getRoomParticipants(roomId);

    return NextResponse.json({
      success: true,
      data: {
        room,
        participants,
        statistics
      }
    });
  } catch (error) {
    console.error('Error fetching room:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch room',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// PUT /api/rooms/[id] - Update room
export async function PUT(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await serviceFactory.initialize();
    const roomService = serviceFactory.getRoomService();
    
    const roomId = params.id;
    const body = await _request.json();
    const { name, maxParticipants, settings } = body;

    // Validate required fields
    if (!name) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'Room name is required'
        },
        { status: 400 }
      );
    }

    const updatedRoom = await roomService.updateRoom(roomId, {
      name,
      maxParticipants,
      settings
    });

    if (!updatedRoom) {
      return NextResponse.json(
        {
          success: false,
          error: 'Room not found',
          message: 'The requested room does not exist'
        },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      data: updatedRoom
    });
  } catch (error) {
    console.error('Error updating room:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to update room',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// DELETE /api/rooms/[id] - Delete room
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  return authMiddleware.requireAuth(_request, async (authenticatedRequest) => {
    try {
      await serviceFactory.initialize();
      const roomService = serviceFactory.getRoomService();
      
      const roomId = params.id;
      const userId = authenticatedRequest.user!.id;
      
      await roomService.deleteRoom(roomId, userId);

      return NextResponse.json({
        success: true,
        message: 'Room deleted successfully'
      });
    } catch (error) {
      console.error('Error deleting room:', error);
      return NextResponse.json(
        {
          success: false,
          error: 'Failed to delete room',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  });
}
