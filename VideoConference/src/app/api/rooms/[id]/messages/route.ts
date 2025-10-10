import { NextRequest, NextResponse } from 'next/server';
import { ServiceFactory } from '@/lib/video-conferencing/services/service.factory';
import { DatabaseService } from '@/lib/video-conferencing/services/database.service';

// Initialize services
const databaseService = DatabaseService.getInstance();
const serviceFactory = ServiceFactory.getInstance(databaseService);

// GET /api/rooms/[id]/messages - Get room messages
export async function GET(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await serviceFactory.initialize();
    const chatService = serviceFactory.getChatService();
    
    const roomId = params.id;
    const { searchParams } = new URL(_request.url);
    const limit = parseInt(searchParams.get('limit') || '50');
    const offset = parseInt(searchParams.get('offset') || '0');

    const messages = await chatService.getMessages(roomId, limit, offset);

    return NextResponse.json({
      success: true,
      data: messages,
      pagination: {
        limit,
        offset,
        total: messages.length
      }
    });
  } catch (error) {
    console.error('Error fetching messages:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to fetch messages',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// POST /api/rooms/[id]/messages - Send a message
export async function POST(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await serviceFactory.initialize();
    const chatService = serviceFactory.getChatService();
    
    const roomId = params.id;
    const body = await _request.json();
    const { participantId, content } = body;

    // Validate required fields
    if (!participantId || !content) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation error',
          message: 'Participant ID and message content are required'
        },
        { status: 400 }
      );
    }

    // Send message
    const message = await chatService.sendMessage(roomId, participantId, content);

    return NextResponse.json({
      success: true,
      data: message
    }, { status: 201 });
  } catch (error) {
    console.error('Error sending message:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to send message',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}
