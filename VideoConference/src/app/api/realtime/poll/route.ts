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

// Store active polling sessions
const activeSessions = new Map<string, {
  roomId: string;
  participantId: string;
  userId: string;
  lastSeen: number;
}>();

// Clean up inactive sessions every 30 seconds
setInterval(() => {
  const now = Date.now();
  for (const [sessionId, session] of activeSessions.entries()) {
    if (now - session.lastSeen > 30000) { // 30 seconds timeout
      activeSessions.delete(sessionId);
    }
  }
}, 30000);

// POST /api/realtime/poll - Poll for real-time updates
export async function POST(request: NextRequest) {
  try {
    await serviceFactory.initialize();
    
    const body = await request.json();
    const { sessionId, roomId, participantId, userId, action } = body;

    if (!sessionId || !roomId || !participantId || !userId) {
      return NextResponse.json(
        { success: false, error: 'Missing required parameters' },
        { status: 400 }
      );
    }

    // Update session
    activeSessions.set(sessionId, {
      roomId,
      participantId,
      userId,
      lastSeen: Date.now()
    });

    const roomService = serviceFactory.getRoomService();
    const chatService = serviceFactory.getChatService();

    switch (action) {
      case 'get-room-info':
        const room = await roomService.getRoom(roomId);
        const participants = await roomService.getRoomParticipants(roomId);
        
        return NextResponse.json({
          success: true,
          data: {
            room,
            participants: participants.map(p => ({
              id: p.id,
              name: p.name,
              userId: (p as any).userId, // Cast to any to access userId
              isConnected: p.isConnected
            }))
          }
        });

      case 'get-messages':
        const messages = await chatService.getMessages(roomId, 50, 0);
        
        return NextResponse.json({
          success: true,
          data: {
            messages: messages.map(m => ({
              id: m.id,
              content: m.content,
              participantId: (m as any).participant_id, // Cast to any to access participant_id
              createdAt: (m as any).created_at // Cast to any to access created_at
            }))
          }
        });

      case 'send-signal':
        const { targetParticipantId, signalType, signalData } = body;
        
        // Store signal for target to poll
        const signalKey = `signal_${targetParticipantId}_${signalType}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const signal = {
          from: participantId, // Use participantId instead of userId
          type: signalType,
          signal: signalData,
          timestamp: Date.now()
        };
        
        // Store in a simple in-memory map (in production, use Redis)
        if (!(global as any).signalQueue) {
          (global as any).signalQueue = new Map();
        }
        (global as any).signalQueue.set(signalKey, signal);
        
        // Clean up old signals (older than 30 seconds)
        const signalCleanupTime = Date.now();
        for (const [key, sig] of (global as any).signalQueue.entries()) {
          if (signalCleanupTime - sig.timestamp > 30000) {
            (global as any).signalQueue.delete(key);
          }
        }
        
        return NextResponse.json({
          success: true,
          data: { signalDelivered: true }
        }, { headers: corsHeaders });

      case 'media-state-change':
        const { type, enabled } = body;
        
        // Store media state change for other participants to poll
        const mediaStateKey = `media_${roomId}_${Date.now()}`;
        const mediaStateChange = {
          type,
          enabled,
          userId,
          participantId,
          timestamp: Date.now()
        };
        
        // Store in a simple in-memory map (in production, use Redis)
        if (!(global as any).mediaStateQueue) {
          (global as any).mediaStateQueue = new Map();
        }
        (global as any).mediaStateQueue.set(mediaStateKey, mediaStateChange);
        
        // Clean up old media state changes (older than 30 seconds)
        const mediaCleanupTime = Date.now();
        for (const [key, change] of (global as any).mediaStateQueue.entries()) {
          if (mediaCleanupTime - change.timestamp > 30000) {
            (global as any).mediaStateQueue.delete(key);
          }
        }
        
        return NextResponse.json({
          success: true,
          data: { mediaStateChangeDelivered: true }
        }, { headers: corsHeaders });

      case 'poll-updates':
        // Check for signals directed to this participant
        const signals = [];
        if ((global as any).signalQueue) {
          for (const [key, signal] of (global as any).signalQueue.entries()) {
            // Check if signal is directed to this participant
            if (key.includes(`_${participantId}_`)) {
              signals.push(signal);
              (global as any).signalQueue.delete(key);
            }
          }
        }
        
        // Check for media state changes in this room
        const mediaStateChanges = [];
        if ((global as any).mediaStateQueue) {
          for (const [key, change] of (global as any).mediaStateQueue.entries()) {
            // Check if media state change is for this room and not from this participant
            if (key.includes(`_${roomId}_`) && change.userId !== userId) {
              mediaStateChanges.push(change);
              (global as any).mediaStateQueue.delete(key);
            }
          }
        }
        
        // Get room participants for participant-joined events
        const roomParticipants = await roomService.getRoomParticipants(roomId);
        const otherParticipants = roomParticipants.filter(p => p.id !== participantId && p.isConnected);
        
        return NextResponse.json({
          success: true,
          data: {
            signals,
            participants: otherParticipants.map(p => ({
              id: p.id,
              name: p.name,
              userId: (p as any).userId, // Cast to any to access userId
              isConnected: p.isConnected
            })),
            mediaStateChanges
          }
        }, { headers: corsHeaders });

      case 'heartbeat':
        // Update last seen
        activeSessions.set(sessionId, {
          roomId,
          participantId,
          userId,
          lastSeen: Date.now()
        });
        
        return NextResponse.json({
          success: true,
          data: { heartbeat: true }
        }, { headers: corsHeaders });

      default:
        return NextResponse.json({
          success: false,
          error: 'Invalid action'
        }, { status: 400, headers: corsHeaders });
    }

  } catch (error) {
    console.error('Realtime poll error:', error);
    return NextResponse.json(
      {
        success: false,
        error: 'Polling failed',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}

// GET /api/realtime/poll - Get active sessions (for debugging)
export async function GET() {
  try {
    const sessions = Array.from(activeSessions.entries()).map(([sessionId, session]) => ({
      sessionId,
      ...session,
      lastSeen: new Date(session.lastSeen).toISOString()
    }));

    return NextResponse.json({
      success: true,
      data: {
        activeSessions: sessions.length,
        sessions
      }
    }, { headers: corsHeaders });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: 'Failed to get sessions',
        message: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500, headers: corsHeaders }
    );
  }
}
